import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Shield, AlertCircle, ArrowRight, CornerDownRight, Plus, X } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    teamId: '',
    password: '',
    members: ['', '', '']
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMember = () => {
    if (formData.members.length < 4) {
      setFormData(prev => ({ ...prev, members: [...prev.members, ''] }));
    }
  };

  const removeMember = (index) => {
    if (formData.members.length > 3) {
      const newMembers = formData.members.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, members: newMembers }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'REGISTRATION_FAILED');

      setSuccess('REGISTRATION_SUCCESSFUL // REDIRECTING');
      setTimeout(() => {
        login(data.team, data.token);
        navigate(from, { replace: true });
      }, 1500);
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
            <UserPlus size={14} />
            <span>DEPLOY_UNIT</span>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">
            CREATE<br /> NEW<br /> ENTITY_
          </h2>
          <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest leading-relaxed">
            Register your team on the decentralized grid to participate in the universal decryption sequence.
          </p>
        </div>
        
        <div className="text-[10px] flex items-center gap-2 opacity-20 font-mono">
          <CornerDownRight size={12} />
          <span>PORT_8081 // ENCRYPTED</span>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-3/5 p-12 bg-white text-black max-h-[70vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleRegister} className="space-y-8">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 font-bold text-xs uppercase">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-accent/10 border-l-4 border-accent text-accent-dim text-accent font-bold text-xs uppercase">
              <Shield size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">TEAM_NAME</label>
              <input
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border-b-2 border-black py-2 px-1 text-xl font-black uppercase focus:outline-none focus:border-accent transition-colors"
                placeholder="NEBULAS"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">TEAM_ID</label>
              <input
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border-b-2 border-black py-2 px-1 text-xl font-black uppercase focus:outline-none focus:border-accent transition-colors"
                placeholder="ID-001"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">ACCESS_KEY</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-transparent border-b-2 border-black py-2 px-1 text-xl font-black focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">CREW_MANIFEST (MIN 3)</label>
              {formData.members.length < 4 && (
                <button type="button" onClick={addMember} className="text-[10px] font-black flex items-center gap-1 hover:text-accent transition-colors">
                  <Plus size={12} /> ADD
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.members.map((member, index) => (
                <div key={index} className="relative group">
                  <input
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    required
                    className="w-full bg-transparent border-2 border-black/10 py-3 px-4 text-sm font-bold uppercase focus:outline-none focus:border-black transition-colors"
                    placeholder={`MEMBER_0${index + 1}`}
                  />
                  {formData.members.length > 3 && (
                    <button 
                      type="button" 
                      onClick={() => removeMember(index)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="neo-button w-full py-6 flex items-center justify-center gap-4 text-xl tracking-tighter"
          >
            <span>{isLoading ? 'DEPLOYING...' : 'DEPLOY_UNIT'}</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;