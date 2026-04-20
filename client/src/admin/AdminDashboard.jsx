import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Loader2, Play, StopCircle, Users, Trophy, Clock, RefreshCw, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllRounds, setRoundLive, endRound, getAllTeams, updateTeam, deleteTeam } from "../utils/adminApi";
import { initializeSocket, subscribeToLeaderboard, disconnectSocket } from "../utils/socketClient";

// Global cache for admin dashboard data
const adminCache = {
  rounds: null,
  teams: null,
  lastFetch: {
    rounds: 0,
    teams: 0
  },
  subscribers: new Set(),
  isSubscribed: false
};

// Cache duration (3 minutes for admin data)
const CACHE_DURATION = 3 * 60 * 1000;
const DEBOUNCE_DELAY = 300;

// Optimized data fetcher with intelligent caching
const createOptimizedFetcher = () => {
  let fetchPromise = null;
  
  return async (forceRefresh = false, specificTable = null) => {
    const now = Date.now();
    
    // If already fetching, wait for that promise
    if (fetchPromise && !forceRefresh) {
      return fetchPromise;
    }
    
    // Check cache validity
    const shouldFetchRounds = forceRefresh || 
      !adminCache.rounds || 
      (now - adminCache.lastFetch.rounds) > CACHE_DURATION ||
      specificTable === 'rounds';
      
    const shouldFetchTeams = forceRefresh || 
      !adminCache.teams || 
      (now - adminCache.lastFetch.teams) > CACHE_DURATION ||
      specificTable === 'teams';
    
    // Return cached data if valid and not forcing refresh
    if (!shouldFetchRounds && !shouldFetchTeams && !forceRefresh) {
      return {
        rounds: adminCache.rounds,
        teams: adminCache.teams
      };
    }
    
    fetchPromise = (async () => {
      try {
        const promises = [];
        
        // Fetch rounds if needed
        if (shouldFetchRounds) {
          promises.push(getAllRounds());
        } else {
          promises.push(Promise.resolve(adminCache.rounds));
        }
        
        // Fetch teams if needed
        if (shouldFetchTeams) {
          promises.push(getAllTeams());
        } else {
          promises.push(Promise.resolve(adminCache.teams));
        }
        
        const results = await Promise.all(promises);
        const [roundsData, teamsData] = results;
        
        // Update cache
        if (shouldFetchRounds) {
          adminCache.rounds = roundsData || [];
          adminCache.lastFetch.rounds = now;
        }
        
        if (shouldFetchTeams) {
          adminCache.teams = teamsData || [];
          adminCache.lastFetch.teams = now;
        }
        
        // Notify all subscribers
        const result = {
          rounds: adminCache.rounds,
          teams: adminCache.teams
        };
        
        adminCache.subscribers.forEach(callback => {
          if (typeof callback === 'function') {
            try {
              callback(result);
            } catch (error) {
              console.warn('Subscriber callback error:', error);
            }
          }
        });
        
        return result;
        
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      } finally {
        fetchPromise = null;
      }
    })();
    
    return fetchPromise;
  };
};

const optimizedFetcher = createOptimizedFetcher();

