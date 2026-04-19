import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { getProgress, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

const TreasureHuntRound3 = () => {
  const { authData, isLoading: authLoading, isLoggedIn, refreshTeamProgress } = useAuth();
  const teamId = authData?.teamId;
  const teamName = authData?.teamName;
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('loading');
  const [clues, setClues] = useState([]);
  const [foundClueIds, setFoundClueIds] = useState([]);
  const [currentClue, setCurrentClue] = useState(null);
  const [timer, setTimer] = useState(0);
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Final Round
  useEffect(() => {
    const initialize = async () => {
      try {
        if (authLoading) return;
        if (!isLoggedIn || !teamId) {
          setError('AUTH_REQUIRED');
          setGameState('error');
          return;
        }

        // Load clues and progress
        const data3 = await import('./Data3.json');
        const allClueData = data3.default || data3;
        setClues(allClueData);

        const progress = await getProgress(3, teamId);
        const resolvedFoundIds = progress.clueIds || [];
        setFoundClueIds(resolvedFoundIds);
        setTimer(progress.timerSeconds || 0);

        if (resolvedFoundIds.length === allClueData.length) {
          setGameState('completed');
        } else {
          // Find or select current clue
          const currentId = progress.currentClueId;
          let clue = allClueData.find(c => c.clue_id === currentId);
          
          if (!clue) {
            const remaining = allClueData.filter(c => !resolvedFoundIds.includes(c.clue_id));
            clue = remaining[Math.floor(Math.random() * remaining.length)];
            // Update current clue on backend
            await submitAnswer(3, teamId, {
              currentClueId: clue.clue_id,
              foundClueIds: resolvedFoundIds,
              timerSeconds: progress.timerSeconds || 0
            });
          }
          
          setCurrentClue(clue);
          setGameState('active');
        }
      } catch (err) {
        console.error('Final Round Init Error:', err);
        setError(err.message);
        setGameState('error');
      }
    };

    if (!authLoading) initialize();
  }, [authLoading, isLoggedIn, teamId]);

  // Timer
  useEffect(() => {
    if (gameState !== 'active') return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleVerify = async () => {
    if (!inputCode.trim() || isSubmitting) return;
    setIsSubmitting(true);

    if (inputCode.trim().toUpperCase() === currentClue.code.toUpperCase()) {
      const newFoundIds = [...foundClueIds, currentClue.clue_id];
      setFeedback({ isCorrect: true });
      
      try {
        if (newFoundIds.length === clues.length) {
          await completeRound(3, teamId, {
            foundClueIds: newFoundIds,
            timerSeconds: timer,
            status: 'completed'
          });
          await refreshTeamProgress();
          setTimeout(() => {
            setGameState('completed');
          }, 1500);
        } else {
          const remaining = clues.filter(c => !newFoundIds.includes(c.clue_id));
          const nextClue = remaining[Math.floor(Math.random() * remaining.length)];
          
          await submitAnswer(3, teamId, {
            foundClueIds: newFoundIds,
            currentClueId: nextClue.clue_id,
            timerSeconds: timer
          });

          setTimeout(() => {
            setFoundClueIds(newFoundIds);
            setCurrentClue(nextClue);
            setFeedback(null);
            setInputCode('');
            setIsSubmitting(false);
          }, 1500);
        }
      } catch (err) {
        setError('SYNC_ERROR');
        setIsSubmitting(false);
      }
    } else {
      setFeedback({ isCorrect: false });
      setTimeout(() => {
        setFeedback(null);
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono uppercase">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          Establishing_Final_Uplink...
        </motion.div>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono overflow-hidden relative">
        {/* Confetti Particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              top: '-10%', 
              left: `${Math.random() * 100}%`,
              scale: Math.random() * 0.5 + 0.5,
              rotate: 0 
            }}
            animate={{ 
              top: '110%', 
              rotate: 360,
              left: `${Math.random() * 100}%` 
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute w-4 h-4 bg-white z-0"
          />
        ))}

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center z-10 border-8 border-white p-12 bg-black"
        >
          <h1 className="text-8xl md:text-[12rem] font-black leading-none mb-8 italic">CONGRATULATIONS</h1>
          <p className="text-4xl font-black mb-12">UNIVERSE_DECODED // MISSION_COMPLETE</p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-12">
            <div className="border-4 border-white p-8">
              <p className="text-xl opacity-50 mb-2">TEAM_NAME</p>
              <p className="text-5xl font-black uppercase text-white">{teamName}</p>
            </div>
            <div className="border-4 border-white p-8">
              <p className="text-xl opacity-50 mb-2">FINAL_TIME</p>
              <p className="text-5xl font-black">{formatTime(timer)}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="border-4 border-white px-12 py-6 text-4xl font-black hover:bg-white hover:text-black transition-colors"
          >
            RETURN_TO_BASE
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black flex flex-col">
      {/* Header / Timer */}
      <div className="bg-white text-black p-4 flex justify-between items-center px-12">
        <h1 className="text-3xl font-black italic uppercase">Final_Phase</h1>
        <div className="text-5xl font-black tabular-nums">{formatTime(timer)}</div>
      </div>

      <main className="flex-1 p-8 md:p-16 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-7xl font-black italic uppercase leading-none">The_Last_Clue</h2>
            <p className="text-xl opacity-70">OBJECTIVE: SECURE_THE_FINAL_KEY</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-50 mb-2 tracking-tighter uppercase">Global_Progress</div>
            <div className="h-4 w-64 bg-white/20 border border-white">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(foundClueIds.length / clues.length) * 100}%` }}
                className="h-full bg-white"
              />
            </div>
            <p className="mt-2 font-black">{foundClueIds.length}/{clues.length} CLUES_FOUND</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Clue Card */}
          <div className="lg:col-span-3 border-4 border-white p-12 relative">
            <div className="absolute top-0 right-0 bg-white text-black px-6 py-2 font-black text-xl uppercase">
              {currentClue?.type || 'Digital'}
            </div>
            <div className="opacity-20 text-xs mb-8 tracking-[0.5em] uppercase">Encrypted_Metadata_Stream</div>
            
            <div className="min-h-[300px] flex flex-col justify-center">
              {currentClue?.type === 'image' ? (
                <div className="space-y-8">
                  <img src={currentClue.image_url} alt="Field Intelligence" className="w-full border-4 border-white grayscale" />
                  <p className="text-3xl font-medium leading-relaxed italic border-l-8 border-white pl-8">
                    {currentClue.clue}
                  </p>
                </div>
              ) : (
                <p className="text-5xl font-black leading-[1.1] italic">
                  "{currentClue?.clue}"
                </p>
              )}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`mt-12 p-6 border-l-[16px] ${feedback.isCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}
                >
                  <p className={`text-4xl font-black ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {feedback.isCorrect ? '✓ ACCESS_GRANTED' : '✗ ACCESS_DENIED'}
                  </p>
                  <p className="mt-2 opacity-70">
                    {feedback.isCorrect ? 'SYNCHRONIZING_LOCATION_DATA...' : 'INVALID_AUTHENTICATION_KEY_DETECTED'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interaction area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="border-4 border-white p-8">
              <h3 className="text-2xl font-black mb-6 uppercase">Input_Final_Key</h3>
              <input 
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                disabled={isSubmitting || feedback}
                placeholder="ENTERCODE_"
                className="w-full bg-transparent border-b-4 border-white text-6xl font-black py-4 mb-8 focus:outline-none placeholder:opacity-20"
              />
              <button 
                onClick={handleVerify}
                disabled={!inputCode.trim() || isSubmitting || feedback}
                className="w-full bg-white text-black py-8 text-4xl font-black uppercase hover:bg-black hover:text-white border-4 border-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'VERIFYING...' : 'AUTHORIZE →'}
              </button>
            </div>

            <div className="border-2 border-white/30 p-6">
              <h4 className="text-xs opacity-50 mb-4 tracking-widest uppercase">System_Logs</h4>
              <div className="space-y-2 text-sm">
                <p className="text-green-500">[0.00s] SYSTEM_STABLE</p>
                <p>[0.02s] CHANNEL_SECURE</p>
                {foundClueIds.map((id, idx) => (
                  <p key={idx} className="opacity-50 text-xs">
                    [{(idx + 1) * 0.4}s] CLUE_#{id}_VERIFIED
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default TreasureHuntRound3;