import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoundAccess } from '../middleware/roundAccess.js';
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
 * Initialize Round 1 (Quiz)
 * Requires: Valid JWT token and round access
 */
router.post('/round1', authenticateToken, requireRoundAccess(1), initializeRound1);

/**
 * POST /api/gateway/round2
 * Initialize Round 2 (Challenge)
 * Requires: Valid JWT token and round access
 */
router.post('/round2', authenticateToken, requireRoundAccess(2), initializeRound2);

/**
 * POST /api/gateway/finalround
 * Initialize Final Round
 * Requires: Valid JWT token and round access
 */
router.post('/finalround', authenticateToken, requireRoundAccess(3), initializeFinalRound);

export default router;
