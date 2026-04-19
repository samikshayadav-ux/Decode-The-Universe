import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const Round2Gateway = () => {
  const navigate = useNavigate();
  const { isLoggedIn, authData } = useAuth();
  const isUnlocked = authData?.unlockedRounds?.includes(2);

  const handleProceed = () => {
    navigate('/round2/game');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-20" />
      <div className="orbit-arc w-[800px] h-[800px] -top-1/4 -right-1/4" />
      
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-lg space-y-16 text-center"
        >
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40">Phase 02 Gateway</div>
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-[0.8]">
              DEEPER<br />
              <span className="text-accent underline decoration-white/10">VOID</span>
            </h1>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
            Sequence authorized. Escalating access to secondary node.
          </p>

          <button
            onClick={handleProceed}
            className="neo-button w-full md:w-auto md:px-24"
          >
            ENTER PHASE_02
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-12 text-[8px] font-black tracking-[1em] opacity-10 uppercase">
        Level 02 // Deep Space
      </div>
    </div>
  );
};

export default Round2Gateway;