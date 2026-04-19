import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

const TreasureHuntRound3 = () => {
  const { authData, isLoading: authLoading, isLoggedIn, refreshTeamProgress } = useAuth();
  const teamId = authData?.teamId;
  const navigate = useNavigate();

  const [currentStage, setCurrentStage] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [gameState, setGameState] = useState('loading');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      if (!isLoggedIn || !teamId) return setGameState('error');
      try {
        const { progress } = await callGateway(3);
        setCurrentStage(progress.currentStage || 1);
        setElapsed(progress.totalTimeSpent || 0);
        setStartTime(Date.now() - (progress.totalTimeSpent * 1000 || 0));
        setGameState(progress.status === 'completed' ? 'results' : 'active');
      } catch (e) { setGameState('error'); }
    };
    init();
  }, [authLoading, isLoggedIn, teamId]);

  useEffect(() => {
    if (gameState !== 'active') return;
    const t = setInterval(() => {
      if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [gameState, startTime]);

  const finish = async () => {
    try {
      await completeRound(3, teamId, { totalTime: elapsed, status: 'completed' });
      await refreshTeamProgress();
      setGameState('results');
    } catch (e) { setGameState('error'); }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (gameState === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center font-mono opacity-40 uppercase tracking-[0.5em] text-[10px]">Initializing...</div>;

  if (gameState === 'results') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-20" />
      <div className="z-10 text-center space-y-12">
        <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase">Mission Complete</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Universe Decoded // Equilibrium Established</p>
        <button onClick={() => navigate('/leaderboard')} className="neo-button">View Global Rankings</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-10" />
      
      {/* Header */}
      <div className="flex justify-between items-center p-8 z-20 border-b border-white/10 backdrop-blur-md">
        <div className="text-[10px] font-black uppercase tracking-[0.4em]">Final Phase // Singularity</div>
        <div className="text-[10px] font-mono font-black tracking-widest text-accent tabular-nums">{formatTime(elapsed)}</div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="minimal-box p-20 text-center relative"
          >
            <div className="absolute top-0 right-0 bg-accent text-black px-3 py-1 text-[8px] font-black uppercase tracking-widest">Critical_Core</div>
            <h2 className="text-4xl font-black italic uppercase tracking-tight mb-12 leading-tight">
              THE FINAL DECRYPTION SEQUENCE IS PROTECTED BY THE QUANTUM CORE.
            </h2>
            <button
               onClick={finish}
               className="neo-button"
            >
              FINALIZE DECODING
            </button>
          </motion.div>
        </div>
      </main>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black tracking-[0.4em] opacity-10 uppercase">
        End of Transmission
      </div>
    </div>
  );
};

export default TreasureHuntRound3;