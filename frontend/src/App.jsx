import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import SetupPage from './pages/Setup';
import DashboardPage from './pages/Dashboard';
import LeadsPage from './pages/Leads';
import KanbanPage from './pages/Kanban';
import LeadDetailPage from './pages/LeadDetail';
import RecordingsPage from './pages/Recordings';
import SettingsPage from './pages/Settings';
import InboxPage from './pages/Inbox';
import { useEffect, useState, createContext, useContext } from 'react';
import { configApi } from './services/api';

export const AppConfigContext = createContext({ googleClientId: null });
export const useAppConfig = () => useContext(AppConfigContext);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="recordings" element={<RecordingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="inbox" element={<InboxPage />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  const [googleClientId, setGoogleClientId] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    configApi.get()
      .then(r => setGoogleClientId(r.data.googleClientId || null))
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  if (!configLoaded) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  );

  const tree = (
    <AppConfigContext.Provider value={{ googleClientId }}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </AppConfigContext.Provider>
  );

  // Only wrap with GoogleOAuthProvider once we have a real clientId
  if (!googleClientId) return tree;
  return (
    <GoogleOAuthProvider clientId={googleClientId} onScriptLoadError={() => console.warn('Google script failed to load')}>
      {tree}
    </GoogleOAuthProvider>
  );
}
