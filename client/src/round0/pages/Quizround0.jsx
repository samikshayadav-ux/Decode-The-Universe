import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';

const QuizRound0 = () => {
  const { authData, isLoading: authLoading, isLoggedIn } = useAuth();
  const teamId = authData?.teamId;
  const teamName = authData?.teamName;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  const [lastAnswerStart, setLastAnswerStart] = useState(null);
  const [lastAnswerTime, setLastAnswerTime] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Add debugging info
  useEffect(() => {
    console.log('Auth Debug:', { teamId, teamName });
    setDebugInfo(`TeamID: ${teamId}, TeamName: ${teamName}`);
  }, [teamId, teamName]);

  // Helper function to format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate progress percentage
  const calculateProgress = () => {
    return questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  };

  // Load or initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log(`[Quiz] Initializing for team: ${teamId}`);
        
        // Wait for auth to finish loading
        if (authLoading) {
          return;
        }

        // Check if user is authenticated
        if (!isLoggedIn || !teamId || !teamName) {
          setError('Please log in to access the quiz.');
          setQuizState('error');
          return;
        }

        // Check for persisted timeLeft in sessionStorage (page refresh scenario)
        const persistedTimeLeft = sessionStorage.getItem(`quizTimeLeft_${teamId}`);
        
        // Fetch combined questions and progress from gateway
        try {
          console.log(`[Quiz] Calling gateway for team: ${teamId}`);
          const gatewayData = await callGateway(0);
          
          const questionsData = gatewayData.questions;
          const progressData = gatewayData.progress;
          const totalQuestions = gatewayData.totalQuestions;

          // Verify we got the right team's data
          console.log(`[Quiz] Gateway returned progress for team: ${progressData.teamId}, Current team: ${teamId}`);
          
          if (!questionsData || questionsData.length === 0) {
            setError('No questions found. Please try again later.');
            setQuizState('error');
            return;
          }
          console.log('Questions fetched successfully:', questionsData.length);
          setQuestions(questionsData);
          
          // Check if quiz was completed by checking status from database
          const isCompleted = progressData.status === 'completed';
          
          if (isCompleted) {
            // Show completed quiz results
            setAnswers(progressData.answers || []);
            setScore(progressData.score || 0);
            setLastAnswerTime(progressData.lastAnswerTime);
            setTimeLeft(progressData.timeLeft || 0);  // Set timeLeft from database
            console.log('[Quiz] Quiz already completed. Showing results. TimeLeft from DB:', progressData.timeLeft);
            setQuizState('results');
            return;
          } else {
            // Resume existing or start new quiz
            setCurrentIndex(progressData.currentQuestion || 0);
            setAnswers(progressData.answers || []);
            setScore(progressData.score || 0);
            
            // Use persisted timeLeft if available (page refresh), otherwise use from server
            if (persistedTimeLeft) {
              const restoredTime = parseInt(persistedTimeLeft);
              console.log(`[Quiz] Restored timeLeft from sessionStorage: ${restoredTime}s`);
              setTimeLeft(restoredTime);
            } else {
              console.log(`[Quiz] Using fresh timeLeft from server: ${progressData.timeLeft || 1500}s`);
              setTimeLeft(progressData.timeLeft || 1500);
            }
            
            setLastAnswerTime(progressData.lastAnswerTime);
          }
        } catch (apiError) {
          console.error('Error fetching quiz data:', apiError);
          setError(`Failed to load quiz: ${apiError.message}`);
          setQuizState('error');
          return;
        }
        
        setQuizState('active');
        setLastAnswerStart(Date.now());
        setQuizStartTime(Date.now()); // Set quiz start time
        console.log('Quiz initialized successfully');
        
      } catch (error) {
        console.error('Quiz initialization failed:', error);
        setError(`Initialization failed: ${error.message}`);
        setQuizState('error');
      }
    };

    // Only initialize if auth is loaded and we have the required data
    if (!authLoading && isLoggedIn && teamId && teamName) {
      initializeQuiz();
    } else if (!authLoading && !isLoggedIn) {
      setError('Please log in to access the quiz.');
      setQuizState('error');
    } else {
      console.log('Waiting for auth to load...');
    }
  }, [teamId, teamName, authLoading, isLoggedIn]);

  // Simple timer - just count down every second
  useEffect(() => {
    if (quizState !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Persist timeLeft to sessionStorage so it survives page refresh
        try {
          sessionStorage.setItem(`quizTimeLeft_${teamId}`, newTime.toString());
        } catch (e) {
          console.warn('Could not persist timeLeft to sessionStorage:', e);
        }
        
        if (newTime <= 0) {
          // Time's up - auto submit with 0 timeLeft to indicate auto-submit
          handleSubmit(answers, score, lastAnswerTime, 0);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState]);

  const saveProgress = async () => {
    // Progress is saved automatically when answers are submitted
    // This method is kept for compatibility but doesn't need to do anything
    return;
  };

  // Remove setLastAnswerStart from handleOptionSelect
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    // Do not setLastAnswerStart here!
  };

  // In handleNextQuestion:
  const handleNextQuestion = async () => {
    if (!selectedOption) return;

    // Enforce minimum 1 second
    const answerTime = Math.max(1, Math.floor((Date.now() - lastAnswerStart) / 1000));
    const currentQuestion = questions[currentIndex];
    
    // Note: We don't verify the answer on the frontend to prevent cheating
    // The answer will be verified when we call submitAnswer on the backend

    const newAnswer = {
      question: currentQuestion.question,
      selected: selectedOption,
      timeTaken: answerTime
    };

    const newAnswers = [...answers, newAnswer];
    const newScore = score;

    setAnswers(newAnswers);
    setSelectedOption(null);
    setLastAnswerTime(answerTime);
    setLastSubmissionTime(Date.now());

    if (currentIndex === questions.length - 1) {
      // This is the last question, submit the quiz
      await handleSubmit(newAnswers, newScore, answerTime);
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setLastAnswerStart(Date.now());
      
      // Submit answer to backend with all metrics
      try {
        const response = await submitAnswer(0, teamId, {
          questionId: currentQuestion.id,
          answer: selectedOption,
          timeTaken: answerTime,
          timeLeft  // Send current timeLeft
        });
        
        // Use backend response to sync state
        if (response && response.data && response.data.updatedProgress) {
          const progress = response.data.updatedProgress;
          setScore(progress.score || 0);
          setTimeLeft(progress.timeLeft || timeLeft);
          console.log('Answer submitted and progress synced:', progress);
        }
      } catch (error) {
        console.error('Failed to submit answer:', error);
      }
    }
  };

  const handleSubmit = async (finalAnswers = answers, finalScore = score, lastTime = null, remainingTimeLeft = null) => {
    setQuizState('submitting');
    
    try {
      const maxPossibleScore = questions.length; 
      const finalLastAnswerTime = lastTime || lastAnswerTime;

      // Calculate time spent based on actual elapsed time from start
      let totalTimeSpent = 0;
      if (quizStartTime) {
        totalTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
      } else {
        // Fallback: use timer calculation
        totalTimeSpent = 1500 - timeLeft;
      }

      // Use the passed remainingTimeLeft if provided (from timer auto-submit), otherwise use state
      const finalTimeLeft = remainingTimeLeft !== null ? remainingTimeLeft : timeLeft;

      const timeAtLastSubmission =
        finalTimeLeft === 0 && lastSubmissionTime
          ? Math.floor((lastSubmissionTime - quizStartTime) / 1000)
          : totalTimeSpent;

      // Determine completion type based on actual remaining time
      let completionType = 'manual_submit';
      if (finalTimeLeft <= 0) {
        completionType = 'auto_submit'; // Time ran out
      } else if (finalAnswers.length >= questions.length) {
        completionType = 'full_completion'; // All questions answered
      }

      console.log('[Quiz] Submitting with:', { 
        totalTimeSpent, 
        finalTimeLeft,
        completionType,
        answersCount: finalAnswers.length,
        questionsCount: questions.length
      });

      // For auto-submit, always send totalTime = 1500 (full duration) to backend
      const finalTotalTime = completionType === 'auto_submit' ? 1500 : totalTimeSpent;

      const response = await completeRound(0, teamId, {
        score: finalScore,
        answers: finalAnswers,
        lastAnswerTime: finalLastAnswerTime,
        timeLeft: finalTimeLeft,
        totalTime: finalTotalTime,
        timeAtLastSubmission,
        completionType
      });

      // Use the backend-verified answers and score
      if (response && response.data) {
        const backendData = response.data;
        
        // Update with backend-verified data
        if (backendData.answers) {
          setAnswers(backendData.answers);
        }
        
        if (backendData.score !== undefined) {
          setScore(backendData.score);
        }
      }

      console.log('Quiz submitted successfully');
      setLastAnswerTime(finalLastAnswerTime);
      setQuizState('results');
      
      // Clean up persisted timeLeft from sessionStorage
      try {
        sessionStorage.removeItem(`quizTimeLeft_${teamId}`);
        console.log(`[Quiz] Cleaned up persisted timeLeft for ${teamId}`);
      } catch (e) {
        console.warn('Could not clean up persisted timeLeft:', e);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setError(`Submission failed: ${error.message}`);
      setQuizState('error');
    }
  };

  // Render states
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full mx-auto"
          />
          <p className="text-gray-400 font-medium">Preparing your quiz...</p>
          <p className="text-gray-500 text-sm">{debugInfo}</p>
        </div>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md text-center border border-gray-700">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error || 'Something went wrong'}</p>
          <p className="text-gray-500 text-xs mb-6">{debugInfo}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Retry
            </button>
            <button 
              onClick={() => window.history.back()}
              className="w-full px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'submitting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-12 h-12 bg-blue-500 rounded-full mx-auto flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <p className="text-gray-400 font-medium">Processing your results...</p>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    const allocatedTime = 1500;
    // If timeLeft is 0, use lastSubmissionTime; else use (allocatedTime - timeLeft)
    const totalTimeSpent = allocatedTime - timeLeft;
    // If quiz was auto-submitted (timeLeft === 0), use lastSubmissionTime; else use totalTimeSpent
    const timeAtLastSubmission =
      timeLeft === 0 && lastSubmissionTime
        ? Math.floor((lastSubmissionTime - quizStartTime) / 1000)
        : totalTimeSpent;

    const maxPossibleScore = questions.length;
    const finalScore = Math.min(score, maxPossibleScore);
    const percentage = Math.round((finalScore / maxPossibleScore) * 100);
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const timeForLastQuestion = answers.length > 0 ? answers[answers.length - 1].timeTaken : 0;

    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 font-sans">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Round - Results</h1>
            <p className="text-blue-400 font-medium">Team: {teamName}</p>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-blue-400 font-medium">Total Questions</p>
                <p className="text-2xl font-bold text-white">{questions.length}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-green-400 font-medium">Correct</p>
                <p className="text-2xl font-bold text-white">{correctAnswers}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-blue-400 font-medium">Score</p>
                <p className="text-2xl font-bold text-white">
                  {finalScore}/{maxPossibleScore}
                </p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-purple-400 font-medium">Percentage</p>
                <p className="text-2xl font-bold text-white">{percentage}%</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600 ">
                <p className="text-sm text-orange-400 font-medium">Time at Last Submission</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(timeAtLastSubmission)}
                </p>
              </div>
            </div>

            {/* Additional stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-cyan-400 font-medium">Total Time Spent</p>
                <p className="text-lg font-bold text-white">
                  {formatTime(totalTimeSpent)}
                </p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center border border-gray-600">
                <p className="text-sm text-yellow-400 font-medium">Questions Attempted</p>
                <p className="text-lg font-bold text-white">
                  {answers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Question Review</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {answers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    answer.isCorrect 
                      ? 'border-green-500/30 bg-green-900/10' 
                      : answer.isCorrect === false
                      ? 'border-red-500/30 bg-red-900/10'
                      : 'border-gray-500/30 bg-gray-700/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white flex-1">
                      <span className="text-gray-400 text-sm">Q{index + 1}:</span> {answer.question}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        answer.isCorrect 
                          ? 'bg-green-500/20 text-green-400' 
                          : answer.isCorrect === false
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {answer.isCorrect ? 'Correct' : answer.isCorrect === false ? 'Wrong' : 'Pending'}
                      </div>
                      {index === answers.length - 1 && (
                        <div className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                          Last Answer
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Your answer</p>
                      <p className={`font-medium ${
                        answer.isCorrect ? 'text-green-400' : answer.isCorrect === false ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {answer.answer || answer.selected}
                      </p>
                    </div>
                    {answer.correctAnswer && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Correct answer</p>
                        <p className="font-medium text-green-400">{answer.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-gray-400">Time taken: {answer.timeTaken}s</p>
                    <p className="text-xs text-blue-400">+{answer.isCorrect ? 1 : 0} points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-700 bg-gray-900/50">
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Great job! Your results have been saved automatically.
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="text-gray-400 font-medium">Loading questions...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-2xl">
        {/* Header with timer */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz Round 0</h1>
            <p className="text-gray-400 text-sm">Team: {teamName}</p>
          </div>
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
              {currentQuestion.question}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options?.map((option, i) => (
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
              )) || <p className="text-red-400">No options available</p>}
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