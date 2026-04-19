import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../AuthContext';

// TODO: This test file needs to be updated to use backend APIs instead of Supabase
// Use /api/quiz/progress and /api/questions endpoints

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuizRound0 = () => {
  const { teamId, teamName } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  const [lastAnswerStart, setLastAnswerStart] = useState(null);

  // Load or initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        // TODO: Replace with backend API call
        // const response = await fetch(`${API_URL}/api/quiz/progress?teamId=${teamId}`);
        // const data = await response.json();
        
        // For now, initialize with empty state
        const qs = []; // TODO: Fetch from /api/questions
        setQuestions(qs);
      } catch (error) {
        console.error('Error initializing quiz:', error);
      }
      setQuizState('active');
      setLastAnswerStart(Date.now());
    };

    initializeQuiz();
  }, [teamId, teamName]);

  // Timer and auto-save
  useEffect(() => {
    if (quizState !== 'active') return;

    const timer = setInterval(async () => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleSubmit();
          return 0;
        }
        return newTime;
      });

      // Auto-save every 30 seconds
      if (timeLeft % 30 === 0) {
        await saveProgress();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const saveProgress = async () => {
    // TODO: Replace with backend API call
    // await fetch(`${API_URL}/api/quiz/progress`, {
    //   method: 'PUT',
    //   body: JSON.stringify({
    //     teamId, currentQuestion: currentIndex, score, answers, timeLeft
    //   })
    // });
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setLastAnswerStart(Date.now());
  };

  const handleNextQuestion = async () => {
    if (!selectedOption) return;

    const answerTime = Math.floor((Date.now() - lastAnswerStart) / 1000);
    const isCorrect = questions[currentIndex].answer === selectedOption;

    const newAnswers = [
      ...answers,
      {
        question: questions[currentIndex].question,
        selected: selectedOption,
        isCorrect,
        timeTaken: answerTime
      }
    ];

    setAnswers(newAnswers);
    setScore(prev => isCorrect ? prev + 2 : prev);
    setSelectedOption(null);

    if (currentIndex === questions.length - 1) {
      await handleSubmit();
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setLastAnswerStart(Date.now());
      // TODO: Replace with backend API call
      // await fetch(`${API_URL}/api/quiz/progress`, {
      //   method: 'PUT',
      //   body: JSON.stringify({...})
      // });
    }
  };

  const handleSubmit = async () => {
    const finalScore = Math.min(score, questions.length * 2);
    const percentage = Math.min(Math.round((finalScore / (questions.length * 2)) * 100), 100);
    const lastAnswerTime = answers.length > 0 ? answers[answers.length - 1].timeTaken : 0;

    // TODO: Replace with backend API call
    // await fetch(`${API_URL}/api/quiz/submit`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     teamId, score: finalScore, answers, completedAt: new Date()
    //   })
    // });

    setQuizState('results');
  };

  if (quizState === 'results') {
      const maxPossibleScore = questions.length * 2;
      const finalScore = Math.min(score, maxPossibleScore);
      const percentage = Math.min(Math.round((finalScore / maxPossibleScore) * 100), 100);
      const timeTaken = lastAnswerTime ? Math.floor((new Date() - lastAnswerTime) / 1000) : 0;
  
      return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 font-sans">
          <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-2xl font-semibold text-white">Quiz Results</h1>
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                  <p className="text-sm text-blue-400 font-medium">Questions</p>
                  <p className="text-2xl font-bold text-white">{questions.length}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                  <p className="text-sm text-blue-400 font-medium">Score</p>
                  <p className="text-2xl font-bold text-white">
                    {finalScore}/{maxPossibleScore}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                  <p className="text-sm text-blue-400 font-medium">Percentage</p>
                  <p className="text-2xl font-bold text-white">{percentage}%</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                  <p className="text-sm text-blue-400 font-medium">Time Taken</p>
                  <p className="text-2xl font-bold text-white">{timeTaken}s</p>
                </div>
              </div>
            </div>
  
            <div className="p-6 space-y-4">
                      {answers.map((answer, index) => (
                      <motion.div
                          key={`${answer.id}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border ${
                          answer.isCorrect 
                              ? 'border-green-500/30 bg-green-900/10' 
                              : 'border-red-500/30 bg-red-900/10'
                          }`}
                      >
                          <h3 className="font-medium text-white mb-2">
                          Question {index+1}: {answer.question}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                              <p className="text-xs text-gray-400 mb-1">Your answer</p>
                              <p className={`font-medium ${
                              answer.isCorrect ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {answer.selected}
                              </p>
                          </div>
                          {!answer.isCorrect && (
                              <div>
                              <p className="text-xs text-gray-400 mb-1">Correct answer</p>
                              <p className="font-medium text-green-400">{answer.correctAnswer}</p>
                              </div>
                          )}
                            </div>
                          </motion.div>
                        ))}
                   </div>
               </div>
           </div>
      );
    }
  
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center py-12 px-4 font-sans">
          <div className="w-full max-w-2xl">
            {/* Header with timer */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-white">Technical Quiz</h1>
              <div className="flex items-center space-x-3 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="text-xl font-mono font-bold text-blue-400">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
    
            {/* Progress bar */}
            <div className="mb-8">
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(calculateProgress())}% complete</span>
              </div>
            </div>
    
            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700"
              >
                <h2 className="text-xl font-semibold text-white mb-6">
                  {questions[currentIndex].question}
                </h2>
    
                <div className="space-y-4">
                  {questions[currentIndex].options.map((option, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedOption === option
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-700 text-gray-200'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
    
            {/* Navigation */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNextQuestion}
                disabled={!selectedOption}
                className={`px-8 py-3 rounded-lg font-bold text-lg ${
                  selectedOption
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/30'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
              </motion.button>
            </div>
          </div>
        </div>
      );
};

export default QuizRound0;