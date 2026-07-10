import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IconsProvider } from './context/IconsContext';
import { RequestsProvider } from './context/RequestsContext';
import { AdminDataProvider } from './context/AdminDataContext';
import App from './Layout';

export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <IconsProvider>
          <RequestsProvider>
            <BrowserRouter>
              <AdminDataProvider>
                <App />
              </AdminDataProvider>
            </BrowserRouter>
          </RequestsProvider>
        </IconsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
