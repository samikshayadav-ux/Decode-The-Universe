import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import questions from '../pages/Data1.json';
import { submitAnswer } from '../../utils/quizApi';

const Stage1 = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [colorHex, setColorHex] = useState('#ff0000');
  const [lastInputTime, setLastInputTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Continuous validation and auto-submit
  useEffect(() => {
    const interval = setInterval(() => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const normalizedAnswer = userAnswer.trim().toLowerCase();
      const isAnswerValid = currentQuestion.answer.some(ans => 
        normalizedAnswer.includes(ans.toLowerCase())
      );

      if (isAnswerValid && !isCorrect) {
        setIsCorrect(true);
        
        // Call submitAnswer API for this question (auto-submit on next question)
        const submitCurrentAnswer = async () => {
          try {
            setIsSubmitting(true);
            setError(null);
            
            const timeTaken = Date.now() - lastInputTime;
            const teamId = sessionStorage.getItem('authInfo') 
              ? JSON.parse(sessionStorage.getItem('authInfo')).teamId 
              : null;
            
            if (!teamId) {
              throw new Error('Team ID not found');
            }
            
            await submitAnswer(1, teamId, {
              questionId: currentQuestion.id,
              answer: userAnswer.trim(),
              timeTaken
            });
            
            console.log('[Stage1] Answer submitted:', {
              questionId: currentQuestion.id,
              correct: true,
              timeTaken
            });
          } catch (err) {
            console.error('[Stage1] Error submitting answer:', err);
            setError(err.message);
          } finally {
            setIsSubmitting(false);
          }
        };
        
        submitCurrentAnswer();
        
        // Move to next question after brief delay
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setUserAnswer('');
            setIsCorrect(false);
            setError(null);
            // Refresh color for next color question
            if (questions[currentQuestionIndex + 1]?.type === 'color') {
              questions[currentQuestionIndex + 1].refreshColor();
            }
          } else {
            onComplete();
          }
        }, 300); // Short delay for smooth transition
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [currentQuestionIndex, userAnswer, isCorrect, lastInputTime]);

  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
    setLastInputTime(Date.now());
  };

  const refreshColor = () => {
    const colorQuestion = questions.find(q => q.type === 'color');
    if (colorQuestion) {
      colorQuestion.refreshColor();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-8">
          {currentQuestion.question}
        </h2>
        
        {/* Image display */}
        {currentQuestion.img && (
          <div className="mb-4 flex justify-center">
            <img 
              src={currentQuestion.img} 
              alt="Visual clue" 
              className="max-h-64 object-contain"
            />
          </div>
        )}

        {/* Code block display */}
        {currentQuestion.code && (
          <div className="mb-4 p-3 bg-gray-900 rounded font-mono text-green-400 overflow-x-auto">
            {currentQuestion.code}
          </div>
        )}

        {/* Foreign text display */}
        {currentQuestion.text && (
          <div className="mb-4 text-3xl text-center">
            {currentQuestion.text}
          </div>
        )}

        {/* Properties display */}
        {currentQuestion.properties && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
            {currentQuestion.properties.map((prop, index) => (
              <div key={index} className="flex mb-2 last:mb-0">
                <span className="w-1/3 text-gray-300">{prop.label}:</span>
                <span className="w-2/3 font-medium">{prop.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats display */}
        {currentQuestion.stats && (
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            {currentQuestion.stats.map((stat, index) => (
              <div key={index} className="bg-gray-700 p-2 rounded">
                <div className="text-xs text-gray-400">{stat.label}</div>
                <div className="font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Details display */}
        {currentQuestion.details && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            {currentQuestion.details.map((detail, index) => (
              <div key={index} className="text-gray-300">{detail}</div>
            ))}
          </div>
        )}

        {/* Paragraph display */}
        {currentQuestion.type === 'paragraph' && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg text-white leading-relaxed whitespace-pre-line max-h-[400px] overflow-y-auto">
            {currentQuestion.passage}
          </div>
        )}

      </div>

      <div className="mb-4">
        <input
          type="text"
          value={userAnswer}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your answer..."
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {isCorrect && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-green-400"
        >
          {isSubmitting ? '📤 Submitting...' : '✓ Correct! Moving to next question...'}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Stage1;
