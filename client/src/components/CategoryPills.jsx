const inactiveClass =
  'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500';

const defaultActiveClass = 'bg-yellow-400 text-black border-yellow-400';

/**
 * Category filter pills used on Gallery, Playground, and Admin icons tab.
 * Pass activeClassName to preserve small per-page differences (e.g. font-medium).
 */
const CategoryPills = ({
  categories,
  activeCategory,
  onChange,
  getCount,
  className = 'flex gap-2 flex-wrap mb-6',
  activeClassName = defaultActiveClass,
}) => {
  return (
    <div className={className}>
      {categories.map((cat) => {
        const count = getCount?.(cat);
        const label = count == null ? cat : `${cat} (${count})`;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
              activeCategory === cat ? activeClassName : inactiveClass
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
