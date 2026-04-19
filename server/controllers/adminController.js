import { Team, Round, Round1, Round2, FinalRound } from '../models/index.js';

/**
 * Get all rounds with live team counts
 */
export const getAllRounds = async (req, res) => {
  try {
    const rounds = await Round.getAllRounds();

    const roundsWithCounts = await Promise.all(
      rounds.map(async (round) => {
        let liveTeams = 0;
        let completedTeams = 0;

        if (round.roundNumber === 1) {
          liveTeams = await Round1.countDocuments({ status: 'in_progress' });
          completedTeams = await Round1.countDocuments({ status: 'completed' });
        } else if (round.roundNumber === 2) {
          liveTeams = await Round2.countDocuments({ status: 'in_progress' });
          completedTeams = await Round2.countDocuments({ status: 'completed' });
        } else if (round.roundNumber === 3) {
          liveTeams = await FinalRound.countDocuments({ status: 'in_progress' });
          completedTeams = await FinalRound.countDocuments({ status: 'completed' });
        }

        return {
          id: round._id.toString(),
          roundNumber: round.roundNumber,
          title: round.title,
          displayName: round.displayName,
          description: round.description,
          status: round.status,
          duration: round.duration,
          startedAt: round.startedAt,
          endedAt: round.endedAt,
          stats: {
            liveTeams,
            completedTeams,
            totalTeams: liveTeams + completedTeams
          }
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      data: {
        totalRounds: roundsWithCounts.length,
        rounds: roundsWithCounts
      }
    });
  } catch (error) {
    console.error(`[Admin Controller] Get all rounds error: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch rounds' });
  }
};

/**
 * Set a round to live status
 */
export const setRoundLive = async (req, res) => {
  try {
    const { id } = req.params;
    let round = await Round.findById(id);
    
    if (!round) {
      const roundNumber = parseInt(id);
      if (![1, 2, 3].includes(roundNumber)) {
        return res.status(400).json({ status: 'error', message: 'Invalid round status' });
      }
      round = await Round.findOne({ roundNumber });
    }

    if (!round) return res.status(404).json({ status: 'error', message: 'Round not found' });

    const updatedRound = await Round.setLive(round.roundNumber);

    return res.status(200).json({
      status: 'success',
      data: {
        roundNumber: updatedRound.roundNumber,
        status: updatedRound.status,
        message: `Round ${updatedRound.roundNumber} is now live`
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to set round live' });
  }
};

/**
 * End a round
 */
export const endRound = async (req, res) => {
  try {
    const { id } = req.params;
    let round = await Round.findById(id);
    
    if (!round) {
      const roundNumber = parseInt(id);
      if (![1, 2, 3].includes(roundNumber)) {
        return res.status(400).json({ status: 'error', message: 'Invalid round' });
      }
      round = await Round.findOne({ roundNumber });
    }

    if (!round) return res.status(404).json({ status: 'error', message: 'Round not found' });

    const updatedRound = await Round.endRound(round.roundNumber);

    return res.status(200).json({
      status: 'success',
      data: {
        roundNumber: updatedRound.roundNumber,
        status: updatedRound.status,
        message: `Round ${updatedRound.roundNumber} has ended`
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to end round' });
  }
};

/**
 * Get all teams with their progress
 */
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).select('-password').lean();

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const r1 = await Round1.findOne({ teamId: team.teamId }).lean();
        const r2 = await Round2.findOne({ teamId: team.teamId }).lean();
        const r3 = await FinalRound.findOne({ teamId: team.teamId }).lean();

        const totalScore = (r1?.score || 0) + (r2?.score || 0) + (r3?.score || 0);

        return {
          id: team._id.toString(),
          teamId: team.teamId,
          teamName: team.teamName,
          members: team.members,
          currentRound: team.currentRound,
          unlockedRounds: team.unlockedRounds,
          stats: {
            totalScore,
            roundProgress: [
              ...(r1 ? [{ roundNumber: 1, status: r1.status, score: r1.score }] : []),
              ...(r2 ? [{ roundNumber: 2, status: r2.status, score: r2.score }] : []),
              ...(r3 ? [{ roundNumber: 3, status: r3.status, score: r3.score }] : [])
            ]
          }
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      data: { teams: teamsWithStats }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch teams' });
  }
};

/**
 * Get a specific team
 */
export const getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    let team = await Team.findById(id).select('-password').lean() || await Team.findOne({ teamId: id }).select('-password').lean();

    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    const r1 = await Round1.findOne({ teamId: team.teamId }).lean();
    const r2 = await Round2.findOne({ teamId: team.teamId }).lean();
    const r3 = await FinalRound.findOne({ teamId: team.teamId }).lean();

    return res.status(200).json({
      status: 'success',
      data: {
        ...team,
        progress: {
          round1: r1,
          round2: r2,
          round3: r3
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch team' });
  }
};

/**
 * Update team
 */
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, members, currentRound, unlockedRounds } = req.body;

    let team = await Team.findById(id) || await Team.findOne({ teamId: id });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (teamName) team.teamName = teamName.trim();
    if (members) team.members = members;
    if (currentRound !== undefined) team.currentRound = currentRound;
    if (unlockedRounds) team.unlockedRounds = unlockedRounds;

    await team.save();
    return res.status(200).json({ status: 'success', data: team });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update team' });
  }
};

/**
 * Delete a team
 */
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    let team = await Team.findByIdAndDelete(id) || await Team.findOneAndDelete({ teamId: id });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });
    return res.status(200).json({ status: 'success', message: 'Team deleted' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete team' });
  }
};

/**
 * Reset team progress for a round
 */
export const resetTeamRound = async (req, res) => {
  try {
    const { id, roundNumber } = req.params;
    const round = parseInt(roundNumber);
    const team = await Team.findById(id) || await Team.findOne({ teamId: id });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (round === 1) await Round1.deleteOne({ teamId: team.teamId });
    else if (round === 2) await Round2.deleteOne({ teamId: team.teamId });
    else if (round === 3) await FinalRound.deleteOne({ teamId: team.teamId });
    else return res.status(400).json({ status: 'error', message: 'Invalid round number' });

    return res.status(200).json({ status: 'success', message: `Round ${round} reset for ${team.teamId}` });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to reset round' });
  }
};

/**
 * Unlock a specific round for a team (Admin action)
 */
export const unlockRoundForTeam = async (req, res) => {
  try {
    const { id, roundNumber } = req.params;
    const round = parseInt(roundNumber);
    const team = await Team.findById(id) || await Team.findOne({ teamId: id });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (!team.unlockedRounds.includes(round)) {
      team.unlockedRounds.push(round);
      await team.save();
    }

    return res.status(200).json({ status: 'success', data: { unlockedRounds: team.unlockedRounds } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to unlock round' });
  }
};

/**
 * Force advance a team to the next round
 */
export const forceAdvanceTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id) || await Team.findOne({ teamId: id });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (team.currentRound < 3) {
      team.currentRound += 1;
      if (!team.unlockedRounds.includes(team.currentRound)) {
        team.unlockedRounds.push(team.currentRound);
      }
      await team.save();
    }

    return res.status(200).json({ status: 'success', data: { currentRound: team.currentRound, unlockedRounds: team.unlockedRounds } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to advance team' });
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { roundNumber } = req.query;
    const teams = await Team.find({}).select('teamId teamName').lean();
    let leaderboard = [];

    if (roundNumber) {
      const round = parseInt(roundNumber);
      if (round === 1) {
        const scores = await Round1.find({}).lean();
        leaderboard = teams.map(t => {
          const d = scores.find(s => s.teamId === t.teamId);
          return { teamId: t.teamId, teamName: t.teamName, score: d?.score || 0, status: d?.status || 'not_started' };
        });
      } else if (round === 2) {
        const scores = await Round2.find({}).lean();
        leaderboard = teams.map(t => {
          const d = scores.find(s => s.teamId === t.teamId);
          return { teamId: t.teamId, teamName: t.teamName, score: d?.answers?.length || 0, status: d?.status || 'not_started' };
        });
      } else if (round === 3) {
        const scores = await FinalRound.find({}).lean();
        leaderboard = teams.map(t => {
          const d = scores.find(s => s.teamId === t.teamId);
          return { teamId: t.teamId, teamName: t.teamName, score: d?.clueIds?.length || 0, status: d?.status || 'not_started' };
        });
      }
    } else {
      const r1s = await Round1.find({}).select('teamId score').lean();
      const r2s = await Round2.find({}).select('teamId answers').lean();
      const r3s = await FinalRound.find({}).select('teamId clueIds').lean();

      leaderboard = teams.map(t => {
        const s1 = r1s.find(s => s.teamId === t.teamId)?.score || 0;
        const s2 = r2s.find(s => s.teamId === t.teamId)?.answers?.length || 0;
        const s3 = r3s.find(s => s.teamId === t.teamId)?.clueIds?.length || 0;
        return { teamId: t.teamId, teamName: t.teamName, totalScore: s1 + s2 + s3 };
      });
    }

    leaderboard.sort((a, b) => (b.totalScore || b.score) - (a.totalScore || a.score));
    leaderboard = leaderboard.map((t, i) => ({ ...t, rank: i + 1 }));

    return res.status(200).json({ status: 'success', data: { leaderboard } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
  }
};

/**
 * Unlock a specific round for all teams
 */
export const unlockRoundGlobally = async (req, res) => {
  try {
    const { id } = req.params;
    let round = await Round.findById(id);
    
    if (!round) {
      const roundNumber = parseInt(id);
      if ([1, 2, 3].includes(roundNumber)) {
        round = await Round.findOne({ roundNumber });
      }
    }

    if (!round) return res.status(404).json({ status: 'error', message: 'Round not found' });

    const roundNumber = round.roundNumber;
    await Team.updateMany(
      {}, 
      { $addToSet: { unlockedRounds: roundNumber } }
    );

    return res.status(200).json({ 
      status: 'success', 
      message: `Round ${roundNumber} unlocked for all teams` 
    });
  } catch (error) {
    console.error(`[Admin Controller] Unlock globally error: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Failed to unlock round globally' });
  }
};

