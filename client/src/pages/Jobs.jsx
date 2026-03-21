import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Smartphone, Laptop, ClipboardList } from 'lucide-react';
import NewJobModal from '../components/NewJobModal';
import JobCardModal from '../components/JobCardModal';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/jobs?status=${encodeURIComponent(statusFilter)}` : '/api/jobs';
      const res = await api.get(url);
      setJobs(res.data);
    } catch (error) {
      toast.error('Failed to load repair jobs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch full job data when opening the detail modal
  const openJobDetail = async (job) => {
    try {
      const res = await api.get(`/api/jobs/${job._id}`);
      setSelectedJob(res.data);
    } catch (error) {
      toast.error('Failed to load job details');
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const res = await api.post('/api/jobs', jobData);
      const newJob = res.data.job || res.data;
      setJobs([newJob, ...jobs]);
      setIsNewJobModalOpen(false);
      
      toast.success('Repair job created! WhatsApp notification sending...');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      const res = await api.put(`/api/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map(j => j._id === jobId ? res.data : j));
      setSelectedJob(res.data); // Update modal data
      toast.success('Status updated successfully. WhatsApp notification sending...');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
      throw error;
    }
  };

  const handleUpdateDetails = async (jobId, details) => {
    try {
      const res = await api.put(`/api/jobs/${jobId}`, details);
      setJobs(jobs.map(j => j._id === jobId ? res.data : j));
      setSelectedJob(res.data);
    } catch (error) {
      throw error;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      job.jobId.toLowerCase().includes(s) ||
      job.customer?.name.toLowerCase().includes(s) ||
      job.customer?.phone.includes(s) ||
      job.brand.toLowerCase().includes(s) ||
      job.model.toLowerCase().includes(s)
    );
  });

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue inline-block">Repair Jobs</h1>
          <p className="text-text-muted mt-1 text-sm sm:text-base">Manage all active and past repair jobs in your shop.</p>
        </div>
        <button onClick={() => setIsNewJobModalOpen(true)} className="btn-primary w-full md:w-auto shadow-lg shadow-accent-primary/20">
          <Plus className="w-5 h-5" /> New Repair Job
        </button>
      </div>

      <div className="card p-3 sm:p-4 flex flex-col md:flex-row gap-4 shadow-sm border-t-2 border-t-accent-primary/20">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-accent-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by Job ID, Customer, Phone, or Device..."
            className="input-field pl-11 bg-surface-bg border-surface-border focus:ring-accent-primary/50 focus:border-accent-primary w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-64 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          </div>
          <select 
            className="input-field pl-10 appearance-none bg-surface-bg border-surface-border text-text-primary focus:ring-accent-primary/50 focus:border-accent-primary w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Under Diagnosis">Under Diagnosis</option>
            <option value="Waiting for Parts">Waiting for Parts</option>
            <option value="Repair in Progress">Repair in Progress</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered / Closed">Delivered / Closed</option>
            <option value="Cannot be Repaired">Cannot be Repaired</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-primary"></div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <>
          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-4">
            {filteredJobs.map(job => (
              <div 
                key={job._id}  
                className="bg-surface-elevated border border-surface-border rounded-2xl p-4 flex flex-col gap-3 active:scale-[0.98] transition-all relative overflow-hidden shadow-sm"
                onClick={() => openJobDetail(job)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold font-mono text-sm text-accent-primary">{job.jobId}</span>
                    <div className="text-xs text-text-muted mt-1">{new Date(job.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                  </div>
                  <span className={getStatusClass(job.status)}>{job.status}</span>
                </div>
                <div className="pt-2 border-t border-surface-border/50">
                  <div className="font-semibold text-text-primary">{job.customer?.name}</div>
                  <div className="text-sm text-text-secondary">{job.customer?.phone}</div>
                </div>
                <div className="flex items-center gap-3 bg-surface-bg p-3 rounded-xl border border-surface-border/50">
                  <div className="p-2 bg-surface-elevated rounded-lg text-text-muted border border-surface-border/50">
                    {job.deviceType === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{job.brand} {job.model}</div>
                    <div className="text-xs text-text-muted truncate max-w-[200px]">{job.reportedIssue?.join(', ') || 'Various issues'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet / Desktop Table */}
          <div className="hidden md:block bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-elevated border-b border-surface-border text-text-muted text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4 hidden xl:table-cell">Job ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 pl-6 lg:pl-10">Device</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredJobs.map(job => (
                  <tr 
                    key={job._id} 
                    className="hover:bg-surface-elevated/50 transition-colors cursor-pointer group"
                    onClick={() => openJobDetail(job)}
                  >
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <span className="font-semibold font-mono text-sm text-text-primary group-hover:text-accent-primary transition-colors">{job.jobId}</span>
                      <div className="text-xs text-text-muted mt-1">{new Date(job.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">{job.customer?.name}</div>
                      <div className="text-sm text-text-secondary">{job.customer?.phone}</div>
                      <div className="xl:hidden text-xs font-mono text-accent-primary mt-1">{job.jobId}</div>
                    </td>
                    <td className="px-6 py-4 pl-6 lg:pl-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-bg border border-surface-border rounded-lg text-text-muted">
                          {job.deviceType === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary text-sm">{job.brand} {job.model}</div>
                          <div className="text-xs text-text-muted truncate max-w-[150px]">{job.reportedIssue?.join(', ') || 'Various issues'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={getStatusClass(job.status)}>{job.status}</span>
                        {job.paymentStatus === 'Paid' ? (
                           <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Paid</div>
                        ) : job.status === 'Delivered / Closed' ? (
                          <div className="text-[10px] uppercase font-bold text-accent-amber tracking-wider">Payment Pending</div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2">
          <div className="w-20 h-20 bg-accent-primary/5 text-accent-primary rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-text-primary">No repair jobs found</h3>
          <p className="text-text-muted max-w-md mb-8 text-sm">
            {searchTerm ? "We couldn't find any jobs matching your criteria." : "Get started by logging your first customer device. They'll instantly receive a WhatsApp confirmation."}
          </p>
          <button onClick={() => setIsNewJobModalOpen(true)} className="btn-primary px-8 shadow-lg shadow-accent-primary/20">
            Create First Job
          </button>
        </div>
      )}

      {isNewJobModalOpen && (
        <NewJobModal 
          onClose={() => setIsNewJobModalOpen(false)} 
          onSubmit={handleCreateJob} 
        />
      )}

      {selectedJob && (
        <JobCardModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          onStatusUpdate={handleUpdateStatus}
          onDetailsUpdate={handleUpdateDetails}
        />
      )}
    </div>
  );
}
