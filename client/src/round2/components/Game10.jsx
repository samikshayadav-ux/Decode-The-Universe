import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const allTasks = [
  { description: "Solve the riddle: What has keys but no locks?", code: "PIANO" },
  { description: "Calculate 15 × 24", code: "360" },
  { description: "Name a 5-letter word starting with B", code: "BEACH" },
  { description: "What is the capital of France?", code: "PARIS" },
  { description: "List three primary colors", code: "RGB" },
  { description: "What is 2^10?", code: "1024" },
  { description: "Name a planet in our solar system", code: "EARTH" },
  { description: "How many continents are there?", code: "7" },
  { description: "What is the square root of 144?", code: "12" },
  { description: "Name the largest ocean", code: "PACIFIC" },
  { description: "What year did World War II end?", code: "1945" },
  { description: "How many sides does a hexagon have?", code: "6" },
  { description: "What is the chemical symbol for gold?", code: "AU" },
  { description: "Name a programming language", code: "PYTHON" },
  { description: "What is 50% of 200?", code: "100" },
  { description: "Name the first month of the year", code: "JANUARY" },
  { description: "How many hours are in a day?", code: "24" },
  { description: "What is the capital of Japan?", code: "TOKYO" },
  { description: "Name a mammal that flies", code: "BAT" },
  { description: "What is 9 × 9?", code: "81" },
  { description: "How many minutes in an hour?", code: "60" },
  { description: "Name a color that starts with P", code: "PURPLE" },
  { description: "What is the opposite of hot?", code: "COLD" },
  { description: "How many wheels does a bicycle have?", code: "2" },
  { description: "Name the largest planet in our solar system", code: "JUPITER" }
];

export default function Game10({ onComplete }) {
  const [allGameTasks, setAllGameTasks] = useState([]);
  const [completionCodes, setCompletionCodes] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [allCompleted, setAllCompleted] = useState(false);

  const totalTasks = 8; // Total tasks for the team to share

  useEffect(() => {
    // Randomly shuffle all tasks and select 8
    const shuffled = [...allTasks].sort(() => 0.5 - Math.random());
    const selectedForGame = shuffled.slice(0, totalTasks);
    setAllGameTasks(selectedForGame);
    
    // Initialize state for each task
    setCompletionCodes(Array(totalTasks).fill(""));
    setCompletedCount(0);
    setFeedback({});
  }, []);

  useEffect(() => {
    const newProgress = Math.round((completedCount / totalTasks) * 100);
    setProgress(newProgress);
    
    if (completedCount === totalTasks && !allCompleted) {
      setAllCompleted(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
  }, [completedCount, allCompleted, onComplete]);

  const handleCodeChange = (index, value) => {
    const newCodes = [...completionCodes];
    newCodes[index] = value;
    setCompletionCodes(newCodes);
    
    if (feedback[index]) {
      const newFeedback = { ...feedback };
      delete newFeedback[index];
      setFeedback(newFeedback);
    }
  };

  const handleSubmit = (index) => {
    const userCode = completionCodes[index].toUpperCase().trim();
    const correctCode = allGameTasks[index].code.toUpperCase();
    
    if (userCode === correctCode) {
      setFeedback({
        ...feedback,
        [index]: { type: 'success', message: 'Task Verified!' }
      });
      setCompletedCount(prev => prev + 1);
    } else {
      setFeedback({
        ...feedback,
        [index]: { type: 'error', message: 'Invalid Sequence.' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3 block">Final Objective</span>
          <h1 className="text-5xl font-black text-white mb-10 tracking-tighter uppercase italic">
            Team Decryption
          </h1>
          
          {/* Progress Bar */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Team Progress</span>
              <span className="text-blue-500 font-mono text-sm font-black">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {allCompleted && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
              <div className="inline-block bg-blue-600/20 border border-blue-500/30 text-blue-400 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest animate-pulse">
                System Restored • Finalizing Round 2
              </div>
            </motion.div>
          )}
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-6xl mx-auto">
          {allGameTasks.map((task, index) => {
            const isTaskDone = feedback[index]?.type === 'success';
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between gap-4 p-5 rounded-xl border transition-all duration-500 ${
                  isTaskDone 
                    ? 'bg-blue-600/5 border-blue-500/20 opacity-60' 
                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                }`}
              >
                {/* Left: Task ID & Description */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg border font-mono text-[10px] font-black shrink-0 ${
                    isTaskDone ? 'bg-blue-500/20 border-blue-500/30 text-blue-500' : 'bg-white/5 border-white/10 text-white/30'
                  }`}>
                    {index + 1}
                  </div>
                  <p className={`text-xs font-bold leading-relaxed ${isTaskDone ? 'text-blue-200/40 line-through' : 'text-white/80'}`}>
                    {task.description}
                  </p>
                </div>

                {/* Right: Input & Action */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <motion.div 
                    animate={feedback[index]?.type === 'error' ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      placeholder="CODE"
                      value={completionCodes[index]}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      disabled={isTaskDone}
                      className={`w-24 px-3 py-2 bg-black/60 border rounded-lg transition-all duration-300 outline-none text-[10px] font-black placeholder:text-white/5 uppercase tracking-[0.2em] text-center ${
                        isTaskDone 
                          ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' 
                          : feedback[index]?.type === 'error'
                          ? 'border-red-500/50 text-red-400 bg-red-500/10'
                          : 'border-white/10 focus:border-blue-500/50 text-white focus:bg-blue-500/5'
                      }`}
                    />
                  </motion.div>
                  
                  {!isTaskDone ? (
                    <button
                      onClick={() => handleSubmit(index)}
                      disabled={!completionCodes[index].trim()}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-0 text-white rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)]" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
