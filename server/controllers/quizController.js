import bcryptjs from 'bcryptjs';
import { Team, Round, Round1, Round2, FinalRound } from '../models/index.js';
import { loadQuestions, loadClues } from '../utils/loadQuestions.js';
import { getLeaderboardData } from '../utils/changeStreams.js';

/**
 * Get all questions for a specific round
 */
export const getQuestions = async (req, res) => {
  try {
    const { round } = req.params;
    const roundNumber = parseInt(round);

    if (![1, 2, 3].includes(roundNumber)) {
      return res.status(400).json({ status: 'error', message: 'Invalid round number' });
    }

    let questions;
    try {
      questions = loadQuestions(roundNumber);
    } catch (loadError) {
      return res.status(500).json({ status: 'error', message: 'Failed to load questions' });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No questions found' });
    }

    const safeQuestions = questions.map(q => ({
      id: q.id || q.questionId,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty || 'medium',
      points: q.points || 1,
      ...(q.img && { img: q.img }),
      ...(q.code && { code: q.code }),
      ...(q.text && { text: q.text }),
      ...(q.type && { type: q.type })
    }));

    return res.status(200).json({
      status: 'success',
      data: { roundNumber, totalQuestions: safeQuestions.length, questions: safeQuestions }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch questions' });
  }
};

/**
 * Submit an answer
 */
export const submitAnswer = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, questionId, answer, timeTaken, timeLeft } = req.body;
    const roundNumber = parseInt(round);

    if (![1, 2, 3].includes(roundNumber)) {
      return res.status(400).json({ status: 'error', message: 'Invalid round' });
    }

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    let questions = loadQuestions(roundNumber);
    const question = questions.find(q => q.id === questionId || q.questionId === questionId);
    if (!question) return res.status(404).json({ status: 'error', message: 'Question not found' });

    let isCorrect = false;
    if (Array.isArray(question.answer)) {
      isCorrect = question.answer.some(v => v.toLowerCase().trim() === answer.toLowerCase().trim());
    } else {
      isCorrect = question.answer?.toLowerCase().trim() === answer.toLowerCase().trim();
    }

    let roundRecord;
    if (roundNumber === 1) {
      roundRecord = await Round1.findByTeamId(teamId);
      if (roundRecord) {
        roundRecord.submitAnswer(questionId, question.question, answer, question.answer, isCorrect, timeTaken || 0, questions.length);
        if (timeLeft !== undefined) roundRecord.timeLeft = timeLeft;
        roundRecord.totalTimeSpent = (roundRecord.totalTimeSpent || 0) + (timeTaken || 0);
        await roundRecord.save();
      }
    } else if (roundNumber === 2) {
      roundRecord = await Round2.findByTeamId(teamId);
      if (roundRecord) {
        roundRecord.answers.push({ stageId: roundRecord.currentStage, answer, isCorrect, timestamp: new Date() });
        roundRecord.totalTimeSpent += (timeTaken || 0);
        roundRecord.status = 'in_progress';
        await roundRecord.save();
      }
    } else if (roundNumber === 3) {
      roundRecord = await FinalRound.findByTeamId(teamId);
      if (roundRecord) {
        roundRecord.updateTimer(timeTaken || 0);
        await roundRecord.save();
      }
    }

    // Emit leaderboard update
    const io = req.app.get('io');
    if (io) {
      const updatedLeaderboard = await getLeaderboardData(roundNumber);
      io.to(`round_${roundNumber}`).emit('leaderboard:update', { roundNumber, leaderboard: updatedLeaderboard });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        questionSubmission: { isCorrect, correctAnswer: question.answer },
        updatedProgress: roundRecord
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Submission failed' });
  }
};

/**
 * Complete a round
 */
export const completeRound = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, totalTime, completionType = 'manual_submit' } = req.body;
    const roundNumber = parseInt(round);

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (roundNumber === 1) {
      const r1 = await Round1.findByTeamId(teamId);
      if (r1) {
        if (completionType === 'auto_submit') { r1.totalTimeSpent = 1500; r1.timeLeft = 0; }
        else { r1.totalTimeSpent = totalTime || 1500; }
        r1.completeRound(completionType);
        await r1.save();
      }
    } else if (roundNumber === 2) {
      const r2 = await Round2.findByTeamId(teamId);
      if (r2) { r2.status = 'completed'; r2.completedAt = new Date(); await r2.save(); }
    } else if (roundNumber === 3) {
      const r3 = await FinalRound.findByTeamId(teamId);
      if (r3) { r3.completeRound(); await r3.save(); }
    }

    return res.status(200).json({ status: 'success', message: 'Round completed' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Completion failed' });
  }
};

/**
 * Get round progress
 */
export const getRoundProgress = async (req, res) => {
  try {
    const { round, teamId } = req.params;
    const roundNumber = parseInt(round);

    let data;
    if (roundNumber === 1) data = await Round1.findByTeamId(teamId);
    else if (roundNumber === 2) data = await Round2.findByTeamId(teamId);
    else if (roundNumber === 3) data = await FinalRound.findByTeamId(teamId);

    if (!data) return res.status(404).json({ status: 'error', message: 'Progress not found' });
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch progress' });
  }
};

/**
 * Start a round
 */
export const startRound = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, duration } = req.body;
    const roundNumber = parseInt(round);

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });

    if (roundNumber === 1) {
      let r1 = await Round1.findByTeamId(teamId);
      if (!r1) r1 = new Round1({ teamId, teamName: team.teamName, status: 'in_progress', startedAt: new Date(), timeLeft: duration || 1500 });
      await r1.save();
    } else if (roundNumber === 2) {
      let r2 = await Round2.findByTeamId(teamId);
      if (!r2) r2 = new Round2({ teamId, teamName: team.teamName, status: 'in_progress', startedAt: new Date() });
      await r2.save();
    } else if (roundNumber === 3) {
      let r3 = await FinalRound.findByTeamId(teamId);
      if (!r3) r3 = new FinalRound({ teamId, teamName: team.teamName, status: 'in_progress', startedAt: new Date() });
      await r3.save();
    }

    return res.status(200).json({ status: 'success', message: 'Round started' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to start round' });
  }
};

export const advanceRound1Stage = async (req, res) => {
    // Round 2 now uses stages if it followed Round 1's old pattern. 
    // We'll rename this or just keep it simple.
    res.status(501).json({ message: 'Not implemented in new system' });
};
