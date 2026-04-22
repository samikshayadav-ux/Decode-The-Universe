import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { getProgress, submitAnswer, completeRound } from '../../utils/quizApi';

const ScavengerHuntRound3 = () => {
  const { authData, isLoading: authLoading, isLoggedIn } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isLoggedIn || !authData?.teamId) {
    return <AuthRequiredScreen />;
  }

  return (
    <GameCore 
      teamId={authData.teamId}
      teamName={authData.teamName}
    />
  );
};

const GameCore = ({ teamId, teamName }) => {
  const [gameState, setGameState] = useState({
    foundClueIds: [],
    currentClueId: null,
    currentClue: null,
    timer: 0,
    isRunning: false,
    message: '',
    inputCode: '',
    loading: true,
    allClues: [],
    gameCompleted: false,
    error: null,
    lastDbUpdate: 0,
    pendingDbUpdate: false
  });

  // Session-based timer management
  const SESSION_KEY = `game_session_${teamId}`;
  const TIMER_KEY = `game_timer_${teamId}`;
  const START_TIME_KEY = `game_start_${teamId}`;

  // Initialize or get session start time
  const getSessionTimer = () => {
    const startTime = sessionStorage.getItem(START_TIME_KEY);
    if (startTime) {
      const elapsed = (Date.now() - parseInt(startTime)) / 1000;
      return Math.max(0, elapsed);
    }
    return 0;
  };

  const setSessionStartTime = (timer = 0) => {
    const startTime = Date.now() - (timer * 1000);
    sessionStorage.setItem(START_TIME_KEY, startTime.toString());
  };

  // Utility function to find clue by ID
  const findClueById = useCallback((clues, clueId) => {
    return clues.find(clue => clue.clue_id === clueId) || null;
  }, []);

  // Get next random clue that hasn't been found
  const selectNextClue = useCallback((allClues, foundClueIds) => {
    const remainingClues = allClues.filter(clue => !foundClueIds.includes(clue.clue_id));
    if (remainingClues.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * remainingClues.length);
    return remainingClues[randomIndex];
  }, []);

  // Database operations with minimal requests
  const dbOperations = {
    // Fetch game data from backend API
    fetchGameData: async () => {
      try {
        const data = await getProgress(3, teamId);
        // Convert API format to local format
        if (data) {
          return {
            team_id: teamId,
            team_name: teamName,
            clue_ids: Array.isArray(data.clueIds) ? data.clueIds : [],
            current_clue_id: data.currentClueId || null,
            timer_seconds: data.timerSeconds || 0
          };
        }
        return null;
      } catch (error) {
        console.error('Error fetching game data:', error);
        throw error;
      }
    },

    // Optimized update via API
    updateGameData: async (updateData, isImmediate = false) => {
      try {
        if (gameState.pendingDbUpdate && !isImmediate) {
          console.log('Database update already pending, skipping...');
          return true;
        }

        setGameState(prev => ({ ...prev, pendingDbUpdate: true }));

        const clueIds = Array.isArray(updateData.foundClueIds) 
          ? updateData.foundClueIds.map(id => String(id))
          : [];

        console.log('API update:', { clueIds: clueIds.length, currentClue: updateData.currentClueId });

        await submitAnswer(3, teamId, {
          foundClueIds: clueIds,
          currentClueId: updateData.currentClueId ? String(updateData.currentClueId) : null,
          timerSeconds: Math.round((updateData.timer || 0) * 10) / 10
        });

        setGameState(prev => ({ 
          ...prev, 
          lastDbUpdate: Date.now(),
          pendingDbUpdate: false 
        }));

        console.log('API update successful');
        return true;
      } catch (error) {
        console.error('Error in updateGameData:', error);
        setGameState(prev => ({ ...prev, pendingDbUpdate: false }));
        throw error;
      }
    },

    // Initialize new game record via API
    initializeGameRecord: async () => {
      try {
        await submitAnswer(3, teamId, {
          foundClueIds: [],
          currentClueId: null,
          timerSeconds: 0
        });
        return true;
      } catch (error) {
        console.error('Error initializing game record:', error);
        throw error;
      }
    }
  };

  // Load clues from JSON file
  const loadCluesData = async () => {
    try {
      const response = await import('./Data3.json');
      const clues = response.default || response;
      
      if (!Array.isArray(clues) || clues.length === 0) {
        throw new Error('Invalid clues data format');
      }

      return clues;
    } catch (error) {
      console.error('Error loading clues data:', error);
      throw new Error('Failed to load game clues');
    }
  };

  // Initialize game with minimal DB calls
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setGameState(prev => ({ ...prev, loading: true, error: null }));

        // 1. Load clues data
        const allClues = await loadCluesData();

        // 2. Fetch existing game data (SINGLE REQUEST)
        const dbData = await dbOperations.fetchGameData();

        let foundClueIds = [];
        let currentClueId = null;
        let currentClue = null;
        let timer = 0;
        let gameCompleted = false;

        if (dbData) {
          // Load existing progress
          foundClueIds = Array.isArray(dbData.clue_ids) ? dbData.clue_ids : [];
          currentClueId = dbData.current_clue_id;
          gameCompleted = foundClueIds.length === allClues.length;

          // Use session timer if available, otherwise use DB timer
          const sessionTimer = getSessionTimer();
          const dbTimer = dbData.timer_seconds || 0;
          timer = Math.max(sessionTimer, dbTimer);
          
          // Set session start time based on current timer
          setSessionStartTime(timer);

          // Handle current clue
          if (currentClueId) {
            currentClue = findClueById(allClues, currentClueId);
            
            // If clue not found, select a new one
            if (!currentClue && !gameCompleted) {
              const nextClue = selectNextClue(allClues, foundClueIds);
              if (nextClue) {
                currentClue = nextClue;
                currentClueId = nextClue.clue_id;
                
                // SINGLE UPDATE for new clue
                await dbOperations.updateGameData({
                  foundClueIds,
                  currentClueId: currentClueId,
                  timer
                });
              }
            }
          } else if (!gameCompleted) {
            // No current clue, but game not completed
            const nextClue = selectNextClue(allClues, foundClueIds);
            if (nextClue) {
              currentClue = nextClue;
              currentClueId = nextClue.clue_id;
              
              // SINGLE UPDATE for first clue
              await dbOperations.updateGameData({
                foundClueIds,
                currentClueId: currentClueId,
                timer
              });
            }
          }
        } else {
          // No existing data - initialize
          await dbOperations.initializeGameRecord();
          
          // Set session start time
          setSessionStartTime(0);
          
          // Select first clue
          if (allClues.length > 0) {
            const firstClue = selectNextClue(allClues, []);
            if (firstClue) {
              currentClue = firstClue;
              currentClueId = firstClue.clue_id;
              
              // SINGLE UPDATE for initialization
              await dbOperations.updateGameData({
                foundClueIds: [],
                currentClueId: currentClueId,
                timer: 0
              });
            }
          }
        }

        const isRunning = !gameCompleted && currentClue !== null;

        setGameState(prev => ({
          ...prev,
          allClues,
          foundClueIds,
          currentClue,
          currentClueId,
          timer,
          isRunning,
          loading: false,
          gameCompleted,
          error: null
        }));

      } catch (error) {
        console.error('Game initialization failed:', error);
        setGameState(prev => ({ 
          ...prev, 
          loading: false,
          error: error.message || 'Failed to initialize game',
          isRunning: false
        }));
      }
    };

    if (teamId && teamName) {
      initializeGame();
    }
  }, [teamId, teamName, findClueById, selectNextClue]);

  // Session-persistent timer with background running
  useEffect(() => {
    if (!gameState.isRunning || gameState.loading || gameState.error) return;

    const interval = setInterval(() => {
      // Calculate timer from session start time (prevents tab switching cheats)
      const sessionTimer = getSessionTimer();
      
      setGameState(prev => ({ 
        ...prev, 
        timer: sessionTimer
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.isRunning, gameState.loading, gameState.error]);

  // Optimized DB save - only every 30 seconds for timer, immediately for critical changes
  useEffect(() => {
    if (gameState.loading || !gameState.isRunning || gameState.error || gameState.pendingDbUpdate) return;

    const saveTimer = setTimeout(async () => {
      try {
        // Only save if no recent update (prevent unnecessary calls)
        const timeSinceLastUpdate = Date.now() - gameState.lastDbUpdate;
        if (timeSinceLastUpdate < 25000) { // Skip if updated less than 25 seconds ago
          return;
        }

        console.log('Auto-saving timer...');
        await dbOperations.updateGameData({
          foundClueIds: gameState.foundClueIds,
          currentClueId: gameState.currentClueId,
          timer: gameState.timer
        });
      } catch (error) {
        console.error('Failed to save timer:', error);
      }
    }, 30000); // Save every 30 seconds instead of 5

    return () => clearTimeout(saveTimer);
  }, [gameState.timer, gameState.foundClueIds, gameState.currentClueId, gameState.loading, gameState.isRunning, gameState.error, gameState.lastDbUpdate, gameState.pendingDbUpdate]);

  // Move to next clue after solving current one
  const moveToNextClue = async (updatedFoundClueIds) => {
    try {
      console.log('Moving to next clue with found clues:', updatedFoundClueIds);
      
      const nextClue = selectNextClue(gameState.allClues, updatedFoundClueIds);
      
      if (!nextClue) {
        // Game completed - ENSURE final update
        console.log('Game completed! Final update with all clues:', updatedFoundClueIds);
        
        // Multiple attempts for final update
        let finalUpdateSuccess = false;
        let attempts = 0;
        const maxAttempts = 5; // More attempts for final update

        while (!finalUpdateSuccess && attempts < maxAttempts) {
          try {
            attempts++;
            console.log(`Final update attempt ${attempts}`);
            
            await dbOperations.updateGameData({
              foundClueIds: updatedFoundClueIds,
              currentClueId: null, // Game finished
              timer: gameState.timer
            });

            // Verify final update
            const verifyFinal = await dbOperations.fetchGameData();
            console.log('Final verification:', verifyFinal?.clue_ids);
            
            if (verifyFinal && Array.isArray(verifyFinal.clue_ids) && 
                verifyFinal.clue_ids.length === updatedFoundClueIds.length &&
                verifyFinal.current_clue_id === null) {
              finalUpdateSuccess = true;
              console.log('Final update verified successfully');
            } else {
              console.warn(`Final update verification failed`);
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (error) {
            console.error(`Final update attempt ${attempts} failed:`, error);
            if (attempts >= maxAttempts) {
              console.error('Failed final update after all attempts');
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        setGameState(prev => ({
          ...prev,
          isRunning: false,
          gameCompleted: true,
          currentClue: null,
          currentClueId: null,
          message: '',
          foundClueIds: updatedFoundClueIds
        }));
        return;
      }

      console.log('Selected next clue:', nextClue.clue_id);

      // Update database with new current clue AND the updated found clues
      let moveUpdateSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!moveUpdateSuccess && attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Move update attempt ${attempts}`);
          
          await dbOperations.updateGameData({
            foundClueIds: updatedFoundClueIds,
            currentClueId: nextClue.clue_id,
            timer: gameState.timer
          });

          // Verify the move update
          const verifyMove = await dbOperations.fetchGameData();
          if (verifyMove && verifyMove.current_clue_id === nextClue.clue_id &&
              Array.isArray(verifyMove.clue_ids) && 
              verifyMove.clue_ids.length === updatedFoundClueIds.length) {
            moveUpdateSuccess = true;
            console.log('Move update verified successfully');
          } else {
            console.warn(`Move update verification failed`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          console.error(`Move update attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update local state
      setGameState(prev => ({
        ...prev,
        currentClue: nextClue,
        currentClueId: nextClue.clue_id,
        message: '',
        foundClueIds: updatedFoundClueIds
      }));

    } catch (error) {
      console.error('Error moving to next clue:', error);
      setGameState(prev => ({
        ...prev,
        message: 'Error loading next clue. Please refresh.',
        error: error.message
      }));
    }
  };

  // Verify the entered code
  const handleVerify = async () => {
    const { inputCode, currentClue } = gameState;
    if (!inputCode.trim() || !currentClue) return;

    try {
      if (inputCode.trim().toUpperCase() === currentClue.code.toUpperCase()) {
        const newFoundClueIds = [...gameState.foundClueIds, currentClue.clue_id];
        
        console.log('Clue solved! Current found clues:', gameState.foundClueIds);
        console.log('Adding clue ID:', currentClue.clue_id);
        console.log('New found clues array:', newFoundClueIds);
        
        // STEP 1: Update local state immediately
        setGameState(prev => ({
          ...prev,
          foundClueIds: newFoundClueIds,
          message: 'Correct! Saving progress...',
          inputCode: ''
        }));

        // STEP 2: FORCE database update - use multiple attempts if needed
        let updateSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!updateSuccess && attempts < maxAttempts) {
          try {
            attempts++;
            console.log(`Database update attempt ${attempts} with clues:`, newFoundClueIds);
            
            await dbOperations.updateGameData({
              foundClueIds: newFoundClueIds,
              currentClueId: gameState.currentClueId,
              timer: gameState.timer
            });
            
            // Verify the update worked by fetching back
            const verifyData = await dbOperations.fetchGameData();
            console.log('Verification fetch result:', verifyData?.clue_ids);
            
            if (verifyData && Array.isArray(verifyData.clue_ids) && 
                verifyData.clue_ids.length === newFoundClueIds.length) {
              updateSuccess = true;
              console.log('Database update verified successfully');
            } else {
              console.warn(`Update verification failed. Expected: ${newFoundClueIds.length}, Got: ${verifyData?.clue_ids?.length || 0}`);
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
              }
            }
          } catch (updateError) {
            console.error(`Database update attempt ${attempts} failed:`, updateError);
            if (attempts >= maxAttempts) {
              throw updateError;
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          }
        }

        if (!updateSuccess) {
          throw new Error('Failed to update database after multiple attempts');
        }

        setGameState(prev => ({
          ...prev,
          message: 'Correct! Moving to next clue...'
        }));

        // STEP 3: Move to next clue with verified data
        setTimeout(() => {
          moveToNextClue(newFoundClueIds);
        }, 1500);

      } else {
        setGameState(prev => ({
          ...prev,
          message: 'Incorrect code. Try again!'
        }));
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setGameState(prev => ({
        ...prev,
        message: 'Error saving progress. Please try again.',
        foundClueIds: gameState.foundClueIds // Revert if failed
      }));
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setGameState(prev => ({
      ...prev,
      inputCode: e.target.value,
      message: prev.message.includes('Incorrect') ? '' : prev.message
    }));
  };

  // Handle key press (Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  // Format time as MM:SS.s
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toFixed(1).padStart(4, '0');
    return `${mins}:${secs}`;
  };

  // Calculate progress
  const totalClues = gameState.allClues.length;
  const foundCount = gameState.foundClueIds.length;
  const progressPercentage = totalClues > 0 ? ((foundCount / totalClues) * 100).toFixed(2) : 0;

  // Error state
  if (gameState.error && !gameState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-4">Game Error</h2>
          <p className="text-gray-700 mb-6">{gameState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry Game
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (gameState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto animate-spin" />
          <p className="text-indigo-700 font-medium">Loading game...</p>
        </div>
      </div>
    );
  }

  // Game completed state
  if (gameState.gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">🏆 Game Complete! 🏆</h1>
            <p className="text-xl">Team: {teamName}</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-sm text-indigo-600 font-medium">Clues Found</p>
                <p className="text-3xl font-bold text-indigo-800">
                  {foundCount}/{totalClues}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600 font-medium">Time Taken</p>
                <p className="text-3xl font-bold text-blue-800">
                  {formatTime(gameState.timer)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center relative mb-12">
          
          <div className='text-xl font-semibold text-indigo-700 mb-1 top-6 absolute left-0'>
            {teamName}
          </div>
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl font-bold text-indigo-900"
          >
            FINAL ROUND
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-auto"
          >
            <div className="text-xs font-semibold text-indigo-500 mb-1">TIME ELAPSED</div>
            <div className="text-3xl font-mono font-bold text-indigo-700 tracking-tighter">
              {formatTime(gameState.timer)}
            </div>
          </motion.div>
        </div>

        {/* Progress Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-indigo-800">
              {foundCount}/{totalClues}
            </span>
            <span className="text-lg font-semibold text-indigo-800">
              {progressPercentage}% Complete
            </span>
          </div>
          <div className="h-3 bg-indigo-200/80 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Clue Section */}
        {gameState.currentClue && (
          <motion.div
            key={gameState.currentClue.clue_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-100/50"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-indigo-900">
                  Clue #{gameState.currentClue.clue_id}
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {gameState.currentClue.type === 'image' ? 'Visual Clue' : 'Text Clue'}
                </div>
              </div>
              
              {gameState.currentClue.type === 'image' ? (
                <div className="mb-6">
                  <img 
                    src={gameState.currentClue.image_url} 
                    alt="Clue visual" 
                    className="w-full max-h-80 object-contain mx-auto rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load image:', gameState.currentClue.image_url);
                    }}
                  />
                  <p className="mt-4 text-lg text-gray-700 text-center font-medium">
                    {gameState.currentClue.clue}
                  </p>
                </div>
              ) : (
                <p className="text-2xl text-gray-700 mb-8 text-center font-medium leading-relaxed">
                  {gameState.currentClue.clue}
                </p>
              )}

              <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto mt-8">
                <input
                  type="text"
                  value={gameState.inputCode}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="ENTER THE CODE"
                  maxLength="8"
                  className="flex-grow px-6 py-3 border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 text-center font-mono uppercase text-lg shadow-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerify}
                  disabled={!gameState.inputCode.trim()}
                  className="px-8 py-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-300/40 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  VERIFY
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Message Section */}
        {gameState.message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg text-center font-medium ${
              gameState.message.includes('Correct') 
                ? 'bg-green-100 text-green-800' 
                : gameState.message.includes('Error')
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {gameState.message}
          </motion.div>
        )}

        {/* No clue available state */}
        {!gameState.currentClue && !gameState.gameCompleted && !gameState.loading && !gameState.error && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
            <p className="text-xl text-gray-700 mb-4">No clues available at the moment</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Refresh Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Subcomponents
const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-indigo-50">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto animate-spin" />
      <p className="text-indigo-700 font-medium">Loading game data...</p>
    </div>
  </div>
);

const AuthRequiredScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-indigo-50">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Required</h2>
      <p className="text-gray-700 mb-6">Please login to access the scavenger hunt.</p>
      <button
        onClick={() => window.location.href = '/login'}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Go to Login
      </button>
    </div>
  </div>
);

export default ScavengerHuntRound3;