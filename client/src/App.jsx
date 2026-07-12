import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IconsProvider } from './context/IconsContext';
import { RequestsProvider } from './context/RequestsContext';
import { AdminDataProvider } from './context/AdminDataContext';
import App from './Layout';

const AppWithProviders = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <IconsProvider>
          <RequestsProvider>
            <BrowserRouter>
              <AdminDataProvider>
                <App />
                <ToastContainer position="top-right" autoClose={3000} theme="colored" />
              </AdminDataProvider>
            </BrowserRouter>
          </RequestsProvider>
        </IconsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppWithProviders;
