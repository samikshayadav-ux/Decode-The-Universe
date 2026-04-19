import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [formData, setFormData] = useState({ teamId: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'AUTHENTICATION_FAILED');

      login(data.team, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-bg">
      {/* Branding Panel */}
      <div className="w-full md:w-2/5 p-12 flex flex-col justify-between border-r-2 border-white/5 bg-surface/50">
        <div>
          <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-widest mb-8">
            <Shield size={14} />
            <span>ACCESS_PROTECT</span>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">
            ENTER<br /> THE<br /> VOID_
          </h2>
          <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest leading-relaxed">
            Please provide your authorized credentials to establish a secure link to the decryption grid.
          </p>
        </div>
        
        <div className="text-[10px] flex items-center gap-2 opacity-20 font-mono">
          <CornerDownRight size={12} />
          <span>PORT_8080 // SECURE</span>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-3/5 p-12 bg-white text-black min-h-[450px] flex flex-col justify-center">
        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 font-bold text-xs uppercase"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">TEAM_IDENTIFIER</label>
            <input
              name="teamId"
              value={formData.teamId}
              onChange={handleInputChange}
              required
              className="w-full bg-transparent border-b-2 border-black py-4 px-1 text-2xl font-black uppercase focus:outline-none focus:border-accent transition-colors placeholder-black/5"
              placeholder="EXP-2026"
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">ACCESS_KEY</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-transparent border-b-2 border-black py-4 px-1 text-2xl font-black focus:outline-none focus:border-accent transition-colors placeholder-black/5"
              placeholder="••••••••"
            />
            <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-0 bottom-4 opacity-30 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="neo-button w-full py-6 flex items-center justify-center gap-4 text-xl tracking-tighter"
          >
            <span>{isLoading ? 'SYNCING...' : 'INITIALIZE'}</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;