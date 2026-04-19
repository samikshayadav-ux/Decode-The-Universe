import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

const QuizRound1 = () => {
  const { authData, isLoading: authLoading, isLoggedIn, refreshTeamProgress } = useAuth();
  const teamId = authData?.teamId;
  const teamName = authData?.teamName;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  const [lastAnswerStart, setLastAnswerStart] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, correctAnswer: string }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const TOTAL_TIME = 1500;

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        if (authLoading) return;
        if (!isLoggedIn || !teamId) {
          setError('Authentication required. Please log in.');
          setQuizState('error');
          return;
        }

        const gatewayData = await callGateway(1);
        const { questions: questionsData, progress } = gatewayData;

        if (!questionsData || questionsData.length === 0) {
          setError('No questions found for this round.');
          setQuizState('error');
          return;
        }

        setQuestions(questionsData);
        setAnswers(progress.answers || []);
        setScore(progress.score || 0);
        setCurrentIndex(progress.currentQuestion || 0);
        
        // Persisted time logic
        const persistedTime = sessionStorage.getItem(`quizTimeLeft_r1_${teamId}`);
        if (persistedTime) {
          setTimeLeft(parseInt(persistedTime));
        } else {
          setTimeLeft(progress.timeLeft || TOTAL_TIME);
        }

        if (progress.status === 'completed') {
          setQuizState('results');
        } else {
          setQuizState('active');
          setLastAnswerStart(Date.now());
          setQuizStartTime(Date.now());
        }
      } catch (err) {
        console.error('Failed to initialize quiz:', err);
        setError(err.message || 'Failed to load quiz data.');
        setQuizState('error');
      }
    };

    if (!authLoading) initializeQuiz();
  }, [authLoading, isLoggedIn, teamId]);

  // Timer logic
  useEffect(() => {
    if (quizState !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        sessionStorage.setItem(`quizTimeLeft_r1_${teamId}`, next.toString());
        
        if (next <= 0) {
          clearInterval(timer);
          handleQuizCompletion(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, teamId]);

  const handleOptionSelect = (option) => {
    if (feedback || isSubmitting) return;
    setSelectedOption(option);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedOption || feedback || isSubmitting) return;

    setIsSubmitting(true);
    const answerTime = Math.max(1, Math.floor((Date.now() - lastAnswerStart) / 1000));
    const currentQuestion = questions[currentIndex];

    try {
      const response = await submitAnswer(1, teamId, {
        questionId: currentQuestion.id,
        answer: selectedOption,
        timeTaken: answerTime,
        timeLeft
      });

      const { isCorrect, correctAnswer, updatedProgress } = response.data;
      
      // Set feedback for brutalist UI
      setFeedback({ isCorrect, correctAnswer });
      
      // Update score with animation
      if (isCorrect) {
        setScore(updatedProgress.score);
      }

      // Wait a bit for the user to see feedback
      setTimeout(async () => {
        setFeedback(null);
        setSelectedOption(null);
        setIsSubmitting(false);

        if (currentIndex === questions.length - 1) {
          handleQuizCompletion(false);
        } else {
          setCurrentIndex(prev => prev + 1);
          setLastAnswerStart(Date.now());
        }
      }, 2000);

    } catch (err) {
      console.error('Answer submission failed:', err);
      setError('Failed to submit answer. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleQuizCompletion = async (isAutoSubmit = false) => {
    setQuizState('submitting');
    try {
      const totalTimeSpent = Math.floor((Date.now() - (quizStartTime || Date.now())) / 1000);
      
      await completeRound(1, teamId, {
        score,
        answers,
        timeLeft: isAutoSubmit ? 0 : timeLeft,
        totalTime: isAutoSubmit ? TOTAL_TIME : totalTimeSpent,
        completionType: isAutoSubmit ? 'auto_submit' : 'full_completion'
      });

      sessionStorage.removeItem(`quizTimeLeft_r1_${teamId}`);
      
      // Refresh progress to unlock next round
      await refreshTeamProgress();
      
      setQuizState('results');
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Completion failed:', err);
      setError('Failed to finalize quiz results.');
      setQuizState('error');
    }
  };

  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }} 
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-2xl"
        >
          INITIALIZING_ROUND_1...
        </motion.div>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
        <div className="border-2 border-white p-8 max-w-md w-full">
          <h2 className="text-2xl mb-4 text-red-500">SYSTEM_ERROR</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full border-2 border-white py-2 hover:bg-white hover:text-black transition-colors"
          >
            RETRY_BOOT
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-mono">
        <div className="max-w-4xl mx-auto">
          <header className="border-b-2 border-white pb-4 mb-8">
            <h1 className="text-4xl font-black">ROUND_1_COMPLETE</h1>
            <p className="text-xl">TEAM: {teamName?.toUpperCase()}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="border-2 border-white p-6">
              <p className="text-sm border-b border-white/30 mb-2">FINAL_SCORE</p>
              <p className="text-5xl font-black">{score}/{questions.length}</p>
            </div>
            <div className="border-2 border-white p-6">
              <p className="text-sm border-b border-white/30 mb-2">ACCURACY</p>
              <p className="text-5xl font-black">{Math.round((score / questions.length) * 100)}%</p>
            </div>
            <div className="border-2 border-white p-6">
              <p className="text-sm border-b border-white/30 mb-2">TIME_REMAINING</p>
              <p className="text-5xl font-black">{formatTime(timeLeft)}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/round2')}
            className="border-2 border-white px-8 py-4 text-xl font-black hover:bg-white hover:text-black transition-colors"
          >
            PROCEED_TO_ROUND_2 →
          </button>
        </div>

        {showCompletionModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="border-4 border-white bg-black p-10 max-w-lg w-full text-center"
            >
              <h2 className="text-5xl font-black mb-4">ROUND COMPLETE!</h2>
              <p className="text-xl mb-8">Data synchronized. Your team has unlocked Round 2.</p>
              <button 
                onClick={() => navigate('/round2')}
                className="w-full border-2 border-white py-4 text-2xl font-black hover:bg-white hover:text-black transition-colors"
              >
                PROCEED TO ROUND 2
              </button>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Fixed Timer Bar */}
      <div className="fixed top-0 left-0 w-full h-12 bg-black border-b-2 border-white z-40 flex items-center">
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
          className={`h-full ${timeLeft < 60 ? 'bg-red-600' : 'bg-white'}`}
          transition={{ ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <span className="font-black mix-blend-difference">TIME_REMAINING: {formatTime(timeLeft)}</span>
          <span className="font-black mix-blend-difference">PHASE_1 // TRANSMISSION</span>
        </div>
      </div>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-6xl font-black italic uppercase leading-none">Decode</h1>
            <p className="text-xl opacity-70">QUESTION_{currentIndex + 1}_OF_{questions.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-50 mb-1 tracking-tighter">LIVE_SCORE</p>
            <motion.div 
              key={score}
              initial={{ scale: 1.5, color: '#fff' }}
              animate={{ scale: 1, color: '#fff' }}
              className="text-6xl font-black leading-none"
            >
              {score.toString().padStart(2, '0')}
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Question Column */}
          <div className="border-2 border-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-white text-black px-4 py-1 font-black">
              #{currentIndex + 1}
            </div>
            <div className="mb-8 opacity-30 text-xs">COMMUNICATION_INBOUND_ENCRYPTED</div>
            <h2 className="text-3xl font-black leading-tight mb-12">
              {currentQuestion?.question}
            </h2>
            
            {/* Inline Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-l-8 p-4 bg-white/5 ${feedback.isCorrect ? 'border-green-500' : 'border-red-500'}`}
                >
                  <p className={`text-2xl font-black ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {feedback.isCorrect ? '✓ CORRECT' : `✗ INCORRECT`}
                  </p>
                  {!feedback.isCorrect && (
                    <p className="mt-2 text-sm">THE CORRECT KEY WAS: <span className="bg-white text-black px-2">{feedback.correctAnswer}</span></p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Answer Column */}
          <div className="space-y-4">
            {currentQuestion?.options.map((option, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={feedback || isSubmitting}
                className={`w-full text-left p-6 border-2 border-white text-xl font-black transition-all relative group overflow-hidden ${
                  selectedOption === option ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                } ${feedback || isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                whileHover={{ x: feedback ? 0 : 10 }}
                whileTap={{ scale: feedback ? 1 : 0.98 }}
              >
                <div className="flex items-center justify-between relative z-10">
                  <span>{option}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </motion.button>
            ))}

            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedOption || feedback || isSubmitting}
              className={`w-full border-4 border-white py-6 text-3xl font-black mt-8 transition-colors ${
                selectedOption && !feedback && !isSubmitting 
                  ? 'bg-white text-black hover:bg-black hover:text-white' 
                  : 'opacity-20 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'PROCESSING...' : 'SUBMIT_KEY'}
            </button>
          </div>
        </div>
      </main>

      {/* Decorative Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default QuizRound1;
