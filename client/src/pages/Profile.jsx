import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Mail, Store, Calendar, CreditCard, Shield, Moon, Sun, LogOut, Crown, Clock, ChevronRight } from 'lucide-react';
import WhatsAppLogo from '../components/WhatsAppLogo';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await api.get('/api/subscription');
        setSubscription(res.data);
      } catch (e) {
        // No subscription found — user is on free/unsubscribed
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-accent-green/10 text-accent-green border-accent-green/20';
      case 'trial': return 'bg-accent-amber/10 text-accent-amber border-accent-amber/20';
      case 'expired': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      case 'suspended': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      default: return 'bg-surface-border text-text-muted border-surface-border';
    }
  };

  const getPlanLabel = (plan) => {
    const labels = { starter: 'Starter', business: 'Business', advanced: 'Advanced', mobile_app: 'Mobile App' };
    return labels[plan] || plan || 'Free';
  };

  const getCycleLabel = (cycle) => {
    const labels = { monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half Yearly', yearly: 'Yearly' };
    return labels[cycle] || cycle || '—';
  };

  const daysLeft = subscription ? getDaysLeft(subscription.endDate) : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue inline-block">Profile</h1>
        <p className="text-text-muted mt-1 text-sm sm:text-base">Account settings & subscription details</p>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-accent-primary/20 via-accent-blue/20 to-accent-green/20 relative">
          <div className="absolute inset-0 bg-surface-card/30 backdrop-blur-sm"></div>
        </div>
        <div className="flex flex-col items-center pb-6 -mt-10 sm:-mt-12 relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-elevated border-2 border-surface-border rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-4 text-center">{user?.ownerName || 'Shop Owner'}</h2>
          <p className="text-text-muted text-sm flex items-center gap-1.5 mt-1">
            <Store className="w-3.5 h-3.5" /> {user?.shopName || 'My Shop'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="card p-5 sm:p-6 space-y-5">
          <h3 className="font-bold text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
            <User className="w-5 h-5 text-accent-primary" />
            Account Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
              <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-accent-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Owner Name</p>
                <p className="text-sm font-semibold text-text-primary truncate">{user?.ownerName || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
              <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Email</p>
                <p className="text-sm font-semibold text-text-primary truncate">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
              <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-accent-green" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Shop Name</p>
                <p className="text-sm font-semibold text-text-primary truncate">{user?.shopName || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
              <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center shrink-0">
                <WhatsAppLogo className="w-5 h-5 text-accent-green" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">WhatsApp</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${user?.whatsappConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`}></span>
                  <p className="text-sm font-semibold text-text-primary">{user?.whatsappConnected ? 'Connected' : 'Not Connected'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="card p-5 sm:p-6 space-y-5">
          <h3 className="font-bold text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
            <Crown className="w-5 h-5 text-accent-amber" />
            Subscription Plan
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              {/* Plan + Status */}
              <div className="flex items-center justify-between p-4 bg-surface-bg rounded-xl border border-surface-border">
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Current Plan</p>
                  <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue">{getPlanLabel(subscription.plan)}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>

              {/* Billing Cycle */}
              <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
                <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Billing Cycle</p>
                  <p className="text-sm font-semibold text-text-primary">{getCycleLabel(subscription.billingCycle)}</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
                <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Start Date</p>
                  <p className="text-sm font-semibold text-text-primary">{formatDate(subscription.startDate)}</p>
                </div>
              </div>

              {/* Expiry Date + Days Left */}
              <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${daysLeft !== null && daysLeft <= 7 ? 'bg-accent-red/10' : 'bg-accent-amber/10'}`}>
                  <Clock className={`w-5 h-5 ${daysLeft !== null && daysLeft <= 7 ? 'text-accent-red' : 'text-accent-amber'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Expires On</p>
                  <p className="text-sm font-semibold text-text-primary">{formatDate(subscription.endDate)}</p>
                </div>
                {daysLeft !== null && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    daysLeft <= 0 ? 'bg-accent-red/10 text-accent-red border-accent-red/20' :
                    daysLeft <= 7 ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                    'bg-accent-green/10 text-accent-green border-accent-green/20'
                  }`}>
                    {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                  </span>
                )}
              </div>

              {/* Amount Paid */}
              {subscription.amountPaid != null && (
                <div className="flex items-center gap-4 p-3 bg-surface-bg rounded-xl border border-surface-border">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Amount Paid</p>
                    <p className="text-sm font-semibold text-text-primary">₹{subscription.amountPaid?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 bg-surface-bg rounded-full flex items-center justify-center border border-surface-border">
                <Crown className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-muted text-sm text-center">No subscription found.<br/>Contact admin to activate your plan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section (visible on all, theme toggle + logout) */}
      <div className="card p-5 sm:p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
          <Shield className="w-5 h-5 text-text-muted" />
          Settings
        </h3>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 bg-surface-bg rounded-xl border border-surface-border hover:bg-surface-elevated transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-amber/10 rounded-xl flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-accent-amber" /> : <Moon className="w-5 h-5 text-accent-amber" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Appearance</p>
              <p className="text-xs text-text-muted">{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 bg-surface-bg rounded-xl border border-surface-border hover:bg-accent-red/5 hover:border-accent-red/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-red/10 rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-accent-red" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary group-hover:text-accent-red transition-colors">Logout</p>
              <p className="text-xs text-text-muted">Sign out of your account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent-red transition-colors" />
        </button>
      </div>

      {/* Footer Branding */}
      <div className="text-center pb-4">
        <p className="text-[10px] text-text-muted/60 font-medium tracking-wide">Powered by</p>
        <p className="text-[11px] text-text-muted font-bold tracking-widest uppercase">Menoval Technology Solutions</p>
      </div>
    </div>
  );
}
