import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [formData, setFormData] = useState({ teamId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AUTH_ERR');
      login(data.team, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-12">
      {error && <div className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</div>}
      
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Team ID</label>
        <input
          value={formData.teamId}
          onChange={(e) => setFormData({...formData, teamId: e.target.value})}
          required
          className="w-full bg-transparent border-b border-white/20 py-4 text-3xl font-black uppercase focus:outline-none focus:border-accent transition-all"
          placeholder="IDENTITY"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Access Key</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
          className="w-full bg-transparent border-b border-white/20 py-4 text-3xl font-black focus:outline-none focus:border-accent transition-all"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="neo-button w-full"
      >
        {loading ? 'SYNCING...' : 'LOGIN'}
      </button>
    </form>
  );
};

export default Login;