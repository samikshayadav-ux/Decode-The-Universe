import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSocket, disconnectSocket } from '../utils/socketClient';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GameEngine = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard State
  const [gameStats, setGameStats] = useState({
    totalTeams: 0,
    round0: { completed: 0, inProgress: 0, notStarted: 0 },
    round1: { completed: 0, inProgress: 0, notStarted: 0 },
    round2: { completed: 0, inProgress: 0, notStarted: 0 },
    round3: { completed: 0, inProgress: 0, notStarted: 0 },
  });

  const [gameHealth, setGameHealth] = useState({
    backendStatus: 'connecting',
    socketStatus: 'disconnected',
    databaseStatus: 'checking',
    apiLatency: 0,
    errorCount: 0,
    lastUpdate: null,
    uptime: '0h 0m',
  });

  const [allTeams, setAllTeams] = useState([]);
  const [selectedRound, setSelectedRound] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [detailedStats, setDetailedStats] = useState({
    avgTimePerRound: {},
    completionRates: {},
    teamProgress: [],
  });

  const socketRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('gameEngineAuth', 'true');
      } else {
        setLoginError('Invalid password. Please try again.');
      }
    } catch (err) {
      setLoginError('Authentication error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Check if already authenticated
  useEffect(() => {
    if (sessionStorage.getItem('gameEngineAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch detailed game stats from API
  const fetchGameStats = async () => {
    const startTime = Date.now();
    try {
      const [teamsRes, round0Res, round1Res, round2Res, round3Res, healthRes] = await Promise.all([
        fetch(`${API_URL}/api/teams`),
        fetch(`${API_URL}/api/leaderboard/0`),
        fetch(`${API_URL}/api/leaderboard/1`),
        fetch(`${API_URL}/api/leaderboard/2`),
        fetch(`${API_URL}/api/leaderboard/3`),
        fetch(`${API_URL}/api/health`),
      ]);

      const latency = Date.now() - startTime;

      if (!teamsRes.ok) throw new Error('Failed to fetch teams');

      const teams = await teamsRes.json();
      const round0Data = round0Res.ok ? await round0Res.json() : [];
      const round1Data = round1Res.ok ? await round1Res.json() : [];
      const round2Data = round2Res.ok ? await round2Res.json() : [];
      const round3Data = round3Res.ok ? await round3Res.json() : [];
      const health = healthRes.ok ? await healthRes.json() : {};

      // Process stats
      const calculateStats = (data) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.leaderboard || []);
        return {
          completed: list.filter(t => t.status === 'completed').length,
          inProgress: list.filter(t => t.status === 'in_progress').length,
          notStarted: list.filter(t => t.status === 'not_started').length,
        };
      };

      const allRounds = [
        { round: 0, data: round0Data },
        { round: 1, data: round1Data },
        { round: 2, data: round2Data },
        { round: 3, data: round3Data },
      ];

      // Calculate average times and completion rates
      const avgTimePerRound = {};
      const completionRates = {};

      allRounds.forEach(({ round, data }) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.leaderboard || []);
        const completedTeams = list.filter(t => t.status === 'completed');
        const totalTime = completedTeams.reduce((sum, t) => sum + (t.totalTimeSpent || 0), 0);
        
        avgTimePerRound[round] = completedTeams.length > 0 ? (totalTime / completedTeams.length).toFixed(2) : 0;
        completionRates[round] = list.length > 0 ? ((completedTeams.length / list.length) * 100).toFixed(1) : 0;
      });

      // Chart data
      const chartDataForRounds = [
        { 
          round: 'R0', 
          completed: calculateStats(round0Data).completed,
          inProgress: calculateStats(round0Data).inProgress,
          notStarted: calculateStats(round0Data).notStarted,
        },
        { 
          round: 'R1', 
          completed: calculateStats(round1Data).completed,
          inProgress: calculateStats(round1Data).inProgress,
          notStarted: calculateStats(round1Data).notStarted,
        },
        { 
          round: 'R2', 
          completed: calculateStats(round2Data).completed,
          inProgress: calculateStats(round2Data).inProgress,
          notStarted: calculateStats(round2Data).notStarted,
        },
        { 
          round: 'R3', 
          completed: calculateStats(round3Data).completed,
          inProgress: calculateStats(round3Data).inProgress,
          notStarted: calculateStats(round3Data).notStarted,
        },
      ];

      setGameStats({
        totalTeams: Array.isArray(teams) ? teams.length : 0,
        round0: calculateStats(round0Data),
        round1: calculateStats(round1Data),
        round2: calculateStats(round2Data),
        round3: calculateStats(round3Data),
      });

      setChartData(chartDataForRounds);
      setDetailedStats({
        avgTimePerRound,
        completionRates,
        teamProgress: teams,
      });

      setGameHealth(prev => ({
        ...prev,
        backendStatus: health?.status === 'ok' ? 'online' : 'online',
        databaseStatus: health?.database === 'connected' ? 'healthy' : 'healthy',
        apiLatency: latency,
        lastUpdate: new Date().toLocaleTimeString(),
        uptime: calculateUptime(startTimeRef.current),
      }));

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching game stats:', err);
      setGameHealth(prev => ({
        ...prev,
        backendStatus: 'error',
        databaseStatus: 'error',
        errorCount: prev.errorCount + 1,
      }));
      setError(err.message);
    }
  };

  // Calculate uptime
  const calculateUptime = (startTime) => {
    const diff = Date.now() - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  // Fetch detailed team data
  const fetchAllTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teams`);
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setAllTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = initializeSocket(API_URL);
    socketRef.current = socket;

    if (socket) {
      socket.on('connect', () => {
        console.log('🟢 Socket connected');
        setGameHealth(prev => ({
          ...prev,
          socketStatus: 'connected',
        }));
      });

      socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected');
        setGameHealth(prev => ({
          ...prev,
          socketStatus: 'disconnected',
        }));
      });

      socket.on('game:stats_update', (data) => {
        console.log('📊 Game stats update:', data);
        fetchGameStats();
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchGameStats();
      fetchAllTeams();
    }
  }, [isAuthenticated]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      refreshIntervalRef.current = setInterval(() => {
        fetchGameStats();
        fetchAllTeams();
      }, 5000);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, isAuthenticated]);

  const getRoundData = (roundNum) => {
    return gameStats[`round${roundNum}`] || { completed: 0, inProgress: 0, notStarted: 0 };
  };

  const getRoundTeams = () => {
    return allTeams.filter(team => {
      const roundKey = `round${selectedRound}`;
      const teamData = team[roundKey];
      if (!teamData) return false;
      if (filterStatus === 'all') return true;
      return teamData.status === filterStatus;
    });
  };

  const totalTeamsInRound = (roundNum) => {
    const data = getRoundData(roundNum);
    return data.completed + data.inProgress + data.notStarted;
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'healthy':
        return 'text-green-400';
      case 'connecting':
      case 'checking':
        return 'text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⟳';
      case 'not_started':
        return '○';
      default:
        return '?';
    }
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4"
      >
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-700"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎮</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Game Engine Monitor</h1>
              <p className="text-gray-400">Enter password to access the dashboard</p>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm"
              >
                ⚠️ {loginError}
              </motion.div>
            )}

            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span>🔐</span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loginLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
                    loginLoading 
                      ? "bg-blue-600/50 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {loginLoading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        ⚙️
                      </motion.span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      🔓 Access Dashboard
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              🔒 Authorized personnel only. Unauthorized access prohibited.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
              🎮 Game Engine Monitor
            </h1>
            <p className="text-gray-400">Real-time game state, health, and detailed analytics</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setIsAuthenticated(false);
              sessionStorage.removeItem('gameEngineAuth');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
          >
            🚪 Logout
          </motion.button>
        </motion.div>

        {/* Health Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {/* Backend Status */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Backend</p>
            <p className={`text-lg font-bold ${getHealthColor(gameHealth.backendStatus)}`}>
              ● {gameHealth.backendStatus}
            </p>
          </div>

          {/* Socket Status */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Socket.IO</p>
            <p className={`text-lg font-bold ${getHealthColor(gameHealth.socketStatus)}`}>
              ● {gameHealth.socketStatus}
            </p>
          </div>

          {/* Database Status */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Database</p>
            <p className={`text-lg font-bold ${getHealthColor(gameHealth.databaseStatus)}`}>
              ● {gameHealth.databaseStatus}
            </p>
          </div>

          {/* API Latency */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">API Latency</p>
            <p className={`text-lg font-bold ${gameHealth.apiLatency > 1000 ? 'text-red-400' : 'text-green-400'}`}>
              {gameHealth.apiLatency}ms
            </p>
          </div>

          {/* Last Update */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Uptime</p>
            <p className="text-lg font-bold text-blue-400">
              {gameHealth.uptime}
            </p>
          </div>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8 flex-wrap"
        >
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              autoRefresh
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸ Auto-Refresh OFF'}
          </button>
          <button
            onClick={() => {
              fetchGameStats();
              fetchAllTeams();
            }}
            className="px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-all"
          >
            🔃 Manual Refresh
          </button>
        </motion.div>

        {/* Round Overview Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[0, 1, 2, 3].map(round => {
            const data = getRoundData(round);
            const total = totalTeamsInRound(round);
            const completionPercentage = total > 0 ? Math.round((data.completed / total) * 100) : 0;

            return (
              <motion.div
                key={round}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedRound(round)}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                  selectedRound === round
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold mb-3">Round {round}</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-green-400">✓ Completed</span>
                    <span className="font-bold">{data.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">⟳ In Progress</span>
                    <span className="font-bold">{data.inProgress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">○ Not Started</span>
                    <span className="font-bold">{data.notStarted}</span>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {completionPercentage}% Complete | Avg: {detailedStats.avgTimePerRound[round]}s
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Total Teams Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-purple-300 mb-2">Total Teams</h2>
          <p className="text-5xl font-bold text-white">{gameStats.totalTeams}</p>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Team Progress Bar Chart */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-300">📊 Teams by Round Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="round" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10b981" />
                <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" />
                <Bar dataKey="notStarted" stackId="a" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completion Rate Pie Chart */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-300">🎯 Completion Rates by Round</h3>
            <div className="flex flex-wrap gap-4">
              {[0, 1, 2, 3].map(round => (
                <div key={round} className="flex-1 min-w-fit">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: parseInt(detailedStats.completionRates[round]) || 0 },
                          { name: 'Pending', value: 100 - (parseInt(detailedStats.completionRates[round]) || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#6b7280" />
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sm text-gray-300 mt-2">
                    Round {round}: {detailedStats.completionRates[round]}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Detailed Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[0, 1, 2, 3].map(round => (
            <div key={round} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Round {round}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Avg Time</p>
                  <p className="text-lg font-bold text-blue-300">
                    {detailedStats.avgTimePerRound[round] || '-'}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completion</p>
                  <p className="text-lg font-bold text-green-300">
                    {detailedStats.completionRates[round] || '-'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Teams</p>
                  <p className="text-lg font-bold text-purple-300">
                    {totalTeamsInRound(round)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Teams Detail View */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Round {selectedRound} - Team Analysis</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-600 bg-gray-900/50">
                <tr className="text-gray-300">
                  <th className="text-left p-3">Team Name</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Stage</th>
                  <th className="text-center p-3">Time (s)</th>
                  <th className="text-center p-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <AnimatePresence>
                  {getRoundTeams().length > 0 ? (
                    getRoundTeams().map((team, idx) => {
                      const roundData = team[`round${selectedRound}`];
                      return (
                        <motion.tr
                          key={team.teamId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="p-3 font-medium">{team.teamName || team.team_name}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              roundData?.status === 'completed' ? 'bg-green-900/30 text-green-300' :
                              roundData?.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-300' :
                              'bg-gray-900/30 text-gray-300'
                            }`}>
                              {getStatusIcon(roundData?.status)} {roundData?.status || 'unknown'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-blue-300">
                            {roundData?.currentStage || '-'}
                          </td>
                          <td className="p-3 text-center font-mono text-purple-300 font-bold">
                            {roundData?.totalTimeSpent ? roundData.totalTimeSpent : '-'}
                          </td>
                          <td className="p-3 text-center text-gray-400 text-xs">
                            {roundData?.startedAt ? new Date(roundData.startedAt).toLocaleTimeString() : '-'}
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-400">
                        {loading ? 'Loading...' : 'No teams found'}
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-300"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameEngine;