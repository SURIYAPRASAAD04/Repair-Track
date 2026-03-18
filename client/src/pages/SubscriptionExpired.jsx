import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle, MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionExpired() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // You can replace this with your actual WhatsApp support number
  const supportNumber = '919876543210'; 

  useEffect(() => {
    // We intentionally don't use the standard configured axios instance to avoid 
    // infinite redirect loops if this endpoint also somehow returns 403.
    // Instead we fetch it and catch any errors gracefully.
    const fetchSubscription = async () => {
      try {
        const res = await api.get('/api/subscription');
        setSubscription(res.data);
      } catch (error) {
        console.error('Failed to fetch subscription bounds');
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

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hi, I'd like to renew my RepairTrack subscription for my shop: ${user?.shopName}`);
    window.open(`https://wa.me/${supportNumber}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-wa-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-4">
      <div className="card max-w-md w-full text-center p-8 border-accent-red/30 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-accent-red/10 blur-3xl rounded-full"></div>
        
        <div className="relative">
          <div className="w-16 h-16 bg-accent-red/10 text-accent-red rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">Subscription Expired</h1>
          
          <p className="text-text-muted mb-8">
            Your access to RepairTrack has been temporarily suspended because your subscription has ended.
          </p>

          <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Shop Name</span>
              <span className="font-medium text-text-primary">{user?.shopName}</span>
            </div>
            {subscription && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Current Plan</span>
                  <span className="font-medium text-text-primary capitalize">{subscription.plan}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Expired On</span>
                  <span className="font-medium text-accent-red">
                    {new Date(subscription.endDate).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={openWhatsApp}
            className="btn-primary w-full py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle className="w-5 h-5" />
            Contact us to renew
          </button>

          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-transparent border border-surface-border hover:bg-surface-border text-text-secondary font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
