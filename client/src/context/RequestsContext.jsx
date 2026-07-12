import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const RequestsContext = createContext(null);

const requestsFingerprint = (requests) => {
  return requests
    .map((req) => `${req._id}:${req.status}:${req.upvotes}:${req.iconName}`)
    .join('|');
};

export const RequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestsRef = useRef(requests);
  const loadedRef = useRef(false);
  const inFlightRef = useRef(null);

  requestsRef.current = requests;

  const refresh = useCallback(async () => {
    const hasCache = loadedRef.current || requestsRef.current.length > 0;
    if (!hasCache) setLoading(true);

    if (inFlightRef.current) return inFlightRef.current;

    const request = api
      .get('/request')
      .then((res) => {
        const next = Array.isArray(res.data?.requests) ? res.data.requests : [];
        if (requestsFingerprint(next) !== requestsFingerprint(requestsRef.current)) {
          setRequests(next);
        }
        loadedRef.current = true;
      })
      .catch(() => {
        if (!hasCache) setRequests([]);
      })
      .finally(() => {
        setLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <RequestsContext.Provider value={{ requests, loading, refresh, setRequests }}>
      {children}
    </RequestsContext.Provider>
  );
}

export const useRequests = () => {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error('useRequests must be used within RequestsProvider');
  return ctx;
};
