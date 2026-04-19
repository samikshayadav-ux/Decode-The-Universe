import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Game5 = ({ onComplete }) => {
  const correctPIN = "5382";
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const hints = [
    "No digits 1 or 6",
    "First digit is prime",
    "Second digit is 3",
    "Sum of last two digits is 10",
    "Third digit is even > 4"
  ];

  const handleGuess = () => {
    if (guess.length !== 4) {
      setMessage("Enter a 4-digit number");
      triggerShake();
      return;
    }

    if (guess === correctPIN) {
      setSuccess(true);
      setMessage("Access granted");
      setTimeout(() => onComplete(), 1500);
    } else {
      setMessage("Incorrect PIN");
      triggerShake();
      window.navigator.vibrate?.(200);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleGuess();
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setGuess(val.slice(0, 4));
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Secure Access</h1>
        <p className="text-gray-400 mb-6">Enter the 4-digit PIN</p>

        <div className="mb-8 space-y-3">
          {hints.map((hint, i) => (
            <div key={i} className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-blue-400">{i + 1}.</div>
              <p className="ml-2 text-sm text-gray-300">{hint}</p>
            </div>
          ))}
        </div>

        <motion.div
          animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <input
            type="text"
            value={guess}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            maxLength={4}
            placeholder="____"
            className={`w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 bg-gray-700 text-white ${
              success 
                ? "border-green-500 bg-gray-700" 
                : message.includes("Incorrect") 
                  ? "border-red-500 bg-gray-700" 
                  : "border-gray-600 focus:border-blue-500 focus:ring-blue-900"
            }`}
          />
        </motion.div>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-sm font-medium mb-4 ${
                success ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleGuess}
          disabled={success}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            success
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {success ? "✓ Verified" : "Submit"}
        </button>
      </motion.div>
    </div>
  );
};

export default Game5;