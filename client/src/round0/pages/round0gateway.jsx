import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Play, ArrowLeft, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Round1Gateway = () => {
  const navigate = useNavigate();
  const { authData } = useAuth();
  const [roundStatus, setRoundStatus] = useState(null); // 'live', 'locked', 'ended'
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoundInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gateway/rounds`);
      if (response.ok) {
        const rounds = await response.json();
        // The API returns rounds; find round 1
        const round1 = rounds.find(r => r.roundNumber === 1);
        setRoundStatus(round1?.status || 'locked');
      }
    } catch (e) {
      console.error('Failed to fetch round status:', e);
      setRoundStatus('locked');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoundInfo();
    const interval = setInterval(fetchRoundInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchRoundInfo]);

  const hasAccess = authData?.unlockedRounds?.includes(1);
  const isLive = roundStatus === 'live';
  const isEnded = roundStatus === 'ended';

  const handleEnter = () => {
    if (isLive && hasAccess) {
      navigate('/round1/game');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono grid-bg p-6 md:p-16 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <div className="flex justify-between items-center z-10 mb-20">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 font-black uppercase text-sm hover:text-accent transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>BACK_TO_TERMINAL</span>
        </button>
        
        <div className="text-right">
          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">AUTHORIZED_TEAM</div>
          <div className="text-accent font-black uppercase tracking-tighter">{authData?.teamName || 'GUEST_01'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-start justify-center z-10">
        <motion.div
           initial={{ x: -100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <span className="bg-white text-black px-4 py-1 font-black text-2xl tracking-tighter italic">01</span>
            <div className="h-px w-24 bg-white/20" />
            <div className="text-xs font-black tracking-[0.5em] text-white/30 uppercase">SYSTEM_GATEWAY_V.4</div>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-tight italic">
            ROUND 1
          </h1>

          <div className="flex flex-wrap gap-4 items-center">
             {/* Status Badge */}
             <div className={`
               flex items-center gap-3 px-6 py-2 border-2 font-black text-sm uppercase tracking-widest transition-colors duration-300
               ${isLive ? 'border-green-500 text-green-500' : isEnded ? 'border-red-500 text-red-500' : 'border-gray-500 text-gray-500'}
             `}>
               <Activity size={16} className={isLive ? 'animate-pulse' : ''} />
               <span>STATUS: {roundStatus?.toUpperCase() || 'UNKNOWN'}</span>
             </div>

             <div className={`
               flex items-center gap-3 px-6 py-2 border-2 font-black text-sm uppercase tracking-widest transition-colors duration-300
               ${hasAccess ? 'border-accent text-accent' : 'border-gray-800 text-gray-800'}
             `}>
               <ShieldCheck size={16} />
               <span>ACCESS: {hasAccess ? 'GRANTED' : 'DENIED'}</span>
             </div>
          </div>
        </motion.div>

        <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-16 w-full max-w-2xl"
        >
           <button
             onClick={handleEnter}
             disabled={!isLive || !hasAccess}
             className={`
               w-full md:w-auto min-w-[320px] border-4 py-8 px-12 flex items-center justify-between text-3xl font-black uppercase tracking-tighter transition-all duration-150
               ${isLive && hasAccess 
                 ? 'border-white hover:bg-white hover:text-black cursor-pointer bg-black' 
                 : 'border-gray-800 text-gray-800 cursor-not-allowed bg-transparent'}
             `}
           >
             <span>{isLive && hasAccess ? 'INITIALIZE' : isEnded ? 'ROUND_ENDED' : 'LOCKED'}</span>
             {isLive && hasAccess ? <Play size={32} fill="currentColor" /> : <Lock size={32} />}
           </button>

           <p className="mt-8 text-white/30 text-[10px] md:text-xs max-w-md uppercase leading-relaxed font-bold tracking-widest">
             CRITICAL: ONCE INITIALIZED, THE TIMER FOR ROUND 1 WILL COMMENCE. <br />
             SYNCHRONIZE YOUR TEAM BEFORE PROCEEDING. NO REBOOTS ALLOWED.
           </p>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-[-10%] right-[-5%] p-8 opacity-5 hidden lg:block">
        <Terminal size={500} strokeWidth={1} />
      </div>
      
      <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col gap-12 opacity-10 hidden xl:flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-xs font-black vertical-text uppercase tracking-[1em]">
            STAY_FOCUSED_LIMIT_0{i+1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Round1Gateway;