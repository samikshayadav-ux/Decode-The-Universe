import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Game6HiddenKey = ({ onComplete = () => {} }) => {
  const SECRET_KEY = "WIKI42";
  const ARTICLE_URL = "/wiki-article.html";
  
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const openArticle = () => {
    window.open(ARTICLE_URL, "_blank", "noopener,noreferrer");
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const guess = value.trim().toUpperCase();
    
    if (!guess) {
      setFeedback("Please enter the key you found");
      triggerShake();
      setIsSubmitting(false);
      return;
    }
    
    if (guess === SECRET_KEY) {
      setFeedback("Correct! Unlocking next stage...");
      setSuccess(true);
      setTimeout(() => {
        onComplete(SECRET_KEY);
        setIsSubmitting(false);
      }, 1500);
    } else {
      setFeedback("That's not the correct key. Try again!");
      triggerShake();
      setIsSubmitting(false);
      if (window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          Find the Hidden Key
        </h1>
        <p className="text-gray-400 mb-6">
          Open the article below and find the secret key
        </p>

        <div className="mb-6">
          <motion.button 
            onClick={openArticle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 border-2 border-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
            </svg>
            Open Article
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              placeholder="Enter the hidden key here"
              className={`w-full px-4 py-3 text-center border-2 rounded-lg focus:outline-none bg-gray-700 text-white ${
                success 
                  ? "border-green-500" 
                  : feedback.includes("❌") 
                    ? "border-red-500" 
                    : "border-gray-600 focus:border-blue-500"
              }`}
              autoFocus
              disabled={isSubmitting || success}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {feedback && (
              <motion.p
                key={feedback}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`text-center text-sm font-medium ${
                  success ? "text-green-400" : "text-red-400"
                }`}
              >
                {feedback}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isSubmitting || success}
            whileHover={!isSubmitting && !success ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && !success ? { scale: 0.98 } : {}}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
              success
                ? "bg-green-600 text-white cursor-default"
                : isSubmitting
                  ? "bg-green-600 text-white cursor-wait"
                  : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : success ? (
              "✓ Verified"
            ) : (
              "Submit Key"
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="mt-6 text-center text-blue-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <motion.p 
                className="mt-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Moving to the next challenge...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Game6HiddenKey;