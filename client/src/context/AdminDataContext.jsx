import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AdminDataContext = createContext(null);

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

export function AdminDataProvider({ children }) {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [icons, setIcons] = useState([]);
  const [iconsLoading, setIconsLoading] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [requestsByStatus, setRequestsByStatus] = useState({});
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

    const hasCache = iconsLoadedRef.current || iconsRef.current.length > 0;
    if (!hasCache) setIconsLoading(true);

    if (iconsInFlightRef.current) return iconsInFlightRef.current;

    const request = api
      .get('/admin/icons')
      .then((res) => {
        const nextIcons = Array.isArray(res.data?.icons) ? res.data.icons : [];
        if (iconsFingerprint(nextIcons) !== iconsFingerprint(iconsRef.current)) {
          setIcons(nextIcons);
        }
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

    const hasCache = categoriesLoadedRef.current || categoriesRef.current.length > 0;
    if (!hasCache) setCategoriesLoading(true);

    if (categoriesInFlightRef.current) return categoriesInFlightRef.current;

    const request = api
      .get('/admin/categories')
      .then((res) => {
        const next = Array.isArray(res.data?.categories) ? res.data.categories : [];
        if (next.join(',') !== categoriesRef.current.join(',')) {
          setCategories(next);
        }
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
      setCategoriesLoaded(true);
      return next;
    },
    [token]
  );

  const refreshRequests = useCallback(async (status) => {
    if (!token || !status) return;

    const cached = requestsRef.current[status];
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
          if (requestsFingerprint(nextRequests) === requestsFingerprint(prevList)) {
            return prev;
          }
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
    refreshIcons();
  }, [isAdmin, refreshIcons]);

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
