import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useIcons } from '../context/IconsContext';
import { buildIconUrl } from '../utils/serverUrl';

const PAGE_SIZE = 50;

const fieldClass =
  'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400';

export default function Gallery() {
  const { categories, categoryCounts, refresh: refreshCatalog } = useIcons();
  const [icons, setIcons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [theme, setTheme] = useState('light');
  const [size, setSize] = useState(48);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  // Debounce search so keyup does not hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories, activeCategory]);

  const fetchPage = useCallback(async (pageNum, { append }) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
      };
      if (activeCategory && activeCategory !== 'all') {
        params.category = activeCategory;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const { data } = await api.get('/gallery', {
        params,
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current) return;

      const nextIcons = Array.isArray(data?.icons) ? data.icons : [];
      setIcons((prev) => (append ? [...prev, ...nextIcons] : nextIcons));
      setTotal(typeof data?.total === 'number' ? data.total : nextIcons.length);
      setPage(pageNum);
      setLoadError('');
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Failed to load gallery page:', err);
      if (requestId !== requestIdRef.current) return;
      if (!append) {
        setIcons([]);
        setTotal(0);
      }
      setLoadError('Could not reach the API. Check VITE_API_URL on the client deploy.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    fetchPage(1, { append: false });
  }, [fetchPage]);

  const loadMore = () => {
    if (loadingMore || icons.length >= total) return;
    fetchPage(page + 1, { append: true });
  };

  const iconUrl = (key) =>
    buildIconUrl({ i: key, theme, width: size, height: size });

  const showInitialLoading = loading && icons.length === 0;
  const hasMore = icons.length < total;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Icon Gallery</h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
        {total} icons available. Click any icon to get its URL.
      </p>
      {loadError && (
        <p className="mb-6 text-sm text-red-500 dark:text-red-400">{loadError}</p>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 ${fieldClass}`}
        />
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={fieldClass}
        >
          {['light', 'dark'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className={fieldClass}
        >
          {[24, 32, 48, 64, 80, 96].map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                activeCategory === cat
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {showInitialLoading ? (
        <div className="text-zinc-500 text-center py-20">Loading icons...</div>
      ) : icons.length === 0 ? (
        <div className="text-zinc-500 text-center py-20">No icons found.</div>
      ) : (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {icons.map((icon) => (
              <button
                key={icon.key}
                onClick={() => setSelectedIcon(icon)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
              >
                <img
                  src={iconUrl(icon.key)}
                  width={size}
                  height={size}
                  alt={icon.name}
                  className="rounded"
                />
                <span className="text-zinc-500 text-xs group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors truncate w-full text-center">
                  {icon.name}
                </span>
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : `Show more (${icons.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Icon detail modal */}
      {selectedIcon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIcon(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <img src={iconUrl(selectedIcon.key)} width={64} height={64} alt={selectedIcon.name} className="rounded-xl" />
              <div>
                <h3 className="font-semibold text-lg">{selectedIcon.name}</h3>
                <span className="text-zinc-500 dark:text-zinc-400 text-sm capitalize">{selectedIcon.category}</span>
              </div>
            </div>
            <p className="text-zinc-500 text-xs mb-2">URL</p>
            <div className="bg-zinc-100 dark:bg-zinc-950 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all mb-4">
              {iconUrl(selectedIcon.key)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(iconUrl(selectedIcon.key)); }}
                className="py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-300"
              >
                Copy URL
              </button>
              <button
                onClick={() => setSelectedIcon(null)}
                className="py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-sm hover:border-zinc-400 dark:hover:border-zinc-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
