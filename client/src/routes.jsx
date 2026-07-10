import { Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Gallery from './pages/Gallery';
import RequestIcon from './pages/RequestIcon';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDetails from './pages/AdminDetails';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/request" element={<RequestIcon />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/details"
        element={
          <AdminRoute>
            <AdminDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
