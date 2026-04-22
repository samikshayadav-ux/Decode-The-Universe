import mongoose from 'mongoose';
import { Team, Round1, Round2, FinalRound } from '../models/index.js';

/**
 * Initialize MongoDB Change Streams for Round1, FinalRound, and Team collections
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
 * Initialize change stream for Round1 collection
 * Watches for score updates and emits leaderboard events
 * @param {Object} io - Socket.IO instance
 */
const initializeRound1ChangeStream = (io) => {
  const changeStream = Round1.collection.watch([
    {
      $match: {
        operationType: { $in: ['insert', 'update', 'replace'] }
      }
    }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      
      if (!fullDocument) {
        return;
      }

      const { teamId, score, status, currentQuestion, totalTimeSpent } = fullDocument;

      // Fetch team name for event
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      // Emit round-specific score change
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

      // Fetch full updated leaderboard and emit to round 1 room
      try {
        const updatedLeaderboard = await getLeaderboardData(0);
        io.to('round_1').emit('leaderboard:update', {
          roundNumber: 1,
          type: 'score_change',
          leaderboard: updatedLeaderboard,
          timestamp: new Date().toISOString()
        });
      } catch (leaderboardError) {
        console.error('[Change Stream - Round1] Error fetching leaderboard:', leaderboardError.message);
        // Fallback: emit partial update
        io.to('round_1').emit('leaderboard:update', {
          roundNumber: 1,
          type: 'score_change',
          teamId,
          teamName,
          score,
          status,
          totalTimeSpent,
          timestamp: new Date().toISOString()
        });
      }

      console.log(
        `[Change Stream - Round1] Score updated - Team: ${teamId}, Score: ${score}, Status: ${status}`
      );
    } catch (error) {
      console.error(`[Change Stream - Round1] Error processing change: ${error.message}`);
    }
  });

  changeStream.on('error', (error) => {
    console.error(`[Change Stream - Round1] Error: ${error.message}`);
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('[Change Stream - Round1] Attempting to reconnect...');
      initializeRound1ChangeStream(io);
    }, 5000);
  });

  changeStream.on('close', () => {
    console.log('[Change Stream - Round1] Change stream closed');
  });

  return changeStream;
};

/**
 * Initialize change stream for Round2 collection
 * Watches for stage progress and timing updates, emits leaderboard events
 * @param {Object} io - Socket.IO instance
 */
const initializeRound2ChangeStream = (io) => {
  const changeStream = Round2.collection.watch([
    {
      $match: {
        operationType: { $in: ['insert', 'update', 'replace'] }
      }
    }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      
      if (!fullDocument) {
        return;
      }

      const { teamId, status, currentStage, totalTimeSpent, stage1Answers } = fullDocument;

      // Fetch team name for event
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      // Emit round-specific status change
      io.emit('team:scoreChange', {
        teamId,
        teamName,
        roundNumber: 2,
        currentStage,
        answersCount: stage1Answers?.length || 0,
        status,
        totalTimeSpent,
        timestamp: new Date().toISOString()
      });

      // Fetch full updated leaderboard and emit to round 2 room
      try {
        const updatedLeaderboard = await getLeaderboardData(1);
        io.to('round_2').emit('leaderboard:update', {
          roundNumber: 2,
          type: 'timing_change',
          leaderboard: updatedLeaderboard,
          timestamp: new Date().toISOString()
        });
      } catch (leaderboardError) {
        console.error('[Change Stream - Round2] Error fetching leaderboard:', leaderboardError.message);
        // Fallback: emit partial update
        io.to('round_2').emit('leaderboard:update', {
          roundNumber: 2,
          type: 'timing_change',
          teamId,
          teamName,
          status,
          totalTimeSpent,
          timestamp: new Date().toISOString()
        });
      }

      console.log(
        `[Change Stream - Round2] Progress updated - Team: ${teamId}, Stage: ${currentStage}, Status: ${status}, Time: ${totalTimeSpent}s`
      );
    } catch (error) {
      console.error(`[Change Stream - Round2] Error processing change: ${error.message}`);
    }
  });

  changeStream.on('error', (error) => {
    console.error(`[Change Stream - Round2] Error: ${error.message}`);
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('[Change Stream - Round2] Attempting to reconnect...');
      initializeRound2ChangeStream(io);
    }, 5000);
  });

  changeStream.on('close', () => {
    console.log('[Change Stream - Round2] Change stream closed');
  });

  return changeStream;
};

