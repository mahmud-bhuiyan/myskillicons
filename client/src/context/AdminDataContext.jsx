import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AdminDataContext = createContext(null);

const SESSION_PREFIX = 'myskillicons:admin:v2:';

const memoryCache = {
  icons: null,
  categories: null,
  requestsByStatus: {},
};

function iconsFingerprint(icons) {
  return icons
    .map((icon) => `${icon.key}:${icon.name}:${icon.category}:${icon.updatedAt || ''}:${icon.previewUrl || ''}`)
    .join('|');
}

function requestsFingerprint(requests) {
  return requests
    .map((req) => `${req._id}:${req.status}:${req.upvotes}:${req.adminNote || ''}:${req.updatedAt || ''}`)
    .join('|');
}

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function clearSession() {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      // Drop current + older admin cache prefixes.
      if (k?.startsWith('myskillicons:admin:')) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function getCachedIcons() {
  if (memoryCache.icons) return memoryCache.icons;
  const fromSession = readSession('icons');
  if (Array.isArray(fromSession?.icons)) {
    memoryCache.icons = fromSession;
    return fromSession;
  }
  return null;
}

function setCachedIcons(icons) {
  // Never persist svg payloads — list API omits them; keeps sessionStorage small.
  const entry = {
    icons: icons.map(({ svgContent, ...rest }) => rest),
  };
  memoryCache.icons = entry;
  writeSession('icons', entry);
}

function getCachedCategories() {
  if (memoryCache.categories) return memoryCache.categories;
  const fromSession = readSession('categories');
  if (Array.isArray(fromSession?.categories)) {
    memoryCache.categories = fromSession;
    return fromSession;
  }
  return null;
}

function setCachedCategories(categories) {
  const entry = { categories };
  memoryCache.categories = entry;
  writeSession('categories', entry);
}

function getCachedRequests(status) {
  if (Array.isArray(memoryCache.requestsByStatus[status])) {
    return memoryCache.requestsByStatus[status];
  }
  const fromSession = readSession(`requests:${status}`);
  if (Array.isArray(fromSession?.requests)) {
    memoryCache.requestsByStatus[status] = fromSession.requests;
    return fromSession.requests;
  }
  return null;
}

function setCachedRequests(status, requests) {
  memoryCache.requestsByStatus[status] = requests;
  writeSession(`requests:${status}`, { requests });
}

function clearAdminCaches() {
  memoryCache.icons = null;
  memoryCache.categories = null;
  memoryCache.requestsByStatus = {};
  clearSession();
}

export function AdminDataProvider({ children }) {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const cachedIcons = getCachedIcons();
  const cachedCategories = getCachedCategories();

  const [icons, setIcons] = useState(() => cachedIcons?.icons ?? []);
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
  }, [token]);

  const handleAuthFailure = useCallback(() => {
    logout();
    navigate('/admin/login');
  }, [logout, navigate]);

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
        if (iconsFingerprint(nextIcons) !== iconsFingerprint(iconsRef.current)) {
          setIcons(nextIcons);
        }
        setCachedIcons(nextIcons);
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
