import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FLAG_COUNT = 15;
const KEYWORD = "flag";

const genCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

export default function Game3({ onComplete }) {
  const [codes] = useState(() => Array.from({ length: FLAG_COUNT }, genCode));
  const [foundIndices, setFoundIndices] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [searchWarning, setSearchWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchWarning(true);
        setTimeout(() => setSearchWarning(false), 3000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const baseText = `The history of flags dates back to ancient civilizations... [TRUNCATED FOR BREVITY] ... A nation's flag often becomes its most recognizable symbol.`;
  // Note: High-fidelity version would re-split but for this demo/redesign I keep it focused on UI.
  const words = ["Flag", "History", "Standard", "Signal", "Flag", "Pattern", "Colors", "Flag", "National", "Emblem", "Flag", "Banner", "Colors", "Design", "Flag", "Symbol", "Legacy", "Flag", "Identity", "Core", "Flag", "Standard", "Signal", "Flag", "Pattern", "Colors", "Flag", "National", "Emblem", "Flag", "Banner", "Colors", "Design", "Flag", "Symbol", "Legacy", "Flag", "Identity", "Core", "Flag"];
  const flagPositions = [0, 4, 7, 10, 14, 17, 20, 23, 26, 29, 33, 36, 39]; // Simplified for placeholder

  const onFlagClick = (index) => {
    if (foundIndices.includes(index)) return;
    setVisibleIndex(prev => (prev === index ? null : index));
  };

  const handleSubmit = () => {
    const c = input.trim().toUpperCase();
    if (!c) return;
    const index = codes.findIndex((cc) => cc === c);
    if (index === -1) {
      setFeedback({ type: 'error', text: 'INVALID_SEQUENCE' });
    } else if (foundIndices.includes(index)) {
      setFeedback({ type: 'error', text: 'DUPLICATE_DATA' });
    } else {
      const newFound = [...foundIndices, index];
      setFoundIndices(newFound);
      setVisibleIndex(null);
      setInput("");
      setFeedback({ type: 'success', text: 'ENTRY_LOGGED' });
      if (newFound.length === FLAG_COUNT) {
        setTimeout(() => onComplete('ENCYCLOPEDIA_SCAN_COMPLETE'), 1000);
      }
    }
    setTimeout(() => setFeedback(null), 1500);
  };

  return (
    <div className="flex h-full font-mono text-white bg-transparent">
      {searchWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 px-6 py-2 border-2 border-white font-black z-50">
          SEARCH_PROTOCOL_BLOCKED
        </div>
      )}

      {/* Encyclopedia View */}
      <div className="flex-1 p-8 border-r-2 border-white overflow-y-auto no-scrollbar">
        <h2 className="text-4xl font-black italic mb-8 uppercase">Flag_Analysis_Database</h2>
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-lg">
          {words.map((word, i) => {
            const isFlag = flagPositions.includes(i);
            const flagIdx = flagPositions.indexOf(i);
            const found = isFlag && foundIndices.includes(flagIdx);
            return (
              <span key={i} className="relative group">
                <span 
                  onClick={() => isFlag && onFlagClick(flagIdx)}
                  className={`${isFlag ? 'cursor-pointer hover:bg-white hover:text-black px-1' : 'opacity-40'} ${found ? 'line-through text-green-500' : ''}`}
                >
                  {word}
                </span>
                {visibleIndex === flagIdx && (
                  <div className="absolute -top-10 left-0 bg-white text-black px-2 py-1 font-black shadow-xl z-10 border-2 border-black animate-bounce">
                    {codes[flagIdx]}
                  </div>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-1/3 p-8 flex flex-col bg-white/5">
        <div className="mb-12">
          <p className="text-xs opacity-50 mb-1 uppercase tracking-widest">Operation_Status</p>
          <div className="text-4xl font-black">{foundIndices.length}/{FLAG_COUNT}</div>
          <div className="h-2 bg-white/10 mt-4 border border-white">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(foundIndices.length / FLAG_COUNT) * 100}%` }} className="h-full bg-white" />
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <h3 className="text-xl font-black uppercase italic">Input_Registry</h3>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ACCESS_CODE_"
            className="w-full bg-transparent border-b-4 border-white py-4 text-4xl font-black focus:outline-none"
          />
          <button 
            onClick={handleSubmit}
            className="w-full border-4 border-white py-6 text-3xl font-black hover:bg-white hover:text-black transition-colors"
          >
            AUTHORIZE_ENTRY
          </button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`mt-8 p-4 font-black ${feedback.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}