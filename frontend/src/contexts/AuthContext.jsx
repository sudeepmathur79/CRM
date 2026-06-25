import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.me().then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Standard password login — handles 2FA mid-step by returning { requiresTwoFactor, tempToken }
  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    if (data.requiresTwoFactor) return data; // caller handles the 2FA step
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  // Complete 2FA step after password login
  const verify2FA = async ({ tempToken, code }) => {
    const { data } = await authApi.verify2FALogin({ tempToken, code });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const refreshUser = () => authApi.me().then(r => setUser(r.data));

  return (
    <AuthContext.Provider value={{ user, setUser, login, verify2FA, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
