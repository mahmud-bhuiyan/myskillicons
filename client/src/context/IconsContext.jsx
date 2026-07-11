import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { invalidateGalleryIconsCache } from '../hooks/useGalleryIcons';

const IconsContext = createContext(null);

function categoriesFingerprint(categories) {
  return categories.join(',');
}

function countsFingerprint(counts) {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}

export function IconsProvider({ children }) {
  const [categories, setCategories] = useState(['all']);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categoriesRef = useRef(categories);
  const countsRef = useRef(categoryCounts);
  const inFlightRef = useRef(null);
  const hasLoadedRef = useRef(false);

  categoriesRef.current = categories;
  countsRef.current = categoryCounts;

  const refresh = useCallback(async ({ invalidateIcons = false } = {}) => {
    const hasCache = hasLoadedRef.current;
    if (!hasCache) setLoading(true);

    if (invalidateIcons) {
      invalidateGalleryIconsCache();
    }

    if (inFlightRef.current) return inFlightRef.current;

    // Categories only — icon lists are paginated + cached per tab in useGalleryIcons.
    const request = api
      .get('/gallery/categories')
      .then((catRes) => {
        const nextCategories = catRes.data?.categories?.length
          ? catRes.data.categories
          : ['all'];
        const nextCounts =
          catRes.data?.counts && typeof catRes.data.counts === 'object'
            ? catRes.data.counts
            : { all: 0 };

        if (categoriesFingerprint(nextCategories) !== categoriesFingerprint(categoriesRef.current)) {
          setCategories(nextCategories);
        }
        if (countsFingerprint(nextCounts) !== countsFingerprint(countsRef.current)) {
          setCategoryCounts(nextCounts);
        }
        hasLoadedRef.current = true;
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
        if (!hasCache) {
          setError('Could not reach the API. Check VITE_API_URL on the client deploy.');
        }
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
    <IconsContext.Provider value={{ categories, categoryCounts, loading, error, refresh }}>
      {children}
    </IconsContext.Provider>
  );
}

export function useIcons() {
  const ctx = useContext(IconsContext);
  if (!ctx) throw new Error('useIcons must be used within IconsProvider');
  return ctx;
}
