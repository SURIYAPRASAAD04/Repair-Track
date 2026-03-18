import { X, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import WhatsAppLogo from './WhatsAppLogo';

export default function QRModal({ qrCode, onClose, isSuccess, isAuthenticating, isError, onRetry }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-0 md:p-4">
      <div className="bg-surface-card md:border border-surface-border rounded-none md:rounded-2xl shadow-xl w-full h-full md:h-auto md:max-w-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-surface-border bg-surface-elevated">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <WhatsAppLogo className="w-5 h-5 text-accent-green" />
            Link WhatsApp
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary hover:bg-surface-border p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-8 flex-1 flex flex-col items-center justify-center bg-white min-h-[300px] relative">
          {isSuccess ? (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle2 className="w-12 h-12 text-accent-green" />
              </div>
              <p className="text-gray-800 text-lg font-bold">Successfully Connected!</p>
              <p className="text-gray-500 text-sm text-center mt-2">You can now send automated updates.</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-800 font-bold">Failed to Start</p>
                <p className="text-gray-500 text-sm mt-1">The server couldn't launch WhatsApp.<br/>This may be a resource issue on the hosting plan.</p>
              </div>
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-green text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : isAuthenticating ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-green mb-4"></div>
              <p className="text-gray-500 text-sm font-medium">Connecting to WhatsApp...</p>
            </div>
          ) : qrCode ? (
            <img src={qrCode} alt="WhatsApp QR Code" className="w-full max-w-[256px] h-auto object-contain animate-in fade-in" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-green mb-4"></div>
              <p className="text-gray-500 text-sm font-medium">Generating secure QR code...</p>
              <p className="text-gray-400 text-xs mt-2">This may take 30–60 seconds...</p>
            </div>
          )}
        </div>
        
        {!isSuccess && !isAuthenticating && (
          <div className="p-5 bg-surface-bg border-t border-surface-border text-sm text-text-muted space-y-3">
            <p><strong>1.</strong> Open WhatsApp on your phone</p>
            <p><strong>2.</strong> Tap Menu (⋮) or Settings and select <strong>Linked Devices</strong></p>
            <p><strong>3.</strong> Tap <strong>Link a Device</strong> and scan this code</p>
          </div>
        )}
      </div>
    </div>
  );
}
