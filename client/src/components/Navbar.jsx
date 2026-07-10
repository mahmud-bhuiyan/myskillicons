import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveServerUrl } from '../utils/serverUrl';

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.8-3.2 4.1-4.8 6.5-4.8s4.7 1.6 6.5 4.8" />
    </svg>
  );
}

function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, avatar } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const publicNavItems = [
    { path: '/', label: 'Home' },
    { path: '/playground', label: 'Playground' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/request', label: 'Request Icon' },
  ];

  const adminNavItems = [
    { path: '/admin?tab=icons', label: 'Icons', match: (p, search) => p === '/admin' && (!search.get('tab') || search.get('tab') === 'icons') },
    { path: '/admin?tab=requests', label: 'Requests', match: (p, search) => p === '/admin' && search.get('tab') === 'requests' },
  ];

  const navItems = isAdmin ? adminNavItems : publicNavItems;
  const onDetails = location.pathname === '/admin/details';

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-zinc-900 dark:text-white font-bold text-lg tracking-tight">
          my<span className="text-yellow-500 dark:text-yellow-400">iconix</span>
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map(item => {
            const active = item.match
              ? item.match(location.pathname, new URLSearchParams(location.search))
              : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-colors ${
                  active
                    ? 'text-zinc-900 dark:text-white font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>

          {isAdmin && (
            <Link
              to="/admin/details"
              aria-label="Admin details"
              className={`flex items-center justify-center w-8 h-8 rounded-full border overflow-hidden transition-colors ${
                onDetails
                  ? 'border-yellow-500 dark:border-yellow-400 text-yellow-500 dark:text-yellow-400'
                  : 'border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {avatar ? (
                <img src={resolveServerUrl(avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
