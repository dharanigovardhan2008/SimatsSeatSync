// Main App Component with Routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Page imports
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminEvents } from '@/pages/AdminEvents';

// Protected Route Component for Students
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }
  
  if (userData.role !== 'student') {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// Protected Route Component for Admins
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }
  
  if (userData.role !== 'admin') {
    return <Navigate to="/student" replace />;
  }
  
  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Student Protected Routes */}
      <Route 
        path="/student" 
        element={
          <StudentRoute>
            <StudentDashboard />
          </StudentRoute>
        } 
      />
      
      {/* Admin Protected Routes */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/events" 
        element={
          <AdminRoute>
            <AdminEvents />
          </AdminRoute>
        } 
      />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
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
