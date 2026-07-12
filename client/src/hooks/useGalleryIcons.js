import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

export const GALLERY_PAGE_SIZE = 50;

const SESSION_PREFIX = 'myskillicons:gallery:v1:';

/** Shared across mounts so tab switches / route changes stay warm. */
const memoryCache = new Map();

const cacheKey = (scope, category, search) => {
  return `${scope || 'gallery'}::${category || 'all'}::${(search || '').trim().toLowerCase()}`;
};

const fingerprint = (icons, total) => {
  return `${total}|${icons.map((icon) => icon.key).join(',')}`;
};

const readSession = (key) => {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.icons)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (key, entry) => {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota / private mode — memory cache still works.
  }
};

const getCached = (key) => {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const fromSession = readSession(key);
  if (fromSession) {
    memoryCache.set(key, fromSession);
    return fromSession;
  }
  return null;
};

const setCached = (key, entry) => {
  memoryCache.set(key, entry);
  writeSession(key, entry);
};

/** Call after admin publishes icons so the next browse gets fresh data. */
export const invalidateGalleryIconsCache = () => {
  memoryCache.clear();
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(SESSION_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
};

/**
 * Paginated gallery fetch with per-tab cache + stale-while-revalidate.
 * Cached tabs show instantly (no loading spinner); API still runs in the
 * background and only updates the UI when the result actually changed.
 */
export const useGalleryIcons = ({ scope = 'gallery', category = 'all', search = '' }) => {
  const key = cacheKey(scope, category, search);
  const cached = getCached(key);

  const [icons, setIcons] = useState(() => cached?.icons ?? []);
  const [total, setTotal] = useState(() => cached?.total ?? 0);
  const [page, setPage] = useState(() => cached?.page ?? 1);
  const [loading, setLoading] = useState(() => !cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const stateRef = useRef({ icons, total, page, key });
  stateRef.current = { icons, total, page, key };

  const applyResult = useCallback((nextIcons, nextTotal, nextPage, queryKey, { append }) => {
    const prev = stateRef.current;
    const merged = append ? [...(prev.key === queryKey ? prev.icons : []), ...nextIcons] : nextIcons;
    const nextFp = fingerprint(merged, nextTotal);
    const prevFp = fingerprint(prev.key === queryKey ? prev.icons : [], prev.key === queryKey ? prev.total : -1);

    if (nextFp !== prevFp || prev.key !== queryKey) {
      setIcons(merged);
      setTotal(nextTotal);
      setPage(nextPage);
    } else {
      // Same data — still keep page in sync if needed
      setPage(nextPage);
    }

    setCached(queryKey, { icons: merged, total: nextTotal, page: nextPage });
  }, []);

  const fetchPage = useCallback(async (pageNum, { append = false, silent = false, limit } = {}) => {
    const queryKey = cacheKey(scope, category, search);
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) setLoadingMore(true);
    else if (!silent) setLoading(true);

    const pageLimit = limit || GALLERY_PAGE_SIZE;

    try {
      const params = {
        page: pageNum,
        limit: pageLimit,
      };
      if (category && category !== 'all') params.category = category;
      if (search?.trim()) params.search = search.trim();

      const { data } = await api.get('/gallery', {
        params,
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current) return;

      const nextIcons = Array.isArray(data?.icons) ? data.icons : [];
      const nextTotal = typeof data?.total === 'number' ? data.total : nextIcons.length;
      // When revalidating a multi-page cache window, keep the same page count.
      const nextPage = append
        ? pageNum
        : Math.max(1, Math.ceil(nextIcons.length / GALLERY_PAGE_SIZE) || pageNum);
      applyResult(nextIcons, nextTotal, nextPage, queryKey, { append });
      setError('');
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Failed to load gallery page:', err);
      if (requestId !== requestIdRef.current) return;
      const hasCache = getCached(queryKey)?.icons?.length > 0;
      if (!append && !hasCache) {
        setIcons([]);
        setTotal(0);
      }
      if (!hasCache) {
        setError('Could not reach the API. Check VITE_API_URL on the client deploy.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [scope, category, search, applyResult]);

  // Restore cache immediately on tab/search change, then revalidate in background.
  useEffect(() => {
    const queryKey = cacheKey(scope, category, search);
    const hit = getCached(queryKey);

    if (hit) {
      setIcons(hit.icons);
      setTotal(hit.total);
      setPage(hit.page);
      setLoading(false);
      setError('');
      // Re-fetch the same window already shown (not just page 1) so "Show more" stays.
      const windowSize = Math.max(GALLERY_PAGE_SIZE, hit.icons.length);
      fetchPage(1, { append: false, silent: true, limit: windowSize });
    } else {
      setIcons([]);
      setTotal(0);
      setPage(1);
      fetchPage(1, { append: false, silent: false });
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [scope, category, search, fetchPage]);

  const loadMore = useCallback(() => {
    const { icons: current, total: t, page: p } = stateRef.current;
    if (loadingMore || current.length >= t) return;
    fetchPage(p + 1, { append: true, silent: false });
  }, [fetchPage, loadingMore]);

  const showLess = useCallback(() => {
    const { icons: current, total: t, key } = stateRef.current;
    if (current.length <= GALLERY_PAGE_SIZE) return;

    const nextLength = Math.max(
      GALLERY_PAGE_SIZE,
      current.length - GALLERY_PAGE_SIZE,
    );
    const trimmed = current.slice(0, nextLength);
    const nextPage = Math.max(1, Math.ceil(trimmed.length / GALLERY_PAGE_SIZE));

    setIcons(trimmed);
    setPage(nextPage);
    setCached(key, { icons: trimmed, total: t, page: nextPage });
  }, []);

  return {
    icons,
    total,
    page,
    loading,
    loadingMore,
    error,
    loadMore,
    showLess,
    hasMore: icons.length < total,
    canShowLess: icons.length > GALLERY_PAGE_SIZE,
    pageSize: GALLERY_PAGE_SIZE,
  };
};
