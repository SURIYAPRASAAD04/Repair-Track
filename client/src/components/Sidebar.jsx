import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { LogOut, LayoutDashboard, Users, ClipboardList, Moon, Sun, AlertCircle } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/api/subscription')
         .then(res => setSubscription(res.data))
         .catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl transition-all group relative min-h-[44px] min-w-[44px] justify-center md:justify-start ${
          isActive 
            ? 'bg-accent-primary/10 text-accent-primary font-semibold' 
            : 'text-text-muted hover:bg-surface-border hover:text-text-primary'
        }`}
      >
        <Icon className={`w-6 h-6 md:w-5 md:h-5 ${isActive && 'text-accent-primary'}`} />
        <span className="text-[10px] md:text-sm md:hidden block whitespace-nowrap mt-1 font-medium">{label}</span>
        <span className="hidden lg:block whitespace-nowrap">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-surface-border z-50 px-2 flex items-center justify-around pb-safe">
        <NavLink to="/dashboard" icon={LayoutDashboard} label="Home" />
        <NavLink to="/jobs" icon={ClipboardList} label="Jobs" />
        <NavLink to="/customers" icon={Users} label="Clients" />
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 p-3 text-text-muted hover:text-accent-primary rounded-xl transition-all min-h-[44px] min-w-[44px]"
        >
          {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          <span className="text-[10px] mt-1 font-medium">Theme</span>
        </button>
      </nav>

      {/* Login Reminder Banner for Unconnected WhatsApp (Mobile Only, floats above Nav) */}
      {!user?.whatsappConnected && (
         <div className="md:hidden fixed bottom-[72px] left-4 right-4 bg-accent-amber/90 backdrop-blur-md text-amber-950 px-4 py-3 rounded-xl shadow-lg z-40 flex items-center justify-between animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <div className="text-sm font-medium">WhatsApp Disconnected</div>
            </div>
            <Link to="/dashboard" className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
              Fix Now
            </Link>
         </div>
      )}

      {/* Tablet / Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-surface-card border-r border-surface-border z-50 transition-all duration-300 w-20 lg:w-64">
        {/* Header */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-surface-border">
          <Link to="/dashboard" className="flex items-center gap-3 text-text-primary font-bold text-xl group">
            <span className="hidden lg:block tracking-tight text-accent-green">RepairTrack</span>
            <span className="lg:hidden tracking-tight text-accent-green text-sm flex items-center justify-center p-2">RT</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-8 px-3 lg:px-4 space-y-2 overflow-y-auto w-full">
           <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
           <NavLink to="/jobs" icon={ClipboardList} label="Repair Jobs" />
           <NavLink to="/customers" icon={Users} label="Customers" />
        </div>

        {/* Footer Settings & Logout */}
        <div className="flex flex-col gap-3 p-3 lg:p-4 border-t border-surface-border w-full bg-surface-base/30">
          
          {/* Desktop Subscription Plan Badge (Moved from top to sidebar bottom per user request) */}
          {subscription && (
            <div className="hidden lg:flex items-center justify-between p-3 bg-surface-elevated border border-surface-border rounded-xl">
               <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Current Plan</div>
                  <div className="text-sm font-semibold capitalize bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue">{subscription.plan}</div>
               </div>
               <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  subscription.status === 'active' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                  subscription.status === 'trial' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                  'bg-accent-red/10 text-accent-red border-accent-red/20'
                }`}>
                  {subscription.status.toUpperCase()}
               </span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl transition-all group relative min-h-[44px] min-w-[44px] justify-center md:justify-start text-text-muted hover:bg-surface-border hover:text-text-primary"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6 md:w-5 md:h-5" /> : <Moon className="w-6 h-6 md:w-5 md:h-5" />}
            <span className="hidden lg:block whitespace-nowrap font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <div className="flex items-center justify-center lg:justify-between w-full mt-1 pt-3 border-t border-surface-border">
            <div className="hidden lg:block pr-2 overflow-hidden">
               <p className="text-text-primary font-semibold text-sm truncate">{user.shopName}</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.whatsappConnected ? 'bg-accent-green' : 'bg-accent-red'}`}></span>
                  <p className="text-text-muted text-xs truncate">{user.whatsappConnected ? 'Connected' : 'Scanner Offline'}</p>
               </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 w-full lg:w-auto flex justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block text-center mt-3 mb-1">
             <p className="text-[10px] text-text-muted/60 font-medium tracking-wide">Powered by</p>
             <p className="text-[11px] text-text-muted font-bold tracking-widest uppercase">Menoval Technology Solutions</p>
          </div>
        </div>
      </aside>
    </>
  );
}
