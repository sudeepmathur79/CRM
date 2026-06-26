import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.me()
        .then(r => { setUser(r.data); setOrg(r.data.org || null); })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    if (data.requiresTwoFactor) return data;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setOrg(data.org || null);
    return data.user;
  };

  const verify2FA = async ({ tempToken, code }) => {
    const { data } = await authApi.verify2FALogin({ tempToken, code });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setOrg(data.org || null);
    return data.user;
  };

  // Used by self-signup flow
  const setAuth = ({ user, org }) => {
    setUser(user);
    setOrg(org || null);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setOrg(null);
  };

  const refreshUser = () => authApi.me().then(r => { setUser(r.data); setOrg(r.data.org || null); });

  return (
    <AuthContext.Provider value={{ user, org, setUser, setOrg, setAuth, login, verify2FA, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
