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
import { ScanQR } from '@/pages/ScanQR';
import { TeamInvite } from '@/pages/TeamInvite';
import { JoinTeam } from '@/pages/JoinTeam';
import { PaymentVerificationPage } from '@/pages/PaymentVerificationPage';
import { EventDetail } from '@/pages/EventDetail';
import { Ticket } from '@/pages/Ticket';
import { MyTickets } from '@/pages/MyTickets';
import { TeamTickets } from '@/pages/TeamTickets';
import { Teams } from '@/pages/Teams';
import { NotFound } from '@/pages/NotFound';
import { CloudBackground } from '@/components/ui/CloudBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading dashboard..." />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'student') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen message="Initializing Admin..." />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const CoordinatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen message="Initializing Coordinator..." />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  if (userData.role !== 'coordinator') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Any signed-in role can view an event or their ticket
const AuthedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen message="Verifying session..." />;
  if (!user || !userData) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Signed-in users go straight to their own dashboard instead of the
// marketing home page; visitors still get the home page.
const RootRoute: React.FC = () => {
  const { user, userData, loading } = useAuth();
  if (loading) {
    return <LoadingScreen message="Welcome to SeatSync..." />;
  }
  if (user && userData) {
    if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData.role === 'coordinator') return <Navigate to="/coordinator" replace />;
    return <Navigate to="/student" replace />;
  }
  return <Home />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/event/:eventId" element={<AuthedRoute><EventDetail /></AuthedRoute>} />
      <Route path="/ticket/:registrationId" element={<AuthedRoute><Ticket /></AuthedRoute>} />
      <Route path="/tickets" element={<AuthedRoute><MyTickets /></AuthedRoute>} />
      <Route path="/team-tickets/:teamId" element={<AuthedRoute><TeamTickets /></AuthedRoute>} />
      <Route path="/teams" element={<AuthedRoute><Teams /></AuthedRoute>} />

      <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />

      <Route path="/coordinator" element={<CoordinatorRoute><CoordinatorDashboard /></CoordinatorRoute>} />
      <Route path="/coordinator/events/new" element={<CoordinatorRoute><CoordinatorEventForm /></CoordinatorRoute>} />
      <Route path="/coordinator/events/:eventId/edit" element={<CoordinatorRoute><CoordinatorEventForm /></CoordinatorRoute>} />
      <Route path="/scan/:eventId" element={<AuthedRoute><ScanQR /></AuthedRoute>} />
      <Route path="/team-invite/:teamId" element={<AuthedRoute><TeamInvite /></AuthedRoute>} />
      {/* Not wrapped in AuthedRoute: JoinTeam itself redirects to /register
          when signed out, preserving this URL via ?redirect= so the user
          lands back here right after creating an account. */}
      <Route path="/join-team/:teamId" element={<JoinTeam />} />
      <Route path="/payments/:eventId" element={<AuthedRoute><PaymentVerificationPage /></AuthedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="relative min-h-screen w-full">
          {/* Fixed background layer - mobile-optimized to prevent flickering */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <CloudBackground speed={0.8} count={6} />
          </div>
          <div className="relative z-0">
            <PageTransition>
              <AppRoutes />
            </PageTransition>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
