import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Game5 = ({ onComplete }) => {
  const correctPIN = "5382";
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hints = [
    "NO_DIGITS_1_OR_6",
    "FIRST_DIGIT_IS_PRIME",
    "SECOND_DIGIT_IS_3",
    "SUM_OF_LAST_TWO_DIGITS_IS_10",
    "THIRD_DIGIT_IS_EVEN_>_4"
  ];

  const handleGuess = () => {
    if (guess.length !== 4) return;
    if (guess === correctPIN) {
      setIsSubmitting(true);
      setFeedback({ type: 'success', text: 'ACCESS_GRANTED' });
      setTimeout(() => onComplete(guess), 1500);
    } else {
      setFeedback({ type: 'error', text: 'INVALID_CREDENTIALS' });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <div className="text-center mb-12">
        <p className="text-xs opacity-50 uppercase tracking-widest mb-2">Security_Override</p>
        <h2 className="text-5xl font-black italic">PIN_DECODER_v4</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-4xl">
        <div className="border-2 border-white p-8">
          <h3 className="text-xl font-black mb-6 border-b-2 border-white pb-2 uppercase">Hint_Stream</h3>
          <div className="space-y-4">
            {hints.map((hint, i) => (
              <div key={i} className="flex gap-4 opacity-70">
                <span className="font-black">[{i + 1}]</span>
                <span className="text-sm">{hint}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-4 border-white p-8 space-y-8">
          <h3 className="text-xl font-black uppercase italic">Input_Interface</h3>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            maxLength={4}
            placeholder="____"
            disabled={isSubmitting}
            className="w-full bg-transparent border-b-4 border-white py-4 text-6xl text-center font-black focus:outline-none placeholder:opacity-20"
          />
          <button
            onClick={handleGuess}
            disabled={guess.length !== 4 || isSubmitting}
            className="w-full bg-white text-black py-4 text-3xl font-black hover:bg-black hover:text-white border-2 border-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'VERIFYING...' : 'AUTHORIZE →'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-12 px-8 py-3 font-black text-2xl ${feedback.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game5;