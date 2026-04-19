import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register = () => {
  const [formData, setFormData] = useState({
    teamName: '', teamId: '', password: '', members: ['', '', '']
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'REG_ERR');
      login(data.team, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && <div className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</div>}
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Name</label>
          <input
            value={formData.teamName}
            onChange={(e) => setFormData({...formData, teamName: e.target.value})}
            required
            className="w-full bg-transparent border-b border-white/20 py-2 text-xl font-black uppercase focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">ID</label>
          <input
            value={formData.teamId}
            onChange={(e) => setFormData({...formData, teamId: e.target.value})}
            required
            className="w-full bg-transparent border-b border-white/20 py-2 text-xl font-black uppercase focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Key</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
          className="w-full bg-transparent border-b border-white/20 py-2 text-xl font-black focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Crew</label>
        <div className="grid grid-cols-2 gap-4">
          {formData.members.map((m, i) => (
            <input
              key={i}
              value={m}
              onChange={(e) => {
                const updated = [...formData.members];
                updated[i] = e.target.value;
                setFormData({...formData, members: updated});
              }}
              required
              className="bg-transparent border border-white/10 p-3 text-xs font-bold uppercase focus:border-white"
              placeholder={`#${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="neo-button w-full mt-4"
      >
        {loading ? 'DEPLOYING...' : 'REGISTER'}
      </button>
    </form>
  );
};

export default Register;