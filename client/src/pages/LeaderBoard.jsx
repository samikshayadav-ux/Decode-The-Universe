import React, { useEffect, useState, useRef, useCallback } from 'react';
import { initializeSocket, joinRound, leaveRound, subscribeToLeaderboard, subscribeToScoreChanges, disconnectSocket } from '../utils/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LeaderBoard = () => {
  const [teams, setTeams] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const previousPositionsRef = useRef({});
  const positionChangeTimersRef = useRef({});
  const [positionChanges, setPositionChanges] = useState({});
  const unsubscribeRef = useRef(null);

  /**
   * Format time in MM:SS format
   */
  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const adjustedSeconds = seconds + 1;
    const mins = Math.floor(adjustedSeconds / 60);
    const secs = adjustedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Fetch leaderboard data from backend API
   */
  const fetchLeaderboard = useCallback(async (roundNum = currentRound) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/leaderboard/${roundNum}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setError(null);
      processLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [currentRound]);

  /**
   * Process and sort leaderboard data
   */
  const processLeaderboard = useCallback((data) => {
    if (!data || data.length === 0) {
      setTeams([]);
      return;
    }

    const processedTeams = data.map(team => ({
      team_id: team.team_id,
      team_name: team.team_name,
      score: team.score || 0,
      displayTime: team.answers?.length > 0
        ? (team.completed_at ? team.total_time_spent : team.time_at_last_submission)
        : null,
      sortTime: team.answers?.length > 0
        ? (team.completed_at ? team.total_time_spent : team.time_at_last_submission) || Infinity
        : Infinity,
      lastSubmittedAt: team.updated_at
    }));

    const sortedTeams = [...processedTeams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
      return new Date(a.lastSubmittedAt) - new Date(b.lastSubmittedAt);
    });

    // Track position changes
    const newPositionChanges = {};
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

    const currentPositions = {};
    sortedTeams.forEach((team, index) => {
      currentPositions[team.team_id] = index;
    });
    previousPositionsRef.current = currentPositions;

    setPositionChanges(newPositionChanges);
    setTeams(sortedTeams);
  }, []);

  /**
   * Initialize Socket.IO connection and setup event listeners
   */
  useEffect(() => {
    const setupSocket = async () => {
      try {
        // Fetch initial data
        await fetchLeaderboard(currentRound);

        // Initialize Socket.IO connection
        const socket = initializeSocket(API_URL);
        if (!socket) {
          setError('Failed to connect to socket');
          return;
        }

        // Join round leaderboard room
        joinRound(currentRound);
        setConnected(true);

        // Subscribe to leaderboard updates
        unsubscribeRef.current = subscribeToLeaderboard((data) => {
          console.log('🔄 Leaderboard update received:', data);
          if (data && Array.isArray(data)) {
            processLeaderboard(data);
          }
        });

        // Subscribe to team score changes (for polling fallback)
        const unsubscribeScores = subscribeToScoreChanges(() => {
          console.log('📊 Score change detected');
          fetchLeaderboard(currentRound);
        });

        return () => {
          if (unsubscribeRef.current) unsubscribeRef.current();
          unsubscribeScores();
          leaveRound(currentRound);
        };
      } catch (err) {
        console.error('Socket setup error:', err);
        setError('Connection error - using polling');
        
        // Fallback: polling every 5 seconds if Socket.IO fails
        const pollInterval = setInterval(() => fetchLeaderboard(currentRound), 5000);
        return () => clearInterval(pollInterval);
      }
    };

    const cleanup = setupSocket();
    return () => {
      if (cleanup) cleanup();
      Object.values(positionChangeTimersRef.current).forEach(timer => clearTimeout(timer));
      disconnectSocket();
    };
  }, [currentRound, fetchLeaderboard, processLeaderboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            🏆 Global Leaderboard
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {connected && <span className="text-green-400">● Live Connected</span>}
            {error && <span className="text-red-400">⚠ {error}</span>}
            {loading && !teams.length && <span className="text-yellow-400">⟳ Loading...</span>}
          </div>
        </div>

        {/* Round selector */}
        <div className="mb-6 flex gap-3">
          {[0, 1, 2, 3].map(round => (
            <button
              key={round}
              onClick={() => setCurrentRound(round)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentRound === round
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Round {round}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-700/50">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 sticky top-0">
              <tr>
                <th className="p-4 text-left text-gray-300">Rank</th>
                <th className="p-4 text-left text-gray-300">Team Name</th>
                <th className="p-4 text-center text-gray-300">Score</th>
                <th className="p-4 text-right text-gray-300">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {teams.length > 0 ? (
                teams.map((team, index) => {
                  const positionChange = positionChanges[team.team_id];
                  const hasPositionChange = typeof positionChange === 'number' && positionChange !== 0;

                  return (
                    <tr
                      key={team.team_id}
                      className="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' :
                            'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          {hasPositionChange && (
                            <span className={`text-xs font-bold ${positionChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {positionChange > 0 ? '↑' : '↓'} {Math.abs(positionChange)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{team.team_name}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/50 text-blue-200 font-semibold">
                          {team.score}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-400">
                        {team.displayTime !== null ? formatTime(team.displayTime) : '--:--'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500">
                    {loading ? 'Loading leaderboard data...' : 'No teams found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;