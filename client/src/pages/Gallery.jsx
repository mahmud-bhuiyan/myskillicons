import { useState, useEffect } from 'react';
import api from '../utils/api';
import { buildIconUrl } from '../utils/serverUrl';

const fieldClass =
  'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400';

export default function Gallery() {
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(48);
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/gallery'),
      api.get('/gallery/categories'),
    ]).then(([iconsRes, catRes]) => {
      setIcons(iconsRes.data.icons);
      const nextCategories = catRes.data.categories?.length
        ? catRes.data.categories
        : ['all'];
      setCategories(nextCategories);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories, activeCategory]);

  const filtered = icons.filter(icon =>
    (activeCategory === 'all' || icon.category === activeCategory) &&
    (icon.name.toLowerCase().includes(search.toLowerCase()) || icon.key.includes(search.toLowerCase()))
  );

  const iconUrl = (key) =>
    buildIconUrl({ i: key, theme, width: size, height: size });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Icon Gallery</h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">{icons.length} icons available. Click any icon to get its URL.</p>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 ${fieldClass}`}
        />
        <select
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className={fieldClass}
        >
          {['dark', 'light'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className={fieldClass}
        >
          {[24,32,48,64,80,96].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
              activeCategory === cat
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-zinc-500 text-center py-20">Loading icons...</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {filtered.map(icon => (
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
      )}

      {/* Icon detail modal */}
      {selectedIcon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIcon(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
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
