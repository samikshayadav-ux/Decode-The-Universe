import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stage1 from '../components/Stage1';
import Stage2 from '../components/Stage2';
import Stage3 from '../components/Stage3';
import { callGateway, advanceRound1Stage } from '../../utils/quizApi';

const TOTAL_STAGES = 3;

const stageTitles = {
  1: "Stage 1",
  2: "Stage 2",
  3: "Stage 3",
};

const TreasureHuntRound1 = () => {
  const [currentStage, setCurrentStage] = useState(() => {
    const savedStage = sessionStorage.getItem('currentStage');
    return savedStage ? parseInt(savedStage, 10) : 1;
  });

  const [startTime] = useState(() => {
    const saved = sessionStorage.getItem('startTime');
    if (saved) return new Date(parseInt(saved, 10));
    const now = new Date();
    sessionStorage.setItem('startTime', now.getTime());
    return now;
  });

  const [elapsed, setElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [stageStartTimes, setStageStartTimes] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);

  // Initialize Round 1 on component mount
  useEffect(() => {
    const initializeRound1 = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await callGateway(1);
        
        if (data && data.questions && data.progress) {
          setQuestions(data.questions);
          setProgress(data.progress);
          
          // Initialize stage start times
          const times = {};
          for (let i = 1; i <= TOTAL_STAGES; i++) {
            times[i] = null;
          }
          setStageStartTimes(times);
          
          console.log('[Round1] Gateway initialized:', {
            questions: data.questions.length,
            status: data.progress.status,
            currentStage: data.progress.currentStage
          });
        } else {
          throw new Error('Invalid gateway response');
        }
      } catch (err) {
        console.error('[Round1] Gateway initialization error:', err);
        setError(err.message || 'Failed to initialize Round 1');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeRound1();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('currentStage', currentStage.toString());
    
    // Track stage start time
    if (!stageStartTimes[currentStage]) {
      const newTimes = { ...stageStartTimes };
      newTimes[currentStage] = Date.now();
      setStageStartTimes(newTimes);
    }
  }, [currentStage, stageStartTimes]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const ms = now - startTime;
      setElapsed(ms);
    }, 50); // update every 50ms for smooth milliseconds
    return () => clearInterval(interval);
  }, [startTime]);

  const handleNextStage = async () => {
    setIsTransitioning(true);
    
    try {
      // Get team ID from session storage
      const teamId = sessionStorage.getItem('authInfo') 
        ? JSON.parse(sessionStorage.getItem('authInfo')).teamId 
        : null;
      
      if (!teamId) {
        throw new Error('Team ID not found');
      }
      
      // Call advance endpoint - backend calculates time from timestamps
      await advanceRound1Stage(teamId);
      
      console.log('[Round1] Stage advanced:', {
        stage: currentStage,
        nextStage: currentStage + 1
      });
      
      // Move to next stage
      if (currentStage < TOTAL_STAGES) {
        setCurrentStage(prev => prev + 1);
      }
    } catch (err) {
      console.error('[Round1] Error advancing stage:', err);
      setError(err.message);
    } finally {
      setIsTransitioning(false);
    }
  };

  const formatTime = (ms) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100); // 0-9

    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const handleRoundCompletion = () => {
    setCompletionTime(elapsed);
    setIsCompleted(true);
  };

  const handleGoHome = () => {
    // Clear session data
    sessionStorage.removeItem('currentStage');
    sessionStorage.removeItem('stageStartTimes');
    // Navigate to home
    window.location.href = '/';
  };

  return (
    <div className="w-full  min-h-screen bg-gradient-to-br pt-8 from-gray-900 to-gray-800 text-white px-4 py-6 relative overflow-hidden">
      {/* Timer with glowing effect and blinking blue dot */}
      <div className="fixed top-8 right-12 z-50">
        <span className="flex items-center gap-3">
          <span
            className="font-mono text-3xl font-extrabold px-6 py-2 rounded-2xl  border-2 border-blue-500"
          >
            {formatTime(elapsed)}
          </span>
        </span>
      </div>

      {/* Round indicator - centered */}
      <div className="w-full flex justify-center mb-2">
        <div className=" px-6 py-1 mb-8">
          <span className="text-5xl font-medium text-blue-400">ROUND 1</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mb-16">
        <div className="w-full bg-gray-700 rounded-full h-4 border-gray-600">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStage) / TOTAL_STAGES) * 100}%` }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 shadow-lg"
          />
        </div>
        <div className="flex justify-between mt-2 px-1 text-xs text-blue-300 tracking-wider">
          {[1, 2, 3].map((stage) => (
            <span
              key={stage}
              className={`${
                currentStage === stage
                  ? 'text-blue-400 font-bold'
                  : currentStage > stage
                  ? 'text-blue-300'
                  : 'text-gray-400'
              }`}
            >
              S{stage}
           </span>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full max-w-2xl mx-auto p-6 rounded-xl bg-gray-800/70 backdrop-blur-sm border border-gray-700 shadow-xl flex items-center justify-center min-h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-4xl"
          >
            ⚙️
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-4 text-lg text-blue-300"
          >
            Initializing Round 1...
          </motion.div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="w-full max-w-2xl mx-auto p-6 rounded-xl bg-red-900/20 border border-red-600 shadow-xl">
          <div className="text-red-400 font-bold mb-3">⚠️ Error</div>
          <div className="text-red-200 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Completion Screen */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="fixed inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 flex items-center justify-center z-50"
        >
          <div className="max-w-md w-full mx-4 text-center">
            {/* Celebration animation */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              🎉
            </motion.div>

            {/* Completion message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2">Congratulations!</h1>
              <p className="text-lg text-gray-300 mb-8">
                You've completed Round 1
              </p>
            </motion.div>

            {/* Go Home button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoHome}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Go Home
            </motion.button>

            {/* Decorative elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 -z-10 pointer-events-none"
            >
              <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main content with animations */}
      {!isLoading && !error && !isCompleted && (
      <AnimatePresence mode='wait'>
        {!isTransitioning && (
          <motion.main
            key={currentStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto p-6 rounded-xl bg-gray-800/70 backdrop-blur-sm border border-gray-700 shadow-xl"
          >
            <div className="mb-6 border-b-2 border-blue-500 bor">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3"
              >
                {stageTitles[currentStage]}
              </motion.h2>
            </div>

            {currentStage === 1 && <Stage1 onComplete={handleNextStage} />}
            {currentStage === 2 && <Stage2 onComplete={handleNextStage} />}
            {currentStage === 3 && <Stage3 onComplete={handleRoundCompletion} />}
          </motion.main>
        )}
      </AnimatePresence>
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

export default TreasureHuntRound1;

// Add this CSS to your global styles or in a <style> tag:
/*
@keyframes blinker {
  50% { opacity: 0.2; }
}
*/