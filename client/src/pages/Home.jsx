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
      navigate(`/round${currentRoundNumber}`);
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
      
      {/* Decorative Grid Lines - only on large screens */}
      <div className="absolute top-0 left-[25%] w-px h-full bg-white/10 hidden lg:block" />
      <div className="absolute top-0 left-[75%] w-px h-full bg-white/10 hidden lg:block" />
      <div className="absolute top-[25%] left-0 w-full h-px bg-white/10 hidden lg:block" />
      <div className="absolute top-[75%] left-0 w-full h-px bg-white/10 hidden lg:block" />

      {/* Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 flex flex-col items-center text-center space-y-4 w-full"
      >
        <div className="flex items-center gap-2 bg-accent text-black px-2 py-1 text-[10px] md:text-sm font-black mb-2 md:mb-4">
          <Terminal size={14} className="md:w-4 md:h-4" />
          <span>ESTABLISHED 2026 // DECODE_SEQUENCE_INIT</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] flex flex-col items-center italic">
          <span className="block">DECODE</span>
          <span className="block text-accent">THE</span>
          <span className="block">UNIVERSE</span>
        </h1>

        <div className="w-full max-w-lg h-1 md:h-2 bg-white/5 mt-4 md:mt-8 relative overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 w-1/3 h-full bg-accent"
          />
        </div>
      </motion.div>

      {/* Progress Section - Hidden on very small screens or made more compact */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-5xl z-10 mt-8 md:mt-12 bg-black/50 backdrop-blur-sm border-y-2 border-white/10"
      >
        <div className="px-2 md:px-0">
          <RoundProgressBar 
            currentRound={currentRoundNumber} 
            unlockedRounds={authData?.unlockedRounds || []} 
          />
        </div>
      </motion.div>

      {/* Main Action */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="z-10 mt-8 md:mt-12 w-full max-w-md px-4 md:px-0"
      >
        <button
          onClick={handleRoundButtonClick}
          disabled={currentRoundNumber === null}
          className={`
            w-full border-4 py-6 md:py-8 px-4 md:px-6 flex items-center justify-between text-xl md:text-2xl font-black uppercase tracking-tighter transition-all duration-150
            ${currentRoundNumber !== null 
              ? 'border-white hover:bg-white hover:text-black cursor-pointer' 
              : 'border-gray-800 text-gray-800 cursor-not-allowed'}
          `}
        >
          <span>
            {currentRoundNumber !== null 
              ? `ROUND ${currentRoundNumber === 0 ? 1 : currentRoundNumber === 3 ? 'FINAL' : currentRoundNumber}` 
              : 'ROUND LOCKED'}
          </span>
          {currentRoundNumber !== null ? <ArrowRight className="w-6 h-6 md:w-8 md:h-8" /> : <Lock className="w-6 h-6 md:w-8 md:h-8" />}
        </button>
      </motion.div>

      {/* Footer Navigation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto md:absolute md:bottom-8 left-0 w-full px-4 md:px-8 py-8 md:py-0 flex flex-col md:flex-row justify-between items-center gap-6 z-10"
      >
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 order-2 md:order-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="text-xs md:text-sm font-black tracking-widest hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 bg-white/5 border-2 border-white/10 px-4 py-2 order-1 md:order-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 md:w-3 md:h-3 ${isLoaded ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/50 uppercase">STATUS: {isLoaded ? 'LIVE' : 'SYNCING'}</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="text-[10px] md:text-xs font-bold tracking-widest text-accent uppercase">
            {authData?.teamName || 'GUEST_UNAFFILIATED'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
;