import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

const Round3Gateway = () => {
  const navigate = useNavigate();
  const { isLoggedIn, authData } = useAuth();
  const isUnlocked = authData?.unlockedRounds?.includes(3);

  const handleProceed = () => {
    navigate('/final-round/game');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-20" />
      <div className="orbit-arc w-[1000px] h-[1000px] -bottom-1/2 -right-1/2" />
      
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-lg space-y-16 text-center"
        >
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40">Final Phase Gateway</div>
            <h1 className="text-7xl md:text-[10rem] font-black italic tracking-tighter uppercase leading-[0.8]">
              SINGULARITY<br />
              <span className="text-accent underline decoration-white/10">POINT</span>
            </h1>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
            Ultimate decryption sequence initiated. Caution: System entropy at maximum.
          </p>

          <button
            onClick={handleProceed}
            className="neo-button w-full md:w-auto md:px-24"
          >
            ENTER FINAL_PHASE
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[8px] font-black tracking-[1em] opacity-10 uppercase">
        End of Sequence
      </div>
    </div>
  );
};

export default Round3Gateway;