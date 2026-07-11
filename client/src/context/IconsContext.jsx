import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const IconsContext = createContext(null);

function iconsFingerprint(icons) {
  return icons
    .map((icon) => `${icon.key}:${icon.name}:${icon.category}:${icon.previewUrl || ''}`)
    .join('|');
}

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
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iconsRef = useRef(icons);
  const categoriesRef = useRef(categories);
  const countsRef = useRef(categoryCounts);
  const inFlightRef = useRef(null);

  iconsRef.current = icons;
  categoriesRef.current = categories;
  countsRef.current = categoryCounts;

  const refresh = useCallback(async () => {
    const hasCache = iconsRef.current.length > 0;
    if (!hasCache) setLoading(true);

    if (inFlightRef.current) return inFlightRef.current;

    // Playground needs the full catalog; Gallery loads its own paginated pages.
    const request = Promise.all([
      api.get('/gallery', { params: { limit: 10000 } }),
      api.get('/gallery/categories'),
    ])
      .then(([iconsRes, catRes]) => {
        const nextIcons = Array.isArray(iconsRes.data?.icons) ? iconsRes.data.icons : [];
        const nextCategories = catRes.data?.categories?.length
          ? catRes.data.categories
          : ['all'];
        const nextCounts = catRes.data?.counts && typeof catRes.data.counts === 'object'
          ? catRes.data.counts
          : { all: nextIcons.length };

        if (iconsFingerprint(nextIcons) !== iconsFingerprint(iconsRef.current)) {
          setIcons(nextIcons);
        }
        if (categoriesFingerprint(nextCategories) !== categoriesFingerprint(categoriesRef.current)) {
          setCategories(nextCategories);
        }
        if (countsFingerprint(nextCounts) !== countsFingerprint(countsRef.current)) {
          setCategoryCounts(nextCounts);
        }
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load gallery:', err);
        if (!hasCache) {
          setIcons([]);
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
    <IconsContext.Provider value={{ icons, categories, categoryCounts, loading, error, refresh }}>
      {children}
    </IconsContext.Provider>
  );
}

export function useIcons() {
  const ctx = useContext(IconsContext);
  if (!ctx) throw new Error('useIcons must be used within IconsProvider');
  return ctx;
}
