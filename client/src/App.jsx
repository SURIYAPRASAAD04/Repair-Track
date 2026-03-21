import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import SubscriptionExpired from './pages/SubscriptionExpired';
import LandingPage from './pages/LandingPage';

/* Inner component that has access to useLocation (inside Router) */
function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const isExpiredPage = location.pathname === '/subscription-expired';
  const isLandingPage = location.pathname === '/' && !user;

  return (
    <>
      {user && !isExpiredPage && <Sidebar />}

      {isLandingPage ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      ) : (
        <main className={`flex-1 min-h-screen transition-all duration-300 ${user && !isExpiredPage ? 'pb-24 pt-4 md:py-8 md:pl-20 lg:pl-64' : 'py-8'}`}>
          <div className="container mx-auto px-4 md:px-8 xl:max-w-7xl">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscription-expired" element={<SubscriptionExpired />} />
            </Route>

            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
          </Routes>
          </div>
        </main>
      )}
    </>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-wa-green"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-surface-bg text-text-primary font-sans transition-colors duration-300">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppRoutes />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
