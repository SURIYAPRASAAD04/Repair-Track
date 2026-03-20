import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Smartphone, Wrench, IndianRupee, BellRing, CheckCircle2, XCircle } from 'lucide-react';
import QRModal from '../components/QRModal';
import PairingCodeModal from '../components/PairingCodeModal';
import WhatsAppLogo from '../components/WhatsAppLogo';

export default function Dashboard() {
  const { user, setUser } = useAuth();

  // Helper: sync WhatsApp status to both local state AND AuthContext
  const updateWhatsAppStatus = (connected) => {
    setWaStatus({ connected });
    setUser(prev => ({ ...prev, whatsappConnected: connected }));
  };
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedToday: 0,
    totalRevenue: 0,
    statusBreakdown: {}
  });
  
  const [waStatus, setWaStatus] = useState({ connected: user?.whatsappConnected || false });
  const [qrCode, setQrCode] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Poll for connection success
  useEffect(() => {
    if (!polling) return;

    const timeout = setTimeout(() => {
      if (!qrCode && !qrSuccess && !isAuthenticating) {
        setPolling(false);
        setQrError(true);
        toast.error('Could not reach WhatsApp service. Please try again.');
      }
    }, 90000);
    
    let interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/whatsapp/qr/${user._id}`);
        
        if (res.data.ready) {
          clearInterval(interval);
          setPolling(false);
          setQrSuccess(true);
          setIsAuthenticating(false);
          updateWhatsAppStatus(true);
          toast.success('WhatsApp Connected successfully!');
          setTimeout(() => {
             setShowQR(false);
             setQrSuccess(false);
          }, 1500);
        } else if (res.data.authenticating) {
          setIsAuthenticating(true);
          setQrCode(null);
        } else if (res.data.qr) {
          setIsAuthenticating(false);
          setQrError(false);
          setQrCode(res.data.qr);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [polling, user._id]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, statusRes] = await Promise.all([
        api.get('/api/jobs/dashboard-stats'),
        api.get(`/api/whatsapp/status/${user._id}`),
      ]);
      
      setStats(statsRes.data);
      updateWhatsAppStatus(statusRes.data.connected);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const handleConnectWhatsApp = async () => {
    if (isMobile) {
      setShowMethodPicker(true);
      return;
    }
    await startQRFlow();
  };

  const startQRFlow = async () => {
    try {
      setIsConnecting(true);
      setShowMethodPicker(false);
      setQrSuccess(false);
      setIsAuthenticating(false);
      setQrError(false);
      setQrCode(null);
      await api.post('/api/whatsapp/connect');
      setShowQR(true);
      setPolling(true);
    } catch (error) {
      toast.error('Failed to initialize session');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetryConnect = async () => {
    setQrError(false);
    setQrCode(null);
    setIsAuthenticating(false);
    setQrSuccess(false);
    try {
      await api.post('/api/whatsapp/connect');
      setPolling(true);
    } catch (error) {
      toast.error('Failed to initialize session');
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      setIsDisconnecting(true);
      await api.post('/api/whatsapp/disconnect');
      updateWhatsAppStatus(false);
      toast.success('WhatsApp Disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-8 relative">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue inline-block">Overview</h1>
        <p className="text-text-muted mt-1 text-sm sm:text-base">Here's what's happening at {user.shopName} right now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
        {/* Active Repairs Card */}
        <div className="card relative overflow-hidden group hover:border-accent-primary/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent-amber/10 rounded-full blur-2xl group-hover:bg-accent-amber/20 transition-all"></div>
          <div className="flex items-center">
             <div className="p-3 bg-surface-elevated text-accent-amber border border-surface-border rounded-xl mr-4 shadow-sm">
               <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
             </div>
             <div>
               <p className="text-xs sm:text-sm font-medium text-text-muted mb-0.5">Active Repairs</p>
               <p className="text-2xl sm:text-3xl font-bold">{stats.activeJobs}</p>
             </div>
          </div>
        </div>
        
        {/* Auto Updates Card */}
        <div className="card relative overflow-hidden group hover:border-accent-primary/50 transition-colors">
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all ${waStatus.connected ? 'bg-accent-green/10 group-hover:bg-accent-green/20' : 'bg-surface-border/50 group-hover:bg-surface-border'}`}></div>
          <div className="flex items-center">
             <div className={`p-3 border rounded-xl mr-4 shadow-sm ${waStatus.connected ? 'bg-surface-elevated border-accent-green/30 text-accent-green' : 'bg-surface-bg border-surface-border text-text-muted'}`}>
               <BellRing className="w-6 h-6 sm:w-7 sm:h-7" />
             </div>
             <div>
               <p className="text-xs sm:text-sm font-medium text-text-muted mb-0.5">WhatsApp Ticker</p>
               <div className="flex items-center gap-1.5">
                 <span className={`w-2 h-2 rounded-full ${waStatus.connected ? 'bg-accent-green animate-pulse' : 'bg-surface-border'}`}></span>
                 <span className={`text-lg sm:text-xl font-bold ${waStatus.connected ? 'text-accent-green' : 'text-text-muted'}`}>
                   {waStatus.connected ? 'Active' : 'Offline'}
                 </span>
               </div>
             </div>
          </div>
        </div>
        
        {/* Delivered Today Card */}
        <div className="card relative overflow-hidden group hover:border-accent-primary/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent-blue/10 rounded-full blur-2xl group-hover:bg-accent-blue/20 transition-all"></div>
          <div className="flex items-center">
             <div className="p-3 bg-surface-elevated text-accent-blue border border-surface-border rounded-xl mr-4 shadow-sm">
               <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
             </div>
             <div>
               <p className="text-xs sm:text-sm font-medium text-text-muted mb-0.5">Delivered Today</p>
               <p className="text-2xl sm:text-3xl font-bold">{stats.completedToday}</p>
             </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="card relative overflow-hidden group hover:border-accent-primary/50 transition-colors">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent-green/10 rounded-full blur-2xl group-hover:bg-accent-green/20 transition-all"></div>
           <div className="flex items-center">
             <div className="p-3 bg-surface-elevated text-accent-green border border-surface-border rounded-xl mr-4 shadow-sm">
               <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7" />
             </div>
             <div>
               <p className="text-xs sm:text-sm font-medium text-text-muted mb-0.5">Gross Revenue</p>
               <p className="text-2xl sm:text-3xl font-bold text-text-primary">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
             </div>
           </div>
        </div>
      </div>
      
      {/* WhatsApp Connection Settings */}
      <div className="card mt-4 sm:mt-8 border-t-4 border-t-accent-green">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
               <WhatsAppLogo className="w-5 h-5 sm:w-6 sm:h-6 text-accent-green" />
               WhatsApp Integration
             </h2>
             <p className="text-sm text-text-muted leading-relaxed">
               Allow RepairTrack to automatically send status updates to your customers directly from your shop's WhatsApp number.
             </p>
           </div>
           
           <div className="shrink-0 w-full sm:w-auto">
             {waStatus.connected ? (
                 <button onClick={handleDisconnectWhatsApp} disabled={isDisconnecting} className="btn-secondary w-full text-text-muted hover:text-accent-red hover:border-accent-red/50 hover:bg-accent-red/5 disabled:opacity-60 disabled:cursor-not-allowed">
                   {isDisconnecting ? 'Disconnecting...' : 'Disconnect Device'}
                 </button>
             ) : (
                 <button onClick={handleConnectWhatsApp} disabled={isConnecting} className="btn-primary w-full bg-accent-green hover:bg-[#20bd5c]">
                   {isConnecting ? 'Starting Session...' : 'Link Device Now'}
                 </button>
             )}
           </div>
        </div>
      </div>

      {/* QR Modal (desktop) */}
      {showQR && (
        <QRModal 
          qrCode={qrCode} 
          isSuccess={qrSuccess}
          isAuthenticating={isAuthenticating}
          isError={qrError}
          onRetry={handleRetryConnect}
          onClose={() => { setShowQR(false); setPolling(false); setQrError(false); }} 
        />
      )}

      {/* Pairing Code Modal (mobile) */}
      {showPairing && (
        <PairingCodeModal
          userId={user._id}
          onClose={() => setShowPairing(false)}
          onConnected={() => {
            updateWhatsAppStatus(true);
            toast.success('WhatsApp Connected successfully!');
            setTimeout(() => setShowPairing(false), 1500);
          }}
        />
      )}

      {/* Mobile method picker bottom sheet */}
      {showMethodPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-surface-card border-t border-surface-border rounded-t-2xl w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-elevated">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <WhatsAppLogo className="w-5 h-5 text-accent-green" />
                Link WhatsApp
              </h3>
              <button onClick={() => setShowMethodPicker(false)} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-text-muted mb-1">Choose how to link your WhatsApp:</p>
              
              {/* Pairing Code - recommended for mobile */}
              <button
                onClick={() => { setShowMethodPicker(false); setShowPairing(true); }}
                className="w-full flex items-center gap-4 p-4 bg-accent-green/5 border-2 border-accent-green/30 rounded-xl hover:bg-accent-green/10 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Use Phone Number</p>
                  <p className="text-xs text-text-muted mt-0.5">Enter a code in WhatsApp — no second device</p>
                </div>
                <span className="text-[10px] bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Best for mobile</span>
              </button>

              {/* QR Code */}
              <button
                onClick={() => startQRFlow()}
                className="w-full flex items-center gap-4 p-4 bg-surface-bg border border-surface-border rounded-xl hover:bg-surface-elevated transition-colors text-left"
              >
                <div className="w-10 h-10 bg-surface-elevated rounded-xl flex items-center justify-center shrink-0 border border-surface-border">
                  <CheckCircle2 className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Scan QR Code</p>
                  <p className="text-xs text-text-muted mt-0.5">Use another device to scan</p>
                </div>
              </button>
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
