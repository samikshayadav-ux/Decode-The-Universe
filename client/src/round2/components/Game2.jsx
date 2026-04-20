import React, { useState } from "react";

/**
 * 4x4 Sudoku (easy)
 * - 0 = empty cell
 * - Boxes are 2x2
 *
 * Solution used for validation:
 * [
 *  [1,2,3,4],
 *  [3,4,1,2],
 *  [2,1,4,3],
 *  [4,3,2,1]
 * ]
 */

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
  const [message, setMessage] = useState("");

  const handleChange = (r, c, value) => {
    // prevent editing clues
    if (PUZZLE[r][c] !== 0) return;

    // allow only 1-4 or empty
    const n = parseInt(value, 10);
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = !isNaN(n) && n >= 1 && n <= 4 ? n : 0;
    setGrid(newGrid);
  };

  const checkSolution = () => {
    // simple deep-equality check with solution
    const ok = SOLUTION.every((row, r) =>
      row.every((val, c) => grid[r][c] === val)
    );

    if (ok) {
      setMessage("✅ Correct! Moving to next stage...");
      setTimeout(() => {
        if (typeof onComplete === "function") onComplete();
      }, 900);
    } else {
      setMessage("❌ Not quite—double-check rows, columns, and 2×2 boxes.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Sudoku 4x4</h2>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4, 56px)",
          gap: "6px",
          background: "#111827",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isClue = PUZZLE[r][c] !== 0;
            // border styles to emphasize 2x2 boxes
            const style = {
              width: 56,
              height: 56,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
              border: "1px solid #374151",
              background: isClue ? "#fcd34d" : "#ffffff",
              color: isClue ? "#000" : "#000",
              outline: "none",
              boxSizing: "border-box",
              // thicker borders for 2x2 boxes
              borderTop: r % 2 === 0 ? "3px solid #000" : "1px solid #374151",
              borderLeft: c % 2 === 0 ? "3px solid #000" : "1px solid #374151",
              borderRight:
                c === 3 ? "3px solid #000" : undefined,
              borderBottom:
                r === 3 ? "3px solid #000" : undefined,
            };

            return (
              <input
                key={`${r}-${c}`}
                value={cell === 0 ? "" : cell}
                onChange={(e) => handleChange(r, c, e.target.value)}
                maxLength={1}
                disabled={isClue}
                style={style}
                inputMode="numeric"
                aria-label={`row ${r + 1} column ${c + 1}`}
              />
            );
          })
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={checkSolution}
          className="px-4 py-2 bg-yellow-400 text-black font-bold rounded"
        >
          Check Solution
        </button>

        <button
          onClick={() => {
            setGrid(PUZZLE.map((r) => [...r]));
            setMessage("");
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded border border-gray-600"
        >
          Reset
        </button>
      </div>

      {message && <p className="mt-3">{message}</p>}

    </div>
  );
};

export default Game2;
