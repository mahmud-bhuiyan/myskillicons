export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
          <div>
            <p className="font-bold text-lg tracking-tight mb-1">
              skill<span className="text-yellow-500 dark:text-yellow-400">icons</span>
            </p>
            <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
              Skill icons for developers — one URL, no hosting, no CSS.
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-zinc-500 dark:text-zinc-600 text-xs uppercase tracking-[0.2em] mb-2">
              Developed by
            </p>
            <a
              href="https://mahmudur-bhuiyan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-zinc-900 dark:text-white font-semibold tracking-tight hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
            >
              Mahmudur Bhuiyan
              <svg
                aria-hidden
                viewBox="0 0 12 12"
                className="w-3 h-3 text-yellow-500 dark:text-yellow-400 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9L9 3M4 3h5v5" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-900 text-center">
          <p className="text-zinc-500 dark:text-zinc-600 text-xs">
            © {year} Mahmudur Bhuiyan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
