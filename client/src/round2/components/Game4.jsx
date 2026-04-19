import React, { useState, useEffect, useRef } from 'react';

const MazeGame = ({ onComplete }) => {
  // Maze dimensions
  const ROWS = 20;
  const COLS = 20;
  const CELL_SIZE = 15;
  
  // Game elements
  const WALL = 1;
  const PATH = 0;
  const START = 2;
  const END = 3;
  
  // Generate maze with properly placed end point
  const generateMaze = () => {
    let maze = Array(ROWS).fill().map(() => Array(COLS).fill(WALL));
    
    // Carve out paths
    const stack = [[1, 1]];
    maze[1][1] = PATH;
    
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    
    while (stack.length) {
      const [r, c] = stack[stack.length - 1];
      const shuffled = [...directions].sort(() => Math.random() - 0.5);
      
      let moved = false;
      
      for (const [dr, dc] of shuffled) {
        const nr = r + dr;
        const nc = c + dc;
        
        if (nr > 0 && nr < ROWS-1 && nc > 0 && nc < COLS-1 && maze[nr][nc] === WALL) {
          maze[nr][nc] = PATH;
          maze[r + dr/2][c + dc/2] = PATH;
          stack.push([nr, nc]);
          moved = true;
          break;
        }
      }
      
      if (!moved) stack.pop();
    }
    
    // Find valid end position (furthest path cell from start)
    let endR = 1, endC = 1, maxDist = 0;
    
    for (let r = 1; r < ROWS-1; r++) {
      for (let c = 1; c < COLS-1; c++) {
        if (maze[r][c] === PATH) {
          const dist = Math.abs(r - 1) + Math.abs(c - 1); // Manhattan distance
          if (dist > maxDist) {
            maxDist = dist;
            endR = r;
            endC = c;
          }
        }
      }
    }
    
    // Set start and end points
    maze[1][1] = START;
    maze[endR][endC] = END; // Now guaranteed to be inside walls
    
    return maze;
  };
  
  const [maze, setMaze] = useState(() => generateMaze());
  const [ballPos, setBallPos] = useState([1, 1]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const mazeRef = useRef(null);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      const [r, c] = ballPos;
      let newR = r, newC = c;
      
      switch(e.key) {
        case 'ArrowUp': newR--; break;
        case 'ArrowDown': newR++; break;
        case 'ArrowLeft': newC--; break;
        case 'ArrowRight': newC++; break;
        case 'w': newR--; break;
        case 's': newR++; break;
        case 'a': newC--; break;
        case 'd': newC++; break;
        default: return;
      }
      
      if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS) {
        if (maze[newR][newC] !== WALL) {
          setBallPos([newR, newC]);
          if (maze[newR][newC] === END) {
            setGameOver(true);
            setWin(true);
            // Call onComplete after a short delay
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 1500); // 1.5 second delay before moving to next game
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ballPos, gameOver, maze, onComplete]);
  
  // Reset game (only used for the New Maze button)
  const resetGame = () => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setBallPos([1, 1]);
    setGameOver(false);
    setWin(false);
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333'
      }}>Maze Game</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '15px',
            height: '15px',
            backgroundColor: '#4CAF50',
            marginRight: '5px'
          }}></div>
          <span>Start</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '15px',
            height: '15px',
            backgroundColor: '#F44336',
            marginRight: '5px'
          }}></div>
          <span>End</span>
        </div>
      </div>
      
      <div ref={mazeRef} style={{
        position: 'relative',
        border: '4px solid #333',
        backgroundColor: 'white',
        overflow: 'hidden',
        width: COLS * CELL_SIZE,
        height: ROWS * CELL_SIZE
      }}>
        {/* Render maze */}
        {maze.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * CELL_SIZE,
                top: r * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cell === WALL ? '#333' : 
                               cell === START ? '#4CAF50' : 
                               cell === END ? '#F44336' : 'white'
              }}
            />
          ))
        )}
        
        {/* Render player */}
        <div style={{
          position: 'absolute',
          backgroundColor: '#2196F3',
          left: ballPos[1] * CELL_SIZE,
          top: ballPos[0] * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          transition: 'left 0.15s ease, top 0.15s ease',
          zIndex: 10
        }}/>
        
        {/* Game over overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}>
            <div style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              {win ? 'You Won! 🎉' : 'Game Over!'}
            </div>
            {!win && (
              <button
                onClick={resetGame}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ margin: '5px 0', color: '#333' }}>Use arrow keys or WASD to move</p>
      </div>
      
      <button
        onClick={resetGame}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        New Maze
      </button>
    </div>
  );
};

export default MazeGame;