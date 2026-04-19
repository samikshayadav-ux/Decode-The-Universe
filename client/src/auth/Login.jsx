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
    <div className="min-h-screen bg-black flex flex-col md:flex-row font-mono overflow-hidden">
      {/* Left Branding Panel */}
      <div className="w-full md:w-1/2 bg-black border-r-2 border-white/10 p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-10" />
        <div className="scanline" />
        
        <div className="z-10">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 text-accent font-black tracking-widest text-lg mb-12"
          >
            <Shield size={24} />
            <span>TERMINAL_LOGIN</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] uppercase"
          >
            ENTER <br />
            THE <br />
            <span className="text-accent underline decoration-white/20">VOID</span>
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.6 }}
          className="z-10 text-xs tracking-[0.4em] uppercase"
        >
          [ DECODE_THE_UNIVERSE // 2026 ]
        </motion.div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 bg-white text-black p-8 md:p-24 flex flex-col justify-center relative">
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`
            border-l-4 transition-colors duration-300 p-8
            ${error ? 'border-red-500' : 'border-black'}
          `}
        >
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">IDENTITY_CHECK</h2>
          
          <form onSubmit={handleLogin} className="space-y-12">
            <div className="space-y-2">
              <label className="text-xs font-black tracking-widest text-gray-500 uppercase">TEAM ID</label>
              <input
                type="text"
                autoFocus
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="EXP-XXXX"
                className="w-full text-2xl font-black bg-transparent border-b-2 border-black py-2 focus:outline-none placeholder-gray-200 uppercase"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-black tracking-widest text-gray-500 uppercase">ACCESS_KEY</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full text-2xl font-black bg-transparent border-b-2 border-black py-2 focus:outline-none placeholder-gray-200"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-black/50 hover:text-black transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 text-red-500 font-black text-sm bg-red-50 p-4 border border-red-200"
              >
                <AlertCircle size={16} />
                <span>ERROR: {error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full group relative overflow-hidden py-6 border-2 border-black font-black text-xl uppercase tracking-tighter transition-all duration-150
                ${isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-wait' 
                  : 'bg-black text-white hover:bg-white hover:text-black'}
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-4">
                {isLoading ? 'VERIFYING...' : 'INITIALIZE'}
                {!isLoading && <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} />}
              </span>
            </button>
          </form>

          <p className="mt-12 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            NOTICE: UNAUTHORIZED ACCESS ATTEMPTS ARE LOGGED. <br />
            ENSURE YOUR TEAM COORDINATOR HAS ALLOCATED YOUR CREDENTIALS.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;