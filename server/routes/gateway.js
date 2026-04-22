import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  initializeRound1,
  initializeRound2,
  initializeFinalRound,
  getLiveRounds
} from '../controllers/gatewayController.js';

const router = express.Router();

/**
 * GET /api/gateway/rounds
 * Get rounds by status (public endpoint for home screen)
 * Query params: status (live, pending, ended)
 */
router.get('/rounds', getLiveRounds);

/**
 * POST /api/gateway/round1
 * Initialize Round 1 - Check/Create Round1 record and return progress + questions
 * Requires: Valid JWT token
 */
router.post('/round1', authenticateToken, initializeRound1);

/**
 * POST /api/gateway/round2
 * Initialize Round 2 - Check/Create Round2 record and return progress + Stage 2 questions
 * Requires: Valid JWT token
 */
router.post('/round2', authenticateToken, initializeRound2);

/**
 * POST /api/gateway/finalround
 * Initialize Final Round - Check/Create FinalRound record and return progress + clues
 * Requires: Valid JWT token
 */
router.post('/finalround', authenticateToken, initializeFinalRound);

export default router;

