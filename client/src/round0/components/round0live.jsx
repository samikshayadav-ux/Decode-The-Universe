import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSocket, joinRound, leaveRound, subscribeToLeaderboard, subscribeToScoreChanges, disconnectSocket } from './../../utils/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ROUND_NUMBER = 0;

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  const adjustedSeconds = seconds + 1;
  const mins = Math.floor(adjustedSeconds / 60);
  const secs = adjustedSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const LiveLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [prevTeams, setPrevTeams] = useState([]);
  const [top10Mode, setTop10Mode] = useState(false);
  const [positionChanges, setPositionChanges] = useState({});
  const [teamNameCounts, setTeamNameCounts] = useState({});
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const previousPositionsRef = useRef({});
  const positionChangeTimersRef = useRef({});
  const unsubscribeRef = useRef(null);

  // Process and sort leaderboard data
  const processData = (data) => {
    // Safety check: ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('processData received non-array data:', data);
      return;
    }

    if (data.length === 0) {
      console.log('No teams in leaderboard');
      return;
    }

    // Log the first team to see the data structure
    console.log('Sample team data:', data[0]);

    const nameCounts = {};
    data.forEach(team => {
      // Handle both teamName and team_name fields
      const teamName = team.teamName || team.team_name || 'Unknown';
      nameCounts[teamName] = (nameCounts[teamName] || 0) + 1;
    });
    setTeamNameCounts(nameCounts);

    const processedTeams = data.map(team => {
      // Handle both naming conventions
      const teamId = team.teamId || team.team_id;
      const teamName = team.teamName || team.team_name || 'Unknown';
      const status = team.status || 'not_started';
      
      // Only show displayTime if quiz is completed, otherwise show null
      let timeToDisplay = null;
      if (status === 'completed') {
        timeToDisplay = team.displayTime !== null && team.displayTime !== undefined 
          ? team.displayTime 
          : (team.totalTimeSpent || 0);
      }
      
      return {
        team_id: teamId,
        team_name: teamName,
        display_name: nameCounts[teamName] > 1
          ? `${teamName} (${teamId})`
          : teamName,
        score: team.score || 0,
        status: status,
        displayTime: timeToDisplay,
        sortTime: timeToDisplay || Infinity,
        lastSubmittedAt: team.lastAnswerTime || new Date().toISOString()
      };
    });

    const sortedTeams = [...processedTeams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
      return new Date(a.lastSubmittedAt) - new Date(b.lastSubmittedAt);
    });

    const newPositionChanges = { ...positionChanges };

    if (top10Mode) {
      sortedTeams.forEach((team, currentIndex) => {
        const previousIndex = previousPositionsRef.current[team.team_id];

        if (previousIndex !== undefined && previousIndex !== currentIndex) {
          const change = previousIndex - currentIndex;
          newPositionChanges[team.team_id] = change;

          if (positionChangeTimersRef.current[team.team_id]) {
            clearTimeout(positionChangeTimersRef.current[team.team_id]);
          }

          positionChangeTimersRef.current[team.team_id] = setTimeout(() => {
            setPositionChanges(prev => {
              const updated = { ...prev };
              delete updated[team.team_id];
              return updated;
            });
            delete positionChangeTimersRef.current[team.team_id];
          }, 60000);
        }
      });
    }

    const currentPositions = {};
    sortedTeams.forEach((team, index) => {
      currentPositions[team.team_id] = index;
    });
    previousPositionsRef.current = currentPositions;

    setPositionChanges(newPositionChanges);
    setTeams(sortedTeams);
    setPrevTeams(sortedTeams);
  };

  // Fetch initial leaderboard data from backend API
  const fetchInitialData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard/${ROUND_NUMBER}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setError(null);
      
      console.log('📊 Leaderboard API Response:', result);
      
      // Extract leaderboard array from the response structure
      let data = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (result.data?.leaderboard && Array.isArray(result.data.leaderboard)) {
        data = result.data.leaderboard;
      } else if (result.leaderboard && Array.isArray(result.leaderboard)) {
        data = result.leaderboard;
      } else if (result.data && Array.isArray(result.data)) {
        data = result.data;
      }
      
      if (data && data.length > 0) {
        processData(data);
      } else {
        console.log('No leaderboard data available');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    }
  };

  // Initialize Socket.IO connection and subscriptions
  useEffect(() => {
    let cleanup = null;

    const setupSocket = async () => {
      try {
        // Fetch initial data
        await fetchInitialData();

        // Initialize Socket.IO connection
        const socket = initializeSocket(API_URL);
        if (!socket) {
          setError('Failed to connect to socket');
          return;
        }

        // Join round leaderboard room
        joinRound(ROUND_NUMBER);
        setConnected(true);

        // Subscribe to leaderboard updates
        unsubscribeRef.current = subscribeToLeaderboard((data) => {
          console.log('🔄 Leaderboard update received:', data);
          
          // Handle full leaderboard updates from change stream
          if (data.leaderboard && Array.isArray(data.leaderboard)) {
            console.log('📊 Processing full leaderboard update with', data.leaderboard.length, 'teams');
            processData(data.leaderboard);
          } 
          // Handle legacy partial updates
          else if (data && Array.isArray(data)) {
            processData(data);
          }
          else {
            console.warn('Unexpected leaderboard update format:', data);
          }
        });

        // Subscribe to team score changes - no longer need to re-fetch
        // as full leaderboard is now emitted by change stream
        const unsubscribeScores = subscribeToScoreChanges((data) => {
          console.log('📊 Score change detected:', data);
          // Just log - full leaderboard will be updated via leaderboard:update
        });

        // Return cleanup function
        cleanup = () => {
          if (unsubscribeRef.current) unsubscribeRef.current();
          unsubscribeScores();
          leaveRound(ROUND_NUMBER);
        };
      } catch (err) {
        console.error('Socket setup error:', err);
        setError('Connection error - using polling');
        
        // Fallback: polling every 5 seconds if Socket.IO fails
        const pollInterval = setInterval(fetchInitialData, 5000);
        cleanup = () => clearInterval(pollInterval);
      }
    };

    setupSocket();

    return () => {
      if (cleanup) cleanup();
      Object.values(positionChangeTimersRef.current).forEach(timer => clearTimeout(timer));
      disconnectSocket();
    };
  }, [top10Mode]);

  // Calculate displayed teams based on top10Mode
  const displayedTeams = top10Mode ? teams.slice(0, 15) : teams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-sans px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              🏆 Live Leaderboard
            </h1>
            {connected && <p className="text-sm text-green-400 mt-2">● Connected</p>}
            {error && <p className="text-sm text-red-400 mt-2">⚠ {error}</p>}
          </div>
          <button
            onClick={() => setTop10Mode(!top10Mode)}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${top10Mode
              ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
          >
            {top10Mode ? 'Show All Teams' : 'Show Top 15'}
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-700/50">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-900/50 to-purple-900/50">
              <tr>
                <th className="p-5 text-left">Rank</th>
                <th className="p-5 text-left">Team</th>
                <th className="p-5 text-left">Score</th>
                <th className="p-5 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              <AnimatePresence>
                {displayedTeams.length > 0 ? displayedTeams.map((team, index) => {
                  const positionChange = positionChanges[team.team_id];
                  const hasPositionChange = top10Mode && typeof positionChange === 'number';

                  return (
                    <motion.tr
                      key={team.team_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-gray-700/30 hover:bg-gray-700/30"
                    >
                      <td className="p-5">
                        <div className="flex items-center">
                          <span className={`font-bold text-xl mr-3 ${index < 3 ? 'text-yellow-400' : ''}`}>
                            {index + 1}
                          </span>
                          {hasPositionChange && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{
                                scale: 1,
                                opacity: 1,
                                transition: { type: 'spring', stiffness: 500, damping: 20 }
                              }}
                              className="flex items-center"
                            >
                              {positionChange > 0 ? (
                                <motion.div className="flex items-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  <span className="ml-1 text-green-400 font-bold">{positionChange}</span>
                                </motion.div>
                              ) : positionChange < 0 ? (
                                <motion.div className="flex items-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <span className="ml-1 text-red-400 font-bold">{Math.abs(positionChange)}</span>
                                </motion.div>
                              ) : null}
                            </motion.div>
                          )}
                        </div>
                      </td>
                      <td className="p-5 font-medium">
                        <div className="flex items-center">{team.display_name}</div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-blue-300 font-semibold">
                          {team.score}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-gray-400">
                        {team.displayTime !== null ? formatTime(team.displayTime) : '--:--'}
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-400">
                      Loading leaderboard data...
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveLeaderboard;
