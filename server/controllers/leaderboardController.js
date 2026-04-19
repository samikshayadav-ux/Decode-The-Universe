import { Team } from '../models/index.js';
import { getLeaderboardData, getOverallLeaderboard } from '../utils/changeStreams.js';

/**
 * GET /api/leaderboard/:round
 * Get leaderboard data for a specific round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRoundLeaderboard = async (req, res) => {
  try {
    const { round } = req.params;

    // Validate round number
    if (![0, 1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number. Must be 0, 1, 2, or 3'
      });
    }

    const roundNumber = parseInt(round);

    // Get leaderboard data
    const leaderboard = await getLeaderboardData(roundNumber);

    console.log(`[Leaderboard Controller] Fetched leaderboard for round ${roundNumber} - ${leaderboard.length} teams`);

    return res.status(200).json({
      status: 'success',
      data: {
        roundNumber,
        totalTeams: leaderboard.length,
        leaderboard
      }
    });
  } catch (error) {
    console.error(`[Leaderboard Controller] Get round leaderboard error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

/**
 * GET /api/leaderboard
 * Get overall leaderboard across all rounds
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOverallLeaderboardData = async (req, res) => {
  try {
    // Get overall leaderboard
    const leaderboard = await getOverallLeaderboard();

    console.log(`[Leaderboard Controller] Fetched overall leaderboard - ${leaderboard.length} teams`);

    return res.status(200).json({
      status: 'success',
      data: {
        type: 'overall',
        totalTeams: leaderboard.length,
        leaderboard
      }
    });
  } catch (error) {
    console.error(`[Leaderboard Controller] Get overall leaderboard error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};