const AdminDashboard = () => {
  const [rounds, setRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rounds");
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamEditForm, setTeamEditForm] = useState({
    team_name: "",
    members: []
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isComponentActive, setIsComponentActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [error, setError] = useState(null);
  
  const debounceTimerRef = useRef(null);
  const componentIdRef = useRef(Symbol('admin-dashboard'));
  const isInitializedRef = useRef(false);
  const socketUnsubscribeRef = useRef(null);

  // Optimized data subscription
  const subscribeToUpdates = useCallback((data) => {
    if (!isComponentActive) return;
    
    console.log('[Admin Dashboard] Data received:', data);
    console.log('[Admin Dashboard] Setting rounds:', data.rounds);
    console.log('[Admin Dashboard] Setting teams:', data.teams);
    setRounds(data.rounds || []);
    setTeams(data.teams || []);
    setLastUpdate(Date.now());
  }, [isComponentActive]);

  // Debounced refresh handler
  const debouncedRefresh = useCallback((specificTable = null) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (isComponentActive) {
        try {
          await optimizedFetcher(true, specificTable);
        } catch (error) {
          console.error('Debounced refresh error:', error);
        }
      }
    }, DEBOUNCE_DELAY);
  }, [isComponentActive]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      setIsComponentActive(isActive);
      
      // Refresh data when tab becomes visible
      if (isActive && !isInitializedRef.current) {
        debouncedRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [debouncedRefresh]);

  // Optimized initial data fetch and Socket.IO setup
  useEffect(() => {
    const componentId = componentIdRef.current;
    
    // Add subscriber
    adminCache.subscribers.add(subscribeToUpdates);
    
    // Initial data fetch
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await optimizedFetcher();
        subscribeToUpdates(data);
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Initial data fetch error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Set up Socket.IO connection for real-time updates
    if (isComponentActive && !adminCache.isSubscribed) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        initializeSocket(apiUrl);
        
        // Subscribe to leaderboard updates which trigger data refresh
        socketUnsubscribeRef.current = subscribeToLeaderboard(() => {
          debouncedRefresh();
        });
        
        adminCache.isSubscribed = true;
        console.log('Admin Socket.IO connection established');
      } catch (error) {
        console.warn('Failed to set up Socket.IO:', error);
        // Fallback to polling
        const pollInterval = setInterval(() => {
          if (isComponentActive) {
            debouncedRefresh();
          }
        }, 5000);
        
        socketUnsubscribeRef.current = () => clearInterval(pollInterval);
      }
    }

    // Cleanup
    return () => {
      adminCache.subscribers.delete(subscribeToUpdates);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Clean up Socket.IO connection only if this is the last component
      if (adminCache.subscribers.size === 0) {
        if (socketUnsubscribeRef.current) {
          socketUnsubscribeRef.current();
        }
        try {
          disconnectSocket();
        } catch (error) {
          console.warn('Error disconnecting Socket.IO:', error);
        }
        adminCache.isSubscribed = false;
        console.log('Admin subscriptions cleaned up');
      }
    };
  }, [subscribeToUpdates, debouncedRefresh, isComponentActive]);

  // Optimized round operations
  const setLive = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to set round live
      await setRoundLive(id);
      
      // Force refresh for immediate UI update
      setTimeout(() => debouncedRefresh('rounds'), 100);
    } catch (error) {
      console.error('Set live error:', error);
      setError(error.message || 'Failed to set round live');
    } finally {
      setLoading(false);
    }
  }, [debouncedRefresh]);

  const handleEndRound = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to end round
      await endRound(id);
      
      // Force refresh for immediate UI update
      setTimeout(() => debouncedRefresh('rounds'), 100);
    } catch (error) {
      console.error('End round error:', error);
      setError(error.message || 'Failed to end round');
    } finally {
      setLoading(false);
    }
  }, [debouncedRefresh]);

  // Memoized computations
  const memoizedStats = useMemo(() => {
    const liveRound = rounds.find(r => r.status === 'live');
    const nextRoundNumber = !liveRound ? 1 : 
      liveRound.roundNumber >= 3 ? 'Finished' : liveRound.roundNumber + 1;
    
    return {
      totalTeams: teams.length,
      liveTeamsCount: rounds.reduce((acc, r) => acc + (r.stats?.liveTeams || 0), 0),
      currentRound: liveRound?.roundNumber || 'Round 0',
      nextRound: nextRoundNumber,
      liveRound
    };
  }, [rounds, teams]);

  // Helper function to check if team is currently in an active round
  const isTeamLive = useCallback((teamId) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team || !team.stats) return false;
    return team.stats.currentRound !== 'Finished' && 
           team.stats.roundProgress?.some(rp => rp.status === 'in_progress');
  }, [teams]);

  // Helper function to transform members to array format
  const transformMembersToArray = (formData) => {
    if (formData.members && Array.isArray(formData.members)) {
      return formData.members;
    }
    // For backward compatibility with old form format
    return [
      { name: formData.member1 || '', position: 1 },
      { name: formData.member2 || '', position: 2 },
      { name: formData.member3 || '', position: 3 },
      { name: formData.member4 || '', position: 4 }
    ].filter(m => m.name);
  };

  const editTeam = useCallback((team) => {
    setEditingTeam(team.id);
    setTeamEditForm({
      team_name: team.teamName,
      members: team.members || []
    });
  }, []);

  const saveTeamEdit = useCallback(async () => {
    try {
      setError(null);
      const members = transformMembersToArray(teamEditForm);
      
      await updateTeam(editingTeam, {
        teamName: teamEditForm.team_name,
        members
      });

      setEditingTeam(null);
      setTimeout(() => debouncedRefresh('teams'), 100);
    } catch (error) {
      console.error('Save team edit error:', error);
      setError(error.message || 'Failed to save team changes');
    }
  }, [teamEditForm, editingTeam, debouncedRefresh]);

  const handleTerminateTeam = useCallback(async (teamId) => {
    if (!confirmDelete) {
      if (window.confirm("Are you sure you want to delete this team?")) {
        setTeamToDelete(teamId);
        setConfirmDelete(true);
        setShowDeleteModal(true);
      }
      return;
    }

    if (teamToDelete === teamId && showDeleteModal) {
      if (deletePassword === "Jayy@admin.123") {
        try {
          setError(null);
          await deleteTeam(teamToDelete);
          
          setConfirmDelete(false);
          setTeamToDelete(null);
          setShowDeleteModal(false);
          setDeletePassword('');
          setDeleteError('');
          setTimeout(() => debouncedRefresh('teams'), 100);
        } catch (error) {
          console.error('Team termination error:', error);
          setError(error.message || 'Failed to delete team');
        }
      } else {
        setDeleteError("Incorrect admin password.");
      }
    }
  }, [confirmDelete, teamToDelete, showDeleteModal, deletePassword, debouncedRefresh]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await optimizedFetcher(true);
    } catch (error) {
      console.error('Manual refresh error:', error);
      setError(error.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-mono">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4"
      >
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            GAME CONTROL PANEL
          </h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
          <p className="text-xs text-gray-600">Last Update: {new Date(lastUpdate).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-full">
            <span className={`h-3 w-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            <span className="text-xs">{loading ? 'Syncing...' : 'Live'}</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1 rounded flex items-center space-x-1 transition-all"
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-all">
          <p className="text-gray-400 text-sm flex items-center">
            <Trophy size={16} className="mr-2" /> Total Teams
          </p>
          <p className="text-2xl font-bold">{memoizedStats.totalTeams}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-all">
          <p className="text-gray-400 text-sm flex items-center">
            <Users size={16} className="mr-2" /> Live Teams
          </p>
          <p className="text-2xl font-bold">{memoizedStats.liveTeamsCount}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-all">
          <p className="text-gray-400 text-sm flex items-center">
            <Play size={16} className="mr-2" /> Current Round
          </p>
          <p className="text-2xl font-bold">{memoizedStats.currentRound}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-all">
          <p className="text-gray-400 text-sm flex items-center">
            <Clock size={16} className="mr-2" /> Next Round
          </p>
          <p className="text-2xl font-bold">{memoizedStats.nextRound}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("rounds")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "rounds" 
              ? "text-blue-400 border-b-2 border-blue-400" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          Rounds Control
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "teams" 
              ? "text-blue-400 border-b-2 border-blue-400" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          Teams Overview
        </button>
      </div>

      {/* Content */}
      {loading && adminCache.subscribers.size <= 1 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-400" size={24} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "rounds" ? (
            <motion.div
              key="rounds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-300 mb-2">ROUNDS CONTROL</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rounds.map((round) => (
                  <motion.div
                    key={round.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-lg border ${
                      round.status === 'live' 
                        ? 'border-blue-500/30 bg-blue-500/10 glow' 
                        : 'border-gray-800 bg-gray-900'
                    } hover:bg-gray-800/50 transition-all`}
                  >
                    <div className="flex justify-between items-start">
                        <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            round.status === 'live' ? 'bg-green-500 animate-pulse' : 
                            round.status === 'ended' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></span>
                          <span className="font-bold text-lg">ROUND {round.roundNumber}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex space-x-2">
                          <span>Status: <span className={`font-medium ${
                            round.status === 'live' ? 'text-green-400' : 
                            round.status === 'ended' ? 'text-red-400' : 'text-yellow-400'
                          }`}>{round.status.toUpperCase()}</span></span>
                          {round.status === 'live' && (
                            <span>Live Teams: <span className="font-medium text-blue-400">{memoizedStats.liveTeamsCount}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {round.status !== 'live' ? (
                          <motion.button
                            onClick={() => setLive(round.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
                            disabled={!!memoizedStats.liveRound || loading}
                          >
                            <Play size={14} />
                            <span>GO LIVE</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleEndRound(round.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
                            disabled={loading}
                          >
                            <StopCircle size={14} />
                            <span>END</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-300 mb-2">TEAMS OVERVIEW</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-left text-sm text-gray-400">
                      <th className="p-3 border-b border-gray-800">Team ID</th>
                      <th className="p-3 border-b border-gray-800">Team Name</th>
                      <th className="p-3 border-b border-gray-800">Members</th>
                      <th className="p-3 border-b border-gray-800">Status</th>
                      <th className="p-3 border-b border-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => {
                      const live = isTeamLive(team.teamId);

                      return (
                        <tr 
                          key={team.id}
                          className={`border-b border-gray-700 hover:bg-gray-800/30 transition-colors ${
                            live ? 'bg-green-900/10' : ''
                          }`}
                        >
                          <td className="p-3 font-mono text-sm">{team.teamId}</td>
                          
                          {editingTeam === team.id ? (
                            <>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={teamEditForm.team_name}
                                  onChange={(e) => setTeamEditForm({...teamEditForm, team_name: e.target.value})}
                                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                />
                              </td>
                              <td className="p-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    value={teamEditForm.member1}
                                    onChange={(e) => setTeamEditForm({...teamEditForm, member1: e.target.value})}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Member 1"
                                  />
                                  <input
                                    value={teamEditForm.member2}
                                    onChange={(e) => setTeamEditForm({...teamEditForm, member2: e.target.value})}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Member 2"
                                  />
                                  <input
                                    value={teamEditForm.member3}
                                    onChange={(e) => setTeamEditForm({...teamEditForm, member3: e.target.value})}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Member 3"
                                  />
                                  <input
                                    value={teamEditForm.member4}
                                    onChange={(e) => setTeamEditForm({...teamEditForm, member4: e.target.value})}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Member 4"
                                  />
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium">{team.teamName}</td>
                              <td className="p-3">
                                <div className="text-sm space-y-1">
                                  <div className="flex gap-2">
                                    {team.members && team.members.map((member, idx) => (
                                      <span key={idx} className="text-gray-300">{member.name}</span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </>
                          )}

                          <td className="p-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              live ? 'bg-green-900/50 text-green-400 border border-green-400/30' : 'bg-gray-700 text-gray-400'
                            }`}>
                              {live ? 'Live' : 'Offline'}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="flex gap-2">
                              {editingTeam === team.id ? (
                                <>
                                  <motion.button
                                    onClick={saveTeamEdit}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Save
                                  </motion.button>
                                  <motion.button
                                    onClick={() => setEditingTeam(null)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Cancel
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  <motion.button
                                    onClick={() => {
                                      if (!confirmEdit) {
                                        setTeamToEdit(team.id);
                                        setConfirmEdit(true);
                                        return;
                                      }
                                      if (teamToEdit === team.id) {
                                        editTeam(team);
                                        setConfirmEdit(false);
                                        setTeamToEdit(null);
                                      }
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-2 rounded transition-colors ${
                                      confirmEdit && teamToEdit === team.id 
                                        ? 'bg-blue-700 hover:bg-blue-600' 
                                        : 'bg-blue-600 hover:bg-blue-500'
                                    }`}
                                    title={confirmEdit && teamToEdit === team.id ? "Confirm Edit" : "Edit"}
                                  >
                                    <Edit size={16} />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleTerminateTeam(team.teamId)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-2 rounded transition-colors ${
                                      confirmDelete && teamToDelete === team.teamId 
                                        ? 'bg-red-700 hover:bg-red-600'
                                        : 'bg-red-600 hover:bg-red-500'
                                    }`}
                                    title={confirmDelete && teamToDelete === team.teamId ? "Confirm Termination" : "Terminate"}
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Glow effect CSS */}
      <style jsx>{`
        .glow {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
          100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-xl font-bold mb-4 text-red-400">Admin Password Required</h3>
              <p className="mb-4 text-gray-300">Please enter the admin password to confirm team termination.</p>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full mb-3 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Admin Password"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTerminateTeam(teamToDelete);
                  }
                }}
              />
              {deleteError && (
                <motion.p 
                  className="text-red-500 mb-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {deleteError}
                </motion.p>
              )}
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmDelete(false);
                    setTeamToDelete(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleTerminateTeam(teamToDelete)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition-colors"
                >
                  Confirm Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;