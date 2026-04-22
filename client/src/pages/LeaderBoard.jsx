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

  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const adjustedSeconds = seconds + 1;
    const mins = Math.floor(adjustedSeconds / 60);
    const secs = adjustedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const processLeaderboard = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setTeams([]);
      return;
    }

    const processedTeams = data.map((team, index) => ({
      // FIX 1: Guaranteed unique teamId with index fallback
      teamId: team.teamId || team.team_id || `team-fallback-${index}`,
      teamName: team.teamName || team.team_name,
      score: team.score || 0,
      displayTime: team.answers?.length > 0
        ? (team.completedAt || team.completed_at
            ? team.totalTimeSpent || team.total_time_spent
            : team.timeAtLastSubmission || team.time_at_last_submission)
        : null,
      sortTime: team.answers?.length > 0
        ? (team.completedAt || team.completed_at
            ? team.totalTimeSpent || team.total_time_spent
            : team.timeAtLastSubmission || team.time_at_last_submission) || Infinity
        : Infinity,
      lastSubmittedAt: team.updatedAt || team.updated_at
    }));

    const sortedTeams = [...processedTeams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
      return new Date(a.lastSubmittedAt) - new Date(b.lastSubmittedAt);
    });

    const newPositionChanges = {};
    sortedTeams.forEach((team, currentIndex) => {
      const teamId = team.teamId;
      const previousIndex = previousPositionsRef.current[teamId];
      if (previousIndex !== undefined && previousIndex !== currentIndex) {
        const change = previousIndex - currentIndex;
        newPositionChanges[teamId] = change;

        if (positionChangeTimersRef.current[teamId]) {
          clearTimeout(positionChangeTimersRef.current[teamId]);
        }

        positionChangeTimersRef.current[teamId] = setTimeout(() => {
          setPositionChanges(prev => {
            const updated = { ...prev };
            delete updated[teamId];
            return updated;
          });
          delete positionChangeTimersRef.current[teamId];
        }, 60000);
      }
    });

    const currentPositions = {};
    sortedTeams.forEach((team, index) => {
      currentPositions[team.teamId] = index;
    });
    previousPositionsRef.current = currentPositions;

    setPositionChanges(newPositionChanges);
    setTeams(sortedTeams);
  }, []);

  const fetchLeaderboard = useCallback(async (roundNum = currentRound) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/leaderboard/${roundNum}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setError(null);
      
      if (result.status === 'success' && result.data && Array.isArray(result.data.leaderboard)) {
        processLeaderboard(result.data.leaderboard);
      } else {
        processLeaderboard([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [currentRound, processLeaderboard]);

  useEffect(() => {
    let unsubscribeScores = null;
    let pollInterval = null;

    const setupSocket = async () => {
      try {
        await fetchLeaderboard(currentRound);

        const socket = initializeSocket(API_URL);
        if (!socket) {
          setError('Failed to connect to socket');
          return;
        }

        joinRound(currentRound);
        setConnected(true);

        unsubscribeRef.current = subscribeToLeaderboard((data) => {
          console.log('Leaderboard update received:', data);
          if (data && Array.isArray(data)) {
            processLeaderboard(data);
          }
        });

        unsubscribeScores = subscribeToScoreChanges(() => {
          console.log('Score change detected');
          fetchLeaderboard(currentRound);
        });
      } catch (err) {
        console.error('Socket setup error:', err);
        setError('Connection error - using polling');
        pollInterval = setInterval(() => fetchLeaderboard(currentRound), 5000);
      }
    };

    setupSocket();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (unsubscribeScores) unsubscribeScores();
      if (pollInterval) clearInterval(pollInterval);
      leaveRound(currentRound);
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
            Global Leaderboard
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
                  const positionChange = positionChanges[team.teamId];
                  const hasPositionChange = typeof positionChange === 'number' && positionChange !== 0;

                  return (
                    <tr
                      key={`${team.teamId ?? 'unknown'}-${index}`} // FIX 2: Always unique key
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
                      <td className="p-4 font-medium">{team.teamName}</td>
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