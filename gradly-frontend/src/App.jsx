import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import Applications from './pages/Applications';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';

// Must be authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Must be authenticated AND have a specific role
function RoleRoute({ children, allowed }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // If role isn't loaded yet (null) let it through — the page has its own soft guard
  if (role && !allowed.includes(role)) return <Navigate to="/jobs" replace />;
  return children;
}

// Redirect authenticated users away from auth pages
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />

      {/* Auth */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Social feed */}
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />

      {/* Jobs */}
      <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/jobs/create" element={<RoleRoute allowed={['alumni', 'admin']}><CreateJob /></RoleRoute>} />

      {/* Applications */}
      <Route path="/applications" element={<RoleRoute allowed={['student', 'alumni']}><Applications /></RoleRoute>} />

      {/* Events */}
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path="/events/:eventId" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />

      {/* Notifications */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

      {/* Messages */}
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
