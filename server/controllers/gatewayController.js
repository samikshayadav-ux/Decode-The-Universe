import { Round1, Round2, FinalRound, Team, Round } from '../models/index.js';
import { loadQuestions, loadClues } from '../utils/loadQuestions.js';

/**
 * Initialize Round 1 - Check/Create Round1 record and return progress + questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initializeRound1 = async (req, res) => {
  try {
    const { teamId } = req.user;

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required in JWT token'
      });
    }

    // Check if Round1 record exists
    let round1Record = await Round1.findByTeamId(teamId);

    if (!round1Record) {
      // Get team info for teamName
      const team = await Team.findOne({ teamId });
      
      if (!team) {
        return res.status(404).json({
          status: 'error',
          message: 'Team not found'
        });
      }

      // Create new Round1 record with defaults
      round1Record = new Round1({
        teamId,
        teamName: team.teamName,
        currentQuestion: 0,
        score: 0,
        timeLeft: 1500,
        answers: [],
        totalTimeSpent: 0,
        timeAtLastSubmission: 0,
        status: 'in_progress',
        startedAt: new Date()
      });

      await round1Record.save();
      console.log(`[Gateway Controller] Created new Round1 record for team ${teamId}`);
    }

    // Load questions from JSON
    let questions;
    try {
      questions = loadQuestions(1);
    } catch (loadError) {
      console.error(`[Gateway Controller] Error loading Round 1 questions:`, loadError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to load quiz questions'
      });
    }

    console.log(`[Gateway Controller] Round 1 initialized for team ${teamId}`);
    console.log(`[Gateway Controller] Round1 Record Details:`, {
      teamId: round1Record.teamId,
      status: round1Record.status,
      currentQuestion: round1Record.currentQuestion,
      score: round1Record.score,
      timeLeft: round1Record.timeLeft,
      answersCount: round1Record.answers.length,
      totalTimeSpent: round1Record.totalTimeSpent,
      timeAtLastSubmission: round1Record.timeAtLastSubmission,
      createdAt: round1Record.createdAt,
      updatedAt: round1Record.updatedAt
    });

    // DO NOT send correct answers to frontend for security - verify answers on backend instead
    return res.status(200).json({
      status: 'success',
      data: {
        round: 1,
        progress: {
          teamId: round1Record.teamId,
          teamName: round1Record.teamName,
          currentQuestion: round1Record.currentQuestion,
          score: round1Record.score,
          timeLeft: round1Record.timeLeft,
          answers: round1Record.answers.map(ans => ({
            questionId: ans.questionId,
            answer: ans.answer,
            isCorrect: ans.isCorrect,
            timestamp: ans.timestamp,
            timeTaken: ans.timeTaken
          })),
          answersCount: round1Record.answers.length,
          status: round1Record.status,
          totalTimeSpent: round1Record.totalTimeSpent,
          timeAtLastSubmission: round1Record.timeAtLastSubmission,
          startedAt: round1Record.startedAt,
          lastAnswerTime: round1Record.lastAnswerTime,
          completedAt: round1Record.completedAt
        },
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options
          // DO NOT include: answer (for security)
        })),
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error(`[Gateway Controller] Initialize Round 1 error:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initialize Round 1',
      error: error.message
    });
  }
};

/**
 * Initialize Round 2 - Check/Create Round2 record and return progress + Stage 2 questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initializeRound2 = async (req, res) => {
  try {
    const { teamId } = req.user;

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required in JWT token'
      });
    }

    // Check if Round2 record exists
    let round2Record = await Round2.findByTeamId(teamId);

    if (!round2Record) {
      // Get team info for teamName
      const team = await Team.findOne({ teamId });
      
      if (!team) {
        return res.status(404).json({
          status: 'error',
          message: 'Team not found'
        });
      }

      // Create new Round2 record with defaults
      round2Record = new Round2({
        teamId,
        teamName: team.teamName,
        currentStage: 1,
        stage2Answers: [],
        totalTimeSpent: 0,
        stageTimes: [
          {
            stageId: 1,
            timeSpent: 0,
            startedAt: new Date(),
            completedAt: null
          }
        ],
        status: 'in_progress',
        startedAt: new Date(),
        completionType: null
      });

      await round2Record.save();
      console.log(`[Gateway Controller] Created new Round2 record for team ${teamId}`);
    }

    // Load questions from JSON (Stage 2 questions from Data1.json)
    let questions;
    try {
      questions = loadQuestions(2);
    } catch (loadError) {
      console.error(`[Gateway Controller] Error loading Round 2 questions:`, loadError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to load round 1 questions'
      });
    }

    console.log(`[Gateway Controller] Round 2 initialized for team ${teamId}`);
    console.log(`[Gateway Controller] Round2 Record Details:`, {
      teamId: round2Record.teamId,
      status: round2Record.status,
      currentStage: round2Record.currentStage,
      answersCount: round2Record.stage2Answers.length,
      totalTimeSpent: round2Record.totalTimeSpent,
      createdAt: round2Record.createdAt,
      updatedAt: round2Record.updatedAt
    });

    // DO NOT send correct answers to frontend for security - verify answers on backend instead
    return res.status(200).json({
      status: 'success',
      data: {
        round: 2,
        progress: {
          teamId: round2Record.teamId,
          teamName: round2Record.teamName,
          currentStage: round2Record.currentStage,
          stage2Answers: round2Record.stage2Answers.map(ans => ({
            questionId: ans.questionId,
            answer: ans.answer,
            isCorrect: ans.isCorrect,
            timestamp: ans.timestamp
          })),
          answersCount: round2Record.stage2Answers.length,
          status: round2Record.status,
          totalTimeSpent: round2Record.totalTimeSpent,
          stageTimes: round2Record.stageTimes,
          startedAt: round2Record.startedAt,
          lastAnswerTime: round2Record.lastAnswerTime,
          completedAt: round2Record.completedAt,
          completionType: round2Record.completionType
        },
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          ...(q.img && { img: q.img }),
          ...(q.code && { code: q.code }),
          ...(q.text && { text: q.text }),
          ...(q.properties && { properties: q.properties }),
          ...(q.stats && { stats: q.stats }),
          ...(q.details && { details: q.details }),
          ...(q.passage && { passage: q.passage }),
          type: q.type
          // DO NOT include: answer (for security)
        })),
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error(`[Gateway Controller] Initialize Round 2 error:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initialize Round 2',
      error: error.message
    });
  }
};

/**
 * Initialize Final Round - Check/Create FinalRound record and return progress + clues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initializeFinalRound = async (req, res) => {
  try {
    const { teamId } = req.user;

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required in JWT token'
      });
    }

    // Check if FinalRound record exists
    let finalRoundRecord = await FinalRound.findByTeamId(teamId);

    if (!finalRoundRecord) {
      // Get team info for teamName
      const team = await Team.findOne({ teamId });
      
      if (!team) {
        return res.status(404).json({
          status: 'error',
          message: 'Team not found'
        });
      }

      // Create new FinalRound record with defaults
      finalRoundRecord = new FinalRound({
        teamId,
        teamName: team.teamName,
        clueIds: [],
        currentClueId: null,
        timerSeconds: 0,
        status: 'in_progress',
        startedAt: new Date(),
        clueProgress: []
      });

      await finalRoundRecord.save();
      console.log(`[Gateway Controller] Created new FinalRound record for team ${teamId}`);
    }

    // Load clues from JSON
    let clues;
    try {
      clues = loadClues();
    } catch (loadError) {
      console.error(`[Gateway Controller] Error loading Final Round clues:`, loadError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to load final round clues'
      });
    }

    console.log(`[Gateway Controller] Final Round initialized for team ${teamId}`);

    return res.status(200).json({
      status: 'success',
      data: {
        round: 3,
        progress: {
          teamId: finalRoundRecord.teamId,
          teamName: finalRoundRecord.teamName,
          clueIds: finalRoundRecord.clueIds,
          currentClueId: finalRoundRecord.currentClueId,
          timerSeconds: finalRoundRecord.timerSeconds,
          status: finalRoundRecord.status,
          startedAt: finalRoundRecord.startedAt
        },
        clues: clues.map(c => ({
          clue_id: c.clue_id,
          clue: c.clue,
          type: c.type,
          ...(c.image_url && { image_url: c.image_url })
        })),
        totalClues: clues.length
      }
    });
  } catch (error) {
    console.error(`[Gateway Controller] Initialize Final Round error:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initialize Final Round',
      error: error.message
    });
  }
};

/**
 * Get live rounds (public endpoint for home screen)
 * @param {Object} req - Express request object (query: status)
 * @param {Object} res - Express response object
 */
export const getLiveRounds = async (req, res) => {
  try {
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'status query parameter is required (e.g., ?status=live)'
      });
    }

    const rounds = await Round.find({ status }).sort({ roundNumber: 1 });

    return res.status(200).json(rounds);
  } catch (error) {
    console.error(`[Gateway Controller] Get live rounds error:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch rounds'
    });
  }
};

export default {
  initializeRound1,
  initializeRound2,
  initializeFinalRound,
  getLiveRounds
};
