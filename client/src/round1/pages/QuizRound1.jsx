import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { callGateway, submitAnswer, completeRound } from '../../utils/quizApi';
import { useNavigate } from 'react-router-dom';

const QuizRound1 = () => {
  const { authData, isLoading: authLoading, isLoggedIn, refreshTeamProgress } = useAuth();
  const teamId = authData?.teamId;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  const [lastStart, setLastStart] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      if (!isLoggedIn || !teamId) return setQuizState('error');
      try {
        const { questions: q, progress: p } = await callGateway(1);
        setQuestions(q);
        setCurrentIndex(p.currentQuestion || 0);
        setTimeLeft(p.timeLeft || 1500);
        setQuizState(p.status === 'completed' ? 'results' : 'active');
        setLastStart(Date.now());
        setStartTime(Date.now());
      } catch (e) { setQuizState('error'); }
    };
    init();
  }, [authLoading, isLoggedIn, teamId]);

  useEffect(() => {
    if (quizState !== 'active') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); finish(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [quizState]);

  const submit = async () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitAnswer(1, teamId, {
        questionId: questions[currentIndex].id,
        answer: selectedOption,
        timeTaken: Math.max(1, Math.floor((Date.now() - lastStart) / 1000)),
        timeLeft
      });
      if (currentIndex === questions.length - 1) {
        finish(false);
      } else {
        setCurrentIndex(v => v + 1);
        setSelectedOption(null);
        setLastStart(Date.now());
        setIsSubmitting(false);
      }
    } catch (e) { setIsSubmitting(false); }
  };

  const finish = async (auto = false) => {
    setQuizState('submitting');
    try {
      await completeRound(1, teamId, {
        timeLeft: auto ? 0 : timeLeft,
        totalTime: Math.floor((Date.now() - startTime) / 1000)
      });
      await refreshTeamProgress();
      setQuizState('results');
    } catch (e) { setQuizState('error'); }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && selectedOption && !isSubmitting) submit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedOption, isSubmitting]);

  if (quizState === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center font-mono uppercase tracking-[0.5em] text-[10px] opacity-40">Initializing...</div>;
  if (quizState === 'error') return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono text-[10px] uppercase tracking-widest">System Error</div>;

  if (quizState === 'results') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-20" />
      <div className="z-10 text-center space-y-12">
        <h1 className="text-6xl font-black italic tracking-tighter uppercase">Phase 01 Complete</h1>
        <button onClick={() => navigate('/round2')} className="neo-button">Proceed to Phase 02</button>
      </div>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-10" />
      
      {/* Top Navigation / Progress */}
      <div className="z-20 border-b border-white/10 backdrop-blur-md">
        <div className="flex justify-between items-center p-6 md:px-12">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Phase_01 // Quiz_Node</div>
          <div className="flex items-center gap-6">
             <div className="text-[10px] font-mono font-black tracking-widest text-accent tabular-nums bg-white/5 px-4 py-1 rounded-full border border-white/5">
                TIME_REMAINING: {formatTime(timeLeft)}
             </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5 relative overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full bg-accent"
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center z-10 p-6 md:p-12">
        <div className="w-full max-w-3xl space-y-12">
          
          {/* Tech Question Container */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 opacity-20">
              <div className="text-[8px] font-black uppercase tracking-widest">QUERY_BUFFER_{ (currentIndex+1).toString().padStart(2, '0') }</div>
              <div className="h-px flex-1 bg-white/40" />
              <div className="text-[8px] font-black uppercase tracking-widest">SEQ_TRANS_{ (currentIndex+1)*234 }</div>
            </div>

            <div className="minimal-box p-8 md:p-12 border-white/20 bg-white/[0.02]">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-relaxed text-center">
                {q?.question}
              </h2>
            </div>
            
            <div className="flex justify-between px-2">
               <div className="text-[8px] font-black uppercase tracking-widest opacity-20">EST_ACCURACY: 98.4%</div>
               <div className="text-[8px] font-black uppercase tracking-widest opacity-20">PKT_LOSS: 0.00%</div>
            </div>
          </div>

          {/* Options Vertical */}
          <div className="flex flex-col gap-2">
            {q?.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={`text-left px-8 py-5 border border-white/5 text-xs font-black uppercase tracking-widest transition-all ${
                  selectedOption === opt 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/[0.02] hover:bg-white/5 opacity-50 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center">
                   <span>{opt}</span>
                   {selectedOption === opt && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </button>
            ))}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={submit}
              disabled={!selectedOption || isSubmitting}
              className={`neo-button w-full md:w-80 ${(!selectedOption || isSubmitting) ? 'opacity-20 grayscale' : ''}`}
            >
              {isSubmitting ? 'SYNCING...' : 'CONFIRM_SELECTION'}
            </button>
            <div className="text-[7px] font-black uppercase tracking-[0.3em] opacity-20">Press [Enter] to transmit data</div>
          </div>
        </div>
      </main>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-8 opacity-5">
         <div className="text-[8px] font-black vertical-text uppercase tracking-widest">INTERSTELLAR_COMM</div>
         <div className="w-px h-24 bg-white/40 mx-auto" />
      </div>
    </div>
  );
};

export default QuizRound1;