/**
 * Initialize change stream for FinalRound collection
 * Watches for treasure hunt progress and emits leaderboard events
 * @param {Object} io - Socket.IO instance
 */
const initializeFinalRoundChangeStream = (io) => {
  const changeStream = FinalRound.collection.watch([
    {
      $match: {
        operationType: { $in: ['insert', 'update', 'replace'] }
      }
    }
  ]);

  changeStream.on('change', async (change) => {
    try {
      const fullDocument = change.fullDocument;
      
      if (!fullDocument) {
        return;
      }

      const { teamId, score, status, currentClueId, clueIds } = fullDocument;

      // Fetch team name for event
      const team = await Team.findOne({ teamId }).select('teamName').lean();
      const teamName = team?.teamName || 'Unknown';

      // Emit round-specific score change
      io.emit('team:scoreChange', {
        teamId,
        teamName,
        roundNumber: 3,
        score,
        currentClueId,
        cluesUnlocked: clueIds?.length || 0,
        status,
        timestamp: new Date().toISOString()
      });

      // Emit leaderboard update for round 3
      io.to('round_3').emit('leaderboard:update', {
        roundNumber: 3,
        type: 'score_change',
        teamId,
        teamName,
        score,
        status,
        cluesUnlocked: clueIds?.length || 0,
        timestamp: new Date().toISOString()
      });

      console.log(
        `[Change Stream - FinalRound] Progress updated - Team: ${teamId}, Score: ${score}, Status: ${status}`
      );
    } catch (error) {
      console.error(`[Change Stream - FinalRound] Error processing change: ${error.message}`);
    }
  });

  changeStream.on('error', (error) => {
    console.error(`[Change Stream - FinalRound] Error: ${error.message}`);
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('[Change Stream - FinalRound] Attempting to reconnect...');
      initializeFinalRoundChangeStream(io);
    }, 5000);
  });

  changeStream.on('close', () => {
    console.log('[Change Stream - FinalRound] Change stream closed');
  });

  return changeStream;
};

/**
 * Initialize change stream for Team collection
 * Monitors team-related changes (for future extensibility)
 * @param {Object} io - Socket.IO instance
 */
