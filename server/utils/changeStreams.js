import mongoose from 'mongoose';
import { Team, Round1, Round2, FinalRound } from '../models/index.js';

/**
 * Initialize MongoDB Change Streams for Round1, Round2, FinalRound, and Team collections
 * Emits real-time events to Socket.IO clients
 * @param {Object} io - Socket.IO instance
 * @returns {Object} - Object containing all change stream references
 */
export const initializeChangeStreams = (io) => {
  const changeStreams = {
    round1: initializeRound1ChangeStream(io),
    round2: initializeRound2ChangeStream(io),
    finalRound: initializeFinalRoundChangeStream(io),
    team: initializeTeamChangeStream(io)
  };

  return changeStreams;
};

/**
 * Initialize change stream for Round1 collection (Quiz)
 */
const initializeRound1ChangeStream = (io) => {
  const changeStream = Round1.collection.watch([
    { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      if (!fullDocument) return;

      const { teamId, score, status, currentQuestion, totalTimeSpent } = fullDocument;
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      io.emit('team:scoreChange', {
        teamId,
        teamName,
        roundNumber: 1,
        score,
        currentQuestion,
        status,
        totalTimeSpent,
        timestamp: new Date().toISOString()
      });

      const updatedLeaderboard = await getLeaderboardData(1);
      io.to('round_1').emit('leaderboard:update', {
        roundNumber: 1,
        type: 'score_change',
        leaderboard: updatedLeaderboard,
        timestamp: new Date().toISOString()
      });

      console.log(`[Change Stream - Round1] Score updated - Team: ${teamId}, Score: ${score}`);
    } catch (error) {
      console.error(`[Change Stream - Round1] Error: ${error.message}`);
    }
  });

  return changeStream;
};

/**
 * Initialize change stream for Round2 collection (Challenge)
 */
const initializeRound2ChangeStream = (io) => {
  const changeStream = Round2.collection.watch([
    { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      if (!fullDocument) return;

      const { teamId, status, currentStage, totalTimeSpent, answers } = fullDocument;
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      io.emit('team:scoreChange', {
        teamId,
        teamName,
        roundNumber: 2,
        currentStage,
        answersCount: answers?.length || 0,
        status,
        totalTimeSpent,
        timestamp: new Date().toISOString()
      });

      const updatedLeaderboard = await getLeaderboardData(2);
      io.to('round_2').emit('leaderboard:update', {
        roundNumber: 2,
        type: 'timing_change',
        leaderboard: updatedLeaderboard,
        timestamp: new Date().toISOString()
      });

      console.log(`[Change Stream - Round2] Progress updated - Team: ${teamId}, Stage: ${currentStage}`);
    } catch (error) {
      console.error(`[Change Stream - Round2] Error: ${error.message}`);
    }
  });

  return changeStream;
};

/**
 * Initialize change stream for FinalRound collection
 */
const initializeFinalRoundChangeStream = (io) => {
  const changeStream = FinalRound.collection.watch([
    { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      if (!fullDocument) return;

      const { teamId, score, status, clueIds } = fullDocument;
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      io.emit('team:scoreChange', {
        teamId,
        teamName,
        roundNumber: 3,
        score,
        status,
        timestamp: new Date().toISOString()
      });

      const updatedLeaderboard = await getLeaderboardData(3);
      io.to('round_3').emit('leaderboard:update', {
        roundNumber: 3,
        type: 'score_change',
        leaderboard: updatedLeaderboard,
        timestamp: new Date().toISOString()
      });

      console.log(`[Change Stream - FinalRound] Progress updated - Team: ${teamId}, Score: ${score}`);
    } catch (error) {
      console.error(`[Change Stream - FinalRound] Error: ${error.message}`);
    }
  });

  return changeStream;
};

/**
 * Initialize change stream for Team collection
 */
const initializeTeamChangeStream = (io) => {
  const changeStream = Team.collection.watch([
    { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
  ]);

  changeStream.on('change', (change) => {
    try {
      const fullDocument = change.fullDocument;
      if (!fullDocument) return;

      io.emit('team:updated', {
        teamId: fullDocument.teamId,
        teamName: fullDocument.teamName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[Change Stream - Team] Error: ${error.message}`);
    }
  });

  return changeStream;
};

/**
 * Get leaderboard data for a specific round
 */
export const getLeaderboardData = async (roundNumber) => {
  try {
    let leaderboard = [];

    if (roundNumber === 1) {
      const data = await Round1.find({}).lean();
      const teams = await Team.find({ teamId: { $in: data.map(r => r.teamId) } }).select('teamId teamName').lean();
      leaderboard = data.map(r => ({
        teamId: r.teamId,
        teamName: teams.find(t => t.teamId === r.teamId)?.teamName || 'Unknown',
        score: r.score,
        status: r.status,
        displayTime: r.displayTime || r.totalTimeSpent
      }));
    } else if (roundNumber === 2) {
      const data = await Round2.find({}).lean();
      const teams = await Team.find({ teamId: { $in: data.map(r => r.teamId) } }).select('teamId teamName').lean();
      leaderboard = data.map(r => ({
        teamId: r.teamId,
        teamName: teams.find(t => t.teamId === r.teamId)?.teamName || 'Unknown',
        score: r.answers?.length || 0,
        status: r.status,
        displayTime: r.totalTimeSpent
      }));
    } else if (roundNumber === 3) {
      const data = await FinalRound.find({}).lean();
      const teams = await Team.find({ teamId: { $in: data.map(r => r.teamId) } }).select('teamId teamName').lean();
      leaderboard = data.map(r => ({
        teamId: r.teamId,
        teamName: teams.find(t => t.teamId === r.teamId)?.teamName || 'Unknown',
        score: r.score || 0,
        status: r.status,
        displayTime: r.timerSeconds
      }));
    }

    return leaderboard
      .sort((a, b) => b.score - a.score || a.displayTime - b.displayTime)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  } catch (error) {
    console.error(`[Change Streams] Error: ${error.message}`);
    return [];
  }
};

/**
 * Get overall leaderboard
 */
export const getOverallLeaderboard = async () => {
  try {
    const teams = await Team.find({}).select('teamId teamName').lean();
    const r1 = await Round1.find({}).lean();
    const r2 = await Round2.find({}).lean();
    const r3 = await FinalRound.find({}).lean();

    const leaderboard = teams.map(team => {
      const s1 = r1.find(r => r.teamId === team.teamId)?.score || 0;
      const s2 = r2.find(r => r.teamId === team.teamId)?.answers?.length || 0;
      const s3 = r3.find(r => r.teamId === team.teamId)?.score || 0;

      return {
        teamId: team.teamId,
        teamName: team.teamName,
        totalScore: s1 + s2 + s3
      };
    });

    return leaderboard
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  } catch (error) {
    console.error(`[Change Streams] Error: ${error.message}`);
    return [];
  }
};
