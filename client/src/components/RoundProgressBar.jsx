import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check } from 'lucide-react';

const RoundProgressBar = ({ currentRound, unlockedRounds = [] }) => {
  const rounds = [
    { id: 1, label: 'ROUND 1' },
    { id: 2, label: 'ROUND 2' },
    { id: 3, label: 'FINAL ROUND' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-8 px-4 w-full max-w-4xl mx-auto">
      {rounds.map((round, index) => {
        const isUnlocked = unlockedRounds.includes(round.id);
        const isActive = currentRound === round.id;
        const isCompleted = isUnlocked && !isActive && round.id < currentRound;
        const isLocked = !isUnlocked;

        return (
          <React.Fragment key={round.id}>
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isActive ? '#FACC15' : isCompleted ? '#FFFFFF' : '#1A1A1A',
                color: isActive ? '#000000' : isCompleted ? '#000000' : '#666666',
                borderColor: isLocked ? '#333333' : '#FFFFFF',
              }}
              className={`
                px-4 py-2 border-2 flex items-center gap-3 font-black text-sm md:text-base tracking-widest
                ${isLocked ? 'cursor-not-allowed' : 'cursor-default'}
              `}
            >
              <span className="opacity-50">[{round.id}]</span>
              <span>{round.label}</span>
              
              <AnimatePresence mode="wait">
                {isCompleted && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.div>
                )}
                {isLocked && (
                  <motion.div
                    key="lock"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Lock size={16} className="text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {index < rounds.length - 1 && (
              <div className={`h-0.5 w-8 md:w-12 bg-white/20 hidden md:block`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default RoundProgressBar;
