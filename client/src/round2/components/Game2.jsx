import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import questions from '../pages/Data2.json';
import { submitAnswer } from '../../utils/quizApi';


const Game2 = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [lastInputTime, setLastInputTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);


  // Reactive validation and auto-submit
  useEffect(() => {
    // Block Inspect and Shortcuts
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (e.ctrlKey && (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reactive validation and auto-submit
  useEffect(() => {
    const validateAndSubmit = async () => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion || isCorrect || isSubmitting) return;

      const normalizedAnswer = userAnswer.trim().toLowerCase();
      
      // Check if any of the valid answers are contained within or match the user's input
      const isAnswerValid = Array.isArray(currentQuestion.answer) 
        ? currentQuestion.answer.some(ans => normalizedAnswer === ans.toLowerCase())
        : normalizedAnswer === currentQuestion.answer.toLowerCase();

      if (isAnswerValid) {
        setIsCorrect(true);
        
        try {
          setIsSubmitting(true);
          setError(null);
          
          const timeTaken = Date.now() - lastInputTime;
          const authInfo = localStorage.getItem('authInfo');
          const teamId = authInfo ? JSON.parse(authInfo).teamId : null;
          
          if (!teamId) {
            throw new Error('Team ID not found');
          }
          
          await submitAnswer(2, teamId, {
            questionId: currentQuestion.id,
            answer: userAnswer.trim(),
            timeTaken
          });
          
          console.log('[Game2] Answer submitted:', {
            questionId: currentQuestion.id,
            correct: true,
            timeTaken
          });

          // Move to next question after brief delay
          setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
              setUserAnswer('');
              setIsCorrect(false);
              setError(null);
              setIsSubmitting(false);
              setLastInputTime(Date.now());
            } else {
              onComplete();
            }
          }, 300);
        } catch (err) {
          console.error('[Game2] Error submitting answer:', err);
          setError(err.message);
          setIsCorrect(false); // Reset correct state so user can retry
          setIsSubmitting(false);
        }
      }
    };

    validateAndSubmit();
  }, [userAnswer, currentQuestionIndex, isCorrect, isSubmitting, lastInputTime, onComplete]);


  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
    setLastInputTime(Date.now());
  };


  const currentQuestion = questions[currentQuestionIndex];


  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl overflow-hidden"
      >
        {/* Header/Question */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
              TASK {currentQuestionIndex + 1}
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Content Area */}
        {(currentQuestion.img || currentQuestion.code || currentQuestion.text || currentQuestion.properties || currentQuestion.stats || currentQuestion.type === 'paragraph') && (
          <div className="px-6 py-6 space-y-8">
            {/* Image display */}
            {currentQuestion.img && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <img
                  src={currentQuestion.img}
                  alt="Visual clue"
                  className="w-full max-h-[300px] object-contain rounded-xl border border-white/5 shadow-2xl"
                />
              </motion.div>
            )}

            {/* Code block display */}
            {currentQuestion.code && (
              <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 font-mono text-sm text-blue-400/80 overflow-x-auto scrollbar-hide leading-relaxed">
                {currentQuestion.code}
              </div>
            )}

            {/* Foreign text display */}
            {currentQuestion.text && (
              <div className="py-4 text-center">
                <span className="text-6xl font-black text-white/90 tracking-tighter italic">
                  {currentQuestion.text}
                </span>
              </div>
            )}

            {/* Properties display */}
            {currentQuestion.properties && (
              <div className="grid grid-cols-1 gap-2">
                {currentQuestion.properties.map((prop, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{prop.label}</span>
                    <span className="text-sm font-bold text-blue-500">{prop.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats display */}
            {currentQuestion.stats && (
              <div className="grid grid-cols-3 gap-6">
                {currentQuestion.stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className="text-xl font-black text-white tracking-tighter">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Paragraph display */}
            {currentQuestion.type === 'paragraph' && (
              <div className="p-6 max-h-[200px] overflow-y-auto scrollbar-hide border-l-2 border-white/10">
                <p className="text-white/50 leading-relaxed text-sm whitespace-pre-line italic pl-6">
                  {currentQuestion.passage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer/Input */}
        <div className={`px-6 pb-10 ${!(currentQuestion.img || currentQuestion.code || currentQuestion.text || currentQuestion.properties || currentQuestion.stats || currentQuestion.type === 'paragraph') ? 'pt-2' : 'pt-4'}`}>
          <div className="relative">
            <input
              type="text"
              value={userAnswer}
              onChange={handleInputChange}
              className={`w-full px-2 py-4 bg-transparent border-b-2 transition-all duration-300 outline-none text-2xl font-bold placeholder:text-white/5 ${
                isCorrect 
                  ? 'border-emerald-500/50 text-emerald-400' 
                  : error 
                  ? 'border-red-500/50 text-red-400' 
                  : 'border-white/10 focus:border-blue-500 text-white'
              }`}
              placeholder="Type your response..."
              autoFocus
              disabled={isSubmitting}
            />
            
            {/* Input Status Icons */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {isCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-red-500 text-[10px] font-bold uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};


export default Game2;
