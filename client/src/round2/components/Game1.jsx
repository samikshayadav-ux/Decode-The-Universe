import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
  "DECOY_DETECTED",
  "WRONG_SECTOR",
  "ACCESS_DENIED",
  "ENCRYPTION_FAIL",
  "NOT_THIS_ONE",
  "TROLL_LOGIC_ACTIVATED",
  "HAHA_NO",
  "KEEP_LOOKING",
  "SYSTEM_MISMATCH",
  "NOP_INSTRUCTION_EXECUTED",
];

const Game1 = ({ onComplete }) => {
  const [buttons, setButtons] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePositions = (count) => {
    const positions = [];
    const padding = 10;
    while (positions.length < count) {
      const x = padding + Math.random() * (100 - 2 * padding);
      const y = padding + Math.random() * (100 - 2 * padding);
      if (!positions.some((p) => Math.abs(p.x - x) < 8 && Math.abs(p.y - y) < 8)) {
        positions.push({ x, y });
      }
    }
    return positions;
  };

  useEffect(() => {
    const totalButtons = 40;
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
  }, []);

  const handleClick = (btn) => {
    if (!btn || isSubmitting) return;

    if (btn.type === 'real') {
      setIsSubmitting(true);
      onComplete('BUTTON_ALPHA_SECURED');
    } else if (btn.type === 'link') {
      window.open(btn.url, '_blank', 'noopener,noreferrer');
    } else if (btn.type === 'fake') {
      setMessage(btn.msg);
      setTimeout(() => setMessage(''), 1500);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20">
        <p className="text-sm opacity-50 uppercase tracking-widest mb-2">Target_Identification</p>
        <h3 className="text-3xl font-black italic">SEARCH_AND_DESTROY</h3>
      </div>

      {buttons.map((btn) => (
        <motion.button
          key={btn.id}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, backgroundColor: '#fff', color: '#000' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleClick(btn)}
          className="absolute px-4 py-2 border-2 border-white font-black text-xs uppercase z-10 bg-black transition-colors"
          style={{
            top: `${btn.y}%`,
            left: `${btn.x}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          TARGET_{btn.id}
        </motion.button>
      ))}

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 border-4 border-red-500 bg-black text-red-500 px-8 py-3 font-black text-xl z-50 uppercase"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game1;
