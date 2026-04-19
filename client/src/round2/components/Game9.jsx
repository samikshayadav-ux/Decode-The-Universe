import React, { useState, useEffect } from "react";

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

export default function TeamTasks() {
  const [gameStarted, setGameStarted] = useState(false);
  const [teamSize, setTeamSize] = useState(null);
  const [allGameTasks, setAllGameTasks] = useState([]);
  const [currentTasks, setCurrentTasks] = useState([]);
  const [completionCodes, setCompletionCodes] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [taskQueue, setTaskQueue] = useState([]);
  const [cardCompletedTasks, setCardCompletedTasks] = useState([]); // Track tasks completed per card
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [allCompleted, setAllCompleted] = useState(false);
  const [showNextGame, setShowNextGame] = useState(false);

  const totalTasks = teamSize === 3 ? 6 : 8;

  useEffect(() => {
    if (teamSize) {
      // Randomly shuffle all tasks and select the required amount
      const shuffled = [...allTasks].sort(() => 0.5 - Math.random());
      const selectedForGame = shuffled.slice(0, totalTasks);
      setAllGameTasks(selectedForGame);
      
      // Set initial tasks (first 3 or 4)
      const initialTasks = selectedForGame.slice(0, teamSize);
      setCurrentTasks(initialTasks);
      
      // Set remaining tasks in queue
      const remaining = selectedForGame.slice(teamSize);
      setTaskQueue(remaining);
      
      // Initialize other states
      setCompletionCodes(Array(teamSize).fill(""));
      setCardCompletedTasks(Array(teamSize).fill(0)); // Track completed tasks per card
      setCompletedCount(0);
      setFeedback({});
    }
  }, [teamSize, totalTasks]);

  useEffect(() => {
    const newProgress = Math.round((completedCount / totalTasks) * 100);
    setProgress(newProgress);
    
    if (completedCount === totalTasks && !allCompleted) {
      setAllCompleted(true);
      // Auto redirect to next game after 2 seconds
      setTimeout(() => {
        setShowNextGame(true);
      }, 2000);
    }
  }, [completedCount, totalTasks, allCompleted]);

  const handleStart = (size) => {
    setTeamSize(size);
    setGameStarted(true);
  };

  const handleCodeChange = (index, value) => {
    const newCodes = [...completionCodes];
    newCodes[index] = value;
    setCompletionCodes(newCodes);
    
    // Clear feedback when typing
    if (feedback[index]) {
      const newFeedback = { ...feedback };
      delete newFeedback[index];
      setFeedback(newFeedback);
    }
  };

  const handleSubmit = (index) => {
    const userCode = completionCodes[index].toUpperCase().trim();
    const correctCode = currentTasks[index].code.toUpperCase();
    
    if (userCode === correctCode) {
      // Show success feedback briefly
      setFeedback({
        ...feedback,
        [index]: { type: 'success', message: 'Correct! Loading next task...' }
      });
      
      // Increment completed count and card completed tasks
      setCompletedCount(prev => prev + 1);
      const newCardCompletedTasks = [...cardCompletedTasks];
      newCardCompletedTasks[index] += 1;
      setCardCompletedTasks(newCardCompletedTasks);
      
      // Clear the input
      const newCodes = [...completionCodes];
      newCodes[index] = "";
      setCompletionCodes(newCodes);
      
      // Replace completed task with new one from queue after a short delay
      setTimeout(() => {
        // Check if this card has completed 2 tasks or no more tasks in queue
        if (newCardCompletedTasks[index] >= 2 || taskQueue.length === 0) {
          // Mark this card as fully completed
          const newCurrentTasks = [...currentTasks];
          newCurrentTasks[index] = null;
          setCurrentTasks(newCurrentTasks);
          
          const newFeedback = { ...feedback };
          delete newFeedback[index];
          setFeedback(newFeedback);
        } else {
          // Give new task from queue
          const newCurrentTasks = [...currentTasks];
          newCurrentTasks[index] = taskQueue[0];
          setCurrentTasks(newCurrentTasks);
          
          const newQueue = taskQueue.slice(1);
          setTaskQueue(newQueue);
          
          // Clear feedback for the new task
          const newFeedback = { ...feedback };
          delete newFeedback[index];
          setFeedback(newFeedback);
        }
      }, 1000);
      
    } else {
      setFeedback({
        ...feedback,
        [index]: { type: 'error', message: 'Incorrect code. Try again!' }
      });
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setTeamSize(null);
    setAllGameTasks([]);
    setCurrentTasks([]);
    setCompletionCodes([]);
    setCompletedCount(0);
    setTaskQueue([]);
    setProgress(0);
    setFeedback({});
    setAllCompleted(false);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="animate-fade-in">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700">
              <h2 className="text-xl text-slate-300 mb-6">
                How many team members?
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => handleStart(3)}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  3 Members
                </button>
                <button
                  onClick={() => handleStart(4)}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  4 Members
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-14 tracking-wider">
            
          </h1>
          
          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Progress</span>
              <span className="text-slate-300 font-semibold">{progress}% Complete</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {allCompleted && (
            <div className="animate-bounce mb-4">
              <div className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold">
                🎉 All Tasks Completed! 🎉
              </div>
            </div>
          )}
        </div>

        {/* Tasks Grid */}
        <div className={`grid gap-6 mb-8 ${
          teamSize === 3 
            ? 'md:grid-cols-3 lg:grid-cols-3' 
            : 'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {currentTasks.map((task, index) => (
            task ? (
              <div
                key={`${task.code}-${index}`}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-500 hover:transform hover:scale-105 animate-fade-in"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    PLAYER {index + 1}
                  </h3>
                </div>

                <p className="text-slate-300 mb-6 min-h-[120px] leading-relaxed">
                  {task.description}
                </p>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter completion code"
                    value={completionCodes[index]}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  
                  {feedback[index] && (
                    <div className={`p-3 rounded-lg text-sm font-medium animate-fade-in ${
                      feedback[index].type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {feedback[index].message}
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleSubmit(index)}
                    disabled={!completionCodes[index].trim() || feedback[index]?.type === 'success'}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={`completed-${index}`}
                className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/30 transition-all duration-500"
              >
                <div className="text-center py-8">
                  <div className="animate-bounce mb-4">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <p className="text-emerald-400 font-semibold text-lg">
                    Slot {index + 1} Complete!
                  </p>
                  <p className="text-emerald-300 text-sm mt-2">
                    All tasks finished
                  </p>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="text-slate-400">
            <p>Complete all {totalTasks} tasks to finish the game</p>
            <p className="text-sm mt-1">Tasks remaining in queue: {taskQueue.length}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-once {
          from { transform: rotate(0deg) scale(0.5); }
          to { transform: rotate(360deg) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-spin-once {
          animation: spin-once 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}