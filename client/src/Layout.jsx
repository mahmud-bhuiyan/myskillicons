import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes';

const Layout = () => {
  const { pathname } = useLocation();
  const isAdminDashboard = pathname === '/admin';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      className={`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white flex flex-col ${
        isAdminDashboard ? 'h-dvh overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Navbar />
      <main className={`flex-1 ${isAdminDashboard ? 'min-h-0 overflow-hidden' : ''}`}>
        <AppRoutes />
      </main>
      {!isAdminDashboard && <Footer />}
    </div>
  );
};

export default Layout;
