import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hadirku_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hadirku_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.data);
          localStorage.setItem('hadirku_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.login(identifier, password);
    const { token: newToken, user: userData } = res.data;

    if (userData.role !== 'hr_admin') {
      throw new Error('Akses ditolak. Portal ini khusus untuk HR / Admin Kantor.');
    }

    localStorage.setItem('hadirku_token', newToken);
    localStorage.setItem('hadirku_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('hadirku_token');
    localStorage.removeItem('hadirku_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
