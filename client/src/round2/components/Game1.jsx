import React, { useEffect, useState } from 'react';

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

  // Generate non-overlapping button positions
 // Generate non-overlapping button positions with padding
const generatePositions = (count) => {
  const positions = [];
  let attempts = 0;
  const padding = 5; // percent from edges

  while (positions.length < count && attempts < 20000) {
    attempts++;
    const x = padding + Math.random() * (100 - 2 * padding);
    const y = padding + Math.random() * (100 - 2 * padding);

    if (!positions.some((p) => Math.abs(p.x - x) < 7 && Math.abs(p.y - y) < 7)) {
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
      } else if (Math.random() < 0.4) {
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
    <div className="w-full h-full relative bg-gradient-to-br from-black to-gray-900">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => handleClick(btn)}
          className="absolute px-4 py-2 rounded-lg font-bold shadow-lg bg-yellow-400 hover:bg-yellow-500 text-black transition-all"
          style={{
            top: `${btn.y}%`,
            left: `${btn.x}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          CLICK ME
        </button>
      ))}

      {message && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 px-6 py-3 rounded-xl text-lg font-bold shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
};

export default Game1;
