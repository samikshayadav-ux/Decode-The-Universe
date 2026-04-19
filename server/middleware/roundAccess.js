import { Team, Round } from '../models/index.js';

/**
 * Middleware factory to enforce round access control
 * @param {number} roundNumber - The round number to check access for
 */
export const requireRoundAccess = (roundNumberArgument) => {
  return async (req, res, next) => {
    try {
      const { teamId } = req.user;
      const roundNumber = roundNumberArgument || parseInt(req.params.round);

      if (!teamId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      if (isNaN(roundNumber)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid round number'
        });
      }

      const team = await Team.findOne({ teamId });
      if (!team) {
        return res.status(404).json({
          status: 'error',
          message: 'Team not found'
        });
      }

      // 1. Check if round is in team's unlockedRounds
      if (!team.unlockedRounds.includes(roundNumber)) {
        return res.status(403).json({
          status: 'error',
          message: 'Round not unlocked for this team.'
        });
      }

      // We are bypassing the global Round.status === 'live' check as per user request
      // to rely solely on the team-based gateway access system.
      
      next();
    } catch (error) {
      console.error(`[Round Access Middleware] Error:`, error.message);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during access check'
      });
    }
  };
};
