import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

// Import all game components
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
  const teamName = authData?.teamName;
  const navigate = useNavigate();

  const [currentStage, setCurrentStage] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [gameState, setGameState] = useState('loading');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Initialize Round 2
  useEffect(() => {
    const initializeRound = async () => {
      try {
        if (authLoading) return;
        if (!isLoggedIn || !teamId) {
          setError('Authentication required.');
          setGameState('error');
          return;
        }

        const gatewayData = await callGateway(2);
        const { progress } = gatewayData;

        setCurrentStage(progress.currentStage || 1);
        setElapsed(progress.totalTimeSpent || 0);
        setStartTime(Date.now() - (progress.totalTimeSpent * 1000 || 0));

        if (progress.status === 'completed') {
          setGameState('results');
        } else {
          setGameState('active');
        }
      } catch (err) {
        console.error('Failed to initialize Round 2:', err);
        setError(err.message || 'Failed to load round data.');
        setGameState('error');
      }
    };

    if (!authLoading) initializeRound();
  }, [authLoading, isLoggedIn, teamId]);

  // Timer
  useEffect(() => {
    if (gameState !== 'active') return;

    const timer = setInterval(() => {
      if (startTime) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, startTime]);

  const handleStageComplete = async (answer = 'completed') => {
    setIsTransitioning(true);
    try {
      const response = await submitAnswer(2, teamId, {
        stageId: currentStage,
        answer: answer,
        timeSpent: Math.floor((Date.now() - startTime) / 1000) - elapsed // Approximate
      });

      if (currentStage === TOTAL_STAGES) {
        await handleRoundCompletion();
      } else {
        setTimeout(() => {
          setCurrentStage(prev => prev + 1);
          setIsTransitioning(false);
        }, 800);
      }
    } catch (err) {
      console.error('Stage submission failed:', err);
      setError('Failed to save progress.');
      setIsTransitioning(false);
    }
  };

  const handleRoundCompletion = async () => {
    try {
      await completeRound(2, teamId, {
        totalTime: elapsed,
        status: 'completed'
      });
      
      await refreshTeamProgress();
      setGameState('results');
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Round completion failed:', err);
      setError('Failed to finalize round.');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          BOOTING_PHASE_2...
        </motion.div>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
        <div className="border-2 border-white p-8 max-w-md w-full">
          <h2 className="text-2xl mb-4 text-red-500">CRITICAL_FAILURE</h2>
          <p className="mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full border-2 border-white py-2 hover:bg-white hover:text-black">REBOOT</button>
        </div>
      </div>
    );
  }

  const CurrentGame = GAMES[currentStage - 1];

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col pt-24">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 w-full h-16 bg-black border-b-2 border-white z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-2">
          {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <span className={`h-8 w-8 flex items-center justify-center border-2 ${currentStage === s ? 'bg-white text-black font-black border-white' : s < currentStage ? 'border-green-500 text-green-500 opacity-50' : 'border-white/30 text-white/30'}`}>
                {s}
              </span>
              {s < TOTAL_STAGES && <span className="text-white/20">→</span>}
            </div>
          ))}
        </div>
        <div className="text-2xl font-black tabular-nums bg-white text-black px-4 h-full flex items-center">
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent z-10" />
        
        <AnimatePresence mode="wait">
          {!isTransitioning && (
            <motion.div
              key={currentStage}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="h-full"
            >
              <div className="max-w-7xl mx-auto p-8 h-full">
                <div className="border-2 border-white p-8 bg-white/5 relative h-full flex flex-col">
                  <div className="absolute top-0 left-0 bg-white text-black px-3 py-1 text-xs font-black uppercase">
                    Stage_{currentStage}_of_{TOTAL_STAGES}
                  </div>
                  <div className="flex-1">
                    {CurrentGame && <CurrentGame onComplete={handleStageComplete} />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isTransitioning && (
          <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black"
            >
              DATA_SYNC_IN_PROGRESS...
            </motion.div>
          </div>
        )}
      </div>

      {/* Results / Modal */}
      {gameState === 'results' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="border-4 border-white p-12 max-w-2xl w-full text-center bg-black">
            <h2 className="text-6xl font-black mb-6">ROUND_2_COMPLETE</h2>
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="border-2 border-white p-6">
                <p className="text-sm opacity-50 mb-2">FINAL_TIME</p>
                <p className="text-4xl font-black">{formatTime(elapsed)}</p>
              </div>
              <div className="border-2 border-white p-6">
                <p className="text-sm opacity-50 mb-2">STATUS</p>
                <p className="text-4xl font-black text-green-500">VERIFIED</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/final-round')}
              className="w-full border-4 border-white py-6 text-3xl font-black hover:bg-white hover:text-black transition-colors"
            >
              ACCESS_FINAL_ROUND →
            </button>
          </div>
        </div>
      )}

      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default TreasureHuntRound2;