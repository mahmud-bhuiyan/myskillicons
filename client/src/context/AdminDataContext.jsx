import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AdminDataContext = createContext(null);

/** Survives refresh; cleared only on logout. */
const LOCAL_PREFIX = 'myskillicons:admin:v3:';

const memoryCache = {
  icons: null,
  categories: null,
  requestsByStatus: {},
};

/** In-memory SVG markup keyed by icon key (also mirrored to localStorage on fetch/edit). */
const memorySvgCache = new Map();

function iconsFingerprint(icons) {
  return icons
    .map(
      (icon) =>
        `${icon.key}:${icon.name}:${icon.category}:${(icon.tags || []).join(',')}:${icon.updatedAt || ''}:${icon.previewUrl || ''}`
    )
    .join('|');
}

function requestsFingerprint(requests) {
  return requests
    .map((req) => `${req._id}:${req.status}:${req.upvotes}:${req.adminNote || ''}:${req.updatedAt || ''}`)
    .join('|');
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function clearLocalAdminCaches() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith('myskillicons:admin:')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith('myskillicons:admin:')) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function getCachedIcons() {
  if (memoryCache.icons) return memoryCache.icons;
  const fromLocal = readLocal('icons');
  if (Array.isArray(fromLocal?.icons)) {
    memoryCache.icons = fromLocal;
    return fromLocal;
  }
  return null;
}

function setCachedIcons(icons) {
  // Never persist svg payloads in the list entry — keeps localStorage small.
  const entry = {
    icons: icons.map(({ svgContent, ...rest }) => rest),
  };
  memoryCache.icons = entry;
  writeLocal('icons', entry);
}

function getCachedCategories() {
  if (memoryCache.categories) return memoryCache.categories;
  const fromLocal = readLocal('categories');
  if (Array.isArray(fromLocal?.categories)) {
    memoryCache.categories = fromLocal;
    return fromLocal;
  }
  return null;
}

function setCachedCategories(categories) {
  const entry = { categories };
  memoryCache.categories = entry;
  writeLocal('categories', entry);
}

function getCachedRequests(status) {
  if (Array.isArray(memoryCache.requestsByStatus[status])) {
    return memoryCache.requestsByStatus[status];
  }
  const fromLocal = readLocal(`requests:${status}`);
  if (Array.isArray(fromLocal?.requests)) {
    memoryCache.requestsByStatus[status] = fromLocal.requests;
    return fromLocal.requests;
  }
  return null;
}

function setCachedRequests(status, requests) {
  memoryCache.requestsByStatus[status] = requests;
  writeLocal(`requests:${status}`, { requests });
}

