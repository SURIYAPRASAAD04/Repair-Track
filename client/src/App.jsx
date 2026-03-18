import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Jobs from './pages/Jobs';
import SubscriptionExpired from './pages/SubscriptionExpired';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-wa-green"></div>
      </div>
    );
  }

  const isExpiredPage = window.location.pathname === '/subscription-expired';

  return (
    <Router>
      <div className="min-h-screen bg-surface-bg text-text-primary font-sans transition-colors duration-300">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
          }}
        />
        
        {user && !isExpiredPage && <Sidebar />}

        <main className={`flex-1 min-h-screen transition-all duration-300 ${user && !isExpiredPage ? 'pb-24 pt-4 md:py-8 md:pl-20 lg:pl-64' : 'py-8'}`}>
          <div className="container mx-auto px-4 md:px-8 xl:max-w-7xl">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/subscription-expired" element={<SubscriptionExpired />} />
            </Route>

            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
          </Routes>
          </div>
        </main>
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
