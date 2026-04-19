import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { authData, isLoggedIn } = useAuth();
  const [currentRoundNumber, setCurrentRoundNumber] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchRoundStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gateway/rounds?status=live`);
      if (response.ok) {
        const data = await response.json();
        const liveRound = Array.isArray(data) ? data[0] : data;
        setCurrentRoundNumber(liveRound?.roundNumber ?? null);
      }
    } catch (error) {
      console.error('Error fetching round status:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchRoundStatus();
    const interval = setInterval(fetchRoundStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchRoundStatus]);

  const handleRoundButtonClick = () => {
    const roundToStart = currentRoundNumber || 1;
    const path = roundToStart === 3 ? '/final-round/game' : `/round${roundToStart}/game`;
    
    if (!isLoggedIn) {
      navigate('/auth', { state: { from: { pathname: path } } });
    } else {
      navigate(path);
    }
  };

  const activeRoundDisplay = currentRoundNumber || 1;

  return (
    <div className="min-h-screen bg-bg text-[#F5F5F5] flex flex-col items-center justify-center relative overflow-hidden font-sans grid-bg-tech p-6">
      <div className="scanline" />
      
      {/* Top Navbar Minimal */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-accent uppercase font-black">
          <Terminal size={14} />
          <span>SYS_ACTIVE // NODE_01</span>
        </div>
        
        <div className="flex gap-8 text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
           <button className="hover:text-accent hover:opacity-100 transition-all">INTEL</button>
           <button className="hover:text-accent hover:opacity-100 transition-all">ENTROPY</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-4 mb-20"
        >
          <div className="inline-block px-4 py-1 border border-white/10 rounded-full text-[10px] tracking-[0.4em] uppercase font-bold mb-4 opacity-50">
            Universal Decoder Sequence
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.85] italic tracking-tighter uppercase">
            DECODE<br />THE<br />
            <span className="text-accent">UNIVERSE</span>
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full flex flex-col items-center"
        >
          <button
            onClick={handleRoundButtonClick}
            className="neo-button group px-12 py-6 min-w-[300px] flex items-center justify-between"
          >
            <span className="text-lg uppercase">START ROUND {activeRoundDisplay}</span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] opacity-20">
            <Globe size={12} />
            <span>SYNC_LEVEL: OPTIMAL</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Status Panel */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
        <div className="max-w-[200px] text-[8px] leading-relaxed opacity-20 uppercase font-bold tracking-widest">
          ESTABLISHING SECURE CONNECTION_
          CALIBRATING ENTROPY SENSORS_
          READY FOR INPUT_
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="text-[10px] font-black text-accent">{authData?.teamName || 'UNAFFILIATED'}</div>
          <div className="text-[8px] opacity-30 uppercase tracking-widest font-bold">TERMINAL_ID: {authData?.teamId || 'GUEST_PROTO'}</div>
        </div>
      </div>
    </div>
  );
};

export default Home;