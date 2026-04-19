/**
 * Fetch leaderboard data from backend API
 * @param {number} roundNumber - Round number (0, 1, 2, 3)
 * @param {string} baseURL - Backend API base URL
 * @returns {Promise<Array>} - Array of team leaderboard data
 */
export const fetchLeaderboardData = async (roundNumber, baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000') => {
  try {
    const response = await fetch(`${baseURL}/api/leaderboard/${roundNumber}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch leaderboard`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching leaderboard for round ${roundNumber}:`, error);
    throw error;
  }
};

/**
 * Fetch leaderboard data for all rounds
 * @param {string} baseURL - Backend API base URL
 * @returns {Promise<Object>} - Object with round numbers as keys and team arrays as values
 */
export const fetchAllLeaderboards = async (baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000') => {
  try {
    const rounds = [0, 1, 2, 3];
    const leaderboards = {};

    const results = await Promise.all(
      rounds.map(round => fetchLeaderboardData(round, baseURL))
    );

    rounds.forEach((round, index) => {
      leaderboards[`round${round}`] = results[index];
    });

    return leaderboards;
  } catch (error) {
    console.error('Error fetching all leaderboards:', error);
    throw error;
  }
};

/**
 * Sort and process leaderboard teams
 * @param {Array} teams - Array of team objects
 * @returns {Array} - Sorted array of teams
 */
export const sortLeaderboardTeams = (teams) => {
  if (!Array.isArray(teams)) return [];

  return [...teams].sort((a, b) => {
    // Primary sort: by score (descending)
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary sort: by time (ascending)
    const timeA = a.answers?.length > 0
      ? (a.completed_at ? a.total_time_spent : a.time_at_last_submission) || Infinity
      : Infinity;
    const timeB = b.answers?.length > 0
      ? (b.completed_at ? b.total_time_spent : b.time_at_last_submission) || Infinity
      : Infinity;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Tertiary sort: by submission time (ascending)
    return new Date(a.updated_at) - new Date(b.updated_at);
  });
};

/**
 * Format time in MM:SS format
 * @param {number} seconds - Seconds to format
 * @returns {string} - Formatted time string
 */
export const formatLeaderboardTime = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  const adjustedSeconds = seconds + 1;
  const mins = Math.floor(adjustedSeconds / 60);
  const secs = adjustedSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get rank medal emoji based on position
 * @param {number} rank - Rank position (0-indexed)
 * @returns {string} - Medal emoji or empty string
 */
export const getRankMedal = (rank) => {
  switch (rank) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return '';
  }
};

export default {
  fetchLeaderboardData,
  fetchAllLeaderboards,
  sortLeaderboardTeams,
  formatLeaderboardTime,
  getRankMedal
};