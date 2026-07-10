import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Gallery from './pages/Gallery';
import RequestIcon from './pages/RequestIcon';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDetails from './pages/AdminDetails';

function AppShell() {
  const { pathname } = useLocation();
  const isAdminDashboard = pathname === '/admin';

  return (
    <div
      className={`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white flex flex-col ${
        isAdminDashboard ? 'h-dvh overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Navbar />
      <main className={`flex-1 ${isAdminDashboard ? 'min-h-0 overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/request" element={<RequestIcon />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/details" element={
            <AdminRoute><AdminDetails /></AdminRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
        </Routes>
      </main>
      {!isAdminDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
