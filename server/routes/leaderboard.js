import express from 'express';
import { getRoundLeaderboard, getOverallLeaderboardData } from '../controllers/leaderboardController.js';

const router = express.Router();

/**
 * Validate round parameter middleware (for specific round leaderboard)
 */
const validateRound = (req, res, next) => {
  if (req.params.round !== undefined) {
    const round = parseInt(req.params.round);
    if (![0, 1, 2, 3].includes(round)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number. Must be 0, 1, 2, or 3'
      });
    }
  }
  next();
};

/**
 * GET /api/leaderboard
 * Get overall leaderboard across all rounds
 */
router.get('/', getOverallLeaderboardData);

/**
 * GET /api/leaderboard/:round
 * Get leaderboard for a specific round
 */
router.get('/:round', validateRound, getRoundLeaderboard);

export default router;
