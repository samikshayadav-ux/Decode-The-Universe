import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TypingChallenge = ({ onComplete }) => {
  const paragraph = "The quick brown fox jumps over the lazy dog. This classic pangram contains all the letters of the English alphabet. Typing exercises like this help improve your keyboard skills, speed, and accuracy. Focus on hitting each key correctly without looking at your hands. The more you practice, the faster and more accurate you'll become. Remember to maintain good posture while typing to prevent fatigue.";
  
  const [typed, setTyped] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    // Prevent copy-paste
    if (e.ctrlKey && (e.key === "v" || e.key === "c" || e.key === "x")) {
      e.preventDefault();
      triggerShake();
    }
  };

  const triggerShake = () => {
    if (containerRef.current) {
      containerRef.current.classList.add("shake");
      setTimeout(() => {
        containerRef.current.classList.remove("shake");
      }, 500);
    }
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const nextChar = paragraph[typed.length];

    // If correct character typed
    if (value[value.length - 1] === nextChar) {
      setTyped(value);
    } else if (value.length > typed.length) {
      // If wrong, don't allow moving forward
      e.target.value = typed;
      setMistakes(mistakes + 1);
      triggerShake();
      return;
    }

    // If paragraph completed
    if (value === paragraph) {
      setCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const calculateAccuracy = () => {
    if (typed.length === 0) return 100;
    const correctChars = typed.split("").filter((char, idx) => char === paragraph[idx]).length;
    return Math.round((correctChars / typed.length) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 transition-all duration-300"
      >
        <div className="p-8">
          <motion.h2 
            className="text-3xl font-bold text-white mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Typing Challenge
          </motion.h2>

          <div className="flex justify-between mb-4 text-gray-400 text-sm">
            <span>Accuracy: {calculateAccuracy()}%</span>
            <span>Mistakes: {mistakes}</span>
            <span>Progress: {Math.round((typed.length / paragraph.length) * 100)}%</span>
          </div>

          <motion.div 
            className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700 relative"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-300 text-xl leading-relaxed tracking-wide">
              {paragraph.split("").map((char, idx) => (
                <span 
                  key={idx} 
                  className={idx < typed.length ? "text-green-400" : "text-gray-500"}
                >
                  {char}
                </span>
              ))}
            </p>
            
            <div className="absolute bottom-2 right-4 text-xs text-gray-500">
              {paragraph.length - typed.length} characters remaining
            </div>
          </motion.div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="typing-input" className="text-gray-400 text-sm">
                Type the text above:
              </label>
              <span className="text-xs text-gray-500">
                {typed.length}/{paragraph.length}
              </span>
            </div>
            
            <motion.textarea
              id="typing-input"
              ref={inputRef}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              value={typed}
              disabled={completed}
              style={{ caretColor: "#3b82f6" }} // Blue caret
            />
          </div>

          <AnimatePresence>
            {completed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-500 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400 font-medium">Challenge completed!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-900 bg-opacity-50 p-4 border-t border-gray-700">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(typed.length / paragraph.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </motion.div>
  );
};

export default TypingChallenge;