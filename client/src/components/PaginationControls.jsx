const defaultLessClass =
  'px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-500';

const defaultMoreClass =
  'px-5 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Show less / Show more (or Load more) controls.
 * Button classNames and moreLabel keep Gallery / Playground / Admin visuals identical.
 */
const PaginationControls = ({
  canShowLess,
  hasMore,
  loadingMore = false,
  onShowLess,
  onLoadMore,
  shown,
  total,
  moreLabel,
  className = 'flex justify-center gap-3 mt-8',
  lessButtonClassName = defaultLessClass,
  moreButtonClassName = defaultMoreClass,
}) => {
  if (!canShowLess && !hasMore) return null;

  const moreText =
    moreLabel ??
    (loadingMore ? 'Loading...' : `Show more (${shown} of ${total})`);

  return (
    <div className={className}>
      {canShowLess && (
        <button type="button" onClick={onShowLess} className={lessButtonClassName}>
          Show less
        </button>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className={moreButtonClassName}
        >
          {moreText}
        </button>
      )}
    </div>
  );
};

export default PaginationControls;
