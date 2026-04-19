import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoundAccess } from '../middleware/roundAccess.js';
import {
  getQuestions,
  submitAnswer,
  completeRound,
  getRoundProgress,
  startRound,
  advanceRound1Stage
} from '../controllers/quizController.js';

const router = express.Router();

/**
 * Validate round parameter middleware
 */
const validateRound = (req, res, next) => {
  const round = parseInt(req.params.round);
  if (![1, 2, 3].includes(round)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid round number. Must be 1, 2, or 3'
    });
  }
  next();
};

// Apply authentication to all quiz routes
router.use(authenticateToken);

/**
 * GET /api/quiz/:round/questions
 * Fetch all questions for a specific round
 */
router.get('/:round/questions', validateRound, requireRoundAccess(), getQuestions);

/**
 * POST /api/quiz/:round/start
 * Start a round (initialize progress)
 */
router.post('/:round/start', validateRound, requireRoundAccess(), startRound);

/**
 * POST /api/quiz/:round/submit
 * Submit an answer for a question
 */
router.post('/:round/submit', validateRound, requireRoundAccess(), submitAnswer);

/**
 * POST /api/quiz/:round/complete
 * Complete a round and finalize scores
 */
router.post('/:round/complete', validateRound, requireRoundAccess(), completeRound);

/**
 * GET /api/quiz/:round/progress/:teamId
 * Get team's progress for a specific round
 */
router.get('/:round/progress/:teamId', validateRound, requireRoundAccess(), getRoundProgress);

export default router;
