import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PUZZLE = [
  [1, 0, 0, 4],
  [0, 4, 0, 0],
  [0, 0, 4, 0],
  [0, 3, 0, 1],
];

const SOLUTION = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const Game2 = ({ onComplete }) => {
  const [grid, setGrid] = useState(PUZZLE.map((r) => [...r]));
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (r, c, value) => {
    if (PUZZLE[r][c] !== 0 || isSubmitting) return;
    const n = parseInt(value, 10);
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = !isNaN(n) && n >= 1 && n <= 4 ? n : 0;
    setGrid(newGrid);
    setFeedback(null);
  };

  const checkSolution = () => {
    const ok = SOLUTION.every((row, r) =>
      row.every((val, c) => grid[r][c] === val)
    );

    if (ok) {
      setIsSubmitting(true);
      setFeedback({ type: 'success', text: 'SEQUENCE_VERIFIED' });
      setTimeout(() => {
        onComplete('SUDOKU_4X4_BYPASS');
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: 'PARITY_ERROR_DETECTED' });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <div className="mb-12 text-center">
        <p className="text-sm opacity-50 uppercase tracking-widest mb-1">Matrix_Alignment</p>
        <h2 className="text-4xl font-black italic uppercase">Logic_Array_v2</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-white/10 p-4 border-2 border-white">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isClue = PUZZLE[r][c] !== 0;
            return (
              <motion.input
                key={`${r}-${c}`}
                value={cell === 0 ? "" : cell}
                onChange={(e) => handleChange(r, c, e.target.value)}
                maxLength={1}
                disabled={isClue || isSubmitting}
                className={`w-16 h-16 text-center text-3xl font-black border-2 transition-all ${
                  isClue 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent border-white/30 focus:border-white text-white focus:bg-white/10'
                }`}
                inputMode="numeric"
                whileFocus={{ scale: 1.05 }}
              />
            );
          })
        )}
      </div>

      <div className="mt-12 flex gap-4 w-full max-w-xs">
        <button
          onClick={checkSolution}
          disabled={isSubmitting}
          className="flex-1 border-2 border-white py-3 font-black text-xl hover:bg-white hover:text-black transition-colors disabled:opacity-30"
        >
          {isSubmitting ? 'SYNC...' : 'VALIDATE'}
        </button>
        <button
          onClick={() => { setGrid(PUZZLE.map((r) => [...r])); setFeedback(null); }}
          disabled={isSubmitting}
          className="px-6 border-2 border-white/30 py-3 font-black text-xl hover:border-white transition-colors disabled:opacity-30"
        >
          RESET
        </button>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-8 px-8 py-3 border-l-8 font-black text-xl ${
              feedback.type === 'success' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'
            }`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game2;