const initializeTeamChangeStream = (io) => {
  const changeStream = Team.collection.watch([
    {
      $match: {
        operationType: { $in: ['insert', 'update', 'replace'] },
        'updateDescription.updatedFields': {
          $exists: true
        }
      }
    }
  ]);

  changeStream.on('change', (change) => {
    try {
      const fullDocument = change.fullDocument;
      
      if (!fullDocument) {
        return;
      }

      // Extract team info
      const teamId = fullDocument.teamId;
      const teamName = fullDocument.teamName;
      const frozenUntil = fullDocument.frozen_until;

      // Emit team status change if frozen status changed
      if (frozenUntil) {
        io.emit('team:frozen', {
          teamId,
          teamName,
          frozenUntil,
          timestamp: new Date().toISOString()
        });

        console.log(
          `[Change Stream - Team] Team frozen - Team: ${teamId}, Until: ${frozenUntil}`
        );
      }

      // Emit generic team update event
      io.emit('team:updated', {
        teamId,
        teamName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[Change Stream - Team] Error processing change: ${error.message}`);
    }
  });

  changeStream.on('error', (error) => {
    console.error(`[Change Stream - Team] Error: ${error.message}`);
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('[Change Stream - Team] Attempting to reconnect...');
      initializeTeamChangeStream(io);
    }, 5000);
  });

  changeStream.on('close', () => {
    console.log('[Change Stream - Team] Change stream closed');
  });

  return changeStream;
};

/**
 * Get initial leaderboard data for a specific round
 * Sorted by score (descending) and time (ascending)
 * @param {Number} roundNumber - Round number (0, 1, 2, 3)
 * @returns {Promise<Array>} - Leaderboard data
 */
export const getLeaderboardData = async (roundNumber) => {
  try {
    let leaderboard = [];

    if (roundNumber === 1) {
      const round1Data = await Round1.find({})
        .select('teamId score status timeLeft totalTimeSpent timeAtLastSubmission currentQuestion completedAt completionType displayTime lastAnswerTime')
        .lean();

      const teams = await Team.find({ teamId: { $in: round1Data.map(r => r.teamId) } })
        .select('teamId teamName')
        .lean();

      leaderboard = round1Data.map((round) => {
        const team = teams.find(t => t.teamId === round.teamId);
        
        // Calculate display time based on completion type and timeLeft
        let displayTime = null;
        if (round.status === 'completed') {
          // Determine actual completion type
          let completionType = round.completionType;
          
          // If completionType is missing, infer from timeLeft
          if (!completionType) {
            // If timeLeft = 0, it was auto-submit; otherwise it was manual
            completionType = (round.timeLeft === 0) ? 'auto_submit' : 'manual_submit';
          }
          
          if (completionType === 'auto_submit' && round.timeLeft === 0) {
            // Auto-submit with time ran out: show 25:00
            displayTime = 1500-1;
          } else {
            // Manual submit or partial time used: show 25:00 - timeLeft
            const timeLeft = round.timeLeft || 0;
            displayTime = 1500 - timeLeft;
          }
        }
        // If in-progress: displayTime stays null (shows as --:--)
        
        return {
          teamId: round.teamId,
          teamName: team?.teamName || 'Unknown',
          score: round.score || 0,
          status: round.status || 'not_started',
          totalTimeSpent: round.totalTimeSpent || 0,
          timeAtLastSubmission: round.timeAtLastSubmission || 0,
          displayTime: displayTime,
          completionType: round.completionType || null,
          currentQuestion: round.currentQuestion || 0,
          completedAt: round.completedAt || null,
          lastAnswerTime: round.lastAnswerTime || null
        };
      });
    } else if (roundNumber === 3) {
      const finalRoundData = await FinalRound.find({})
        .select('teamId score status timerSeconds completedAt displayTime lastAnswerTime')
        .lean();

      const teams = await Team.find({ teamId: { $in: finalRoundData.map(r => r.teamId) } })
        .select('teamId teamName')
        .lean();

      leaderboard = finalRoundData.map((round) => {
        const team = teams.find(t => t.teamId === round.teamId);
        return {
          teamId: round.teamId,
          teamName: team?.teamName || 'Unknown',
          score: round.score || 0,
          status: round.status || 'not_started',
          totalTimeSpent: round.timerSeconds || 0,
          timeAtLastSubmission: 0,
          displayTime: round.displayTime || (round.timerSeconds || 0),
          currentQuestion: 0,
          completedAt: round.completedAt || null,
          lastAnswerTime: round.lastAnswerTime || null
        };
      });
    } else if (roundNumber === 2) {
      // Round 2: Time-based leaderboard (fastest completion wins)
      const round2Data = await Round2.find({})
        .select('teamId status currentStage totalTimeSpent displayTime stage1Answers stageTimes completedAt lastAnswerTime completionType')
        .lean();

      const teams = await Team.find({ teamId: { $in: round2Data.map(r => r.teamId) } })
        .select('teamId teamName')
        .lean();

      leaderboard = round2Data.map((round) => {
        const team = teams.find(t => t.teamId === round.teamId);
        
        // For Round 2: displayTime is based on totalTimeSpent (time-based, not score-based)
        let displayTime = null;
        if (round.status === 'completed') {
          // Use totalTimeSpent as the ranking metric (fastest wins)
          displayTime = round.totalTimeSpent || round.displayTime || 0;
        }

        // Extract stage times from stageTimes array
        const stageTimes = {};
        if (round.stageTimes && Array.isArray(round.stageTimes)) {
          round.stageTimes.forEach(st => {
            if (st.stageId === 1) stageTimes.stage1 = st.timeSpent || null;
            if (st.stageId === 2) stageTimes.stage2 = st.timeSpent || null;
            if (st.stageId === 3) stageTimes.stage3 = st.timeSpent || null;
          });
        }
        
        return {
          teamId: round.teamId,
          teamName: team?.teamName || 'Unknown',
          score: 0, // Round 2 doesn't use score
          status: round.status || 'not_started',
          totalTimeSpent: round.totalTimeSpent || 0,
          timeAtLastSubmission: 0,
          displayTime: displayTime,
          currentStage: round.currentStage || 1,
          answersCount: round.stage1Answers?.length || 0,
          stageTimes: stageTimes,
          completedAt: round.completedAt || null,
          lastAnswerTime: round.lastAnswerTime || null,
          completionType: round.completionType || null
        };
      });
    } else {
      // Rounds 2: Not yet migrated
      return [];
    }

    // Sort based on round type
    if (roundNumber === 2) {
      // Round 2: Time-based leaderboard (fastest completion wins)
      // Sort only completed teams, by displayTime (ascending - fastest first)
      leaderboard = leaderboard
        .sort((a, b) => {
          // Primary: Status (completed first, then in_progress, then not_started)
          const statusOrder = { 'completed': 0, 'in_progress': 1, 'not_started': 2 };
          const statusA = statusOrder[a.status] || 3;
          const statusB = statusOrder[b.status] || 3;
          if (statusA !== statusB) {
            return statusA - statusB;
          }
          
          // Secondary: For completed teams, sort by time (lowest/fastest first)
          if (a.status === 'completed' && b.status === 'completed') {
            const timeA = a.displayTime || Infinity;
            const timeB = b.displayTime || Infinity;
            if (timeA !== timeB) {
              return timeA - timeB;
            }
          }
          
          // Tertiary: Last answer time (earliest first)
          const lastTimeA = a.lastAnswerTime ? new Date(a.lastAnswerTime).getTime() : Infinity;
          const lastTimeB = b.lastAnswerTime ? new Date(b.lastAnswerTime).getTime() : Infinity;
          return lastTimeA - lastTimeB;
        })
        // Add rank
        .map((team, index) => ({
          ...team,
          rank: index + 1
        }));
    } else {
      // Rounds 0 and 3: Score-based leaderboard
      // Sort by:
      // 1. Score (descending - highest first)
      // 2. Display time (ascending - lowest first)
      // 3. Last answer time (ascending - earliest first)
      leaderboard = leaderboard
        .sort((a, b) => {
          // Primary: Score (highest first)
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          
          // Secondary: Display time (lowest first)
          const timeA = a.displayTime || 0;
          const timeB = b.displayTime || 0;
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          
          // Tertiary: Last answer time (earliest first)
          const lastTimeA = a.lastAnswerTime ? new Date(a.lastAnswerTime).getTime() : Infinity;
          const lastTimeB = b.lastAnswerTime ? new Date(b.lastAnswerTime).getTime() : Infinity;
          return lastTimeA - lastTimeB;
        })
        // Add rank
        .map((team, index) => ({
          ...team,
          rank: index + 1
        }));
    }

    return leaderboard;
  } catch (error) {
    console.error(`[Change Streams] Get leaderboard error: ${error.message}`);
    throw error;
  }
};

/**
 * Get overall leaderboard across all rounds
 * @returns {Promise<Array>} - Overall leaderboard data
 */
export const getOverallLeaderboard = async () => {
  try {
    const teams = await Team.find({})
      .select('teamId teamName')
      .lean();

    const round1Data = await Round1.find({})
      .select('teamId score status totalTimeSpent')
      .lean();

    const finalRoundData = await FinalRound.find({})
      .select('teamId score status')
      .lean();

    // Calculate overall scores and stats
    const leaderboard = teams
      .map((team) => {
        const finalRound = finalRoundData.find(r => r.teamId === team.teamId);

        const totalScore = (finalRound?.score || 0);
        const completedCount = [finalRound?.status === 'completed'].filter(Boolean).length;
        const totalTime = 0; // FinalRound uses timerSeconds

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          totalScore,
          completedRounds: completedCount,
          totalTimeSpent: totalTime,
          roundStats: [
            ...(finalRound ? [{
              roundNumber: 3,
              score: finalRound.score || 0,
              status: finalRound.status
            }] : [])
          ]
        };
      })
      // Sort by total score (descending) and total time (ascending)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.totalTimeSpent - b.totalTimeSpent;
      })
      // Add rank
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    return leaderboard;
  } catch (error) {
    console.error(`[Change Streams] Get overall leaderboard error: ${error.message}`);
    throw error;
  }
};
