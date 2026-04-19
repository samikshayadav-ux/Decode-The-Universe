import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ScavengerHuntRound3 = () => {
  // Load from session storage or initialize
  const savedState = JSON.parse(sessionStorage.getItem('scavengerHuntState'));
  const [foundClues, setFoundClues] = useState(savedState?.foundClues || []);
  const [remainingClues, setRemainingClues] = useState(savedState?.remainingClues || [...clues]);
  const [currentClue, setCurrentClue] = useState(savedState?.currentClue || null);
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(savedState?.timer || 0);
  const [isRunning, setIsRunning] = useState(true);
  const [clues, setClues] = useState([]);

  useEffect(() => {
  import('/src/round3/pages/Data3.json')
    .then(response => response.json())
    .then(data => setClues(data))
    .catch(error => console.error('Error loading JSON:', error));
}, []);

  

  // Save state to session storage
  useEffect(() => {
    const state = {
      foundClues,
      remainingClues,
      currentClue,
      timer
    };
    sessionStorage.setItem('scavengerHuntState', JSON.stringify(state));
  }, [foundClues, remainingClues, currentClue, timer]);

  const usePreventInspect = () => {
    useEffect(() => {
      // Disable right click
      const handleContextMenu = (e) => {
        e.preventDefault();
      };

      // Disable keyboard shortcuts
      // const handleKeyDown = (e) => {
      //   if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();
      //   if (e.ctrlKey && e.shiftKey && e.key === 'J') e.preventDefault();
      //   if (e.ctrlKey && e.key === 'U') e.preventDefault();
      //   if (e.ctrlKey && e.key === 'u') e.preventDefault();
      //   if (e.key === 'F12') e.preventDefault();
      // };

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);
  };

  // Usage in your component
  //usePreventInspect();

  // Initialize the game
  useEffect(() => {
    if (!currentClue) getNewClue();
    
    const interval = setInterval(() => {
      if (isRunning) {
        setTimer(prevTimer => prevTimer + 0.1);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Format time as MM:SS.s
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toFixed(1).padStart(4, '0');
    return `${mins}:${secs}`;
  };

  const getNewClue = () => {
    if (remainingClues.length === 0) {
      setIsRunning(false);
      setMessage('Congratulations! You found all clues!');
      sessionStorage.removeItem('scavengerHuntState');
      return;
    }

    const randomIndex = Math.floor(Math.random() * remainingClues.length);
    const newClue = remainingClues[randomIndex];
    setCurrentClue(newClue);
  };

  const handleVerify = () => {
    if (!inputCode || !currentClue) return;

    if (inputCode.toUpperCase() === currentClue.code) {
      // Correct code
      const updatedFoundClues = [...foundClues, currentClue];
      const updatedRemainingClues = remainingClues.filter(clue => clue.clue_id !== currentClue.clue_id);
      
      setFoundClues(updatedFoundClues);
      setRemainingClues(updatedRemainingClues);
      setMessage('Correct! Moving to next clue...');
      setInputCode('');
      
      setTimeout(() => {
        setMessage('');
        getNewClue();
      }, 1500);
    } else {
      // Incorrect code
      setMessage('Incorrect code. Try again!');
    }
  };

  const progressPercentage = ((foundClues.length / clues.length) * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center relative mb-12">
          {/* Final Round - Top Center */}
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl font-bold text-indigo-900 bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600"
          >
            FINAL ROUND
          </motion.h2>

          {/* Timer - Top Right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-auto p-4"
          >
            <div className="text-xs font-semibold text-indigo-500 mb-1">TIME ELAPSED</div>
            <div className="text-3xl font-mono font-bold text-indigo-700 tracking-tighter">
              {formatTime(timer)}
            </div>
          </motion.div>
        </div>

        {/* Progress Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-indigo-800">
              {foundClues.length}/{clues.length}
            </span>
            <span className="text-lg font-semibold text-indigo-800">
              {progressPercentage}% Complete
            </span>
          </div>
          <div className="h-3 bg-indigo-200/80 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            />
          </div>
        </motion.div>

        {/* Clue Section */}
        {currentClue && (
          <motion.div
            key={currentClue.clue_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-100/50"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-indigo-900">
                  Clue #{currentClue.clue_id}
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentClue.type === 'image' ? 'Visual Clue' : 'Text Clue'}
                </div>
              </div>
              
              {currentClue.type === 'image' ? (
                <div className="mb-8 space-y-4">
                  <div className="overflow-hidden rounded-xl shadow-lg border border-indigo-100">
                    <img 
                      src={currentClue.image_url} 
                      alt="Clue visual" 
                      className="w-full max-h-80 object-contain mx-auto"
                    />
                  </div>
                  <p className="text-xl text-gray-700 text-center font-medium">
                    {currentClue.clue}
                  </p>
                </div>
              ) : (
                <p className="text-2xl text-gray-700 mb-8 text-center font-medium leading-relaxed">
                  {currentClue.clue}
                </p>
              )}

              <div className="flex flex-col mt-10 md:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="ENTER 8-DIGIT CODE"
                  maxLength="8"
                  className="flex-grow border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 text-center font-mono uppercase text-l tracking-wider shadow-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerify}
                  className="px-8 py-4 bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-300/40 transition-all text-l"
                >
                  VERIFY
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Message Section */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl text-center font-bold text-lg shadow-lg ${
              message.includes('Correct!') ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-red-50 text-red-700 border-2 border-red-200'
            }`}
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ScavengerHuntRound3;