import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState(localStorage.getItem('adminUsername') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('adminAvatar') || '');

  useEffect(() => {
    if (!token) return;
    api.get('/admin/me')
      .then(res => {
        localStorage.setItem('adminUsername', res.data.username);
        localStorage.setItem('adminAvatar', res.data.avatar || '');
        setUsername(res.data.username);
        setAvatar(res.data.avatar || '');
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminAvatar');
        setToken(null);
        setUsername('');
        setAvatar('');
      });
  }, [token]);

  const login = (newToken, name = '', avatarUrl = '') => {
    localStorage.setItem('adminToken', newToken);
    if (name) localStorage.setItem('adminUsername', name);
    localStorage.setItem('adminAvatar', avatarUrl || '');
    setToken(newToken);
    setUsername(name || localStorage.getItem('adminUsername') || '');
    setAvatar(avatarUrl || '');
  };

  const updateProfile = (name, avatarUrl) => {
    if (typeof name === 'string') {
      localStorage.setItem('adminUsername', name);
      setUsername(name);
    }
    if (typeof avatarUrl === 'string') {
      localStorage.setItem('adminAvatar', avatarUrl);
      setAvatar(avatarUrl);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminAvatar');
    setToken(null);
    setUsername('');
    setAvatar('');
  };

  return (
    <AuthContext.Provider value={{ token, username, avatar, login, logout, updateProfile, isAdmin: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
