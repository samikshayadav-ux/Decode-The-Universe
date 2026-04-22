import bcryptjs from 'bcryptjs';
import { Team, Round, Round1, Round2, FinalRound } from '../models/index.js';
import { loadQuestions, loadClues } from '../utils/loadQuestions.js';
import { getLeaderboardData } from '../utils/changeStreams.js';

/**
 * Get all questions for a specific round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getQuestions = async (req, res) => {
  try {
    const { round } = req.params;

    // Validate round number
    if (![1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number. Must be 1, 2, or 3'
      });
    }

    const roundNumber = parseInt(round);

    // Load questions from JSON file
    let questions;
    try {
      questions = loadQuestions(roundNumber);
    } catch (loadError) {
      console.error(`[Quiz Controller] Error loading questions for round ${roundNumber}:`, loadError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to load questions'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No questions found for round ${roundNumber}`
      });
    }

    console.log(`[Quiz Controller] Fetched ${questions.length} questions for round ${roundNumber}`);

    // Return questions without answers (safe objects)
    // Handle both JSON format and database format
    const safeQuestions = questions.map(q => ({
      id: q.id || q.questionId,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty || 'medium',
      points: q.points || 1,
      // Include rich fields for Round 2 JSON questions
      ...(q.img && { img: q.img }),
      ...(q.code && { code: q.code }),
      ...(q.text && { text: q.text }),
      ...(q.properties && { properties: q.properties }),
      ...(q.stats && { stats: q.stats }),
      ...(q.details && { details: q.details }),
      ...(q.passage && { passage: q.passage }),
      ...(q.type && { type: q.type }),
      // Include answer only for database questions (for validation)
      ...(q.answer && { answer: q.answer })
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        roundNumber,
        totalQuestions: safeQuestions.length,
        questions: safeQuestions
      }
    });
  } catch (error) {
    console.error(`[Quiz Controller] Get questions error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

/**
 * Submit an answer for a question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitAnswer = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, questionId, answer, timeTaken, timeLeft } = req.body;

    // Validate parameters
    if (![1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number'
      });
    }

    if (!teamId || questionId === undefined || !answer) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId, questionId, and answer are required'
      });
    }

    const roundNumber = parseInt(round);

    // Load questions from JSON
    let questions;
    try {
      if (roundNumber === 1) {
        questions = loadQuestions(1);
      } else if (roundNumber === 2) {
        questions = loadQuestions(2);
      } else if (roundNumber === 3) {
        questions = loadClues();
      }
    } catch (loadError) {
      console.error(`[Quiz Controller] Error loading questions for round ${roundNumber}:`, loadError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to load questions'
      });
    }

    // Fetch the team (for validation and backward compatibility)
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Find the question
    const question = questions.find(q => q.id === questionId || q.questionId === questionId);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: `Question ${questionId} not found in round ${roundNumber}`
      });
    }

    // Check if answer is correct
    // Handle both string and array answer formats
    let isCorrect = false;
    let correctAnswer = question.answer;
    
    if (Array.isArray(question.answer)) {
      // Answer is an array of valid responses
      isCorrect = question.answer.some(validAnswer => 
        validAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
      );
    } else {
      // Answer is a string
      isCorrect = question.answer?.toLowerCase().trim() === answer.toLowerCase().trim();
    }
    
    const pointsEarned = isCorrect ? (question.points || 1) : 0;

    // Update the appropriate round collection
    let roundRecord;
    if (roundNumber === 1) {
      roundRecord = await Round1.findByTeamId(teamId);
      
      // If round record doesn't exist, create it (on-the-fly initialization)
      if (!roundRecord) {
        console.log(`[Quiz Controller] Round 1 record not found for team ${teamId}, creating new one...`);
        roundRecord = new Round1({
          teamId,
          teamName: team.teamName,
          currentQuestion: 0,
          score: 0,
          timeLeft: timeLeft || 1500,
          answers: [],
          totalTimeSpent: 0,
          timeAtLastSubmission: 0,
          status: 'in_progress',
          startedAt: new Date(),
          totalQuestions: questions.length
        });
      }

      if (roundRecord) {
        // Pass totalQuestions
        roundRecord.submitAnswer(questionId, question.question, answer, question.answer, isCorrect, timeTaken || 0, questions.length);
        
        // Store current time left (passed from frontend)
        if (timeLeft !== undefined) {
          roundRecord.timeLeft = timeLeft;
        }
        
        // Update total time spent
        if (timeTaken) {
          roundRecord.totalTimeSpent = (roundRecord.totalTimeSpent || 0) + timeTaken;
        }
        
        await roundRecord.save();
        console.log(`[Quiz Controller] Saved Round 1 record for team ${teamId}`);
      }
    } else if (roundNumber === 2) {
      roundRecord = await Round2.findByTeamId(teamId);
      if (roundRecord) {
        // For Round 2: Use Stage 2 answers (auto-submit on next question)
        roundRecord.submitStage1Answer(questionId, answer, isCorrect);
        
        // Update total time spent
        if (timeTaken) {
          roundRecord.totalTimeSpent = (roundRecord.totalTimeSpent || 0) + timeTaken;
        }
        
        await roundRecord.save();
      }
    } else if (roundNumber === 3) {
      roundRecord = await FinalRound.findByTeamId(teamId);
      if (roundRecord) {
        // For final round, we might track clue attempts
        roundRecord.updateTimer((timeTaken || 0));
        await roundRecord.save();
      }
    } else {
      // Rounds 2: Not yet migrated to separate collections
      return res.status(501).json({
        status: 'error',
        message: `Round ${roundNumber} submission not yet implemented. Please use Round 1 (Quiz), Round 2 (Stages), or Round 3 (Final Challenge).`
      });
    }

    console.log(
      `[Quiz Controller] Answer submitted - Team: ${teamId}, Round: ${roundNumber}, Question: ${questionId}, Correct: ${isCorrect}, CurrentQuestion: ${roundRecord?.currentQuestion}`
    );

    // Emit real-time leaderboard update to all clients in the round room
    try {
      const io = req.app.get('io');
      if (io) {
        const updatedLeaderboard = await getLeaderboardData(roundNumber);
        io.to(`round_${roundNumber}`).emit('leaderboard:update', {
          roundNumber,
          leaderboard: updatedLeaderboard,
          timestamp: new Date().toISOString()
        });
        console.log(
          `[Quiz Controller] Emitted leaderboard update to round ${roundNumber} with ${updatedLeaderboard.length} teams`
        );
      }
    } catch (emitError) {
      console.error(`[Quiz Controller] Error emitting leaderboard update: ${emitError.message}`);
    }

    // Return updated record with all tracking parameters
    const updatedProgress = {
      teamId: roundRecord?.teamId || teamId,
      teamName: roundRecord?.teamName,
      ...(roundNumber === 1 && { currentQuestion: roundRecord?.currentQuestion || (questionId + 1) }),
      ...(roundNumber === 2 && { 
        currentStage: roundRecord?.currentStage,
        answersCount: roundRecord?.stage1Answers?.length || 0
      }),
      score: roundRecord?.score || 0,
      timeLeft: roundRecord?.timeLeft || 0,
      answers: roundRecord?.answers || roundRecord?.stage1Answers || [],
      answersCount: roundRecord?.answers?.length || roundRecord?.stage1Answers?.length || 0,
      status: roundRecord?.status || 'in-progress',
      totalTimeSpent: roundRecord?.totalTimeSpent || 0,
      timeAtLastSubmission: roundRecord?.timeAtLastSubmission || Date.now(),
      startedAt: roundRecord?.startedAt,
      lastAnswerTime: roundRecord?.lastAnswerTime || Date.now(),
      completedAt: roundRecord?.completedAt
    };

    return res.status(200).json({
      status: 'success',
      data: {
        questionSubmission: {
          teamId,
          roundNumber,
          questionId,
          isCorrect,
          pointsEarned,
          correctAnswer: question.answer,
          message: isCorrect ? 'Correct answer!' : 'Incorrect answer'
        },
        updatedProgress
      }
    });
  } catch (error) {
    console.error(`[Quiz Controller] Submit answer error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

/**
 * Complete a round and finalize scores
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeRound = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, totalTime, timeAtLastSubmission, completionType = 'manual_submit' } = req.body;

    if (![1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number'
      });
    }

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required'
      });
    }

    const roundNumber = parseInt(round);

    // Fetch the team (for validation)
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    let responseData = {
      teamId,
      roundNumber,
      message: 'Round completed successfully'
    };

    // Update the appropriate round collection
    if (roundNumber === 1) {
      const round1Record = await Round1.findByTeamId(teamId);
      if (round1Record) {
        // For auto-submit (timeLeft = 0), store full duration and mark as auto_submit
        if (completionType === 'auto_submit') {
          // Auto-submit: store full 1500 seconds as totalTimeSpent
          round1Record.totalTimeSpent = 1500;
          round1Record.timeLeft = 0; // Explicit marker that time ran out
        } else {
          // Manual or full completion: store actual time taken
          const finalTotalTime = (totalTime && totalTime > 0) ? totalTime : (timeAtLastSubmission || 0);
          round1Record.totalTimeSpent = finalTotalTime;
          round1Record.timeLeft = timeLeft || 0;
        }
        
        round1Record.timeAtLastSubmission = timeAtLastSubmission || 0;
        
        console.log(`[Quiz Controller] Before completeRound - completionType: ${completionType}, totalTimeSpent: ${round1Record.totalTimeSpent}, timeLeft: ${round1Record.timeLeft}`);
        
        // Pass completion type: 'full_completion', 'auto_submit', or 'manual_submit'
        round1Record.completeRound(completionType);
        
        console.log(`[Quiz Controller] After completeRound - displayTime: ${round1Record.displayTime}, completionType: ${round1Record.completionType}, totalTimeSpent: ${round1Record.totalTimeSpent}`);
        
        await round1Record.save();
        
        responseData = {
          ...responseData,
          score: round1Record.score,
          totalTime,
          timeAtLastSubmission,
          displayTime: round1Record.displayTime,
          completionType: round1Record.completionType,
          answersCount: round1Record.answers.length,
          answers: round1Record.answers // Return detailed answers with correct answers for results display
        };
      }
    } else if (roundNumber === 2) {
      const round2Record = await Round2.findByTeamId(teamId);
      if (round2Record) {
        const { currentStage } = round2Record;
        
        // If totalTime is provided, update the current stage's time before marking completion
        if (totalTime && totalTime > 0) {
          // Find or create the stage timing record
          let stageTime = round2Record.stageTimes.find(st => st.stageId === currentStage);
          
          if (stageTime) {
            // Update existing stage record
            stageTime.completedAt = new Date();
            stageTime.timeSpent = totalTime;
          } else {
            // Create new stage record if it doesn't exist
            round2Record.stageTimes.push({
              stageId: currentStage,
              timeSpent: totalTime,
              startedAt: new Date(new Date().getTime() - (totalTime * 1000)),
              completedAt: new Date()
            });
          }
          
          // Update totalTimeSpent
          round2Record.totalTimeSpent = (round2Record.totalTimeSpent || 0) + totalTime;
          
          console.log(`[Quiz Controller] Updated Stage ${currentStage} - Time: ${totalTime}s, Total: ${round2Record.totalTimeSpent}s`);
        }
        
        // If completing the entire round (all stages done)
        if (currentStage === 10) {
          round2Record.completedAt = new Date();
          round2Record.status = 'completed';
          round2Record.completionType = completionType || 'manual_submit';
          
          // Set display time for leaderboard
          round2Record.displayTime = round2Record.totalTimeSpent || 0;
          
          console.log(`[Quiz Controller] Round 2 completion - Team: ${teamId}, totalTime: ${round2Record.totalTimeSpent}s`);
        }
        
        await round2Record.save();
        
        responseData = {
          ...responseData,
          currentStage: round2Record.currentStage,
          totalTimeSpent: round2Record.totalTimeSpent,
          displayTime: round2Record.displayTime,
          status: round2Record.status,
          completionType: round2Record.completionType,
          answersCount: round2Record.stage1Answers.length,
          stageTimes: round2Record.stageTimes,
          answers: round2Record.stage1Answers // Return stage 1 answers
        };
      }
    } else if (roundNumber === 3) {
      const finalRoundRecord = await FinalRound.findByTeamId(teamId);
      if (finalRoundRecord) {
        finalRoundRecord.updateTimer(totalTime || 0);
        finalRoundRecord.completeRound();
        await finalRoundRecord.save();
        
        responseData = {
          ...responseData,
          score: finalRoundRecord.score,
          totalTime,
          cluesUnlocked: finalRoundRecord.clueIds.length
        };
      }
    } else {
      // Rounds 2: Not yet migrated to separate collections
      return res.status(501).json({
        status: 'error',
        message: `Round ${roundNumber} completion not yet implemented. Please use Round 1 (Quiz), Round 2 (Stages), or Round 3 (Final Challenge).`
      });
    }

    console.log(
      `[Quiz Controller] Round ${roundNumber} completed - Team: ${teamId}, Time: ${totalTime}s`
    );

    // Emit updated leaderboard to all clients
    try {
      const io = req.app.get('io');
      if (io) {
        const updatedLeaderboard = await getLeaderboardData(roundNumber);
        io.to(`round_${roundNumber}`).emit('leaderboard:update', {
          roundNumber,
          leaderboard: updatedLeaderboard,
          timestamp: new Date().toISOString()
        });
        console.log(
          `[Quiz Controller] Emitted leaderboard update after round completion to round ${roundNumber}`
        );
      }
    } catch (emitError) {
      console.error(`[Quiz Controller] Error emitting leaderboard update: ${emitError.message}`);
    }

    return res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error(`[Quiz Controller] Complete round error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to complete round',
      error: error.message
    });
  }
};

/**
 * Get team's progress for a specific round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRoundProgress = async (req, res) => {
  try {
    const { round, teamId } = req.params;

    if (![1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number'
      });
    }

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required'
      });
    }

    const roundNumber = parseInt(round);
    let progressData = null;

    // Query the appropriate collection
    if (roundNumber === 1) {
      const round1Record = await Round1.findByTeamId(teamId);
      if (!round1Record) {
        return res.status(404).json({
          status: 'error',
          message: `Round ${roundNumber} progress not found for team ${teamId}`
        });
      }
      
      progressData = {
        teamId: round1Record.teamId,
        roundNumber,
        status: round1Record.status,
        currentQuestion: round1Record.currentQuestion,
        score: round1Record.score,
        timeLeft: round1Record.timeLeft,
        totalTimeSpent: round1Record.totalTimeSpent,
        timeAtLastSubmission: round1Record.timeAtLastSubmission,
        answersCount: round1Record.answers.length,
        completedAt: round1Record.completedAt,
        startedAt: round1Record.startedAt
      };
    } else if (roundNumber === 2) {
      const round2Record = await Round2.findByTeamId(teamId);
      if (!round2Record) {
        return res.status(404).json({
          status: 'error',
          message: `Round ${roundNumber} progress not found for team ${teamId}`
        });
      }
      
      progressData = {
        teamId: round2Record.teamId,
        roundNumber,
        status: round2Record.status,
        currentStage: round2Record.currentStage,
        stage1Answers: round2Record.stage1Answers,
        answersCount: round2Record.stage1Answers?.length || 0,
        totalTimeSpent: round2Record.totalTimeSpent,
        displayTime: round2Record.displayTime,
        stageTimes: round2Record.stageTimes,
        completedAt: round2Record.completedAt,
        startedAt: round2Record.startedAt,
        completionType: round2Record.completionType
      };
    } else if (roundNumber === 3) {
      const finalRoundRecord = await FinalRound.findByTeamId(teamId);
      if (!finalRoundRecord) {
        return res.status(404).json({
          status: 'error',
          message: `Round ${roundNumber} progress not found for team ${teamId}`
        });
      }
      
      progressData = {
        teamId: finalRoundRecord.teamId,
        roundNumber,
        status: finalRoundRecord.status,
        currentClueId: finalRoundRecord.currentClueId,
        clueIds: finalRoundRecord.clueIds,
        timerSeconds: finalRoundRecord.timerSeconds,
        score: finalRoundRecord.score,
        completedAt: finalRoundRecord.completedAt,
        startedAt: finalRoundRecord.startedAt
      };
    } else {
      // Rounds 2: Query Team collection (backward compatibility)
      const team = await Team.findOne({ teamId });
      if (!team) {
        return res.status(404).json({
          status: 'error',
          message: 'Team not found'
        });
      }

      // Rounds 2: Not yet migrated to separate collections
      return res.status(501).json({
        status: 'error',
        message: `Round ${roundNumber} progress not yet available. Please use Round 1 (Quiz), Round 2 (Stages), or Round 3 (Final Challenge).`
      });
    }

    console.log(`[Quiz Controller] Retrieved progress - Team: ${teamId}, Round: ${roundNumber}`);

    return res.status(200).json({
      status: 'success',
      data: progressData
    });
  } catch (error) {
    console.error(`[Quiz Controller] Get round progress error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch round progress',
      error: error.message
    });
  }
};

/**
 * Start a round (initialize round progress)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const startRound = async (req, res) => {
  try {
    const { round } = req.params;
    const { teamId, duration } = req.body;

    if (![1, 2, 3].includes(parseInt(round))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid round number'
      });
    }

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required'
      });
    }

    const roundNumber = parseInt(round);

    // Fetch the team (for validation)
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    let responseData = {
      teamId,
      roundNumber,
      message: 'Round started successfully'
    };

    // Create/Update record in appropriate collection
    if (roundNumber === 1) {
      let round1Record = await Round1.findByTeamId(teamId);
      
      if (!round1Record) {
        round1Record = new Round1({
          teamId,
          teamName: team.teamName,
          currentQuestion: 0,
          score: 0,
          timeLeft: duration || 1500, // Default 25 minutes
          answers: [],
          totalTimeSpent: 0,
          timeAtLastSubmission: 0,
          status: 'in_progress',
          startedAt: new Date()
        });
      } else if (round1Record.status === 'not_started') {
        round1Record.status = 'in_progress';
        round1Record.startedAt = new Date();
        round1Record.timeLeft = duration || 1500;
      }

      await round1Record.save();
      
      responseData = {
        ...responseData,
        status: round1Record.status,
        currentQuestion: round1Record.currentQuestion,
        score: round1Record.score,
        timeLeft: round1Record.timeLeft
      };
    } else if (roundNumber === 2) {
      let round2Record = await Round2.findByTeamId(teamId);
      
      if (!round2Record) {
        round2Record = new Round2({
          teamId,
          teamName: team.teamName,
          currentStage: 1,
          stage1Answers: [],
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
      } else if (round2Record.status === 'not_started') {
        round2Record.status = 'in_progress';
        round2Record.startedAt = new Date();
        round2Record.currentStage = 1;
        // Initialize stage 1 timing if not already present
        if (!round2Record.stageTimes.find(st => st.stageId === 1)) {
          round2Record.stageTimes.push({
            stageId: 1,
            timeSpent: 0,
            startedAt: new Date(),
            completedAt: null
          });
        }
      }

      await round2Record.save();
      
      responseData = {
        ...responseData,
        status: round2Record.status,
        currentStage: round2Record.currentStage,
        stage1Answers: round2Record.stage1Answers,
        startedAt: round2Record.startedAt
      };
    } else if (roundNumber === 3) {
      let finalRoundRecord = await FinalRound.findByTeamId(teamId);
      
      if (!finalRoundRecord) {
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
      } else if (finalRoundRecord.status === 'not_started') {
        finalRoundRecord.status = 'in_progress';
        finalRoundRecord.startedAt = new Date();
      }

      await finalRoundRecord.save();
      
      responseData = {
        ...responseData,
        status: finalRoundRecord.status,
        currentClueId: finalRoundRecord.currentClueId,
        timerSeconds: finalRoundRecord.timerSeconds
      };
    } else {
      // Rounds 2: Not yet migrated to separate collections
      return res.status(501).json({
        status: 'error',
        message: `Round ${roundNumber} not yet available. Please use Round 1 (Quiz), Round 2 (Stages), or Round 3 (Final Challenge).`
      });
    }

    console.log(
      `[Quiz Controller] Round ${roundNumber} started - Team: ${teamId}, Duration: ${duration || 1500}s`
    );

    return res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error(`[Quiz Controller] Start round error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to start round',
      error: error.message
    });
  }
};

/**
 * Advance to next stage for Round 2
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const advanceRound2Stage = async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId is required'
      });
    }

    const round2Record = await Round2.findByTeamId(teamId);
    if (!round2Record) {
      return res.status(404).json({
        status: 'error',
        message: 'Round 2 record not found'
      });
    }

    const currentStage = round2Record.currentStage || 1;

    // Mark current stage as completed - calculate time from timestamps
    let stageRecord = round2Record.stageTimes.find(st => st.stageId === currentStage);
    
    if (stageRecord && stageRecord.startedAt && !stageRecord.completedAt) {
      // Calculate elapsed time from startedAt to now
      const elapsedMs = new Date() - new Date(stageRecord.startedAt);
      const elapsedSeconds = Math.round(elapsedMs / 1000);
      
      stageRecord.completedAt = new Date();
      stageRecord.timeSpent = elapsedSeconds;
      
      console.log(`[Quiz Controller] Completed Stage ${currentStage} - Calculated time: ${elapsedSeconds}s from timestamps`);
    }

    // Advance to next stage if not at stage 10
    if (currentStage < 10) {
      const nextStage = currentStage + 1;
      round2Record.currentStage = nextStage;

      // Initialize the next stage timing
      if (!round2Record.stageTimes.find(st => st.stageId === nextStage)) {
        round2Record.stageTimes.push({
          stageId: nextStage,
          timeSpent: 0,
          startedAt: new Date(),
          completedAt: null
        });
      }

      console.log(`[Quiz Controller] Advanced Stage - Team: ${teamId}, from Stage ${currentStage} to Stage ${nextStage}`);
    } else {
      console.log(`[Quiz Controller] Already at final stage - Team: ${teamId}, Stage: ${currentStage}`);
    }

    await round2Record.save();

    return res.status(200).json({
      status: 'success',
      data: {
        teamId,
        currentStage: round2Record.currentStage,
        stageTimes: round2Record.stageTimes
      }
    });
  } catch (error) {
    console.error(`[Quiz Controller] Advance stage error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to advance stage',
      error: error.message
    });
  }
};
