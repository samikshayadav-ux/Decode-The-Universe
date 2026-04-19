import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { initializeSocket, joinRound, leaveRound, subscribeToLeaderboard } from '../utils/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LeaderBoard = () => {
  const [teams, setTeams] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  
  const previousPositionsRef = useRef({});
  const unsubscribeRef = useRef(null);

  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const adjustedSeconds = Math.floor(seconds);
    const mins = Math.floor(adjustedSeconds / 60);
    const secs = adjustedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const fetchLeaderboard = useCallback(async (roundNum = currentRound) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/leaderboard/${roundNum}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      processLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [currentRound]);

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
    }));

    const sortedTeams = [...processedTeams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.displayTime - b.displayTime;
    });

    const newPositionChanges = {};
    sortedTeams.forEach((team, currentIndex) => {
      const id = team.team_id;
      const previousIndex = previousPositionsRef.current[id];
      if (previousIndex !== undefined && previousIndex !== currentIndex) {
        newPositionChanges[id] = previousIndex - currentIndex;
      }
      previousPositionsRef.current[id] = currentIndex;
    });

    setTeams(sortedTeams);
  }, [currentRound]);

  useEffect(() => {
    let socket;
    const setupSocket = async () => {
      try {
        await fetchLeaderboard(currentRound);
        socket = initializeSocket(API_URL);
        if (socket) {
          joinRound(currentRound);
          setConnected(true);
          unsubscribeRef.current = subscribeToLeaderboard((data) => {
            const leaderboardData = Array.isArray(data) ? data : (data.leaderboard || []);
            processLeaderboard(leaderboardData);
          });
        }
      } catch (err) {
        console.error('Socket setup error:', err);
      }
    };

    setupSocket();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      leaveRound(currentRound);
    };
  }, [currentRound, fetchLeaderboard, processLeaderboard]);

  const rounds = [
    { id: 1, name: 'PHASE_01' },
    { id: 2, name: 'PHASE_02' },
    { id: 3, name: 'FINAL' }
  ];

  return (
    <div className="min-h-screen bg-bg text-[#F5F5F5] font-sans grid-bg-tech p-6 md:p-12 relative overflow-hidden">
      <div className="scanline opacity-5" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Minimal Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 px-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-[0.4em]">
              <Terminal size={14} />
              <span>DATA_STREAM // GLOBAL_RANKINGS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
              LEADER<span className="text-accent underline decoration-white/10">BOARD</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-surface border border-white/10 px-5 py-2.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">
              {connected ? 'NODE_SYNCED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Phase Selector */}
        <div className="flex gap-1 bg-surface border border-white/5 p-1 mb-12 w-fit">
          {rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setCurrentRound(round.id)}
              className={`px-8 py-3 text-[10px] font-black tracking-widest transition-all ${
                currentRound === round.id 
                  ? 'bg-white text-black' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {round.name}
            </button>
          ))}
        </div>

        {/* Main Table */}
        <div className="neo-box overflow-hidden mb-12 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black/10 bg-white text-black">
                <th className="p-6 text-[10px] font-black tracking-widest uppercase w-24">RANK</th>
                <th className="p-6 text-[10px] font-black tracking-widest uppercase text-left">TEAM_ENTITY</th>
                <th className="p-6 text-[10px] font-black tracking-widest uppercase text-center w-32">SCORE</th>
                <th className="p-6 text-[10px] font-black tracking-widest uppercase text-right w-40">ELAPSED_TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-mono bg-white text-black">
              <AnimatePresence mode="popLayout">
                {teams.map((team, index) => (
                  <motion.tr
                    layout
                    key={team.team_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group hover:bg-bg/5 transition-colors ${index < 3 ? 'bg-black/[0.02]' : ''}`}
                  >
                    <td className="p-6">
                      <span className={`text-3xl font-black italic tracking-tighter ${index === 0 ? 'text-accent' : 'text-black'}`}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-black uppercase tracking-tight group-hover:text-accent transition-colors">
                          {team.team_name}
                        </span>
                        <span className="text-[10px] opacity-30 font-bold">UID: {team.team_id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="bg-bg/5 px-4 py-1 border border-black/10 text-xl font-black">
                        {team.score.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="p-6 text-right font-black text-xl tabular-nums tracking-tighter">
                      {formatTime(team.displayTime)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {teams.length === 0 && !loading && (
            <div className="p-20 text-center text-[10px] font-black tracking-[0.5em] opacity-20 uppercase">
              NO_ENTRIES_IN_DATAFEED
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center opacity-30 font-mono text-[8px] font-black tracking-[0.4em] uppercase">
          <div>TIME_SYNC_UTC: {new Date().toISOString().split('T')[1].slice(0, 8)}</div>
          <div className="flex items-center gap-2">
             <Trophy size={10} />
             <span>DECODE_PROTOCOL_v4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;