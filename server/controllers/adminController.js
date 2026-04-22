import { Team, Round, Round1, FinalRound } from '../models/index.js';

/**
 * Get all rounds with live team counts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRounds = async (req, res) => {
  try {
    const rounds = await Round.getAllRounds();

    // For each round, get team count from appropriate collection
    const roundsWithCounts = await Promise.all(
      rounds.map(async (round) => {
        let liveTeams = 0;
        let completedTeams = 0;

        if (round.roundNumber === 1) {
          liveTeams = await Round1.countDocuments({ status: 'in_progress' });
          completedTeams = await Round1.countDocuments({ status: 'completed' });
        } else if (round.roundNumber === 3) {
          liveTeams = await FinalRound.countDocuments({ status: 'in_progress' });
          completedTeams = await FinalRound.countDocuments({ status: 'completed' });
        } else {
          // Rounds 1 and 2 not yet migrated
          liveTeams = 0;
          completedTeams = 0;
        }

        return {
          id: round._id.toString(),
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          status: round.status,
          duration: round.duration,
          startedAt: round.startedAt,
          endedAt: round.endedAt,
          createdAt: round.createdAt,
          updatedAt: round.updatedAt,
          stats: {
            liveTeams,
            completedTeams,
            totalTeams: liveTeams + completedTeams
          }
        };
      })
    );

    console.log(`[Admin Controller] Retrieved all rounds with stats`);

    return res.status(200).json({
      status: 'success',
      data: {
        totalRounds: roundsWithCounts.length,
        rounds: roundsWithCounts
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Get all rounds error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch rounds',
      error: error.message
    });
  }
};

/**
 * Set a round to live status
 * Ensures only one round is live at a time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setRoundLive = async (req, res) => {
  try {
    const { id } = req.params;

    // Find round by ID or roundNumber
    let round = await Round.findById(id);
    
    if (!round) {
      // Try finding by roundNumber
      const roundNumber = parseInt(id);
      if (![1, 2, 3].includes(roundNumber)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid round number or ID'
        });
      }
      round = await Round.findOne({ roundNumber });
    }

    if (!round) {
      return res.status(404).json({
        status: 'error',
        message: 'Round not found'
      });
    }

    // Use the static method to set live (which handles exclusivity)
    const updatedRound = await Round.setLive(round.roundNumber);

    console.log(`[Admin Controller] Round ${round.roundNumber} set to live`);

    return res.status(200).json({
      status: 'success',
      data: {
        id: updatedRound._id.toString(),
        roundNumber: updatedRound.roundNumber,
        title: updatedRound.title,
        status: updatedRound.status,
        startedAt: updatedRound.startedAt,
        message: `Round ${round.roundNumber} is now live`
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Set round live error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to set round live',
      error: error.message
    });
  }
};

/**
 * End a round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const endRound = async (req, res) => {
  try {
    const { id } = req.params;

    // Find round by ID or roundNumber
    let round = await Round.findById(id);
    
    if (!round) {
      // Try finding by roundNumber
      const roundNumber = parseInt(id);
      if (![1, 2, 3].includes(roundNumber)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid round number or ID'
        });
      }
      round = await Round.findOne({ roundNumber });
    }

    if (!round) {
      return res.status(404).json({
        status: 'error',
        message: 'Round not found'
      });
    }

    // Use the static method to end round
    const updatedRound = await Round.endRound(round.roundNumber);

    console.log(`[Admin Controller] Round ${round.roundNumber} ended`);

    return res.status(200).json({
      status: 'success',
      data: {
        id: updatedRound._id.toString(),
        roundNumber: updatedRound.roundNumber,
        title: updatedRound.title,
        status: updatedRound.status,
        endedAt: updatedRound.endedAt,
        message: `Round ${round.roundNumber} has ended`
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] End round error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to end round',
      error: error.message
    });
  }
};

/**
 * Get all teams with their progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).select('-password').lean();

    // Add computed fields from Round1 and FinalRound collections
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const round1 = await Round1.findOne({ teamId: team.teamId }).lean();
        const finalRound = await FinalRound.findOne({ teamId: team.teamId }).lean();

        const totalScore = (round1?.score || 0) + (finalRound?.score || 0);
        const completedRounds = [];
        if (round1?.status === 'completed') completedRounds.push(1);
        if (finalRound?.status === 'completed') completedRounds.push(3);

        const currentRound = round1?.status === 'in_progress' ? 0 : 
                            finalRound?.status === 'in_progress' ? 3 : 
                            completedRounds.length > 0 ? Math.max(...completedRounds) + 1 : 0;

        return {
          id: team._id.toString(),
          teamId: team.teamId,
          teamName: team.teamName,
          members: team.members,
          createdAt: team.createdAt,
          stats: {
            totalScore,
            currentRound,
            completedRounds,
            roundProgress: [
              ...(round1 ? [{
                roundNumber: 1,
                status: round1.status,
                score: round1.score,
                answersCount: round1.answers?.length || 0
              }] : []),
              ...(finalRound ? [{
                roundNumber: 3,
                status: finalRound.status,
                score: finalRound.score,
                answersCount: finalRound.clueIds?.length || 0
              }] : [])
            ]
          }
        };
      })
    );

    console.log(`[Admin Controller] Retrieved ${teamsWithStats.length} teams`);

    return res.status(200).json({
      status: 'success',
      data: {
        totalTeams: teamsWithStats.length,
        teams: teamsWithStats
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Get all teams error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};

/**
 * Get a specific team by ID or teamId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding by MongoDB ID first
    let team = await Team.findById(id).select('-password').lean();

    // If not found, try by teamId
    if (!team) {
      team = await Team.findOne({ teamId: id }).select('-password').lean();
    }

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Query Round1 and FinalRound collections
    const round1 = await Round1.findOne({ teamId: team.teamId }).lean();
    const finalRound = await FinalRound.findOne({ teamId: team.teamId }).lean();

    const completedRounds = [];
    if (round1?.status === 'completed') completedRounds.push(1);
    if (finalRound?.status === 'completed') completedRounds.push(3);

    const currentRound = round1?.status === 'in_progress' ? 0 : 
                        finalRound?.status === 'in_progress' ? 3 : 
                        completedRounds.length > 0 ? Math.max(...completedRounds) + 1 : 0;

    const totalScore = (round1?.score || 0) + (finalRound?.score || 0);

    console.log(`[Admin Controller] Retrieved team: ${team.teamId}`);

    return res.status(200).json({
      status: 'success',
      data: {
        id: team._id.toString(),
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        stats: {
          totalScore,
          currentRound,
          completedRounds,
          roundProgress: [
            ...(round1 ? [{
              roundNumber: 1,
              status: round1.status,
              score: round1.score,
              timeLeft: round1.timeLeft,
              answersCount: round1.answers?.length || 0,
              answers: round1.answers
            }] : []),
            ...(finalRound ? [{
              roundNumber: 3,
              status: finalRound.status,
              score: finalRound.score,
              clueIds: finalRound.clueIds,
              answersCount: finalRound.clueIds?.length || 0
            }] : [])
          ]
        }
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Get team error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};

/**
 * Update team (name, members)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, members } = req.body;

    // Find team by ID or teamId
    let team = await Team.findById(id);

    if (!team) {
      team = await Team.findOne({ teamId: id });
    }

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Update allowed fields
    if (teamName) {
      team.teamName = teamName.trim();
    }

    if (members && Array.isArray(members)) {
      team.members = members
        .filter(m => m.name && m.name.trim().length > 0)
        .map(m => ({
          name: m.name.trim(),
          position: m.position || undefined
        }))
        .slice(0, 4);
    }

    await team.save();

    console.log(`[Admin Controller] Team updated: ${team.teamId}`);

    return res.status(200).json({
      status: 'success',
      data: {
        id: team._id.toString(),
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        message: 'Team updated successfully'
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Update team error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update team',
      error: error.message
    });
  }
};

/**
 * Delete a team
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete by ID or teamId
    let team = await Team.findByIdAndDelete(id);

    if (!team) {
      team = await Team.findOneAndDelete({ teamId: id });
    }

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    console.log(`[Admin Controller] Team deleted: ${team.teamId}`);

    return res.status(200).json({
      status: 'success',
      data: {
        teamId: team.teamId,
        teamName: team.teamName,
        message: 'Team deleted successfully'
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Delete team error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete team',
      error: error.message
    });
  }
};

/**
 * Reset team progress for a round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetTeamRound = async (req, res) => {
  try {
    const { id, roundNumber } = req.params;
    const round = parseInt(roundNumber);

    if (![1, 2, 3].includes(round)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number'
      });
    }

    // Find team
    let team = await Team.findById(id);

    if (!team) {
      team = await Team.findOne({ teamId: id });
    }

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Reset the appropriate round collection
    if (round === 1) {
      const round1 = await Round1.findOne({ teamId: team.teamId });
      if (!round1) {
        return res.status(404).json({
          status: 'error',
          message: `Round ${roundNumber} not started for this team`
        });
      }
      await Round1.deleteOne({ teamId: team.teamId });
    } else if (round === 3) {
      const finalRound = await FinalRound.findOne({ teamId: team.teamId });
      if (!finalRound) {
        return res.status(404).json({
          status: 'error',
          message: `Round ${roundNumber} not started for this team`
        });
      }
      await FinalRound.deleteOne({ teamId: team.teamId });
    } else {
      // Rounds 1 and 2 not yet migrated
      return res.status(501).json({
        status: 'error',
        message: `Round ${roundNumber} reset not yet implemented`
      });
    }

    console.log(`[Admin Controller] Round ${roundNumber} reset for team: ${team.teamId}`);

    return res.status(200).json({
      status: 'success',
      data: {
        teamId: team.teamId,
        roundNumber: round,
        message: `Round ${roundNumber} has been reset for team ${team.teamId}`
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Reset team round error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reset round',
      error: error.message
    });
  }
};

/**
 * Get leaderboard for a specific round or all rounds
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { roundNumber } = req.query;

    const teams = await Team.find({})
      .select('teamId teamName')
      .lean();

    // Build leaderboard with data from Round1 and FinalRound collections
    let leaderboard = [];

    if (roundNumber !== undefined) {
      const round = parseInt(roundNumber);
      if (![1, 2, 3].includes(round)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid round number'
        });
      }

      // Query specific round
      if (round === 1) {
        const round1Scores = await Round1.find({}).select('teamId score status').lean();
        leaderboard = teams.map(team => {
          const roundData = round1Scores.find(r => r.teamId === team.teamId);
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            roundNumber: 1,
            score: roundData?.score || 0,
            status: roundData?.status || 'not_started',
            timeSpent: roundData?.totalTimeSpent || 0
          };
        });
      } else if (round === 3) {
        const finalRoundScores = await FinalRound.find({}).select('teamId score status').lean();
        leaderboard = teams.map(team => {
          const roundData = finalRoundScores.find(r => r.teamId === team.teamId);
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            roundNumber: 3,
            score: roundData?.score || 0,
            status: roundData?.status || 'not_started',
            timeSpent: roundData?.timerSeconds || 0
          };
        });
      } else {
        // Rounds 1 and 2 not yet implemented
        return res.status(501).json({
          status: 'error',
          message: `Leaderboard for round ${round} not yet implemented`
        });
      }
    } else {
      // All rounds - get total from Round1 + FinalRound
      const round1Scores = await Round1.find({}).select('teamId score').lean();
      const finalRoundScores = await FinalRound.find({}).select('teamId score').lean();

      leaderboard = teams.map(team => {
        const round1Data = round1Scores.find(r => r.teamId === team.teamId);
        const finalRoundData = finalRoundScores.find(r => r.teamId === team.teamId);
        const totalScore = (round1Data?.score || 0) + (finalRoundData?.score || 0);

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          totalScore,
          roundCount: [round1Data, finalRoundData].filter(Boolean).length
        };
      });
    }

    // Sort and add ranks
    leaderboard = leaderboard
      .sort((a, b) => {
        const scoreA = roundNumber ? (a.score || 0) : (a.totalScore || 0);
        const scoreB = roundNumber ? (b.score || 0) : (b.totalScore || 0);
        return scoreB - scoreA;
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    console.log(`[Admin Controller] Generated leaderboard for ${teams.length} teams`);

    return res.status(200).json({
      status: 'success',
      data: {
        roundNumber: roundNumber !== undefined ? parseInt(roundNumber) : 'all',
        teamCount: teams.length,
        leaderboard
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Get leaderboard error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};
