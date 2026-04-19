import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MazeGame = ({ onComplete }) => {
  const ROWS = 15;
  const COLS = 25;
  const [maze, setMaze] = useState([]);
  const [ballPos, setBallPos] = useState([1, 1]);
  const [gameOver, setGameOver] = useState(false);

  const WALL = 1;
  const PATH = 0;
  const START = 2;
  const END = 3;

  const generateMaze = () => {
    let m = Array(ROWS).fill().map(() => Array(COLS).fill(WALL));
    const stack = [[1, 1]];
    m[1][1] = PATH;
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    while (stack.length) {
      const [r, c] = stack[stack.length - 1];
      const shuffled = [...directions].sort(() => Math.random() - 0.5);
      let moved = false;
      for (const [dr, dc] of shuffled) {
        const nr = r + dr, nc = c + dc;
        if (nr > 0 && nr < ROWS-1 && nc > 0 && nc < COLS-1 && m[nr][nc] === WALL) {
          m[nr][nc] = PATH;
          m[r + dr/2][c + dc/2] = PATH;
          stack.push([nr, nc]);
          moved = true;
          break;
        }
      }
      if (!moved) stack.pop();
    }
    m[1][1] = START;
    m[ROWS-2][COLS-2] = END;
    return m;
  };

  useEffect(() => {
    setMaze(generateMaze());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const [r, c] = ballPos;
      let nr = r, nc = c;
      if (e.key === 'ArrowUp' || e.key === 'w') nr--;
      else if (e.key === 'ArrowDown' || e.key === 's') nr++;
      else if (e.key === 'ArrowLeft' || e.key === 'a') nc--;
      else if (e.key === 'ArrowRight' || e.key === 'd') nc++;
      else return;

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && maze[nr][nc] !== WALL) {
        setBallPos([nr, nc]);
        if (maze[nr][nc] === END) {
          setGameOver(true);
          setTimeout(() => onComplete('MAZE_SOLVED'), 1000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ballPos, gameOver, maze]);

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <div className="mb-8 text-center">
        <p className="text-xs opacity-50 uppercase tracking-widest mb-1">Pathfinding_Module</p>
        <h2 className="text-4xl font-black italic">MAZE_RUNNER_v1.0</h2>
      </div>

      <div 
        className="grid border-4 border-white bg-white/5" 
        style={{ gridTemplateColumns: `repeat(${COLS}, 20px)` }}
      >
        {maze.map((row, r) => row.map((cell, c) => (
          <div 
            key={`${r}-${c}`} 
            className={`w-5 h-5 ${
              cell === WALL ? 'bg-white' : 
              cell === START ? 'bg-blue-500' : 
              cell === END ? 'bg-green-500' : 'bg-transparent'
            } relative`}
          >
            {ballPos[0] === r && ballPos[1] === c && (
              <motion.div 
                layoutId="ball"
                className="absolute inset-1 bg-red-500 z-10" 
              />
            )}
          </div>
        )))}
      </div>

      <div className="mt-8 text-sm opacity-50 uppercase tracking-tighter">
        Use_WASD_or_Arrows_to_Navigate
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 p-4 bg-white text-black font-black text-2xl animate-pulse"
          >
            MAZE_BYPASSED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MazeGame;