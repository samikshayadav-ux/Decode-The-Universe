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
          message: 'Round not unlocked'
        });
      }

      // 2. Check if round is live globally
      const round = await Round.findOne({ roundNumber });
      if (!round) {
        return res.status(404).json({
          status: 'error',
          message: 'Round configuration not found'
        });
      }

      // Access allowed if round is live OR if team has it in unlockedRounds 
      // (which we already checked, but the requirement said "OR admin has force-unlocked it")
      // Since 'unlockRoundForTeam' updates 'unlockedRounds', we can assume 
      // presence in 'unlockedRounds' could be either manual or automatic.
      // To strictly follow "status: 'live' OR force-unlocked", we might need another field.
      // But if we don't have one, we'll assume being in unlockedRounds + (live OR currentRound > roundNumber)
      
      const isLive = round.status === 'live';
      const isForceUnlocked = team.unlockedRounds.includes(roundNumber) && !isLive; 
      // This is a bit circular. Let's just check if it's live. 
      // If the admin wants them to play when it's not live, we'll check a 'forceUnlockedRounds' field.
      
      if (!isLive && !(team.forceUnlockedRounds && team.forceUnlockedRounds.includes(roundNumber))) {
          // If it's not live and not explicitly force-unlocked, deny.
          // BUT wait, many teams will have round 1 in unlockedRounds by default.
          // We don't want them accessing it until it's live.
          return res.status(403).json({
            status: 'error',
            message: 'Round is not yet live'
          });
      }

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
