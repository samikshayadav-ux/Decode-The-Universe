import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeSocket,
  joinRound,
  leaveRound,
  subscribeToLeaderboard,
  subscribeToScoreChanges,
  disconnectSocket,
  getSocket
} from '../utils/socketClient';

const LeaderboardContext = createContext(null);

export const LeaderboardProvider = ({ children, serverURL = 'http://localhost:5000' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [scoreChanges, setScoreChanges] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [error, setError] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    try {
      const socket = initializeSocket(serverURL);
      if (socket) {
        socket.on('connect', () => {
          console.log('[LeaderboardContext] Connected to server');
          setIsConnected(true);
          setError(null);
        });

        socket.on('disconnect', () => {
          console.log('[LeaderboardContext] Disconnected from server');
          setIsConnected(false);
        });

        socket.on('error', (err) => {
          console.error('[LeaderboardContext] Connection error:', err);
          setError(err?.message || 'Connection error');
        });
      }

      return () => {
        // Cleanup on unmount is not called here since we want persistent connection
      };
    } catch (err) {
      console.error('[LeaderboardContext] Initialization error:', err);
      setError(err?.message || 'Initialization error');
    }
  }, [serverURL]);

  // Subscribe to leaderboard updates
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      console.log('[LeaderboardContext] Leaderboard update received:', data);
      setLeaderboardData((prev) => ({
        ...prev,
        [data.roundNumber]: data.leaderboard || []
      }));
    });

    return unsubscribe;
  }, []);

  // Subscribe to score changes
  useEffect(() => {
    const unsubscribe = subscribeToScoreChanges((data) => {
      console.log('[LeaderboardContext] Score change received:', data);
      setScoreChanges((prev) => [...prev, { ...data, timestamp: Date.now() }].slice(-50)); // Keep last 50
    });

    return unsubscribe;
  }, []);

  // Join round
  const enterRound = useCallback((roundNumber) => {
    if (isConnected) {
      joinRound(roundNumber);
      setCurrentRound(roundNumber);
    } else {
      console.warn('[LeaderboardContext] Not connected to server');
    }
  }, [isConnected]);

  // Leave round
  const exitRound = useCallback((roundNumber) => {
    if (isConnected) {
      leaveRound(roundNumber);
      if (currentRound === roundNumber) {
        setCurrentRound(null);
      }
    }
  }, [isConnected, currentRound]);

  // Get leaderboard for specific round
  const getLeaderboard = useCallback((roundNumber) => {
    return leaderboardData[roundNumber] || [];
  }, [leaderboardData]);

  // Get current leaderboard
  const getCurrentLeaderboard = useCallback(() => {
    return currentRound !== null ? getLeaderboard(currentRound) : [];
  }, [currentRound, getLeaderboard]);

  // Get team rank
  const getTeamRank = useCallback((teamId, roundNumber) => {
    const leaderboard = getLeaderboard(roundNumber);
    return leaderboard.find((entry) => entry.teamId === teamId)?.rank || null;
  }, [getLeaderboard]);

  // Get team score
  const getTeamScore = useCallback((teamId, roundNumber) => {
    const leaderboard = getLeaderboard(roundNumber);
    return leaderboard.find((entry) => entry.teamId === teamId)?.score || 0;
  }, [getLeaderboard]);

  // Disconnect (cleanup)
  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
  }, []);

  const value = {
    isConnected,
    leaderboardData,
    scoreChanges,
    currentRound,
    error,
    enterRound,
    exitRound,
    getLeaderboard,
    getCurrentLeaderboard,
    getTeamRank,
    getTeamScore,
    disconnect
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within LeaderboardProvider');
  }
  return context;
};

export default LeaderboardContext;
