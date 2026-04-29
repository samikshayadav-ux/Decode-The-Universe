import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callGateway, advanceRound2Stage, completeRound } from '../../utils/quizApi';

// Import all game components
import Game1 from '../components/Game1';
import Game3 from '../components/Game3';
import Game4 from '../components/Game4';
import Game5 from '../components/Game5';
import Game6 from '../components/Game6';
import Game7 from '../components/Game7';
<<<<<<< HEAD
import Game9 from '../components/Game9';
import Game10 from '../components/Game10';

const TOTAL_STAGES = 8;
=======
import Game8 from '../components/Game8';
import Game9 from '../components/Game9';
import Game10 from '../components/Game10';

const TOTAL_STAGES = 10;
>>>>>>> upstream/main

const TreasureHuntRound2 = () => {
  const [introDone, setIntroDone] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [currentStage, setCurrentStage] = useState(() => {
    const savedStage = sessionStorage.getItem('currentStageR2');
    return savedStage ? parseInt(savedStage, 10) : 1;
  });
  const [startTime] = useState(() => {
    const saved = sessionStorage.getItem('startTimeR2');
    if (saved) return new Date(parseInt(saved, 10));
    const now = new Date();
    sessionStorage.setItem('startTimeR2', now.getTime());
    return now;
  });
  const [elapsed, setElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Dev tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [devStageInput, setDevStageInput] = useState('');

  const introMessages = ['ROUND 2', 'Decode The Universe', 'Get Ready...'];

  useEffect(() => {
    sessionStorage.setItem('currentStageR2', currentStage.toString());
  }, [currentStage]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const ms = now - startTime;
      setElapsed(ms);
    }, 50);
    return () => clearInterval(interval);
  }, [startTime]);

  // Intro sequence logic
  useEffect(() => {
    if (!introDone) {
      const steps = [
        { text: 'ROUND 2', duration: 1500 },
        { text: 'Decode The Universe', duration: 2000 },
        { text: 'Get Ready...', duration: 1500 },
      ];
      if (introStep < steps.length) {
        const timer = setTimeout(() => {
          setIntroStep(prev => prev + 1);
        }, steps[introStep].duration);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setIntroDone(true), 500);
      }
    }
  }, [introStep, introDone]);

  // Dev tools keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDevTools(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNextStage = async () => {
    setIsTransitioning(true);
    
    try {
      const authInfo = localStorage.getItem('authInfo');
      const teamId = authInfo ? JSON.parse(authInfo).teamId : null;

      if (teamId) {
        if (currentStage < TOTAL_STAGES) {
          await advanceRound2Stage(teamId);
          setCurrentStage((prev) => prev + 1);
        } else {
          // Final stage completed
          await completeRound(2, teamId, {
            totalTime: Math.floor(elapsed / 1000),
            completionType: 'manual_submit'
          });
          window.location.href = '/';
        }
      } else {
        if (currentStage < TOTAL_STAGES) {
          setCurrentStage((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('[Round2] Error advancing stage:', err);
      if (currentStage < TOTAL_STAGES) {
        setCurrentStage((prev) => prev + 1);
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const jumpToStage = () => {
    const stageNum = parseInt(devStageInput, 10);
    if (stageNum >= 1 && stageNum <= TOTAL_STAGES) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStage(stageNum);
        setIsTransitioning(false);
      }, 500);
    }
  };

  const formatTime = (ms) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const games = [
<<<<<<< HEAD
    Game1, Game3, Game4, Game5,
    Game6, Game7, Game9, Game10
=======
    Game1, Game2, Game3, Game4, Game5,
    Game6, Game7, Game8, Game9, Game10
>>>>>>> upstream/main
  ];

  const CurrentGame = games[currentStage - 1];

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      {/* Dev Tools Panel */}
      {showDevTools && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 z-50 bg-gray-800 p-4 rounded-lg shadow-xl"
        >
          <h3 className="text-lg font-bold mb-2">Developer Tools</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              min="1"
              max={TOTAL_STAGES}
              value={devStageInput}
              onChange={(e) => setDevStageInput(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded w-16"
              placeholder="Stage #"
            />
            <button
              onClick={jumpToStage}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              Jump
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((stage) => (
              <button
                key={stage}
                onClick={() => {
                  setDevStageInput(stage.toString());
                  jumpToStage();
                }}
                className={`px-2 py-1 rounded text-xs ${
                  currentStage === stage 
                    ? 'bg-green-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDevTools(false)}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Close [Ctrl+Shift+D]
          </button>
        </motion.div>
      )}

      {/* Timer (only visible after intro) */}
      {introDone && (
        <div className="fixed top-4 right-6 z-50">
          <span className="font-mono text-3xl font-extrabold px-4 py-2 rounded-2xl border-2 border-blue-500 bg-black/50">
            {formatTime(elapsed)}
          </span>
        </div>
      )}

      {/* Intro overlay */}
      {!introDone && (
        <motion.div
          key={`intro-${introStep}`}
          className="absolute inset-0 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            {introMessages[introStep] || ''}
          </motion.h1>
        </motion.div>
      )}

      {/* Game full screen */}
      {introDone && (
        <main className="w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
<<<<<<< HEAD
                className={`w-full ${currentStage === 1 ? 'max-w-3xl' : 'h-full'}`}
=======
                className={`w-full ${currentStage === 2 ? 'max-w-3xl' : 'h-full'}`}
>>>>>>> upstream/main
              >
                <CurrentGame onComplete={handleNextStage} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Transition overlay */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            Loading Stage {currentStage + 1}...
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

<<<<<<< HEAD
export default TreasureHuntRound2;
=======
export default TreasureHuntRound2;
>>>>>>> upstream/main
