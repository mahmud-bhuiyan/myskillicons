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

  const [requestsByStatus, setRequestsByStatus] = useState({});
  const [requestsLoadingByStatus, setRequestsLoadingByStatus] = useState({});

  const iconsRef = useRef(icons);
  const iconsLoadedRef = useRef(iconsLoaded);
  const requestsRef = useRef(requestsByStatus);
  const iconsInFlightRef = useRef(null);
  const requestsInFlightRef = useRef({});

  iconsRef.current = icons;
  iconsLoadedRef.current = iconsLoaded;
  requestsRef.current = requestsByStatus;

  useEffect(() => {
    if (token) return;
    setIcons([]);
    setIconsLoaded(false);
    setIconsLoading(false);
    setRequestsByStatus({});
    setRequestsLoadingByStatus({});
    iconsInFlightRef.current = null;
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
        requestsByStatus,
        requestsLoadingByStatus,
        refreshIcons,
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
