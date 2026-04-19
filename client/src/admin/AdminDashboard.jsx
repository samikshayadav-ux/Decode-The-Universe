import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Loader2, Play, StopCircle, Users, Trophy, Clock, RefreshCw, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getAllRounds, 
  setRoundLive, 
  endRound, 
  getAllTeams, 
  updateTeam, 
  deleteTeam,
  unlockRoundForTeam,
  forceAdvanceTeam,
  unlockRoundGlobally
} from "../utils/adminApi";
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
    
    const getRoundLabel = (num) => {
      if (num === 1) return "ROUND 1";
      if (num === 2) return "ROUND 2";
      if (num === 3) return "FINAL ROUND";
      return `ROUND ${num}`;
    };

    return {
      totalTeams: teams.length,
      liveTeamsCount: rounds.reduce((acc, r) => acc + (r.stats?.liveTeams || 0), 0),
      currentRound: liveRound ? getRoundLabel(liveRound.roundNumber) : 'None',
      nextRound: typeof nextRoundNumber === 'number' ? getRoundLabel(nextRoundNumber) : nextRoundNumber,
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

  const handleUnlockGlobally = useCallback(async (roundId) => {
    try {
      setLoading(true);
      setError(null);
      await unlockRoundGlobally(roundId);
      setTimeout(() => debouncedRefresh(), 100);
    } catch (error) {
      console.error('Unlock globally error:', error);
      setError(error.message || 'Failed to unlock round globally');
    } finally {
      setLoading(false);
    }
  }, [debouncedRefresh]);

  const handleUnlockForTeam = useCallback(async (teamId, roundNumber) => {
    try {
      setLoading(true);
      setError(null);
      await unlockRoundForTeam(teamId, roundNumber);
      setTimeout(() => debouncedRefresh('teams'), 100);
    } catch (error) {
      console.error('Unlock for team error:', error);
      setError(error.message || 'Failed to unlock round for team');
    } finally {
      setLoading(false);
    }
  }, [debouncedRefresh]);

  const handleForceAdvance = useCallback(async (teamId) => {
    try {
      setLoading(true);
      setError(null);
      await forceAdvanceTeam(teamId);
      setTimeout(() => debouncedRefresh('teams'), 100);
    } catch (error) {
      console.error('Force advance error:', error);
      setError(error.message || 'Failed to force advance team');
    } finally {
      setLoading(false);
    }
  }, [debouncedRefresh]);

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

  const getRoundLabel = (num) => {
    if (num === 1) return "ROUND 1";
    if (num === 2) return "ROUND 2";
    if (num === 3) return "FINAL ROUND";
    return `ROUND ${num}`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8 border-4 border-white p-6 bg-black"
      >
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            GAME_CONTROL_PANEL
          </h1>
          <p className="text-sm mt-2 opacity-70">ADMIN_DASHBOARD // SYSTEM_v2.0</p>
          <p className="text-xs opacity-50">LAST_UPDATE: {new Date(lastUpdate).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 border-2 border-white px-4 py-2">
            <span className={`h-4 w-4 ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
            <span className="text-sm font-bold uppercase">{loading ? 'Syncing...' : 'Live'}</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="text-sm border-2 border-white hover:bg-white hover:text-black disabled:opacity-50 px-6 py-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1"
          >
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        {[
          { label: "Total Teams", value: memoizedStats.totalTeams, icon: Trophy },
          { label: "Live Teams", value: memoizedStats.liveTeamsCount, icon: Users },
          { label: "Current Round", value: memoizedStats.currentRound, icon: Play },
          { label: "Next Round", value: memoizedStats.nextRound, icon: Clock }
        ].map((stat, i) => (
          <div key={i} className="bg-black p-4 md:p-6 border-4 border-white hover:bg-white hover:text-black transition-colors group">
            <p className="text-[10px] md:text-xs uppercase font-bold mb-2 flex items-center opacity-70 group-hover:opacity-100">
              <stat.icon size={14} className="mr-2" /> {stat.label}
            </p>
            <p className="text-xl md:text-2xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex border-4 border-white mb-8 bg-black">
        <button
          onClick={() => setActiveTab("rounds")}
          className={`flex-1 px-8 py-4 text-sm font-black uppercase transition-colors ${
            activeTab === "rounds" 
              ? "bg-white text-black" 
              : "text-white hover:bg-white/10"
          }`}
        >
          Rounds_Control
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`flex-1 px-8 py-4 text-sm font-black uppercase transition-colors border-l-4 border-white ${
            activeTab === "teams" 
              ? "bg-white text-black" 
              : "text-white hover:bg-white/10"
          }`}
        >
          Teams_Overview
        </button>
      </div>

      {/* Content */}
      {loading && adminCache.subscribers.size <= 1 ? (
        <div className="flex justify-center py-24 border-4 border-white bg-black">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-white mb-4" size={48} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading_System_Data...</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "rounds" ? (
            <motion.div
              key="rounds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">ROUNDS_CONTROL</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rounds.map((round) => (
                  <motion.div
                    key={round.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-6 border-4 border-white bg-black hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all ${
                      round.status === 'live' ? 'border-yellow-400 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)]' : ''
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-black tracking-tighter uppercase">
                            {getRoundLabel(round.roundNumber)}
                          </span>
                          <span className={`px-3 py-1 text-xs font-black uppercase ${
                            round.status === 'live' ? 'bg-yellow-400 text-black' : 
                            round.status === 'ended' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
                          }`}>
                            {round.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold uppercase opacity-60">
                            <span>Live_Teams</span>
                            <span>{round.stats?.liveTeams || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold uppercase opacity-60">
                            <span>Completed</span>
                            <span>{round.stats?.completedTeams || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {round.status !== 'live' ? (
                          <button
                            onClick={() => setLive(round.id)}
                            disabled={!!memoizedStats.liveRound || loading}
                            className="bg-white text-black font-black uppercase py-2 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
                          >
                            GO LIVE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEndRound(round.id)}
                            disabled={loading}
                            className="bg-red-600 text-white font-black uppercase py-2 hover:bg-red-700 transition-colors text-sm"
                          >
                            END ROUND
                          </button>
                        )}
                        <button
                          onClick={() => handleUnlockGlobally(round.id)}
                          disabled={loading}
                          className="border-2 border-white text-white font-black uppercase py-2 hover:bg-white hover:text-black transition-colors text-sm"
                        >
                          Unlock Globally
                        </button>
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
              className="space-y-6"
            >
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">TEAMS_OVERVIEW</h2>
              <div className="overflow-x-auto border-4 border-white">
                <table className="w-full border-collapse bg-black text-white">
                  <thead>
                    <tr className="bg-white text-black font-black uppercase text-xs">
                      <th className="p-4 border-b-4 border-black text-left">ID</th>
                      <th className="p-4 border-b-4 border-black text-left">Team Name</th>
                      <th className="p-4 border-b-4 border-black text-left text-nowrap">Current Round</th>
                      <th className="p-4 border-b-4 border-black text-left text-nowrap">Unlocked</th>
                      <th className="p-4 border-b-4 border-black text-left text-nowrap">Progress</th>
                      <th className="p-4 border-b-4 border-black text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => {
                      const live = isTeamLive(team.teamId);
                      const progress = team.stats?.roundProgress || [];

                      return (
                        <tr 
                          key={team.id}
                          className={`border-b-2 border-white hover:bg-white/5 transition-colors ${
                            live ? 'shadow-[inset_4px_0_0_0_#4ade80]' : ''
                          }`}
                        >
                          <td className="p-4 font-mono text-xs opacity-50">{team.teamId}</td>
                          
                          <td className="p-4">
                            {editingTeam === team.id ? (
                                <input
                                  type="text"
                                  value={teamEditForm.team_name}
                                  onChange={(e) => setTeamEditForm({...teamEditForm, team_name: e.target.value})}
                                  className="bg-black border-2 border-white px-3 py-2 w-full font-bold focus:bg-white focus:text-black outline-none"
                                />
                            ) : (
                                <span className="font-black text-sm uppercase">{team.teamName}</span>
                            )}
                          </td>
                          
                          <td className="p-4">
                            <span className="font-bold text-xs uppercase bg-white text-black px-2 py-1">
                                {team.currentRound === 4 ? 'FINISHED' : getRoundLabel(team.currentRound)}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex gap-1 flex-wrap">
                                {(team.unlockedRounds || []).sort().map(r => (
                                    <span key={r} className="border border-white/50 text-[10px] font-bold px-1.5 py-0.5">
                                        R{r}
                                    </span>
                                ))}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex gap-2">
                                {[1, 2, 3].map(rNum => {
                                    const rp = progress.find(p => p.roundNumber === rNum);
                                    let bgColor = 'bg-gray-800';
                                    if (rp?.status === 'completed') bgColor = 'bg-green-500';
                                    else if (rp?.status === 'in_progress') bgColor = 'bg-yellow-400';
                                    
                                    return (
                                        <div 
                                            key={rNum} 
                                            className={`w-3 h-3 ${bgColor} border border-white/20`}
                                            title={`${getRoundLabel(rNum)}: ${rp?.status || 'not_started'}`}
                                        />
                                    );
                                })}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap max-w-[300px]">
                              {editingTeam === team.id ? (
                                <>
                                  <button
                                    onClick={saveTeamEdit}
                                    className="bg-green-500 text-black px-3 py-1 font-black uppercase text-[10px] hover:bg-green-400 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTeam(null)}
                                    className="bg-red-600 text-white px-3 py-1 font-black uppercase text-[10px] hover:bg-red-700 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleForceAdvance(team.id)}
                                    className="border-2 border-white px-2 py-1 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-colors"
                                  >
                                    Force Advance
                                  </button>
                                  <button
                                    onClick={() => {
                                        const nextRoundToUnlock = [1,2,3].find(r => !(team.unlockedRounds || []).includes(r));
                                        if (nextRoundToUnlock) handleUnlockForTeam(team.id, nextRoundToUnlock);
                                    }}
                                    disabled={team.unlockedRounds?.length >= 3}
                                    className="border-2 border-white px-2 py-1 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-30"
                                  >
                                    Unlock Next
                                  </button>
                                  <button
                                    onClick={() => editTeam(team)}
                                    className="p-1 border-2 border-white hover:bg-blue-600 transition-colors"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleTerminateTeam(team.teamId)}
                                    className="p-1 border-2 border-white hover:bg-red-600 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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

      {/* Brutalist styling overrides */}
      <style jsx>{`
        .text-nowrap { white-space: nowrap; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #fff; border: 2px solid #000; }
        ::-webkit-scrollbar-thumb:hover { background: #ccc; }
      `}</style>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-black border-4 border-white p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <h3 className="text-3xl font-black uppercase mb-4 text-red-600">SECURITY_ALERT</h3>
              <p className="mb-6 font-bold text-sm tracking-tight opacity-80">CONFIRM ACTION: TERMINATE_TEAM_DATA. REQUIRES LEVEL_0_ACCESS_PASSWORD.</p>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="bg-black border-4 border-white p-4 w-full mb-6 font-black focus:bg-white focus:text-black outline-none text-xl"
                placeholder="PASSWORD_REQUIRED"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTerminateTeam(teamToDelete);
                  }
                }}
              />
              {deleteError && (
                <p className="text-red-500 font-black uppercase text-xs mb-6 animate-bounce">
                  {deleteError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className="border-2 border-white text-white font-black uppercase py-3 hover:bg-white hover:text-black transition-colors"
                >
                  ABORT
                </button>
                <button
                  onClick={() => handleTerminateTeam(teamToDelete)}
                  className="bg-red-600 text-white font-black uppercase py-3 hover:bg-red-700 transition-colors"
                >
                  EXECUTE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;