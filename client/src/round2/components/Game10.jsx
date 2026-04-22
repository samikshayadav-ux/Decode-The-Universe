import React from 'react'

const Game10 = ({ onComplete }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-xl border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">Final Challenge</h2>
      <p className="text-slate-300 mb-8 text-center">
        You have reached the end of Round 2. Click the button below to finish!
      </p>
      <button
        onClick={() => onComplete && onComplete()}
        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all transform hover:scale-105"
      >
        FINISH ROUND 2
      </button>
    </div>
  )
}

export default Game10