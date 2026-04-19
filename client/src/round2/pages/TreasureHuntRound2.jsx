import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

import Game1 from '../components/Game1';
import Game2 from '../components/Game2';
import Game3 from '../components/Game3';
import Game4 from '../components/Game4';
import Game5 from '../components/Game5';
import Game6 from '../components/Game6';
import Game7 from '../components/Game7';
import Game8 from '../components/Game8';
import Game9 from '../components/Game9';
import Game10 from '../components/Game10';

const TOTAL_STAGES = 10;
const GAMES = [Game1, Game2, Game3, Game4, Game5, Game6, Game7, Game8, Game9, Game10];

const TreasureHuntRound2 = () => {
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
        const { progress } = await callGateway(2);
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

  const onStageComplete = async (ans = 'completed') => {
    setIsTransitioning(true);
    try {
      await submitAnswer(2, teamId, {
        stageId: currentStage,
        answer: ans,
        timeSpent: Math.floor((Date.now() - startTime) / 1000) - elapsed
      });
      if (currentStage === TOTAL_STAGES) {
        finish();
      } else {
        setTimeout(() => {
          setCurrentStage(s => s + 1);
          setIsTransitioning(false);
        }, 600);
      }
    } catch (e) { setIsTransitioning(false); }
  };

  const finish = async () => {
    try {
      await completeRound(2, teamId, { totalTime: elapsed, status: 'completed' });
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
        <h1 className="text-6xl font-black italic tracking-tighter uppercase">Phase 02 Complete</h1>
        <button onClick={() => navigate('/final-round')} className="neo-button">Proceed to Final Phase</button>
      </div>
    </div>
  );

  const CurrentGame = GAMES[currentStage - 1];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-10" />
      
      {/* Header */}
      <div className="flex justify-between items-center p-8 z-20 border-b border-white/10 backdrop-blur-md">
        <div className="text-[10px] font-black uppercase tracking-[0.4em]">Phase_02 // Extraction</div>
        <div className="flex items-center gap-4">
           <div className="flex gap-2">
             {Array.from({ length: TOTAL_STAGES }).map((_, i) => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full ${i + 1 <= currentStage ? 'bg-accent' : 'bg-white/10'}`} />
             ))}
           </div>
           <div className="w-px h-4 bg-white/20" />
           <div className="text-[10px] font-mono font-black tracking-widest text-accent">{formatTime(elapsed)}</div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="minimal-box p-12 relative"
              >
                <div className="absolute -top-3 left-8 bg-black px-4 text-[8px] font-black uppercase tracking-[0.4em] opacity-40">
                  Node_{currentStage.toString().padStart(2, '0')}
                </div>
                {CurrentGame && <CurrentGame onComplete={onStageComplete} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="absolute bottom-8 right-8 text-[8px] font-black tracking-[0.4em] opacity-10 uppercase">
        Telemetry: Extraction_Stream_02
      </div>
    </div>
  );
};

export default TreasureHuntRound2;