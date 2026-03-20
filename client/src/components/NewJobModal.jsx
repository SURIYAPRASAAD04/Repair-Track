import { useState } from 'react';
import { X, Smartphone, Laptop, CheckCircle2, ChevronRight, PlusCircle } from 'lucide-react';

const COMMON_MOBILE_ISSUES = ['Broken Screen', 'Battery Drain', 'Charging Port', 'Software Hang', 'Water Damage', 'Camera Issue', 'Speaker/Mic'];
const COMMON_LAPTOP_ISSUES = ['Slow Performance', 'Screen Damage', 'Keyboard Issue', 'Charging Issue', 'Overheating', 'No Display', 'Virus/Malware', 'RAM/SSD Upgrade'];
const REPAIR_CATEGORIES = ['Hardware', 'Software', 'Both', 'General Service', 'Data Recovery', 'Unsure'];
import SearchableDropdown from './SearchableDropdown';
import { MOBILE_BRANDS_MODELS, LAPTOP_BRANDS_MODELS } from '../utils/deviceData';

export default function NewJobModal({ onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [deviceType, setDeviceType] = useState('Mobile');
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [repairCategory, setRepairCategory] = useState('');
  const [reportedIssues, setReportedIssues] = useState([]);
  const [customIssue, setCustomIssue] = useState('');
  const [deviceCondition, setDeviceCondition] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Handle Tag Selection
  const toggleIssueTag = (issue) => {
    if (reportedIssues.includes(issue)) {
      setReportedIssues(reportedIssues.filter(i => i !== issue));
    } else {
      setReportedIssues([...reportedIssues, issue]);
    }
  };

  const addCustomIssue = () => {
    if (customIssue.trim() && !reportedIssues.includes(customIssue.trim())) {
      setReportedIssues([...reportedIssues, customIssue.trim()]);
      setCustomIssue('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const jobData = {
      customerInfo: { name: customerName, phone: customerPhone },
      deviceType,
      brand,
      model,
      color,
      identifier,
      repairCategory,
      reportedIssue: reportedIssues,
      deviceCondition,
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      estimatedDelivery: estimatedDelivery || null
    };

    await onSubmit(jobData);
    setLoading(false);
  };

  const baseTags = deviceType === 'Mobile' ? COMMON_MOBILE_ISSUES : COMMON_LAPTOP_ISSUES;
  const allTagsToDisplay = [...new Set([...baseTags, ...reportedIssues])];

  const deviceData = deviceType === 'Mobile' ? MOBILE_BRANDS_MODELS : LAPTOP_BRANDS_MODELS;
  const brandOptions = Object.keys(deviceData);
  const modelOptions = brand && deviceData[brand] ? deviceData[brand] : [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card md:border border-surface-border rounded-none md:rounded-2xl shadow-xl w-full h-full md:h-auto md:max-h-[90vh] md:w-[90vw] lg:max-w-4xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-surface-border bg-surface-elevated shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg md:text-xl text-text-primary flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-accent-primary" /> Create New Repair Job
            </h3>
            <p className="text-text-muted text-xs md:text-sm mt-1">Register a new device and automatically notify the customer via WhatsApp.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-border rounded-xl transition-colors shrink-0 z-10 relative">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide flex-1 bg-surface-bg custom-scrollbar">
          <form id="new-job-form" onSubmit={handleSubmit} className="space-y-10 max-w-3xl mx-auto">
            
            {/* 1. Device Category Selection */}
            <div className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border"></div>
              <div className="absolute left-[-11px] top-0 w-6 h-6 bg-surface-bg border-2 border-accent-primary rounded-full flex items-center justify-center text-[10px] font-bold text-accent-primary z-10">1</div>
              
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">Device Type</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setDeviceType('Mobile'); setReportedIssues([]); }}
                  className={`flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl border-2 transition-all group ${
                    deviceType === 'Mobile' ? 'border-accent-primary bg-accent-primary/10 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)]' : 'border-surface-border bg-surface-elevated hover:border-accent-primary/50'
                  }`}
                >
                  <Smartphone className={`w-8 h-8 md:w-10 md:h-10 mb-3 transition-colors ${deviceType === 'Mobile' ? 'text-accent-primary' : 'text-text-muted group-hover:text-accent-primary/70'}`} />
                  <span className={`font-bold ${deviceType === 'Mobile' ? 'text-accent-primary' : 'text-text-secondary'}`}>Mobile Phone</span>
                  {deviceType === 'Mobile' && <CheckCircle2 className="w-4 h-4 text-accent-primary absolute top-3 right-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeviceType('Laptop'); setReportedIssues([]); }}
                  className={`flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl border-2 transition-all group relative ${
                    deviceType === 'Laptop' ? 'border-accent-primary bg-accent-primary/10 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)]' : 'border-surface-border bg-surface-elevated hover:border-accent-primary/50'
                  }`}
                >
                  <Laptop className={`w-8 h-8 md:w-10 md:h-10 mb-3 transition-colors ${deviceType === 'Laptop' ? 'text-accent-primary' : 'text-text-muted group-hover:text-accent-primary/70'}`} />
                  <span className={`font-bold ${deviceType === 'Laptop' ? 'text-accent-primary' : 'text-text-secondary'}`}>Laptop / PC</span>
                  {deviceType === 'Laptop' && <CheckCircle2 className="w-4 h-4 text-accent-primary absolute top-3 right-3" />}
                </button>
              </div>
            </div>

            {/* 2. Customer Details */}
            <div className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border"></div>
              <div className="absolute left-[-11px] top-0 w-6 h-6 bg-surface-bg border-2 border-accent-blue rounded-full flex items-center justify-center text-[10px] font-bold text-accent-blue z-10">2</div>
              
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-surface-card rounded-2xl border border-surface-border shadow-sm">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Full Name *</label>
                  <input type="text" required className="input-field bg-surface-bg placeholder-text-muted/50" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">WhatsApp Number *</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm font-medium text-text-muted shrink-0">+91</span>
                    <input type="tel" required className="input-field bg-surface-bg placeholder-text-muted/50 flex-1" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98XXXXXXXX" maxLength={10} />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1.5 ml-1">10-digit mobile number. Used for WhatsApp notifications.</p>
                </div>
              </div>
            </div>

            {/* 3. Device Details */}
            <div className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border"></div>
              <div className="absolute left-[-11px] top-0 w-6 h-6 bg-surface-bg border-2 border-accent-green rounded-full flex items-center justify-center text-[10px] font-bold text-accent-green z-10">3</div>
              
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Device Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-surface-card rounded-2xl border border-surface-border shadow-sm">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Brand *</label>
                  <SearchableDropdown
                    value={brand}
                    onChange={(val) => { setBrand(val); setModel(''); }} // Reset model on brand change
                    options={brandOptions}
                    placeholder={deviceType === 'Mobile' ? "e.g. Apple, Samsung" : "e.g. Dell, HP"}
                    labelName="Brand"
                    localStorageKey={`custom-brands-${deviceType}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Model *</label>
                  <SearchableDropdown
                    value={model}
                    onChange={setModel}
                    options={modelOptions}
                    placeholder={deviceType === 'Mobile' ? "e.g. iPhone 13 Pro" : "e.g. Inspiron 15"}
                    labelName="Model"
                    localStorageKey={`custom-models-${brand}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">{deviceType === 'Mobile' ? 'IMEI Number' : 'Serial Number'}</label>
                  <input type="text" className="input-field bg-surface-bg placeholder-text-muted/50" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Tracking ID (Optional)" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Color / Finish</label>
                  <input type="text" className="input-field bg-surface-bg placeholder-text-muted/50" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Midnight Black (Optional)" />
                </div>
              </div>
            </div>

            {/* 4. Problem Description */}
            <div className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border"></div>
              <div className="absolute left-[-11px] top-0 w-6 h-6 bg-surface-bg border-2 border-accent-amber rounded-full flex items-center justify-center text-[10px] font-bold text-accent-amber z-10">4</div>
              
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Issue & Condition</h4>
              
              <div className="p-5 bg-surface-card rounded-2xl border border-surface-border shadow-sm space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3">Repair Category/Kind *</label>
                  <select
                    className="select-field mb-5 bg-surface-bg border-surface-border"
                    value={repairCategory}
                    onChange={(e) => setRepairCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {REPAIR_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3">Reported Issues (Select multiple)</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {allTagsToDisplay.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleIssueTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          reportedIssues.includes(tag) 
                            ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/40 shadow-sm' 
                            : 'bg-surface-bg text-text-secondary border-surface-border hover:border-text-muted'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input type="text" className="input-field flex-1 text-sm bg-surface-bg" value={customIssue} onChange={e => setCustomIssue(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomIssue())} placeholder="Or type a custom issue..." />
                    <button type="button" onClick={addCustomIssue} className="btn-secondary text-sm px-5 font-bold">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Condition on Receipt (Pre-existing Damage)</label>
                  <textarea className="input-field h-24 resize-none bg-surface-bg placeholder-text-muted/50" value={deviceCondition} onChange={e => setDeviceCondition(e.target.value)} placeholder="e.g. Minor scratches on back glass, small dent on bottom left corner. Missing SIM tray." />
                </div>
              </div>
            </div>

            {/* 5. Cost & Delivery */}
            <div className="relative pl-6 md:pl-8">
              <div className="absolute left-[-11px] top-0 w-6 h-6 bg-surface-bg border-2 border-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-500 z-10">5</div>
              
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Estimates (Optional)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-surface-card rounded-2xl border border-surface-border shadow-sm">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Estimated Cost</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
                    <input type="number" min="0" className="input-field pl-8 bg-surface-bg font-bold" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Target Delivery Date</label>
                  <input type="date" className="input-field bg-surface-bg text-text-primary" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-surface-border bg-surface-elevated flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto px-6 py-3 md:py-2.5 font-bold" disabled={loading}>Cancel</button>
          <button type="submit" form="new-job-form" className="btn-primary w-full sm:w-auto px-8 py-3 md:py-2.5 font-bold flex flex-row justify-center items-center shadow-lg shadow-accent-primary/20" disabled={loading}>
            {loading ? (
              <span className="items-center flex">
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 Processing...
              </span>
             ) : (
              <span className="flex items-center gap-2">Register Device <ChevronRight className="w-4 h-4" /></span>
             )}
          </button>
        </div>
      </div>
    </div>
  );
}
