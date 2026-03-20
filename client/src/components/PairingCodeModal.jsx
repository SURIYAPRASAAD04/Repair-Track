import { useState } from 'react';
import { X, CheckCircle2, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import WhatsAppLogo from './WhatsAppLogo';
import api from '../api/axios';

export default function PairingCodeModal({ userId, onClose, onConnected }) {
  const [step, setStep] = useState('phone'); // phone | loading | code | success | error
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [polling, setPolling] = useState(false);

  const handleRequestCode = async () => {
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    setErrorMsg('');
    setStep('loading');

    try {
      const res = await api.post('/api/whatsapp/pairing-code', { phoneNumber });

      if (res.data.alreadyConnected) {
        setStep('success');
        onConnected?.();
        return;
      }

      setPairingCode(res.data.code);
      setStep('code');
      startPolling();
    } catch (err) {
      setErrorMsg(err.response?.data?.details || 'Failed to generate pairing code');
      setStep('error');
    }
  };

  const startPolling = () => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/whatsapp/qr/${userId}`);
        if (res.data.ready) {
          clearInterval(interval);
          setPolling(false);
          setStep('success');
          onConnected?.();
        }
      } catch (e) { /* keep polling */ }
    }, 2000);

    // Auto-stop after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 120000);
  };

  const formatCode = (code) => {
    // Format as "XXXX-XXXX" for readability
    if (!code) return '';
    const c = code.replace(/\D/g, '');
    if (c.length <= 4) return c;
    return c.slice(0, 4) + '-' + c.slice(4);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-surface-card border-t sm:border border-surface-border rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border bg-surface-elevated">
          <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <WhatsAppLogo className="w-5 h-5 text-accent-green" />
            Link via Phone Number
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary hover:bg-surface-border p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {step === 'phone' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-accent-green/5 border border-accent-green/20 rounded-xl">
                <Smartphone className="w-5 h-5 text-accent-green shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">
                  Enter your WhatsApp number to get a <strong>pairing code</strong>. No QR scan needed!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">WhatsApp Phone Number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm font-medium text-text-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98XXXXXXXX"
                    className="flex-1 px-4 py-2.5 bg-surface-bg border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green placeholder:text-text-muted/50"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                {errorMsg && <p className="text-xs text-accent-red mt-2">{errorMsg}</p>}
              </div>

              <button
                onClick={handleRequestCode}
                disabled={phoneNumber.length < 10}
                className="w-full py-3 bg-accent-green text-white rounded-xl font-semibold text-sm hover:bg-[#20bd5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Get Pairing Code
              </button>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-accent-green animate-spin" />
              <p className="text-sm text-text-muted font-medium">Generating pairing code...</p>
              <p className="text-xs text-text-muted/60">This may take a few seconds</p>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-text-muted mb-4">Enter this code in WhatsApp:</p>
                <div className="inline-block px-8 py-4 bg-surface-elevated border-2 border-accent-green/30 rounded-2xl">
                  <span className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.3em] text-text-primary">
                    {formatCode(pairingCode)}
                  </span>
                </div>
                {polling && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-accent-green">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Waiting for connection...
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-sm text-text-muted bg-surface-bg rounded-xl p-4 border border-surface-border">
                <p><strong>1.</strong> Open <strong>WhatsApp</strong> on your phone</p>
                <p><strong>2.</strong> Go to <strong>Settings → Linked Devices</strong></p>
                <p><strong>3.</strong> Tap <strong>Link a Device</strong></p>
                <p><strong>4.</strong> Tap <strong>"Link with phone number instead"</strong></p>
                <p><strong>5.</strong> Enter the code shown above</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8 gap-3 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-accent-green" />
              </div>
              <p className="text-lg font-bold text-gray-800">Connected!</p>
              <p className="text-sm text-gray-500 text-center">WhatsApp is now linked. Auto-updates will be sent to your customers.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">Something went wrong</p>
                <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStep('phone'); setErrorMsg(''); }}
                className="px-6 py-2.5 bg-accent-green text-white rounded-xl font-semibold text-sm hover:bg-[#20bd5c] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
