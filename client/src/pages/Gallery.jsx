import { useState, useEffect } from 'react';
import { useIcons } from '../context/IconsContext';
import { useGalleryIcons } from '../hooks/useGalleryIcons';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { buildIconUrl } from '../utils/serverUrl';
import { fieldClass } from '../utils/formClasses';
import CategoryPills from '../components/CategoryPills';
import PaginationControls from '../components/PaginationControls';

const Gallery = () => {
  const { categories, categoryCounts, refresh: refreshCatalog } = useIcons();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(48);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    icons,
    total,
    loading,
    loadingMore,
    error: loadError,
    loadMore,
    showLess,
    hasMore,
    canShowLess,
  } = useGalleryIcons({ scope: 'gallery', category: activeCategory, search: debouncedSearch });

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories, activeCategory]);

  const iconUrl = (key) =>
    buildIconUrl({ i: key, theme, width: size, height: size });

  const copyUrl = () => {
    if (!selectedIcon) return;
    navigator.clipboard.writeText(iconUrl(selectedIcon.key));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showInitialLoading = loading && icons.length === 0;

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
          {[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ].map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
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

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
        getCount={(cat) => categoryCounts[cat] ?? 0}
      />

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
                  loading="lazy"
                />
                <span className="text-zinc-500 text-xs group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors truncate w-full text-center">
                  {icon.name}
                </span>
              </button>
            ))}
          </div>

          <PaginationControls
            canShowLess={canShowLess}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onShowLess={showLess}
            onLoadMore={loadMore}
            shown={icons.length}
            total={total}
          />
        </>
      )}

      {/* Icon detail modal */}
      {selectedIcon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedIcon(null);
            setCopied(false);
          }}
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
                onClick={copyUrl}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={() => {
                  setSelectedIcon(null);
                  setCopied(false);
                }}
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
};

export default Gallery;
