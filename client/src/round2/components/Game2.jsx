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
          const authInfo = sessionStorage.getItem('authInfo');
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header/Question */}
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Task {currentQuestionIndex + 1}
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          
          <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Content Area */}
        <div className="p-10 space-y-8">
          {/* Image display */}
          {currentQuestion.img && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={currentQuestion.img}
                alt="Visual clue"
                className="relative w-full max-h-[300px] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          )}

          {/* Code block display */}
          {currentQuestion.code && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative p-6 bg-black/40 rounded-xl border border-white/10 font-mono text-sm text-blue-300 overflow-x-auto leading-relaxed">
                <div className="flex gap-2 mb-4 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                {currentQuestion.code}
              </div>
            </div>
          )}

          {/* Foreign text display */}
          {currentQuestion.text && (
            <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-white/5">
              <span className="text-6xl font-black text-white/90 tracking-tighter italic">
                {currentQuestion.text}
              </span>
            </div>
          )}

          {/* Properties display */}
          {currentQuestion.properties && (
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.properties.map((prop, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{prop.label}</span>
                  <span className="text-sm font-black text-blue-400">{prop.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats display */}
          {currentQuestion.stats && (
            <div className="grid grid-cols-3 gap-4">
              {currentQuestion.stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</span>
                  <span className="text-xl font-black text-white tracking-tighter">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Paragraph display */}
          {currentQuestion.type === 'paragraph' && (
            <div className="relative group p-6 bg-white/[0.02] rounded-2xl border border-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
              <p className="text-white/70 leading-relaxed text-sm whitespace-pre-line font-medium italic">
                {currentQuestion.passage}
              </p>
            </div>
          )}
        </div>

        {/* Footer/Input */}
        <div className="p-10 bg-black/20 border-t border-white/5">
          <div className="relative">
            <input
              type="text"
              value={userAnswer}
              onChange={handleInputChange}
              className={`w-full px-8 py-6 bg-white/[0.03] border-2 rounded-2xl text-xl font-bold transition-all duration-300 outline-none placeholder:text-white/10 ${
                isCorrect 
                  ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-400' 
                  : error 
                  ? 'border-red-500/50 text-red-400' 
                  : 'border-white/5 focus:border-blue-500/50 focus:bg-white/[0.05] text-white'
              }`}
              placeholder="Input response sequence..."
              autoFocus
              disabled={isSubmitting}
            />
            
            {/* Input Status Icons */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              {isSubmitting && (
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              )}
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest px-4"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                System Alert: {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};


export default Game2;
