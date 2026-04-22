import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const randomSites = [
  'https://example.com',
  'https://openai.com',
  'https://www.wikipedia.org',
  'https://www.bbc.com',
  'https://www.youtube.com',
  'https://x.com',
  'https://github.com',
  'https://news.ycombinator.com',
  'https://www.producthunt.com',
];

const fakeMessages = [
  "Nice try 😉",
  "Wrong button!",
  "Oops, not this one.",
  "Almost there...",
  "Better luck next time!",
  "This is a decoy.",
  "Hahaha nope.",
  "Keep looking...",
  "Are you even trying?",
  "Not quite!",
  "Try harder...",
  "You're being trolled.",
  "False alarm.",
  "This isn't it.",
  "LOL nope.",
];

const Game1 = ({ onComplete }) => {
  const [buttons, setButtons] = useState([]);
  const [message, setMessage] = useState('');

  // Generate non-overlapping button positions with padding
  const generatePositions = (count) => {
    const positions = [];
    let attempts = 0;
    const padding = 10; // percent from edges

    while (positions.length < count && attempts < 20000) {
      attempts++;
      const x = padding + Math.random() * (100 - 2 * padding);
      const y = padding + Math.random() * (100 - 2 * padding);

      if (!positions.some((p) => Math.abs(p.x - x) < 6 && Math.abs(p.y - y) < 4)) {
        positions.push({ x, y });
      }
    }
    return positions;
  };

  useEffect(() => {
    const totalButtons = 50;
    const positions = generatePositions(totalButtons);
    const realButtonIndex = Math.floor(Math.random() * totalButtons);

    const newButtons = Array.from({ length: totalButtons }, (_, i) => {
      if (i === realButtonIndex) {
        return { id: i, type: 'real', x: positions[i].x, y: positions[i].y };
      } else if (Math.random() < 0.3) {
        const url = randomSites[Math.floor(Math.random() * randomSites.length)];
        return { id: i, type: 'link', url, x: positions[i].x, y: positions[i].y };
      } else {
        const msg = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
        return { id: i, type: 'fake', msg, x: positions[i].x, y: positions[i].y };
      }
    });

    setButtons(newButtons);

    // Block Inspect and Shortcuts
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (e.ctrlKey && (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClick = (btn) => {
    if (!btn) return;

    if (btn.type === 'real') {
      onComplete();
    } else if (btn.type === 'link') {
      window.open(btn.url, '_blank', 'noopener,noreferrer');
    } else if (btn.type === 'fake') {
      setMessage(btn.msg);
      setTimeout(() => setMessage(''), 1500);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/40 rounded-[2rem] border border-white/5 backdrop-blur-sm">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <h2 className="text-[15vw] font-black text-white/5 select-none uppercase tracking-tighter">Decoy</h2>
      </div>

      {buttons.map((btn) => (
        <motion.button
          key={btn.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05, zIndex: 20 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleClick(btn)}
          className="absolute px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-tighter shadow-xl transition-colors bg-yellow-400 text-black hover:bg-yellow-500 border border-yellow-300"
          style={{
            top: `${btn.y}%`,
            left: `${btn.x}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          Click Me
        </motion.button>
      ))}

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl z-50 text-white border border-white/20"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game1;
