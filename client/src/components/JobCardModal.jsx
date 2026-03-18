import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Smartphone, Laptop, IndianRupee, Save, Clock, Target, AlertCircle, Info, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = [
  'Received', 'Under Diagnosis', 'Waiting for Parts', 'Repair in Progress',
  'Quality Check', 'Ready for Pickup', 'Delivered / Closed', 'Cannot be Repaired', 'On Hold'
];

export default function JobCardModal({ job, onClose, onStatusUpdate, onDetailsUpdate }) {
  const { user } = useAuth();

  // Local state for edits
  const [status, setStatus] = useState(job.status);
  const [technicianNotes, setTechnicianNotes] = useState(job.technicianNotes || '');
  const [finalCost, setFinalCost] = useState(job.finalCost || job.estimatedCost || 0);
  const [paymentStatus, setPaymentStatus] = useState(job.paymentStatus || 'Pending');

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === job.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(job._id, newStatus);
      setStatus(newStatus);
    } catch (error) {
      // rollback handled by parent
      setStatus(job.status);
    }
    setIsUpdatingStatus(false);
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    try {
      await onDetailsUpdate(job._id, {
        technicianNotes,
        finalCost: Number(finalCost),
        paymentStatus
      });
      toast.success('Job details saved successfully');
    } catch (error) {
      toast.error('Failed to save details');
    }
    // Don't auto-close the modal, let user keep viewing
    setIsSavingDetails(false);
  };

  const getStatusClass = (s) => {
    const statusMap = {
      'Received': 'status-received',
      'Under Diagnosis': 'status-diagnosis',
      'Waiting for Parts': 'status-waiting',
      'Repair in Progress': 'status-repairing',
      'Quality Check': 'status-quality',
      'Ready for Pickup': 'status-ready',
      'Delivered / Closed': 'status-delivered',
      'Cannot be Repaired': 'status-cannot',
      'On Hold': 'status-hold'
    };
    return `badge ${statusMap[s] || 'bg-surface-border text-text-muted'}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card md:border border-surface-border rounded-none md:rounded-2xl shadow-xl w-full h-full md:h-auto md:max-h-[90vh] md:w-[90vw] lg:max-w-5xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-surface-border bg-surface-elevated shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-lg md:text-xl text-text-primary flex items-center gap-2">
                <Hash className="w-5 h-5 text-accent-primary" />
                {job.jobId}
              </h3>
              <span className={getStatusClass(status)}>{status}</span>
            </div>
            <p className="text-text-muted text-xs md:text-sm flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3.5 h-3.5" /> Created on {new Date(job.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-border rounded-xl transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 md:p-6 flex-1 bg-surface-bg w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Device & Customer Info */}
            <div className="lg:col-span-2 space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {/* Customer Card */}
                <div className="card p-4 md:p-5 bg-surface-card h-full shadow-sm hover:border-accent-primary/30 transition-colors">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-4 border-b border-surface-border pb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Customer Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">Name</p>
                      <p className="font-semibold text-lg text-text-primary">{job.customer?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">Phone</p>
                      <p className="font-medium text-text-secondary">{job.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Device Card */}
                <div className="card p-4 md:p-5 bg-surface-card h-full shadow-sm hover:border-accent-blue/30 transition-colors">
                  <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-4 border-b border-surface-border pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Device Info</span>
                    <span className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded uppercase font-bold tracking-wider">{job.deviceType}</span>
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">Brand & Model</p>
                      <p className="font-semibold text-lg text-text-primary">{job.brand} {job.model}</p>
                    </div>
                    <div className="flex gap-6">
                      {job.color && (
                        <div>
                          <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">Color</p>
                          <p className="font-medium text-text-secondary">{job.color}</p>
                        </div>
                      )}
                      {job.identifier && (
                        <div>
                          <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">ID/IMEI</p>
                          <p className="font-medium text-text-secondary">{job.identifier}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues Card */}
              <div className="card p-4 md:p-5 bg-surface-card shadow-sm hover:border-accent-amber/30 transition-colors">
                <h4 className="text-xs font-bold text-accent-amber uppercase tracking-wider mb-4 border-b border-surface-border pb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Issues & Condition
                </h4>

                {job.repairCategory && (
                  <div className="mb-5 border-b border-surface-border/50 pb-5">
                    <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-3">Repair Category</p>
                    <span className="bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-3 py-1 text-sm font-semibold rounded-lg inline-block">
                      {job.repairCategory}
                    </span>
                  </div>
                )}

                <div className="mb-5 border-b border-surface-border/50 pb-5">
                  <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-3">Reported Issues</p>
                  <div className="flex flex-wrap gap-2">
                    {job.reportedIssue && job.reportedIssue.length > 0 ? (
                      job.reportedIssue.map((issue, idx) => (
                        <span key={idx} className="bg-surface-bg border border-surface-border px-3 py-1.5 text-sm font-medium rounded-lg text-text-primary">
                          {issue}
                        </span>
                      ))
                    ) : <span className="text-sm text-text-muted italic">No specific issues reported.</span>}
                  </div>
                </div>

                {job.deviceCondition && (
                  <div>
                    <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-2">Condition on Receipt (Damage details)</p>
                    <p className="text-sm font-medium text-text-secondary bg-surface-bg p-3.5 rounded-xl border border-surface-border/50 leading-relaxed max-w-none">{job.deviceCondition}</p>
                  </div>
                )}
              </div>

              {/* Technician Notes (Internal) */}
              <div className="card p-4 md:p-5 bg-surface-card border-accent-green/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-accent-green/20 pb-3 gap-2">
                  <h4 className="text-xs font-bold text-accent-green uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" /> Internal Technician Notes
                  </h4>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-accent-green/10 text-accent-green px-2 py-0.5 rounded">Not shared externally</span>
                </div>
                <textarea
                  className="input-field w-full h-32 resize-y bg-surface-bg/50 border-surface-border/80 focus:ring-accent-green/30 focus:border-accent-green"
                  placeholder="Record diagnosis findings, required parts, internal repair timelines, or specific customer instructions here..."
                  value={technicianNotes}
                  onChange={e => setTechnicianNotes(e.target.value)}
                />
              </div>

            </div>

            {/* Right Column: Actions & Status Controls */}
            <div className="space-y-6">

              {/* Automated Workflows Control */}
              <div className="card p-4 md:p-5 bg-surface-elevated shadow-lg border-surface-border ring-1 ring-white/5">
                <h4 className="font-bold mb-4 text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
                  <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${user?.whatsappConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`}></div>
                  Repair Status
                </h4>

                {(!user?.whatsappConnected) && (
                  <div className="mb-5 bg-accent-red/10 text-accent-red border border-accent-red/20 p-3.5 rounded-xl text-xs font-medium leading-relaxed">
                    <strong>⚠️ Action Required:</strong> WhatsApp is disconnected. You must connect WhatsApp from the Dashboard to send automated status receipts and updates.
                  </div>
                )}

                <div className="space-y-2 relative z-10">
                  <label className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1 block">Update Status (Notifies Customer)</label>
                  <select
                    className="select-field text-base font-semibold p-3.5 bg-surface-bg border-surface-border shadow-inner"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdatingStatus || !user?.whatsappConnected}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 pt-5 border-t border-surface-border">
                  <label className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-3 block">Timeline History</label>
                  <div className="max-h-56 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {[...job.statusHistory].reverse().map((sh, idx) => (
                      <div key={idx} className="flex flex-col text-sm relative pl-4 border-l-2 border-surface-border/50">
                        <div className="absolute w-2.5 h-2.5 bg-surface-elevated border-2 border-accent-primary rounded-full -left-[6px] top-1"></div>
                        <span className="font-semibold text-text-primary">{sh.status}</span>
                        <span className="text-xs text-text-muted font-medium mt-0.5">{new Date(sh.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financials Control */}
              <div className="card p-4 md:p-5 bg-surface-card shadow-sm">
                <h4 className="font-bold mb-4 text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
                  <IndianRupee className="w-5 h-5 text-emerald-500" /> Invoice & Payment
                </h4>

                <div className="space-y-5">
                  <div className="flex items-center justify-between text-sm bg-surface-bg p-3 rounded-lg border border-surface-border border-dashed">
                    <span className="text-text-muted font-medium">Initial Estimate:</span>
                    <span className="font-bold text-text-primary">₹{job.estimatedCost || 0}</span>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-2 block">Final Amount Due</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                      <input
                        type="number"
                        className="input-field pl-9 font-bold text-xl text-text-primary bg-surface-bg focus:ring-accent-primary/50"
                        value={finalCost}
                        onChange={e => setFinalCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-2 block">Payment Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentStatus('Pending')}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${paymentStatus === 'Pending' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/40 shadow-sm' : 'bg-surface-bg border-surface-border text-text-muted hover:bg-surface-border'}`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setPaymentStatus('Paid')}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-bg border-surface-border text-text-muted hover:bg-surface-border'}`}
                      >
                        Paid
                      </button>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveDetails} 
                  disabled={isSavingDetails}
                  className="btn-primary w-full mt-6 bg-accent-blue hover:bg-blue-600 shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {isSavingDetails ? 'Saving Details...' : 'Update Details & Notes'}
                </button>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>

  );
}
