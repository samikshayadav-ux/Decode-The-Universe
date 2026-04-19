import React, { useState, useEffect } from 'react';
import { completeRound } from '../../utils/quizApi';

const Stage2 = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [rules, setRules] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [wordleWord, setWordleWord] = useState('');
  const [colorHex, setColorHex] = useState(null);
  const [wordleGuesses, setWordleGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState(0);
  const [showWordle, setShowWordle] = useState(false);
  const [wordleCompleted, setWordleCompleted] = useState(false);
  const [completedWordleWord, setCompletedWordleWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sample data
  const wordleWords = ['CRANE', 'SLATE', 'CRATE', 'INDIA', 'AUDIO'];
  const today = new Date();
  const dateFormats = [
    `${today.getDate()}/${today.getMonth() + 1}`,
    `${today.getDate()}.${today.getMonth() + 1}`,
    `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`
  ];

  // Generate a random color
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Check if a number is prime
  const isPrime = (num) => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  };

  // Check if a string contains a palindrome of at least 3 characters
  const hasPalindrome = (str) => {
    for (let i = 0; i <= str.length - 3; i++) {
      const substr = str.substring(i, i + 3);
      if (substr === substr.split('').reverse().join('')) {
        return true;
      }
    }
    return false;
  };

  // Reset the entire game state
  const resetGame = () => {
    setPassword('');
    setCurrentLevel(0);
    setHasStartedTyping(false);
    setWordleGuesses(Array(6).fill(''));
    setCurrentGuess(0);
    setShowWordle(false);
    setWordleCompleted(false);
    setCompletedWordleWord('');
    // Generate new Wordle word
    setWordleWord(wordleWords[Math.floor(Math.random() * wordleWords.length)]);
    // Generate new color
    setColorHex(generateRandomColor());
    // Reinitialize rules
    initializeRules();
  };

  // Initialize rules
  const initializeRules = () => {
    const initialRules = [
      {
        id: 1,
        description: "Must be at least 5 characters long",
        status: "pending",
        validate: (pw) => pw.length >= 5
      },
      {
        id: 2,
        description: "Must contain a number (0-9)",
        status: "pending",
        validate: (pw) => /\d/.test(pw)
      },
      {
        id: 3,
        description: "Must contain an uppercase letter (A-Z)",
        status: "pending",
        validate: (pw) => /[A-Z]/.test(pw)
      },
      {
        id: 4,
        description: "Must contain a special character (!@#$%^&*)",
        status: "pending",
        validate: (pw) => /[!@#$%^&*]/.test(pw)
      },
      {
        id: 5,
        description: `Must include its length (${password.length}) as a number`,
        status: "pending",
        validate: (pw) => pw.includes(pw.length.toString())
      },
      {
        id: 6,
        description: "Length must be divisible by 5",
        status: "pending",
        validate: (pw) => pw.length % 5 === 0
      },
      {
        id: 7,
        description: `Must include today's date (${dateFormats[0]})`,
        status: "pending",
        validate: (pw) => dateFormats.some(format => pw.includes(format))
      },
      {
        id: 8,
        description: "Sum of digits must be a prime number",
        status: "pending",
        validate: (pw) => {
          const digitSum = pw.split('').reduce((sum, char) => {
            if (/\d/.test(char)) return sum + parseInt(char);
            return sum;
          }, 0);
          return isPrime(digitSum);
        }
      },
      {
        id: 9,
        description: "Must not contain lowercase vowels (a,e,i,o,u)",
        status: "pending",
        validate: (pw) => !/[aeiou]/.test(pw)
      },
      {
        id: 10,
        description: "No character should appear 3 times in a row",
        status: "pending",
        validate: (pw) => !/(.)\1\1/.test(pw)
      },
      {
        id: 11,
        description: "Must not start with special char but must end with one",
        status: "pending",
        validate: (pw) => !/^[!@#$%^&*]/.test(pw) && /[!@#$%^&*]$/.test(pw)
      },
      {
        id: 12,
        description: "Must have even number of letters (A-Za-z)",
        status: "pending",
        validate: (pw) => (pw.match(/[A-Za-z]/g) || []).length % 2 === 0
      },
      {
        id: 13,
        description: "Must contain a palindrome of 3+ characters",
        status: "pending",
        validate: (pw) => hasPalindrome(pw)
      },
      {
        id: 14,
        description: "Your password must include the hex code of the shown color.",
        status: "pending",
        validate: (pw) => {
          if (!colorHex) return false;
          const hexPattern = new RegExp(colorHex.slice(1), 'i');
          return hexPattern.test(pw);
        }
      },
      {
        id: 15,
        description: "Must include the Wordle answer (click to play)",
        status: "pending",
        validate: (pw) => {
          // If Wordle hasn't been completed yet, this rule can't be satisfied
          if (!wordleCompleted || !completedWordleWord) {
            return false;
          }
          // Check if the password contains the completed Wordle word (case-insensitive)
          const pwUpper = pw.toUpperCase();
          const wordUpper = completedWordleWord.toUpperCase();
          return pwUpper.includes(wordUpper);
        },
        action: () => setShowWordle(true)
      }
    ];
    setRules(initialRules);
  };

  // Initialize game on mount
  useEffect(() => {
    setWordleWord(wordleWords[Math.floor(Math.random() * wordleWords.length)]);
    setColorHex(generateRandomColor());
    initializeRules();
  }, []);

  // Update Rule 14's validate function whenever colorHex changes
  useEffect(() => {
    if (colorHex) {
      setRules(prevRules =>
        prevRules.map(rule =>
          rule.id === 14
            ? {
                ...rule,
                validate: (pw) => {
                  const hexPattern = new RegExp(colorHex.slice(1), 'i');
                  return hexPattern.test(pw);
                }
              }
            : rule
        )
      );
    }
  }, [colorHex]);

  // Update Rule 15's validate function when Wordle is completed
  useEffect(() => {
    if (wordleCompleted && completedWordleWord) {
      setRules(prevRules =>
        prevRules.map(rule =>
          rule.id === 15
            ? {
                ...rule,
                validate: (pw) => {
                  const pwUpper = pw.toUpperCase();
                  const wordUpper = completedWordleWord.toUpperCase();
                  return pwUpper.includes(wordUpper);
                }
              }
            : rule
        )
      );
    }
  }, [wordleCompleted, completedWordleWord]);

  // When Rule 14 becomes visible, generate a color if not already set
  useEffect(() => {
    if (
      rules.some(rule => rule.id === 14 && rule.id <= currentLevel) &&
      !colorHex
    ) {
      const newColor = generateRandomColor();
      setColorHex(newColor);
    }
  }, [currentLevel, rules, colorHex]);

  // Evaluate rules when password or dependencies change
  useEffect(() => {
    if (password.length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
      setCurrentLevel(1);
    }

    if (hasStartedTyping) {
      const updatedRules = rules.map(rule => {
        if (rule.id <= currentLevel) {
          const isValid = rule.validate(password);
          return {
            ...rule,
            status: isValid ? 'passed' : rule.status === 'passed' ? 'violated' : 'pending',
            description: rule.id === 5 ? `Must include its length (${password.length}) as a number` : rule.description
          };
        }
        return rule;
      });
      setRules(updatedRules);

      // Check if all current level rules are passed to advance
      const allCurrentRulesPassed = updatedRules
        .filter(rule => rule.id <= currentLevel)
        .every(rule => rule.status === 'passed');

      if (allCurrentRulesPassed && currentLevel < 15) {
        setCurrentLevel(currentLevel + 1);
        const nextRule = updatedRules.find(r => r.id === currentLevel + 1);
        if (nextRule?.action) nextRule.action();
      }
    }
  }, [password, hasStartedTyping, currentLevel, completedWordleWord, wordleCompleted]);

  const getLetterColor = (letter, index) => {
    if (!letter) return 'bg-gray-700';
    if (wordleWord[index] === letter) return 'bg-green-600';
    if (wordleWord.includes(letter)) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const handleWordleSubmit = (guess) => {
    const newGuesses = [...wordleGuesses];
    newGuesses[currentGuess] = guess;
    setWordleGuesses(newGuesses);

    if (guess === wordleWord) {
      setWordleCompleted(true);
      setCompletedWordleWord(wordleWord);
      setShowWordle(false);
      
      // Force immediate rule re-evaluation by updating the rules
      setTimeout(() => {
        setRules(prevRules => 
          prevRules.map(rule => {
            if (rule.id === 15) {
              return {
                ...rule,
                validate: (pw) => {
                  const pwUpper = pw.toUpperCase();
                  const wordUpper = wordleWord.toUpperCase();
                  return pwUpper.includes(wordUpper);
                }
              };
            }
            return rule;
          })
        );
      }, 100);
    } else if (currentGuess < 5) {
      setCurrentGuess(currentGuess + 1);
    } else {
      resetGame();
    }
  };

  const handleSubmit = async () => {
    if (rules.every(rule => rule.status === 'passed')) {
      try {
        setIsSubmitting(true);
        setError(null);
        
        const teamId = sessionStorage.getItem('authInfo') 
          ? JSON.parse(sessionStorage.getItem('authInfo')).teamId 
          : null;
        
        if (!teamId) {
          throw new Error('Team ID not found');
        }
        
        // Call completeRound to mark stage 2 completion
        await completeRound(1, teamId, {
          totalTime: 0, // Time will be tracked by parent component
          completionType: 'manual_submit'
        });
        
        console.log('[Stage2] Stage completion submitted');
        onComplete();
      } catch (err) {
        console.error('[Stage2] Error completing stage:', err);
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  function hexToRgb(hex) {
  hex = hex.replace(/^#/, ""); // Remove the #
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `RGB(${r}, ${g}, ${b})`;
  }

  // Only show relevant rules
  const visibleRules = rules
    .filter(rule => rule.id <= currentLevel || rule.status === 'passed')
    .sort((a, b) => b.id - a.id);

  return (
    <div className="text-white space-y-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center font-mono mb-6 bg-gradient-to-r p-3 rounded-lg">
        Password Challenge
      </h2>
      
      <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex items-center mb-4">
          <input
            type="text"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:border-transparent"
            placeholder="Start typing your password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="ml-3 bg-gray-700 px-3 py-1 rounded-lg text-sm font-mono">
            {password.length}
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {visibleRules.map((rule) => (
            <div 
              key={rule.id}
              className={`p-4 rounded-lg transition-all duration-300 ${
                rule.status === 'passed' 
                  ? 'bg-green-900/30 border-l-4 border-green-500' 
                  : rule.id === currentLevel
                    ? 'bg-red-800/20 border-l-4 border-red-500'
                    : 'bg-red-800/20 border-l-4 border-red-600'
              }`}
            >
              <div className="flex items-start">
                <span className="font-mono mr-3 bg-gray-600 px-2 py-1 rounded text-xs">
                  Rule {rule.id}
                </span>
                <div className="flex-1">
                  {rule.description}
                  
                  {/* Wordle game embedded in the rule card */}
                  {rule.id === 15 && showWordle && (
                    <div className="mt-4 flex flex-col items-center justify-center">
                      <div className="space-y-2 mt-6 mb-4">
                        {wordleGuesses.map((guess, guessIndex) => (
                          <div key={guessIndex} className="flex gap-1 justify-center">
                            {Array(5).fill(0).map((_, i) => (
                              <div 
                                key={i}
                                className={`w-8 h-8 flex items-center justify-center font-bold rounded text-sm ${
                                  guessIndex < currentGuess ? getLetterColor(guess[i], i) : 'bg-gray-700'
                                }`}
                              >
                                {guess[i] || ''}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {currentGuess < 6 && !wordleCompleted && (
                        <div className="flex flex-col items-center space-y-2 w-full">
                          <input
                            type="text"
                            value={wordleGuesses[currentGuess] || ''}
                            onChange={(e) => {
                              const newGuesses = [...wordleGuesses];
                              newGuesses[currentGuess] = e.target.value.toUpperCase().slice(0, 5);
                              setWordleGuesses(newGuesses);
                            }}
                            maxLength={5}
                            className="p-1 text-center uppercase font-mono bg-gray-900 border border-gray-600 rounded text-sm w-48"
                            placeholder="5-letter word"
                            autoFocus
                          />
                          <button
                            onClick={() => handleWordleSubmit(wordleGuesses[currentGuess])}
                            disabled={wordleGuesses[currentGuess]?.length !== 5}
                            className="bg-blue-600 hover:bg-blue-700 py-1 rounded text-sm z-10 disabled:opacity-50 w-48"
                          >
                            Submit ({6 - currentGuess} left)
                          </button>
                        </div>
                      )}

                      {wordleCompleted && (
                        <div className="text-center py-2 bg-green-900/30 rounded w-full">
                          <p className="text-green-400 font-bold text-sm">Word found! Include "{completedWordleWord}" in your password</p>
                        </div>
                      )}

                      {currentGuess >= 6 && !wordleCompleted && (
                        <div className="text-center py-2 bg-red-900/30 rounded w-full">
                          <p className="text-red-400 font-bold text-sm">Game over! Starting over...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show "Play Wordle" button when not showing the game and not completed */}
                  {rule.id === 15 && !showWordle && !wordleCompleted && (
                    <button
                      onClick={() => setShowWordle(true)}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Play Wordle
                    </button>
                  )}

                  {/* Show word to include when completed */}
                  {rule.id === 15 && wordleCompleted && !showWordle && (
                    <div className="mt-2 text-sm text-green-400">
                      Include the word: <span className="font-bold">{completedWordleWord}</span>
                    </div>
                  )}

                  {/* Color rule display */}
                  {rule.id === 14 && colorHex && (
                    <div className="mt-2 ">
                      <div
                        className="w-full h-35 rounded-lg relative"
                        style={{ backgroundColor: colorHex }}
                      >                        
                        <button
                          className="absolute bottom-2 right-2 rounded-full p-2  text-gray-800 font-bold"
                          type="button"
                          title="Refresh Color"
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorHex(generateRandomColor());
                          }}
                        >
                          ↻
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        {hexToRgb(colorHex)}
                      </div>
                    </div>
                  )}
                </div>
                {rule.status === 'passed' && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className={`w-full mt-6 py-3 rounded-lg text-white font-bold transition-all ${
            rules.every(r => r.status === 'passed') && !isSubmitting
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg'
              : 'bg-gray-700 cursor-not-allowed opacity-70'
          }`}
          disabled={!rules.every(r => r.status === 'passed') || isSubmitting}
        >
          {isSubmitting ? '⏳ Submitting...' : rules.every(r => r.status === 'passed') ? '🚀 Submit Password' : 'Complete All Rules'}
        </button>
      </div>
    </div>
  );
};

export default Stage2;