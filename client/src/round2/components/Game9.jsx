import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MurderMystery = ({ onComplete }) => {
  const [password, setPassword] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Correct password for the mystery
  const CORRECT_PASSWORD = "SHADOW_IN_THE_RAIN"; // Example password

  useEffect(() => {
    // Block Inspect and Shortcuts for localhost testing (matching other games)
    const handleContextMenu = (e) => {
      if (window.location.hostname === 'localhost') return;
      e.preventDefault();
    };
    const handleKeyDown = (e) => {
      if (window.location.hostname === 'localhost') return;
      if (e.keyCode === 123 || (e.ctrlKey && (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) || e.keyCode === 85))) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedInput = password.trim().toUpperCase();
    
    if (normalizedInput === CORRECT_PASSWORD) {
      setIsCorrect(true);
      setError(null);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setError("Incorrect password. The evidence suggests otherwise...");
      setTimeout(() => setError(null), 3000);
    }
  };

  const clues = [
    { type: 'pdf', title: 'Crime Scene', url: '/clues/The Murder Mystery.pdf' },
    { type: 'pdf', title: 'Circumstantial Evidence', url: '/clues/Who is the Murderer.pdf' },
    { type: 'audio', title: 'Witness Interview', url: '/clues/witness_audio.mp3' },
    { type: 'audio', title: 'Phone Call Recording', url: '/clues/phone_call.mp3' }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 text-center">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2 block">Stage 9: Investigation</span>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Murder Mystery</h2>
          <div className="h-1 w-20 bg-red-600 mx-auto mt-4" />
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clues Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Case Evidence</h3>
              <div className="grid grid-cols-1 gap-3">
                {clues.map((clue, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.06] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${clue.type === 'pdf' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {clue.type === 'pdf' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-bold text-white/80">{clue.title}</span>
                    </div>
                    <a 
                      href={clue.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Section */}
            <div className="flex flex-col justify-center space-y-6 bg-white/[0.01] p-8 rounded-2xl border border-white/5">
              <div className="text-center">
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  Connect the dots to find the sequence.
                </p>
                <h4 className="text-lg font-bold text-white mb-2 tracking-tight">What is the password?</h4>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-6 py-4 bg-black/40 border-b-2 transition-all duration-300 outline-none text-xl font-bold placeholder:text-white/10 text-center uppercase tracking-widest ${
                      isCorrect ? 'border-emerald-500 text-emerald-400' : 
                      error ? 'border-red-500 text-red-400' : 'border-white/10 focus:border-red-500 text-white'
                    }`}
                    placeholder="ENTER CODE..."
                    autoFocus
                    disabled={isCorrect}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {error}
                    </motion.div>
                  )}
                  {isCorrect && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-emerald-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Case Solved. Moving to final debrief...
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isCorrect || !password.trim()}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-white/5 disabled:text-white/20 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-95"
                >
                  Confirm Evidence
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MurderMystery;