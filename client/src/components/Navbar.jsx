import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Users, ClipboardList, Wifi, WifiOff } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isActive ? 'bg-accent-green/10 text-accent-green font-medium' : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-surface-card border-b border-surface-border py-3 sticky top-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-text-primary font-bold text-xl tracking-tight">
            RepairTrack
          </Link>
          
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
            isOnline 
              ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' 
              : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-6 text-sm">
            <div className="flex items-center space-x-1 sm:space-x-2 mr-2">
              <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink to="/jobs" icon={ClipboardList} label="Repair Jobs" />
              <NavLink to="/customers" icon={Users} label="Customers" />
            </div>
            
            <div className="flex items-center gap-4 pl-4 border-l border-surface-border">
              <div className="hidden md:block text-right">
                <p className="text-text-primary font-medium text-sm leading-tight">{user.shopName}</p>
                <p className="text-text-muted text-xs">{user.name}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
