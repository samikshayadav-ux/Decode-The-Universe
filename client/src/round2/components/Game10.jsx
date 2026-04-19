import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Game10 = ({ onComplete }) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const CORRECT_KEY = 'OMEGA_POINT';

  const handleSubmit = () => {
    if (input.toUpperCase() === CORRECT_KEY) {
      setFeedback('ACCESS_GRANTED');
      setTimeout(() => onComplete(CORRECT_KEY), 1500);
    } else {
      setFeedback('INVALID_KEY');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <div className="text-center mb-12">
        <p className="text-xs opacity-50 uppercase tracking-widest mb-2">Final_Gatekeeper</p>
        <h2 className="text-6xl font-black italic">ULTIMATE_BARRIER</h2>
      </div>

      <div className="border-4 border-white p-12 bg-white/5 max-w-md w-full">
        <p className="mb-8 text-sm opacity-70">
          THE FINAL BARRIER REQUIRES THE ULTIMATE KEY. <br />
          HINT: THE END IS THE OMEGA.
        </p>
        
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="ENTER_FINAL_KEY_"
          className="w-full bg-transparent border-b-4 border-white py-4 text-3xl font-black focus:outline-none mb-8"
        />

        <button 
          onClick={handleSubmit}
          className="w-full bg-white text-black py-4 font-black text-2xl hover:bg-black hover:text-white border-2 border-white transition-all"
        >
          BREAK_BARRIER →
        </button>

        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 p-4 text-center font-black text-xl ${feedback === 'ACCESS_GRANTED' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
          >
            {feedback}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Game10;