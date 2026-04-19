/**
 * Quiz API utility functions
 * Handles all API calls for quiz/game rounds
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get JWT token from sessionStorage (tab-specific, not persistent)
 */
const getAuthToken = () => {
  return localStorage.getItem('jwtToken');
};

/**
 * Get common headers for API requests
 */
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Fetch questions for a specific round
 * @param {number} roundNumber - Round number (1-3)
 * @returns {Promise<Array>} - Array of questions
 */
export const fetchQuestions = async (roundNumber) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/${roundNumber}/questions`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch questions for round ${roundNumber}`);
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error(`Error fetching questions for round ${roundNumber}:`, error);
    throw error;
  }
};

/**
 * Start a quiz/game round for a team
 * @param {number} roundNumber - Round number (1-3)
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} - Quiz start response
 */
export const startRound = async (roundNumber, teamId) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/${roundNumber}/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to start round ${roundNumber}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error starting round ${roundNumber}:`, error);
    throw error;
  }
};

/**
 * Submit an answer for a quiz question
 * @param {number} roundNumber - Round number (1-3)
 * @param {string} teamId - Team ID
 * @param {Object} answerData - Answer data
 * @returns {Promise<Object>} - Submission response
 */
export const submitAnswer = async (roundNumber, teamId, answerData) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/${roundNumber}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        teamId,
        ...answerData
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit answer');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Get progress for a team in a specific round
 * @param {number} roundNumber - Round number (1-3)
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} - Progress data
 */
export const getProgress = async (roundNumber, teamId) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/${roundNumber}/progress/${teamId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch progress');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

/**
 * Complete a round
 * @param {number} roundNumber - Round number (1-3)
 * @param {string} teamId - Team ID
 * @param {Object} completionData - Completion data
 * @returns {Promise<Object>} - Completion response
 */
export const completeRound = async (roundNumber, teamId, completionData) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/${roundNumber}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        teamId,
        ...completionData
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete round');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error completing round:', error);
    throw error;
  }
};

/**
 * Call gateway endpoint to get combined progress + questions/clues for a round
 * Replaces separate fetchQuestions() and getProgress() calls
 * @param {number} roundNumber - Round number (1 for Quiz/Round 1, 2 for Round 2, 3 for Final Round)
 * @returns {Promise<Object>} - Gateway response containing { progress, questions/clues, totalQuestions/totalClues }
 * @throws {Error} - If roundNumber is not 1, 2, or 3, or if the request fails
 */
export const callGateway = async (roundNumber) => {
  try {
    // Validate input
    if (roundNumber !== 1 && roundNumber !== 2 && roundNumber !== 3) {
      throw new Error(`Invalid round number: ${roundNumber}. Only rounds 1, 2, and 3 are supported.`);
    }

    // Determine endpoint based on round number
    let endpoint;
    if (roundNumber === 1) {
      endpoint = '/api/gateway/round1';
    } else if (roundNumber === 2) {
      endpoint = '/api/gateway/round2';
    } else if (roundNumber === 3) {
      endpoint = '/api/gateway/finalround';
    }

    // Make POST request with JWT token
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to load round ${roundNumber} data from gateway`);
    }

    const result = await response.json();

    // Extract and return the data object containing progress, questions/clues, and totals
    if (!result.data) {
      throw new Error(`Invalid gateway response for round ${roundNumber}`);
    }

    return result.data;
  } catch (error) {
    console.error(`Error calling gateway for round ${roundNumber}:`, error);
    throw error;
  }
};

/**
 * Advance to next stage for Round 1 (calculates time from backend timestamps)
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} - Advance response with updated stage info
 */
export const advanceRound1Stage = async (teamId) => {
  try {
    const response = await fetch(`${API_URL}/api/quiz/1/advance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        teamId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to advance stage');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error advancing stage:', error);
    throw error;
  }
};

export default {
  fetchQuestions,
  startRound,
  submitAnswer,
  getProgress,
  completeRound,
  callGateway,
  advanceRound1Stage
};
