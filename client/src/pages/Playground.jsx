import { useState, useEffect } from 'react';
import { useIcons } from '../context/IconsContext';
import { useGalleryIcons } from '../hooks/useGalleryIcons';
import { buildIconUrl } from '../utils/serverUrl';

const THEMES = ['dark', 'light'];
const LAYOUTS = ['row', 'grid'];
const SIZES = [24, 32, 48, 64, 80, 96];

const fieldClass =
  'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400';
const inactiveBtn =
  'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500';
const surfaceClass =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800';

export default function Playground() {
  const { categories, categoryCounts, error: catalogError, refresh } = useIcons();
  const [selected, setSelected] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(48);
  const [layout, setLayout] = useState('row');
  const [gap, setGap] = useState(8);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const {
    icons,
    total,
    loading,
    loadingMore,
    error: iconsError,
    loadMore,
    showLess,
    hasMore,
    canShowLess,
  } = useGalleryIcons({ scope: 'playground', category: activeCategory, search: debouncedSearch });

  const loadError = catalogError || iconsError;

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories, activeCategory]);

  const toggleIcon = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const buildUrl = () => {
    if (selected.length === 0) return '';
    return buildIconUrl({
      i: selected.join(','),
      theme,
      width: size,
      height: size,
      layout,
      gap,
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(buildUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showInitialLoading = loading && icons.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Icon Playground</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">Pick icons, customize settings, and copy your embed URL.</p>
      {loadError && (
        <p className="mb-6 text-sm text-red-500 dark:text-red-400">{loadError}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Icon picker */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 ${fieldClass}`}
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {categories.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                    activeCategory === cat
                      ? 'bg-yellow-400 text-black border-yellow-400 font-medium'
                      : inactiveBtn
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Icon grid */}
          {showInitialLoading ? (
            <div className="text-zinc-500 text-center py-16">Loading icons...</div>
          ) : icons.length === 0 ? (
            <div className="text-zinc-500 text-center py-16">No icons found.</div>
          ) : (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon.key}
                    onClick={() => toggleIcon(icon.key)}
                    title={icon.name}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      selected.includes(icon.key)
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <img
                      key={`${icon.key}-${theme}`}
                      src={buildIconUrl({ i: icon.key, theme, width: 32, height: 32 })}
                      width={32}
                      height={32}
                      alt={icon.name}
                      className="rounded"
                      loading="lazy"
                    />
                    <span className="text-zinc-500 text-xs truncate w-full text-center">{icon.key}</span>
                  </button>
                ))}
              </div>

              {(hasMore || canShowLess) && (
                <div className="flex justify-center gap-3 mt-6">
                  {canShowLess && (
                    <button
                      type="button"
                      onClick={showLess}
                      className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-500"
                    >
                      Show less
                    </button>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? 'Loading...' : `Show more (${icons.length} of ${total})`}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Settings + Preview */}
        <div className="space-y-6">

          {/* Selected chips */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Selected ({selected.length})</label>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    setTheme('dark');
                    setSize(48);
                    setLayout('row');
                    setGap(8);
                  }}
                  className="text-xs px-2 py-0.5 rounded bg-yellow-400 text-black font-medium hover:bg-yellow-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 min-h-8">
              {selected.length === 0 && <span className="text-zinc-500 dark:text-zinc-600 text-sm">Click icons to select</span>}
              {selected.map((key) => (
                <span
                  key={key}
                  onClick={() => toggleIcon(key)}
                  className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-1 rounded cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {key} ×
                </span>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Theme</label>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    theme === t ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400' : inactiveBtn
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Size: {size}px</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${
                    size === s ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400' : inactiveBtn
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Layout + Gap */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Layout</label>
            <div className="flex gap-2 mb-3">
              {LAYOUTS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    layout === l ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400' : inactiveBtn
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="text-xs text-zinc-500 mb-1 block">Gap: {gap}px</label>
            <input
              type="range" min={0} max={32} value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Preview</label>
            <div className={`${surfaceClass} rounded-lg p-4 min-h-20 flex items-center justify-center`}>
              {selected.length === 0
                ? <span className="text-zinc-500 dark:text-zinc-600 text-sm">Select icons to preview</span>
                : <img
                    src={buildUrl()}
                    alt="preview"
                    className="max-w-full"
                    key={buildUrl()}
                  />
              }
            </div>
          </div>

          {/* URL output */}
          {selected.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Embed URL</label>
              <div className={`${surfaceClass} rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-400 break-all font-mono mb-2`}>
                {buildUrl()}
              </div>
              <button
                onClick={copyUrl}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied ? 'bg-green-600 text-white' : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
