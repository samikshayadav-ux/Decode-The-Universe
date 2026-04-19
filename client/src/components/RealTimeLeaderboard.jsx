import React, { useEffect, useState } from 'react';
import { useLeaderboard } from '../contexts/LeaderboardContext';

/**
 * Example Real-Time Leaderboard Component
 * Demonstrates how to use the useLeaderboard hook for real-time updates
 */
export function RealTimeLeaderboard({ roundNumber = 1, teamId = null }) {
  const {
    isConnected,
    getLeaderboard,
    enterRound,
    exitRound,
    getTeamRank,
    getTeamScore,
    error
  } = useLeaderboard();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const leaderboard = getLeaderboard(roundNumber);
  const userRank = teamId ? getTeamRank(teamId, roundNumber) : null;
  const userScore = teamId ? getTeamScore(teamId, roundNumber) : null;

  // Join round on mount, leave on unmount
  useEffect(() => {
    enterRound(roundNumber);
    return () => exitRound(roundNumber);
  }, [roundNumber, enterRound, exitRound]);

  // Connection status indicator
  const getStatusBadge = () => {
    if (!isConnected) {
      return <span className="badge badge-error">Offline</span>;
    }
    return <span className="badge badge-success">Live</span>;
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Round {roundNumber} Leaderboard
          </h2>
          <div className="flex gap-2 items-center">
            {getStatusBadge()}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Auto-update</span>
            </label>
          </div>
        </div>

        {/* User Stats */}
        {teamId && (
          <div className="stats shadow mb-4 w-full">
            <div className="stat">
              <div className="stat-title">Your Rank</div>
              <div className="stat-value text-primary">
                {userRank ? `#${userRank}` : '—'}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Your Score</div>
              <div className="stat-value text-secondary">
                {userScore !== null ? userScore : '—'}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Teams Ranked</div>
              <div className="stat-value">{leaderboard.length}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {leaderboard.length === 0 && isConnected && (
        <div className="text-center py-8">
          <p className="text-gray-500">No teams in leaderboard yet...</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="w-12">Rank</th>
                <th>Team Name</th>
                <th className="text-right">Score</th>
                <th className="text-right">Time Spent</th>
                <th className="text-center">Questions</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={entry.teamId}
                  className={
                    teamId === entry.teamId
                      ? 'bg-primary bg-opacity-20 font-bold'
                      : idx === 0
                      ? 'bg-warning bg-opacity-10'
                      : ''
                  }
                >
                  <td>
                    <div className="flex items-center justify-center">
                      {entry.rank === 1 && <span className="text-xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-xl">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="font-bold">#{entry.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{entry.teamName}</td>
                  <td className="text-right">
                    <span className="badge badge-lg badge-primary">
                      {entry.score}
                    </span>
                  </td>
                  <td className="text-right text-sm">
                    {formatTime(entry.totalTimeSpent)}
                  </td>
                  <td className="text-center">
                    {entry.questionsAnswered}/{entry.totalQuestions}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        entry.status === 'completed'
                          ? 'badge-success'
                          : entry.status === 'in_progress'
                          ? 'badge-info'
                          : 'badge-ghost'
                      }`}
                    >
                      {entry.status === 'completed' && '✓ Done'}
                      {entry.status === 'in_progress' && '⏳ Active'}
                      {entry.status === 'not_started' && '○ Waiting'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Connection Status Message */}
      {!isConnected && (
        <div className="alert alert-warning mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 4v2M4.707 7.293a1 1 0 00-.707 1.414l1.414 1.414a1 1 0 101.414-1.414L4.707 7.293zm1.414 10L4 18.707a1 1 0 101.414 1.414l1.414-1.414a1 1 0 00-1.414-1.414zm10-10l1.414-1.414a1 1 0 10-1.414-1.414L14.293 4.707a1 1 0 001.414 1.414zm1.414 10l1.414 1.414a1 1 0 101.414-1.414l-1.414-1.414a1 1 0 00-1.414 1.414z"
            />
          </svg>
          <span>
            Connecting to server for real-time updates... This may take a
            moment.
          </span>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500">
        {isConnected ? (
          <span>✓ Real-time updates enabled</span>
        ) : (
          <span>○ Awaiting connection...</span>
        )}
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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        <h3 className="card-title text-lg mb-2">
          Top {limit} - Round {roundNumber}
        </h3>
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.teamId}
                className="flex justify-between items-center p-2 bg-base-200 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold w-6">#{entry.rank}</span>
                  <span className="text-sm">{entry.teamName}</span>
                </div>
                <span className="font-bold text-primary">{entry.score}</span>
              </div>
            ))
          )}
        </div>
        {isConnected && (
          <p className="text-xs text-success mt-2">● Live Updates</p>
        )}
      </div>
    </div>
  );
}

/**
 * Leaderboard Stats Component
 */
export function LeaderboardStats({ roundNumber = 1 }) {
  const { isConnected, getLeaderboard } = useLeaderboard();
  const leaderboard = getLeaderboard(roundNumber);

  const stats = {
    totalTeams: leaderboard.length,
    maxScore:
      leaderboard.length > 0
        ? Math.max(...leaderboard.map((t) => t.score))
        : 0,
    avgScore:
      leaderboard.length > 0
        ? Math.floor(
            leaderboard.reduce((sum, t) => sum + t.score, 0) /
              leaderboard.length
          )
        : 0,
    completed: leaderboard.filter((t) => t.status === 'completed').length
  };

  return (
    <div className="stats shadow w-full">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="stat-title">Total Teams</div>
        <div className="stat-value text-primary">{stats.totalTeams}</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </div>
        <div className="stat-title">Max Score</div>
        <div className="stat-value text-secondary">{stats.maxScore}</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-accent">
          <div className="avatar placeholder">
            <div className="bg-accent text-accent-content rounded-full w-10 text-xl">
              ✓
            </div>
          </div>
        </div>
        <div className="stat-title">Completed</div>
        <div className="stat-value">{stats.completed}</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-info">📊</div>
        <div className="stat-title">Avg Score</div>
        <div className="stat-value text-info">{stats.avgScore}</div>
      </div>
    </div>
  );
}

export default RealTimeLeaderboard;
