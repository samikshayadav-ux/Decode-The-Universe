import express from 'express';
import {
  getQuestions,
  submitAnswer,
  completeRound,
  getRoundProgress,
  startRound,
  advanceRound2Stage
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

/**
 * GET /api/quiz/:round/questions
 * Fetch all questions for a specific round
 */
router.get('/:round/questions', validateRound, getQuestions);

/**
 * POST /api/quiz/:round/start
 * Start a round (initialize progress)
 */
router.post('/:round/start', validateRound, startRound);

/**
 * POST /api/quiz/:round/submit
 * Submit an answer for a question
 */
router.post('/:round/submit', validateRound, submitAnswer);

/**
 * POST /api/quiz/:round/complete
 * Complete a round and finalize scores
 */
router.post('/:round/complete', validateRound, completeRound);

/**
 * POST /api/quiz/2/advance
 * Advance to next stage for Round 2 with stage time tracking
 */
router.post('/2/advance', advanceRound2Stage);

/**
 * GET /api/quiz/:round/progress/:teamId
 * Get team's progress for a specific round
 */
router.get('/:round/progress/:teamId', validateRound, getRoundProgress);

export default router;
