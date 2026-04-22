import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import questionsData from './Data1.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TreasureHuntRound1 = () => {
  const { authData, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizState, setQuizState] = useState('active'); // 'active', 'completed'
  const [score, setScore] = useState(0);

  const [startTime, setStartTime] = useState(Date.now());

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/round1');
      return;
    }

    // Start round on backend when component mounts
    const initializeRound = async () => {
      try {
        await fetch(`${API_URL}/api/quiz/1/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: authData.teamId, duration: 1500 })
        });
      } catch (err) {
        console.error('Error starting round:', err);
      }
    };

    initializeRound();
    setStartTime(Date.now());
  }, [isLoggedIn, navigate, authData.teamId]);

  useEffect(() => {
    if (quizState !== 'active') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuizState('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState]);

  const handleNext = async () => {
    if (!selectedOption) return;

    const currentQuestion = questionsData[currentIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Sync answer with backend
    try {
      const response = await fetch(`${API_URL}/api/quiz/1/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: authData.teamId,
          questionId: currentQuestion.id,
          answer: selectedOption,
          timeTaken: timeTaken,
          timeLeft: timeLeft
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend submission failed:', errorData);
      } else {
        const result = await response.json();
        console.log('Backend submission successful:', result);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }

    // Update local state
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentIndex < questionsData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setStartTime(Date.now());
    } else {
      // Final submission
      console.log('Final question submitted, calling complete...');
      try {
        const response = await fetch(`${API_URL}/api/quiz/1/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: authData.teamId,
            totalTime: 1500 - timeLeft,
            timeLeft: timeLeft,
            completionType: 'manual_submit'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Backend completion failed:', errorData);
        } else {
          console.log('Backend completion successful');
        }
      } catch (err) {
        console.error('Error completing round:', err);
      }
      setQuizState('completed');
    }
  };

  if (quizState === 'completed') {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md border border-gray-800 p-8 rounded-lg bg-black/50 backdrop-blur-sm text-center">
          <h1 className="text-2xl mb-6 tracking-widest text-blue-500">Round Complete</h1>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-500 uppercase text-xs">Team</span>
              <span>{authData?.teamId || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-500 uppercase text-xs">Score</span>
              <span>{score}</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-500 uppercase text-xs">Time Remaining</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors font-mono"
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questionsData[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Techie Header */}
      <div className="border-b border-gray-800 py-7 p-4 md:px-12 flex justify-between items-center bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="text-lg uppercase tracking-[0.4em] text-gray-400">
            ROUND 1
          </div>
        </div>
        
        <div className="text-center border-x border-gray-800 px-8">
          <div className="text-2xl md:text-3xl font-black tracking-tighter flex items-baseline gap-2">
            {formatTime(timeLeft)}
          </div>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-gray-900">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]"
          style={{ width: `${((currentIndex + 1) / questionsData.length) * 100}%` }}
        />
      </div>

      {/* Progress Text */}
      <div className="px-4 md:px-12 py-2 flex justify-between items-center mt-3 bg-black/30">
        <div className="text-sm text-gray-500 tracking-widest uppercase">
          Progress: {currentIndex + 1} / {questionsData.length}
        </div>
        <div className="text-sm text-blue-500 tracking-widest font-bold">
          {Math.round(((currentIndex + 1) / questionsData.length) * 100)}%
        </div>
      </div>

      {/* Quiz Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                Question_{ (currentIndex+1).toString().padStart(2, '0') }
              </span>
              <div className="h-[1px] flex-1 bg-gray-800" />
            </div>
            
            <div className="bg-gray-950/50 border border-gray-800 p-8 rounded-lg mb-8">
              <h2 className="text-lg md:text-xl text-center leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(option)}
                  className={`p-4 text-left border transition-all text-xs uppercase tracking-widest ${
                    selectedOption === option
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                      : 'border-gray-800 bg-black hover:border-gray-600 text-gray-400'
                  }`}
                >
                  <span className="mr-3 text-gray-600">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`w-full py-4 rounded border font-mono tracking-widest transition-all ${
                selectedOption
                  ? 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black'
                  : 'border-gray-800 text-gray-700 cursor-not-allowed'
              }`}
            >
              {currentIndex === questionsData.length - 1 ? 'SUBMIT' : 'Next'}
            </button>
          </div>
        </div>
      </main>

    </div>
  );
};

export default TreasureHuntRound1;