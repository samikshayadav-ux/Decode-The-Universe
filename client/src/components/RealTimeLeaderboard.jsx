import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Trophy, Clock, Target, AlertCircle } from 'lucide-react';
import { useLeaderboard } from '../contexts/LeaderboardContext';

/**
 * Enhanced Real-Time Leaderboard Component with Brutalist Design
 */
export function RealTimeLeaderboard({ teamId = null }) {
  const [activeRound, setActiveRound] = useState(1);
  const {
    isConnected,
    getLeaderboard,
    enterRound,
    exitRound,
    getTeamRank,
    getTeamScore,
    error
  } = useLeaderboard();

  const leaderboard = getLeaderboard(activeRound);
  const userRank = teamId ? getTeamRank(teamId, activeRound) : null;
  const userScore = teamId ? getTeamScore(teamId, activeRound) : null;

  // Join active round room
  useEffect(() => {
    enterRound(activeRound);
    return () => exitRound(activeRound);
  }, [activeRound, enterRound, exitRound]);

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const rounds = [
    { id: 1, label: 'ROUND 1' },
    { id: 2, label: 'ROUND 2' },
    { id: 3, label: 'FINAL ROUND' }
  ];

  return (
    <div className="bg-black border-4 border-white font-mono text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b-2 border-white/20 pb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            LIVE_LEADER<span className="text-accent underline">BOARD</span>
          </h2>
          <p className="text-[10px] text-white/50 font-bold tracking-[0.3em] mt-1">REAL_TIME_SYNC_ENABLED</p>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-2 border-2 border-green-500 px-3 py-1 bg-green-500/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-xs font-black tracking-widest">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-2 border-red-500 px-3 py-1 bg-red-500/10">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-red-400 text-xs font-black tracking-widest">OFFLINE</span>
            </div>
          )}
        </div>
      </div>

      {/* Round Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {rounds.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRound(r.id)}
            className={`
              px-4 py-2 border-2 font-black text-xs transition-all duration-150
              ${activeRound === r.id 
                ? 'bg-white text-black border-white' 
                : 'border-white/20 hover:border-white'}
            `}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Team Specific Stats (If logged in) */}
      {teamId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-white mb-8">
          <div className="p-6 border-b-4 md:border-b-0 md:border-r-4 border-white">
            <p className="text-[10px] font-black tracking-widest opacity-50 uppercase mb-2">YOUR_POSITION</p>
            <p className="text-4xl font-black text-yellow-400 italic">#{userRank || '--'}</p>
          </div>
          <div className="p-6 border-b-4 md:border-b-0 md:border-r-4 border-white bg-white text-black">
            <p className="text-[10px] font-black tracking-widest opacity-50 uppercase mb-2">CURRENT_SCORE</p>
            <p className="text-4xl font-black italic">{userScore !== null ? userScore.toString().padStart(3, '0') : '000'}</p>
          </div>
          <div className="p-6">
            <p className="text-[10px] font-black tracking-widest opacity-50 uppercase mb-2">TOTAL_PARTICIPANTS</p>
            <p className="text-4xl font-black italic">{leaderboard.length.toString().padStart(2, '0')}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/20 border-2 border-red-500 p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-xs font-black text-red-500 uppercase">SIGNAL_INTERFERENCE: {error}</span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="border-4 border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white/5 border-b-2 border-white">
                <th className="p-4 text-[10px] font-black tracking-[0.2em] uppercase border-r-2 border-white w-16">RANK</th>
                <th className="p-4 text-[10px] font-black tracking-[0.2em] uppercase border-r-2 border-white">TEAM_IDENTIFIER</th>
                <th className="p-4 text-[10px] font-black tracking-[0.2em] uppercase border-r-2 border-white w-24">SCORE</th>
                <th className="p-4 text-[10px] font-black tracking-[0.2em] uppercase w-32">TIME_TAKEN</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map((entry, idx) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={entry.teamId}
                      className={`
                        border-b border-white/10 hover:bg-white/5 transition-colors
                        ${teamId === entry.teamId ? 'bg-accent/10 border-l-4 border-l-accent' : ''}
                        ${idx === 0 ? 'bg-yellow-400/5' : ''}
                      `}
                    >
                      <td className="p-4 border-r-2 border-white font-black italic text-xl">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="p-4 border-r-2 border-white">
                        <div className="flex items-center justify-between">
                          <span className="font-black uppercase tracking-tight">{entry.teamName}</span>
                          {entry.status === 'completed' && (
                            <span className="text-[8px] bg-green-500 text-black px-1 font-black">FINISHED</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r-2 border-white font-black text-xl text-accent text-center">
                        {entry.score}
                      </td>
                      <td className="p-4 font-black tabular-nums text-sm">
                        {formatTime(entry.totalTimeSpent)}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-16 text-center">
                      <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-20 italic">
                        {isConnected ? 'awaiting_data_sequence...' : 'link_offline'}
                      </span>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center opacity-40">
        <p className="text-[9px] font-black uppercase tracking-widest">TOP_10_RECORDS_DISPLAYED</p>
        <p className="text-[9px] font-black uppercase tracking-widest">[ DECODE_SEQUENCE_V.1.04 ]</p>
      </div>
    </div>
  );
}

/**
 * Minimal Leaderboard Component (Compact View)
 */
export function CompactLeaderboard({ roundNumber = 1, limit = 5 }) {
  const { isConnected, getLeaderboard } = useLeaderboard();
  const leaderboard = getLeaderboard(roundNumber).slice(0, limit);

  return (
    <div className="bg-black border-4 border-white font-mono text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-tighter">ROUND_{roundNumber}_TOP</h3>
        {isConnected && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      </div>
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="h-20 flex items-center justify-center border-2 border-white/10 italic text-[10px] opacity-20 uppercase font-black">
            SYNCING...
          </div>
        ) : (
          leaderboard.map((entry, idx) => (
            <div
              key={entry.teamId}
              className="flex justify-between items-center p-2 border-2 border-white/20 hover:border-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-black italic text-yellow-400">#{idx + 1}</span>
                <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">{entry.teamName}</span>
              </div>
              <span className="text-sm font-black text-accent">{entry.score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Leaderboard Stats Component
 */
export function LeaderboardStats({ roundNumber = 1 }) {
  const { getLeaderboard } = useLeaderboard();
  const leaderboard = getLeaderboard(roundNumber);

  const stats = {
    totalTeams: leaderboard.length,
    maxScore: leaderboard.length > 0 ? Math.max(...leaderboard.map((t) => t.score)) : 0,
    completed: leaderboard.filter((t) => t.status === 'completed').length
  };

  return (
    <div className="grid grid-cols-3 border-4 border-white font-mono text-white overflow-hidden bg-black">
      <div className="p-4 border-r-2 border-white flex flex-col items-center">
        <span className="text-[8px] font-black opacity-40 mb-1">TEAMS</span>
        <span className="text-xl font-black italic">{stats.totalTeams.toString().padStart(2, '0')}</span>
      </div>
      <div className="p-4 border-r-2 border-white flex flex-col items-center bg-white text-black">
        <span className="text-[8px] font-black opacity-40 mb-1 text-black/50">MAX_SCR</span>
        <span className="text-xl font-black italic">{stats.maxScore.toString().padStart(3, '0')}</span>
      </div>
      <div className="p-4 flex flex-col items-center">
        <span className="text-[8px] font-black opacity-40 mb-1">DONE</span>
        <span className="text-xl font-black italic">{stats.completed.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}

export default RealTimeLeaderboard;

