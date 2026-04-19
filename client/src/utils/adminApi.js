/**
 * Admin API Utility Module
 * 
 * Provides centralized API functions for admin dashboard operations.
 * Handles authentication via x-admin-auth header with admin credentials.
 * Mirrors the structure of quizApi.js for consistency.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Retrieve admin credentials from localStorage and build authentication headers
 * 
 * @returns {Object} Headers object with Content-Type and x-admin-auth
 * @throws {Error} If credentials not found in localStorage
 */
function getAdminHeaders() {
  const credentialsJson = localStorage.getItem('adminCredentials');
  
  if (!credentialsJson) {
    throw new Error('Admin credentials not found. Please log in again.');
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    return {
      'Content-Type': 'application/json',
      'x-admin-auth': JSON.stringify(credentials)
    };
  } catch (error) {
    throw new Error('Invalid admin credentials format. Please log in again.');
  }
}

/**
 * Fetch all rounds from backend
 * 
 * @returns {Promise<Array>} Array of round objects with structure:
 *   {id, roundNumber, title, status, stats: {liveTeams, completedTeams, totalTeams}}
 * @throws {Error} If API call fails
 * 
 * @example
 * const rounds = await getAllRounds();
 * console.log(rounds[0].roundNumber); // 1
 * console.log(rounds[0].stats.liveTeams); // 5
 */
async function getAllRounds() {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/rounds`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch rounds: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Admin API] getAllRounds response:', data);
    const rounds = data.data?.rounds || data.rounds || [];
    console.log('[Admin API] Extracted rounds:', rounds);
    return rounds;
  } catch (error) {
    console.error('Error fetching rounds:', error);
    throw error;
  }
}

/**
 * Set a round as live (only one round can be live at a time)
 * 
 * @param {string} roundId - MongoDB ObjectId of the round
 * @returns {Promise<Object>} Updated round object with new status
 * @throws {Error} If API call fails
 * 
 * @example
 * const updatedRound = await setRoundLive('507f1f77bcf86cd799439011');
 * console.log(updatedRound.status); // 'live'
 */
async function setRoundLive(roundId) {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/rounds/${roundId}/live`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to set round live: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error setting round live:', error);
    throw error;
  }
}

/**
 * End a live round
 * 
 * @param {string} roundId - MongoDB ObjectId of the round
 * @returns {Promise<Object>} Updated round object with new status
 * @throws {Error} If API call fails
 * 
 * @example
 * const updatedRound = await endRound('507f1f77bcf86cd799439011');
 * console.log(updatedRound.status); // 'completed'
 */
async function endRound(roundId) {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/rounds/${roundId}/end`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to end round: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error ending round:', error);
    throw error;
  }
}

/**
 * Fetch all teams from backend
 * 
 * @returns {Promise<Array>} Array of team objects with structure:
 *   {id, teamId, teamName, members: [{name, position}], stats: {totalScore, currentRound}}
 * @throws {Error} If API call fails
 * 
 * @example
 * const teams = await getAllTeams();
 * console.log(teams[0].teamName); // 'Team Alpha'
 * console.log(teams[0].members); // [{name: 'John', position: 1}, ...]
 */
async function getAllTeams() {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/teams`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch teams: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.teams || data.teams || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Update a team's information
 * 
 * @param {string} teamId - MongoDB ObjectId of the team
 * @param {Object} data - Update data object
 * @param {string} data.teamName - New team name
 * @param {Array} data.members - Array of members: [{name: string, position: number}]
 * @returns {Promise<Object>} Updated team object
 * @throws {Error} If API call fails
 * 
 * @example
 * const updated = await updateTeam('507f1f77bcf86cd799439011', {
 *   teamName: 'New Team Name',
 *   members: [
 *     {name: 'Alice', position: 1},
 *     {name: 'Bob', position: 2}
 *   ]
 * });
 */
async function updateTeam(teamId, data) {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/teams/${teamId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to update team: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

/**
 * Delete a team from the system
 * 
 * @param {string} teamId - MongoDB ObjectId of the team to delete
 * @returns {Promise<Object>} Deletion confirmation object
 * @throws {Error} If API call fails
 * 
 * @example
 * await deleteTeam('507f1f77bcf86cd799439011');
 * console.log('Team deleted successfully');
 */
async function deleteTeam(teamId) {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(`${API_URL}/api/admin/teams/${teamId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to delete team: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

/**
 * Get leaderboard data for a specific round
 * 
 * @param {number} roundNumber - Round number (0-3)
 * @returns {Promise<Array>} Array of leaderboard entries sorted by score/time
 * @throws {Error} If API call fails
 * 
 * @example
 * const leaderboard = await getLeaderboard(0);
 * console.log(leaderboard[0].teamName); // Top scoring team
 */
async function getLeaderboard(roundNumber) {
  try {
    const headers = getAdminHeaders();
    const response = await fetch(
      `${API_URL}/api/admin/leaderboard?roundNumber=${roundNumber}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch leaderboard: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.leaderboard || data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

export {
  getAllRounds,
  setRoundLive,
  endRound,
  getAllTeams,
  updateTeam,
  deleteTeam,
  getLeaderboard,
  getAdminHeaders
};
