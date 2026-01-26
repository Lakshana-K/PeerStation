import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import FindTutors from './pages/FindTutors';
import TutorProfile from './pages/TutorProfile';
import BookSession from './pages/BookSession';
import HelpRequests from './pages/HelpRequests';
import Messages from './pages/Messages';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import Availability from './pages/Availability';
import ClaimRequest from './pages/ClaimRequest';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Don't show loading spinner - just wait
  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Public Only Route (redirects to dashboard if logged in)
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Don't show loading spinner - just wait
  if (loading) {
    return null;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutors"
          element={
            <ProtectedRoute>
              <FindTutors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutors/:id"
          element={
            <ProtectedRoute>
              <TutorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-session"
          element={
            <ProtectedRoute>
              <BookSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help-requests"
          element={
            <ProtectedRoute>
              <HelpRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claim-request"
          element={
            <ProtectedRoute>
              <ClaimRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <Availability />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;