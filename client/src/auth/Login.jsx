import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'AUTHENTICATION_FAILED');
      }

      login({
        teamId: data.team.teamId,
        teamName: data.team.teamName,
        currentRound: data.team.currentRound,
        unlockedRounds: data.team.unlockedRounds
      }, data.token);

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'SERVER_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row font-mono overflow-y-auto md:overflow-hidden">
      {/* Left Branding Panel */}
      <div className="w-full md:w-1/2 bg-black border-b-2 md:border-b-0 md:border-r-2 border-white/10 p-6 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[250px] md:min-h-screen">
        <div className="grid-bg absolute inset-0 opacity-5" />
        <div className="scanline" />
        
        <div className="z-10">
          <motion.div 
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 text-accent font-black tracking-widest text-xs md:text-sm mb-6 md:mb-10"
          >
            <Shield size={16} />
            <span>TERMINAL_LOGIN</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[0.8] uppercase italic"
          >
            ENTER <br />
            THE <br />
            <span className="text-accent underline decoration-white/10">VOID</span>
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.3 }}
          className="z-10 text-[8px] tracking-[0.3em] uppercase mt-4 md:mt-0 opacity-40"
        >
          [ DECODE_v2.0 // 2026 ]
        </motion.div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 bg-white text-black p-6 md:p-16 flex flex-col justify-center relative min-h-[400px] md:min-h-screen">
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`
            border-l-2 transition-colors duration-300 p-4 md:p-6
            ${error ? 'border-red-500' : 'border-black'}
          `}
        >
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6 italic">IDENTITY_CHECK</h2>
          
          <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
            <div className="space-y-1">
              <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase">TEAM ID</label>
              <input
                type="text"
                autoFocus
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="EXP-XXXX"
                className="w-full text-base md:text-lg font-black bg-transparent border-b border-black py-1 focus:outline-none placeholder-gray-100 uppercase"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase">ACCESS_KEY</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full text-base md:text-lg font-black bg-transparent border-b border-black py-1 focus:outline-none placeholder-gray-100"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-black/30 hover:text-black transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 text-red-500 font-bold text-[9px] bg-red-50 p-3 border border-red-100"
              >
                <AlertCircle size={12} />
                <span>ERR: {error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full group relative overflow-hidden py-3 md:py-4 border-2 border-black font-black text-sm md:text-base uppercase tracking-tight transition-all duration-150
                ${isLoading 
                  ? 'bg-gray-50 text-gray-300 cursor-wait' 
                  : 'bg-black text-white hover:bg-white hover:text-black'}
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? 'VERIFYING...' : 'INITIALIZE'}
                {!isLoading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />}
              </span>
            </button>
          </form>

          <p className="mt-6 md:mt-8 text-[7px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
            NOTICE: UNAUTHORIZED ATTEMPTS LOGGED. <br />
            ENSURE SYSTEM CREDENTIALS ARE VALID.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;