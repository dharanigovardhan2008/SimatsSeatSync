// Main App Component with Routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminEvents } from '@/pages/AdminEvents';
import { CoordinatorDashboard } from '@/pages/CoordinatorDashboard';
import { CoordinatorEventForm } from '@/pages/CoordinatorEventForm';
import { EventDetail } from '@/pages/EventDetail';
import { Ticket } from '@/pages/Ticket';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
    <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin"></div>
  </div>
);

const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'student') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const CoordinatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'coordinator') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Any signed-in role can view an event or their ticket
const AuthedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/event/:eventId" element={<AuthedRoute><EventDetail /></AuthedRoute>} />
      <Route path="/ticket/:registrationId" element={<AuthedRoute><Ticket /></AuthedRoute>} />

      <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />

      <Route path="/coordinator" element={<CoordinatorRoute><CoordinatorDashboard /></CoordinatorRoute>} />
      <Route path="/coordinator/events/new" element={<CoordinatorRoute><CoordinatorEventForm /></CoordinatorRoute>} />
      <Route path="/coordinator/events/:eventId/edit" element={<CoordinatorRoute><CoordinatorEventForm /></CoordinatorRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;