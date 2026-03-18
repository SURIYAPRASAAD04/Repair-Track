import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Users, Search, Smartphone, Calendar, User } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-blue inline-block">Customers Directory</h1>
          <p className="text-text-muted mt-1 text-sm sm:text-base">View all customers who have brought in devices for repair.</p>
        </div>
      </div>

      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border-t-2 border-t-accent-primary/20">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-accent-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="input-field pl-11 bg-surface-bg border-surface-border focus:ring-accent-primary/50 focus:border-accent-primary w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto text-sm text-text-muted font-medium bg-surface-bg px-4 py-2 rounded-lg border border-surface-border flex items-center gap-2 justify-center">
           <Users className="w-4 h-4" />
           {filteredCustomers.length} Total
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-primary"></div>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <>
          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map(customer => (
              <div key={customer._id} className="bg-surface-elevated border border-surface-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary"></div>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold shrink-0">
                      {(customer.name || 'U').charAt(0).toUpperCase()}
                   </div>
                   <div className="font-semibold text-text-primary text-lg truncate">{customer.name || 'Unknown'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-surface-border/50">
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <Smartphone className="w-4 h-4 text-text-muted" />
                    <span className="truncate">{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary justify-end">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    <span>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric'}) : 'N/A'}</span>
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
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4 text-right">First Visit Date</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredCustomers.map(customer => (
                  <tr key={customer._id} className="hover:bg-surface-elevated/50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-xs">
                            {(customer.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{customer.name || 'Unknown'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-text-secondary">
                           <Smartphone className="w-4 h-4 text-text-muted" />
                           {customer.phone || 'N/A'}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted text-right">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric'}) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-24 text-center border-dashed border-2">
          <div className="w-20 h-20 bg-accent-primary/5 text-accent-primary rounded-full flex items-center justify-center mb-6">
            <User className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-text-primary">No customers found</h3>
          <p className="text-text-muted max-w-md text-sm">
            {searchTerm ? "We couldn't find any customers matching your search query." : "You haven't added any customers yet. Profiles are created automatically when you log a new repair job."}
          </p>
        </div>
      )}
    </div>
  );
}
