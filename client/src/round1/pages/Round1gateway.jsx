import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, Terminal, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const Round1Gateway = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { isLoggedIn, authData } = useAuth();

  const correctPassword = 'KLE&3h9jd';

  useEffect(() => {
    if (isLoggedIn && authData) {
      if (authData.unlockedRounds?.includes(1)) {
        navigate('/round1/game', { replace: true });
      }
    }
  }, [isLoggedIn, authData, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (password.trim() === correctPassword) {
        navigate('/auth', { state: { from: { pathname: '/round1' } } });
      } else {
        setError('INVALID_KEY_SEQUENCE');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono grid-bg p-6 md:p-16 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      
      <div className="flex justify-between items-center z-10 mb-20">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 font-black uppercase text-xs md:text-sm hover:text-accent transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>BACK_TO_HOME</span>
        </button>
        
        <div className="text-right">
          <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">AUTHORIZED_TERMINAL</div>
          <div className="text-accent font-black uppercase tracking-tighter text-xs md:text-base">
            {authData?.teamName || 'GUEST_UNAFFILIATED'}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="w-full max-w-md border-4 border-white p-8 bg-black relative"
        >
          <div className="absolute -top-4 -left-4 bg-white text-black px-3 py-1 font-black italic">
            SECURE_GATE_01
          </div>

          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-2">ROUND 1</h1>
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-[0.3em]">
              <ShieldCheck size={12} />
              <span>ENTRY_RESTRICTED // KEYS_REQUIRED</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black tracking-widest uppercase opacity-50">INPUT ACCESS_KEY</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent border-b-4 border-white py-4 px-2 text-2xl font-black focus:outline-none placeholder-white/5 uppercase"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase mt-2">
                  [!] ERROR: {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={`
                w-full border-4 py-6 flex items-center justify-center gap-4 text-xl font-black uppercase tracking-tighter transition-all duration-150
                ${isLoading || !password.trim()
                  ? 'border-white/10 text-white/10 cursor-not-allowed'
                  : 'border-white bg-white text-black hover:bg-black hover:text-white'}
              `}
            >
              {isLoading ? 'VERIFY_SEQUENCE...' : (
                <>
                  <span>INITIALIZE</span>
                  <Lock size={20} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="mt-12 text-white/20 text-[10px] font-bold uppercase tracking-widest text-center max-w-xs leading-loose">
          WARNING: UNAUTHORIZED ATTEMPTS WILL TRIGGER SYSTEM_LOCKOUT. <br />
          REFER TO COMMAND_BRIEF FOR AUTHENTICATION PROTOCOLS.
        </p>
      </div>

      <div className="absolute bottom-[-10%] right-[-10%] opacity-5 hidden lg:block">
        <Terminal size={600} strokeWidth={1} />
      </div>
    </div>
  );
};

export default Round1Gateway;