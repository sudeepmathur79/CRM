import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import SetupPage from './pages/Setup';
import SignupPage from './pages/Signup';
import DashboardPage from './pages/Dashboard';
import LeadsPage from './pages/Leads';
import KanbanPage from './pages/Kanban';
import LeadDetailPage from './pages/LeadDetail';
import RecordingsPage from './pages/Recordings';
import SettingsPage from './pages/Settings';
import InboxPage from './pages/Inbox';
import AgentsPage from './pages/Agents';
import GlassesHud from './views/GlassesHud';

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
      <Route path="/hud" element={<Protected><GlassesHud /></Protected>} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="recordings" element={<RecordingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="agents" element={<AgentsPage />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
