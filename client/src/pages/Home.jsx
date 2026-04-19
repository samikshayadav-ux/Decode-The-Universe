import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { authData, isLoggedIn } = useAuth();
  const [currentRound, setCurrentRound] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gateway/rounds?status=live`);
      if (res.ok) {
        const data = await res.json();
        const liveRound = Array.isArray(data) ? data[0] : data;
        setCurrentRound(liveRound?.roundNumber ?? null);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = () => {
    const round = currentRound || 1;
    const path = round === 3 ? '/final-round/game' : `/round${round}/game`;
    navigate(isLoggedIn ? path : '/auth', { state: { from: { pathname: path } } });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 starfield" />
      
      {/* Orbital Elements */}
      <div className="orbit-arc w-[800px] h-[800px] -top-1/4 -right-1/4 scale-150" />
      <div className="orbit-arc w-[1200px] h-[1200px] -bottom-1/2 -left-1/4 opacity-30" />

      <div className="z-10 flex flex-col items-center text-center space-y-16 mt-[-10vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 uppercase tracking-[0.6em] text-[10px] opacity-40 font-bold"
        >
          <div>Deep Space Protocol</div>
          <div className="w-8 h-px bg-white mx-auto" />
        </motion.div>

        <motion.h1 
          className="text-7xl md:text-[10rem] font-black italic tracking-tighter uppercase leading-[0.8]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          DECODE<br />THE<br />
          <span className="text-accent underline decoration-white/5">UNIVERSE</span>
        </motion.h1>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
        >
          <button
            onClick={handleStart}
            className="neo-button group flex items-center gap-6"
          >
            <span>START MISSION {currentRound || 1}</span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-12 font-mono text-[8px] uppercase tracking-[0.4em] opacity-20 hidden md:block">
        Coordinate: 41.8781° N // 87.6298° W<br />
        Status: Signal Clear
      </div>

      <div className="absolute top-12 right-12 flex flex-col items-end gap-1">
        <div className="text-[10px] font-black tracking-[0.3em] text-accent uppercase">
          {authData?.teamName || 'GUEST_PROTO'}
        </div>
        <div className="w-12 h-[2px] bg-accent" />
      </div>
    </div>
  );
};

export default Home;