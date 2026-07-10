import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/playground', label: 'Playground' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/request', label: 'Request Icon' },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">
          skill<span className="text-yellow-400">icons</span>
        </Link>
        <div className="flex gap-6">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm transition-colors ${
                location.pathname === item.path || (item.path === '/admin' && location.pathname.startsWith('/admin'))
                  ? 'text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
