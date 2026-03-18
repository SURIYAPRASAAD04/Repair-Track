import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Smartphone, Wrench, IndianRupee, BellRing, CheckCircle2, XCircle } from 'lucide-react';
import QRModal from '../components/QRModal';
import WhatsAppLogo from '../components/WhatsAppLogo';

export default function Dashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Poll for connection success
  useEffect(() => {
    if (!polling) return;
    
    let interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/whatsapp/qr/${user._id}`);
        
        if (res.data.ready) {
          clearInterval(interval);
          setPolling(false);
          setQrSuccess(true);
          setIsAuthenticating(false);
          setWaStatus({ connected: true });
          toast.success('WhatsApp Connected successfully!');
          // Auto close modal after 1.5 seconds of seeing the success state
          setTimeout(() => {
             setShowQR(false);
             setQrSuccess(false);
          }, 1500);
        } else if (res.data.authenticating) {
          setIsAuthenticating(true);
          setQrCode(null);
        } else if (res.data.qr) {
          setIsAuthenticating(false);
          setQrCode(res.data.qr);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, user._id]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, statusRes] = await Promise.all([
        api.get('/api/jobs/dashboard-stats'),
        api.get(`/api/whatsapp/status/${user._id}`),
      ]);
      
      setStats(statsRes.data);
      setWaStatus({ connected: statusRes.data.connected });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const handleConnectWhatsApp = async () => {
    try {
      setIsConnecting(true);
      setQrSuccess(false);
      setIsAuthenticating(false);
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

  const handleDisconnectWhatsApp = async () => {
    try {
      await api.post('/api/whatsapp/disconnect');
      setWaStatus({ connected: false });
      toast.success('WhatsApp Disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
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
                 <button onClick={handleDisconnectWhatsApp} className="btn-secondary w-full text-text-muted hover:text-accent-red hover:border-accent-red/50 hover:bg-accent-red/5">
                   Disconnect Device
                 </button>
             ) : (
                 <button onClick={handleConnectWhatsApp} disabled={isConnecting} className="btn-primary w-full bg-accent-green hover:bg-[#20bd5c]">
                   {isConnecting ? 'Starting Session...' : 'Link Device Now'}
                 </button>
             )}
           </div>
        </div>
      </div>

      {showQR && (
        <QRModal 
          qrCode={qrCode} 
          isSuccess={qrSuccess}
          isAuthenticating={isAuthenticating}
          onClose={() => { setShowQR(false); setPolling(false); }} 
        />
      )}
    </div>
  );
}
