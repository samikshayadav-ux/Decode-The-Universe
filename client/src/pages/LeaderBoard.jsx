import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSocket, joinRound, leaveRound, subscribeToLeaderboard } from '../utils/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LeaderBoard = () => {
  const [teams, setTeams] = useState([]);
  const [round, setRound] = useState(1);
  const [connected, setConnected] = useState(false);

  const formatTime = useCallback((s) => {
    if (!s && s !== 0) return '00:00';
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(Math.floor(s % 60)).toString().padStart(2, '0')}`;
  }, []);

  const fetchLB = useCallback(async (r = round) => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard/${r}`);
      if (res.ok) setTeams(await res.json());
    } catch (e) {}
  }, [round]);

  useEffect(() => {
    fetchLB();
    const socket = initializeSocket(API_URL);
    if (socket) {
      joinRound(round);
      setConnected(true);
      const unsub = subscribeToLeaderboard((d) => {
        const lb = Array.isArray(d) ? d : (d.leaderboard || []);
        setTeams(lb.sort((a,b) => b.score - a.score || a.totalTimeSpent - b.totalTimeSpent));
      });
      return () => { unsub(); leaveRound(round); };
    }
  }, [round, fetchLB]);

  return (
    <div className="min-h-screen bg-black text-white p-12 relative overflow-hidden font-sans">
      <div className="absolute inset-0 starfield" />
      <div className="orbit-arc w-[900px] h-[900px] -top-1/4 -right-1/4" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-16">
          <div className="space-y-4">
            <div className="text-[10px] font-black tracking-[0.6em] text-accent uppercase">Telemetry_Stream</div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
              LEADER<span className="text-accent underline underline-offset-8">BOARD</span>
            </h1>
          </div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${connected ? 'text-accent' : 'text-red-500'}`}>
            {connected ? 'SYNC_ACTIVE' : 'OFFLINE'}
          </div>
        </div>

        <div className="flex gap-1 mb-12">
          {[1, 2, 3].map(i => (
            <button
              key={i}
              onClick={() => setRound(i)}
              className={`px-10 py-4 text-[10px] font-black tracking-widest transition-all ${
                round === i ? 'bg-white text-black' : 'hover:bg-white/5 opacity-40'
              }`}
            >
              PHASE_0{i}
            </button>
          ))}
        </div>

        <div className="minimal-box">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-black tracking-widest opacity-40">
                <th className="p-8">RANK</th>
                <th className="p-8">ENTITY</th>
                <th className="p-8 text-center">SCORE</th>
                <th className="p-8 text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <AnimatePresence mode="popLayout">
                {teams.map((t, i) => (
                  <motion.tr
                    layout
                    key={t.teamId || t.team_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-8 text-3xl font-black italic tracking-tighter">
                      {(i + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-8">
                      <div className="text-lg font-black uppercase tracking-tight">{t.teamName || t.team_name}</div>
                      <div className="text-[10px] opacity-20 uppercase tracking-widest">UID_{ (t.teamId || t.team_id).slice(0,6) }</div>
                    </td>
                    <td className="p-8 text-center text-2xl font-black text-accent">{t.score}</td>
                    <td className="p-8 text-right text-xl font-black">{formatTime(t.totalTimeSpent || t.displayTime)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {teams.length === 0 && <div className="p-20 text-center text-[10px] font-black opacity-20 uppercase tracking-[0.5em]">No Data</div>}
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;