import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Terminal, Activity } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import RoundProgressBar from '../components/RoundProgressBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { authData } = useAuth();
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
    const interval = setInterval(fetchRoundStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [fetchRoundStatus]);

  const handleRoundButtonClick = () => {
    if (currentRoundNumber !== null) {
       if (currentRoundNumber === 3) {
         navigate('/final-round');
       } else {
         navigate(`/round${currentRoundNumber}`);
       }
    }
  };

  const menuItems = [
    { name: 'INSTRUCTIONS', path: '/instructions' },
    { name: 'ABOUT', path: '/about' },
    { name: 'CREDITS', path: '/credits' }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-mono md:grid-bg p-4 md:p-6">
      <div className="scanline" />
      
      {/* Decorative Grid Lines - minimized */}
      <div className="absolute top-0 left-[50%] w-px h-full bg-white/5 hidden lg:block" />
      <div className="absolute top-[50%] left-0 w-full h-px bg-white/5 hidden lg:block" />

      {/* Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 flex flex-col items-center text-center space-y-2 w-full"
      >
        <div className="flex items-center gap-1.5 bg-accent text-black px-1.5 py-0.5 text-[8px] font-black mb-1">
          <Terminal size={10} />
          <span>DECODE_SYSTEM_v2.0</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.9] flex flex-col items-center uppercase italic">
          <span className="block">DECODE</span>
          <span className="block text-accent">THE</span>
          <span className="block">UNIVERSE</span>
        </h1>
      </motion.div>

      {/* Main Action */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="z-10 mt-8 w-full max-w-[280px]"
      >
        <button
          onClick={handleRoundButtonClick}
          disabled={currentRoundNumber === null}
          className={`
            w-full border-2 py-4 px-5 flex items-center justify-between text-sm md:text-base font-black uppercase tracking-tight transition-all duration-150
            ${currentRoundNumber !== null 
              ? 'border-white hover:bg-white hover:text-black cursor-pointer' 
              : 'border-gray-800 text-gray-800 cursor-not-allowed'}
          `}
        >
          <span>
            {currentRoundNumber !== null 
              ? `START ROUND ${currentRoundNumber}` 
              : 'ACCESS_LOCKED'}
          </span>
          {currentRoundNumber !== null ? <ArrowRight className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Footer Navigation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-16 w-full max-w-lg px-4 flex flex-col items-center gap-6 z-10"
      >
        <div className="flex gap-6">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="text-[9px] font-bold tracking-widest text-white/40 hover:text-accent transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${isLoaded ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[8px] font-bold tracking-widest text-white/50 uppercase">{isLoaded ? 'LIVE' : 'SYNCING'}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="text-[8px] font-bold tracking-widest text-accent uppercase">
            {authData?.teamName || 'GUEST_UNAFFILIATED'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;