import express from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import {
  getAllRounds,
  setRoundLive,
  endRound,
  getAllTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  resetTeamRound,
  unlockRoundForTeam,
  forceAdvanceTeam,
  getLeaderboard,
  unlockRoundGlobally
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * POST /api/admin/verify-password
 * Verify admin password (no middleware, public endpoint for login)
 */
router.post('/verify-password', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ success: true, message: 'Password verified' });
});

// Apply admin authentication middleware to all routes below this
router.use(authenticateAdmin);

/**
 * GET /api/admin/rounds
 * Get all rounds with live team counts
 */
router.get('/rounds', getAllRounds);

/**
 * PUT /api/admin/rounds/:id/live
 * Set a round to live status (ensures only one live at a time)
 */
router.put('/rounds/:id/live', setRoundLive);

/**
 * PUT /api/admin/rounds/:id/end
 * End a round
 */
router.put('/rounds/:id/end', endRound);

/**
 * PUT /api/admin/rounds/:id/unlock-all
 * Unlock a specific round for all teams
 */
router.put('/rounds/:id/unlock-all', unlockRoundGlobally);

/**
 * GET /api/admin/teams
 * Get all teams with their progress
 */
router.get('/teams', getAllTeams);

/**
 * GET /api/admin/teams/:id
 * Get a specific team by ID or teamId
 */
router.get('/teams/:id', getTeam);

/**
 * PUT /api/admin/teams/:id
 * Update team (name, members)
 */
router.put('/teams/:id', updateTeam);

/**
 * DELETE /api/admin/teams/:id
 * Delete a team
 */
router.delete('/teams/:id', deleteTeam);

/**
 * POST /api/admin/teams/:id/reset-round/:roundNumber
 * Reset team progress for a specific round
 */
router.post('/teams/:id/reset-round/:roundNumber', resetTeamRound);

/**
 * PUT /api/admin/teams/:id/unlock-round/:roundNumber
 * Unlock a specific round for a team
 */
router.put('/teams/:id/unlock-round/:roundNumber', unlockRoundForTeam);

/**
 * PUT /api/admin/teams/:id/advance
 * Force advance team to the next round
 */
router.put('/teams/:id/advance', forceAdvanceTeam);

/**
 * GET /api/admin/leaderboard
 * Get leaderboard (all teams or specific round)
 * Query params: ?roundNumber=1 (optional)
 */
router.get('/leaderboard', getLeaderboard);

export default router;
