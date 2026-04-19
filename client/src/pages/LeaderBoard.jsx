import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Trophy, Clock, Target, Layers } from 'lucide-react';
import { initializeSocket, joinRound, leaveRound, subscribeToLeaderboard, subscribeToScoreChanges, disconnectSocket } from '../utils/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LeaderBoard = () => {
  const [teams, setTeams] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
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
    const adjustedSeconds = Math.floor(seconds);
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
      team_id: team.team_id || team.teamId,
      team_name: team.team_name || team.teamName,
      score: team.score || 0,
      round: team.currentRound || currentRound,
      displayTime: team.displayTime || team.totalTimeSpent || 0,
      status: team.status,
      updatedAt: team.updatedAt || team.updated_at
    }));

    // Sorting logic: Higher score first, then lower time
    const sortedTeams = [...processedTeams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.displayTime - b.displayTime;
    });

    // Track position changes
    const newPositionChanges = {};
    sortedTeams.forEach((team, currentIndex) => {
      const id = team.team_id;
      const previousIndex = previousPositionsRef.current[id];
      if (previousIndex !== undefined && previousIndex !== currentIndex) {
        const change = previousIndex - currentIndex;
        newPositionChanges[id] = change;

        if (positionChangeTimersRef.current[id]) {
          clearTimeout(positionChangeTimersRef.current[id]);
        }

        positionChangeTimersRef.current[id] = setTimeout(() => {
          setPositionChanges(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
          delete positionChangeTimersRef.current[id];
        }, 30000);
      }
    });

    const currentPositions = {};
    sortedTeams.forEach((team, index) => {
      currentPositions[team.team_id] = index;
    });
    previousPositionsRef.current = currentPositions;

    setPositionChanges(newPositionChanges);
    setTeams(sortedTeams);
  }, [currentRound]);

  /**
   * Initialize Socket.IO connection and setup event listeners
   */
  useEffect(() => {
    let socket;
    const setupSocket = async () => {
      try {
        await fetchLeaderboard(currentRound);

        socket = initializeSocket(API_URL);
        if (!socket) {
          setError('Failed to connect to socket');
          return;
        }

        joinRound(currentRound);
        setConnected(true);

        unsubscribeRef.current = subscribeToLeaderboard((data) => {
          // Handle both array format and wrapped object format
          const leaderboardData = Array.isArray(data) ? data : (data.leaderboard || []);
          processLeaderboard(leaderboardData);
        });

        // Use standard score change listener as fallback/multiplier
        const unsubscribeScores = subscribeToScoreChanges(() => {
          fetchLeaderboard(currentRound);
        });

        return () => {
          if (unsubscribeRef.current) unsubscribeRef.current();
          if (unsubscribeScores) unsubscribeScores();
          leaveRound(currentRound);
        };
      } catch (err) {
        console.error('Socket setup error:', err);
        setError('Using fallback polling');
        const pollInterval = setInterval(() => fetchLeaderboard(currentRound), 5000);
        return () => clearInterval(pollInterval);
      }
    };

    const cleanupPromise = setupSocket();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
      Object.values(positionChangeTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [currentRound, fetchLeaderboard, processLeaderboard]);

  const rounds = [
    { id: 1, name: 'ROUND 1' },
    { id: 2, name: 'ROUND 2' },
    { id: 3, name: 'FINAL ROUND' }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono grid-bg p-4 md:p-8 relative overflow-hidden">
      <div className="scanline" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b-4 border-white pb-8">
          <div>
            <div className="flex items-center gap-2 bg-accent text-black px-3 py-1 text-xs font-black mb-4 w-fit">
              <Trophy size={14} />
              <span>LIVE_RANKINGS // SYNC_ACTIVE</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none italic uppercase">
              LEADER<span className="text-accent underline">BOARD</span>
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 border-2 ${connected ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} font-black text-xs uppercase tracking-widest`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-50'}`} />
              {connected ? 'SOCKET_CONNECTED' : 'DISCONNECTED'}
            </div>
            {error && <span className="text-[10px] text-red-400 font-bold uppercase">{error}</span>}
          </div>
        </div>

        {/* Round Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setCurrentRound(round.id)}
              className={`
                px-6 py-3 font-black text-sm transition-all duration-150 border-2
                ${currentRound === round.id 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-white border-white/20 hover:border-white'}
              `}
            >
              {round.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Table Container */}
        <div className="border-4 border-white bg-black overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-4 border-white bg-white/5">
                <th className="p-6 text-xs font-black tracking-[0.2em] uppercase border-r-2 border-white/20 w-24">
                  <div className="flex items-center gap-2"><Activity size={14} /> RANK</div>
                </th>
                <th className="p-6 text-xs font-black tracking-[0.2em] uppercase border-r-2 border-white/20">
                  <div className="flex items-center gap-2"><Target size={14} /> TEAM</div>
                </th>
                <th className="p-6 text-xs font-black tracking-[0.2em] uppercase border-r-2 border-white/20 w-32">
                  <div className="flex items-center gap-2"><Layers size={14} /> ROUND</div>
                </th>
                <th className="p-6 text-xs font-black tracking-[0.2em] uppercase border-r-2 border-white/20 w-32">
                  <div className="flex items-center gap-2"><Trophy size={14} /> SCORE</div>
                </th>
                <th className="p-6 text-xs font-black tracking-[0.2em] uppercase w-40">
                  <div className="flex items-center gap-2"><Clock size={14} /> TIME</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-white/10">
              <AnimatePresence mode="popLayout">
                {teams.length > 0 ? (
                  teams.map((team, index) => {
                    const positionChange = positionChanges[team.team_id];
                    const isTop3 = index < 3;
                    const borderClass = index === 0 ? 'border-l-8 border-yellow-400' : 
                                       index === 1 ? 'border-l-8 border-gray-400' : 
                                       index === 2 ? 'border-l-8 border-amber-700' : '';

                    return (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={team.team_id}
                        className={`group hover:bg-white/5 transition-colors ${borderClass}`}
                      >
                        <td className="p-6 border-r-2 border-white/20">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`text-4xl font-black italic leading-none ${isTop3 ? 'text-yellow-400' : 'text-white'}`}>
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                            {positionChange !== undefined && positionChange !== 0 && (
                              <span className={`text-[10px] font-black ${positionChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {positionChange > 0 ? '▲' : '▼'} {Math.abs(positionChange)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6 border-r-2 border-white/20">
                          <div className="flex flex-col">
                            <span className="text-xl font-black uppercase tracking-tight group-hover:text-accent transition-colors">
                              {team.team_name}
                            </span>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                              ID: {team.team_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 border-r-2 border-white/20 font-black text-lg">
                          {team.round === 3 ? 'FINAL' : `R${team.round}`}
                        </td>
                        <td className="p-6 border-r-2 border-white/20 font-black text-2xl text-accent">
                          {team.score.toString().padStart(3, '0')}
                        </td>
                        <td className="p-6 font-black text-xl tabular-nums">
                          {formatTime(team.displayTime)}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-24 text-center">
                      {loading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-accent border-t-transparent animate-spin" />
                          <span className="text-sm font-black tracking-widest uppercase opacity-50">Fetching_Registry...</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black tracking-[0.5em] uppercase opacity-20">No_Data_Sequence_Found</span>
                      )}
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-8 opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-0.5 bg-yellow-400" /> TOP_01 GOLD_CLASS
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-0.5 bg-gray-400" /> TOP_02 SILVER_CLASS
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-0.5 bg-amber-700" /> TOP_03 BRONZE_CLASS
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;