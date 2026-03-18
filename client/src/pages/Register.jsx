import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench } from 'lucide-react';

export default function Register() {
  const [shopName, setShopName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await register(name, email, password, shopName);
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent-green/10 border border-accent-green/20 rounded-2xl flex items-center justify-center mb-4 text-accent-green">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Setup Your Shop</h2>
          <p className="text-text-muted mt-2 text-sm text-center">Start tracking repairs & automating WhatsApp updates in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Repair Shop Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. iFixIt Mobiles & Laptops"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Your Full Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email Address</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shop.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted border-t border-surface-border pt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-green hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