function readCachedSvg(key) {
  if (!key) return null;
  if (memorySvgCache.has(key)) return memorySvgCache.get(key);
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}svg:${key}`);
    if (typeof raw === 'string' && raw.length > 0) {
      memorySvgCache.set(key, raw);
      return raw;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCachedSvg(key, svgContent) {
  if (!key || typeof svgContent !== 'string') return;
  memorySvgCache.set(key, svgContent);
  try {
    localStorage.setItem(`${LOCAL_PREFIX}svg:${key}`, svgContent);
  } catch {
    // Quota — memory still has it for this session.
  }
}

function removeCachedSvg(key) {
  if (!key) return;
  memorySvgCache.delete(key);
  try {
    localStorage.removeItem(`${LOCAL_PREFIX}svg:${key}`);
  } catch {
    // ignore
  }
}

function clearAdminCaches() {
  memoryCache.icons = null;
  memoryCache.categories = null;
  memoryCache.requestsByStatus = {};
  memorySvgCache.clear();
  clearLocalAdminCaches();
}

/** Attach any known SVG markup onto list items without persisting it in the list blob. */
function hydrateIconsWithSvg(icons) {
  return icons.map((icon) => {
    const svg = readCachedSvg(icon.key);
    if (svg && !icon.svgContent) return { ...icon, svgContent: svg };
    if (icon.svgContent) writeCachedSvg(icon.key, icon.svgContent);
    return icon;
  });
}

export function AdminDataProvider({ children }) {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const cachedIcons = getCachedIcons();
  const cachedCategories = getCachedCategories();

  const [icons, setIcons] = useState(() =>
    hydrateIconsWithSvg(cachedIcons?.icons ?? [])
  );
  const [iconsLoading, setIconsLoading] = useState(() => !cachedIcons);
  const [iconsLoaded, setIconsLoaded] = useState(() => Boolean(cachedIcons));

  const [categories, setCategories] = useState(() => cachedCategories?.categories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(() => !cachedCategories);
  const [categoriesLoaded, setCategoriesLoaded] = useState(() => Boolean(cachedCategories));

  const [requestsByStatus, setRequestsByStatus] = useState(() => {
    const initial = {};
    for (const status of ['pending', 'in-progress', 'approved', 'rejected']) {
      const cached = getCachedRequests(status);
      if (cached) initial[status] = cached;
    }
    return initial;
  });
  const [requestsLoadingByStatus, setRequestsLoadingByStatus] = useState({});

  const iconsRef = useRef(icons);
  const iconsLoadedRef = useRef(iconsLoaded);
  const categoriesRef = useRef(categories);
  const categoriesLoadedRef = useRef(categoriesLoaded);
  const requestsRef = useRef(requestsByStatus);
  const iconsInFlightRef = useRef(null);
  const categoriesInFlightRef = useRef(null);
  const requestsInFlightRef = useRef({});
  const svgPrefetchInFlightRef = useRef(new Map());

  iconsRef.current = icons;
  iconsLoadedRef.current = iconsLoaded;
  categoriesRef.current = categories;
  categoriesLoadedRef.current = categoriesLoaded;
  requestsRef.current = requestsByStatus;

  useEffect(() => {
    if (token) return;
    clearAdminCaches();
    setIcons([]);
    setIconsLoaded(false);
    setIconsLoading(false);
    setCategories([]);
    setCategoriesLoaded(false);
    setCategoriesLoading(false);
    setRequestsByStatus({});
    setRequestsLoadingByStatus({});
    iconsInFlightRef.current = null;
    categoriesInFlightRef.current = null;
    requestsInFlightRef.current = {};
    svgPrefetchInFlightRef.current = new Map();
  }, [token]);

  const handleAuthFailure = useCallback(() => {
    logout();
    navigate('/admin/login');
  }, [logout, navigate]);

  const cacheIconSvg = useCallback((key, svgContent) => {
    writeCachedSvg(key, svgContent);
    setIcons((prev) => {
      const idx = prev.findIndex((icon) => icon.key === key);
      if (idx === -1) return prev;
      if (prev[idx].svgContent === svgContent) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], svgContent };
      return next;
    });
  }, []);

  const getIconSvg = useCallback((key) => readCachedSvg(key), []);

  /** Merge full icon details into list state + SVG cache. No-op if unchanged. */
  const mergeIconDetails = useCallback((full) => {
    if (!full?.key) return;
    if (full.svgContent) writeCachedSvg(full.key, full.svgContent);

    setIcons((prev) => {
      const idx = prev.findIndex((icon) => icon.key === full.key);
      if (idx === -1) return prev;
      const cur = prev[idx];
      const nextIcon = {
        ...cur,
        name: full.name ?? cur.name,
        category: full.category ?? cur.category,
        tags: Array.isArray(full.tags) ? full.tags : cur.tags,
        themes: full.themes ?? cur.themes,
        updatedAt: full.updatedAt ?? cur.updatedAt,
        previewUrl: full.previewUrl ?? cur.previewUrl,
        svgContent: full.svgContent ?? cur.svgContent,
      };
      const same =
        nextIcon.name === cur.name &&
        nextIcon.category === cur.category &&
        JSON.stringify(nextIcon.tags || []) === JSON.stringify(cur.tags || []) &&
        JSON.stringify(nextIcon.themes || {}) === JSON.stringify(cur.themes || {}) &&
        nextIcon.svgContent === cur.svgContent &&
        nextIcon.updatedAt === cur.updatedAt;
      if (same) return prev;
      const next = [...prev];
      next[idx] = nextIcon;
      setCachedIcons(next);
      return next;
    });
  }, []);

  /** Merge many full icons in one state update (used by batch details prefetch). */
  const mergeIconsDetails = useCallback((fullIcons) => {
    const list = Array.isArray(fullIcons) ? fullIcons.filter((icon) => icon?.key) : [];
    if (list.length === 0) return;

    list.forEach((full) => {
      if (full.svgContent) writeCachedSvg(full.key, full.svgContent);
    });

    setIcons((prev) => {
      let changed = false;
      const next = prev.map((cur) => {
        const full = list.find((icon) => icon.key === cur.key);
        if (!full) return cur;
        const nextIcon = {
          ...cur,
          name: full.name ?? cur.name,
          category: full.category ?? cur.category,
          tags: Array.isArray(full.tags) ? full.tags : cur.tags,
          themes: full.themes ?? cur.themes,
          updatedAt: full.updatedAt ?? cur.updatedAt,
          previewUrl: full.previewUrl ?? cur.previewUrl,
          svgContent: full.svgContent ?? cur.svgContent,
        };
        const same =
          nextIcon.name === cur.name &&
          nextIcon.category === cur.category &&
          JSON.stringify(nextIcon.tags || []) === JSON.stringify(cur.tags || []) &&
          JSON.stringify(nextIcon.themes || {}) === JSON.stringify(cur.themes || {}) &&
          nextIcon.svgContent === cur.svgContent &&
          nextIcon.updatedAt === cur.updatedAt;
        if (same) return cur;
        changed = true;
        return nextIcon;
      });
      if (!changed) return prev;
      setCachedIcons(next);
      return next;
    });
  }, []);

  /**
   * Fetch full icon (incl. svgContent). Skips network when SVG is already cached
   * unless `force` is set. Never exposes a loading state to the UI.
   */
  const prefetchIconDetails = useCallback(
    async (key, { force = false } = {}) => {
      if (!token || !key) return null;

      const cachedSvg = readCachedSvg(key);
      if (!force && cachedSvg) {
        const fromList = iconsRef.current.find((icon) => icon.key === key);
        return fromList?.svgContent
          ? fromList
          : { key, svgContent: cachedSvg, ...(fromList || {}) };
      }

      const existing = svgPrefetchInFlightRef.current.get(key);
      if (existing) return existing;

      const request = api
        .get(`/admin/icons/${key}`)
        .then(({ data }) => {
          const full = data?.icon;
          if (full) mergeIconDetails(full);
          return full || null;
        })
        .catch(() => null)
        .finally(() => {
          svgPrefetchInFlightRef.current.delete(key);
        });

      svgPrefetchInFlightRef.current.set(key, request);
      return request;
    },
    [token, mergeIconDetails]
  );

  /**
   * Batch-prefetch full details for visible keys (one request).
   * Works the same for All and category filters.
   */
  const prefetchIconsDetails = useCallback(
    async (keys) => {
      if (!token) return;
      const list = [...new Set((Array.isArray(keys) ? keys : []).filter(Boolean))];
      const missing = list.filter((key) => !readCachedSvg(key));
      if (missing.length === 0) return;

      const batchKey = `batch:${missing.sort().join(',')}`;
      const existing = svgPrefetchInFlightRef.current.get(batchKey);
      if (existing) return existing;

      const request = api
        .get('/admin/icons/details', { params: { keys: missing.join(',') } })
        .then(({ data }) => {
          const fullIcons = Array.isArray(data?.icons) ? data.icons : [];
          mergeIconsDetails(fullIcons);
          return fullIcons;
        })
        .catch(() => {
          // Fallback: fetch individually so category tabs still warm the cache.
          missing.forEach((key) => prefetchIconDetails(key));
          return [];
        })
        .finally(() => {
          svgPrefetchInFlightRef.current.delete(batchKey);
        });

      svgPrefetchInFlightRef.current.set(batchKey, request);
      return request;
    },
    [token, mergeIconsDetails, prefetchIconDetails]
  );

  const refreshIcons = useCallback(async () => {
    if (!token) return;

    const hasCache = iconsLoadedRef.current || iconsRef.current.length > 0 || Boolean(getCachedIcons());
    // Never flash a loading state when we already have something to show.
    if (!hasCache) setIconsLoading(true);

    if (iconsInFlightRef.current) return iconsInFlightRef.current;

    const request = api
      .get('/admin/icons')
      .then((res) => {
        const nextIcons = Array.isArray(res.data?.icons) ? res.data.icons : [];
        // Ignore empty payloads (e.g. odd 304) when we already have icons.
        if (nextIcons.length === 0 && iconsRef.current.length > 0) {
          setIconsLoaded(true);
          return;
        }

        const hydrated = hydrateIconsWithSvg(nextIcons);
        const prevFp = iconsFingerprint(iconsRef.current);
        const nextFp = iconsFingerprint(hydrated);

        if (nextFp !== prevFp) {
          setIcons(hydrated);
        }
        setCachedIcons(hydrated);
        setIconsLoaded(true);
      })
      .catch(() => {
        handleAuthFailure();
      })
      .finally(() => {
        setIconsLoading(false);
        iconsInFlightRef.current = null;
      });

    iconsInFlightRef.current = request;
    return request;
  }, [token, handleAuthFailure]);

  const refreshCategories = useCallback(async () => {
    if (!token) return;

    const hasCache =
      categoriesLoadedRef.current ||
      categoriesRef.current.length > 0 ||
      Boolean(getCachedCategories());
    if (!hasCache) setCategoriesLoading(true);

    if (categoriesInFlightRef.current) return categoriesInFlightRef.current;

    const request = api
      .get('/admin/categories')
      .then((res) => {
        const next = Array.isArray(res.data?.categories) ? res.data.categories : [];
        if (next.length === 0 && categoriesRef.current.length > 0) {
          setCategoriesLoaded(true);
          return;
        }
        if (next.join(',') !== categoriesRef.current.join(',')) {
          setCategories(next);
        }
        setCachedCategories(next);
        setCategoriesLoaded(true);
      })
      .catch(() => {
        handleAuthFailure();
      })
      .finally(() => {
        setCategoriesLoading(false);
        categoriesInFlightRef.current = null;
      });

    categoriesInFlightRef.current = request;
    return request;
  }, [token, handleAuthFailure]);

  const saveCategoryOrder = useCallback(
    async (ordered) => {
      if (!token) return;
      const res = await api.put('/admin/categories/order', { categories: ordered });
      const next = Array.isArray(res.data?.categories) ? res.data.categories : ordered;
      setCategories(next);
      setCachedCategories(next);
      setCategoriesLoaded(true);
      return next;
    },
    [token]
  );

  const refreshRequests = useCallback(async (status) => {
    if (!token || !status) return;

    const cached = requestsRef.current[status] ?? getCachedRequests(status);
    const hasCache = Array.isArray(cached);
    if (!hasCache) {
      setRequestsLoadingByStatus((prev) => ({ ...prev, [status]: true }));
    }

    if (requestsInFlightRef.current[status]) {
      return requestsInFlightRef.current[status];
    }

    const request = api
      .get(`/admin/requests?status=${status}`)
      .then((res) => {
        const nextRequests = Array.isArray(res.data?.requests) ? res.data.requests : [];
        setRequestsByStatus((prev) => {
          const prevList = prev[status] || [];
          if (
            nextRequests.length === 0 &&
            prevList.length > 0 &&
            !Array.isArray(res.data?.requests)
          ) {
            return prev;
          }
          if (requestsFingerprint(nextRequests) === requestsFingerprint(prevList)) {
            return prev;
          }
          setCachedRequests(status, nextRequests);
          return { ...prev, [status]: nextRequests };
        });
      })
      .catch(() => {
        handleAuthFailure();
      })
      .finally(() => {
        setRequestsLoadingByStatus((prev) => ({ ...prev, [status]: false }));
        delete requestsInFlightRef.current[status];
      });

    requestsInFlightRef.current[status] = request;
    return request;
  }, [token, handleAuthFailure]);

  const removeIconFromCache = useCallback((key) => {
    removeCachedSvg(key);
    setIcons((prev) => {
      const next = prev.filter((icon) => icon.key !== key);
      setCachedIcons(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    // Warm cache in the background as soon as admin session is active.
    refreshIcons();
    refreshCategories();
  }, [isAdmin, refreshIcons, refreshCategories]);

  return (
    <AdminDataContext.Provider
      value={{
        icons,
        iconsLoading,
        iconsLoaded,
        categories,
        categoriesLoading,
        categoriesLoaded,
        requestsByStatus,
        requestsLoadingByStatus,
        refreshIcons,
        refreshCategories,
        saveCategoryOrder,
        refreshRequests,
        cacheIconSvg,
        getIconSvg,
        removeIconFromCache,
        prefetchIconDetails,
        prefetchIconsDetails,
        mergeIconDetails,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
}
