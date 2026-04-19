import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Play, ArrowLeft, ShieldCheck, Activity, Terminal, Trophy } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FinalRoundGateway = () => {
  const navigate = useNavigate();
  const { authData } = useAuth();
  const [roundStatus, setRoundStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoundInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gateway/rounds`);
      if (response.ok) {
        const rounds = await response.json();
        const round = rounds.find(r => r.roundNumber === 3);
        setRoundStatus(round?.status || 'locked');
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

  const hasAccess = authData?.unlockedRounds?.includes(3);
  const isLive = roundStatus === 'live';
  const isEnded = roundStatus === 'ended';

  const handleEnter = () => {
    if (isLive && hasAccess) {
      navigate('/final-round/game');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono grid-bg p-6 md:p-16 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      
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

      <div className="flex-1 flex flex-col items-start justify-center z-10">
        <motion.div
           initial={{ x: -100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           className="space-y-6"
        >
          <div className="flex items-center gap-4 text-accent">
            <Trophy size={32} />
            <div className="h-px w-24 bg-accent/20" />
            <div className="text-xs font-black tracking-[0.5em] uppercase">FINAL_SEQUENCE</div>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-tight italic">
            FINAL ROUND
          </h1>

          <div className="flex flex-wrap gap-4 items-center">
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
             CORE OVERRIDE INITIATED. ALL SYSTEMS CONVERGING. <br />
             THERE IS NO SECOND PLACE IN THE UNIVERSE.
           </p>
        </motion.div>
      </div>

      <div className="absolute bottom-[-10%] right-[-5%] p-8 opacity-5 hidden lg:block">
        <Terminal size={500} strokeWidth={1} />
      </div>
    </div>
  );
};

export default FinalRoundGateway;