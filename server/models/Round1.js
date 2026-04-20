import mongoose from 'mongoose';

const round1Schema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      index: true
    },
    teamName: {
      type: String,
      required: true
    },
    currentQuestion: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0,
      index: true
    },
    timeLeft: {
      type: Number,
      default: 1500
    },
    answers: [
      {
        questionId: Number,
        question: String,
        answer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        timestamp: Date,
        timeTaken: Number
      }
    ],
    totalTimeSpent: {
      type: Number,
      default: 0
    },
    timeAtLastSubmission: {
      type: Number,
      default: 0
    },
    lastAnswerTime: Date,
    completedAt: Date,
    startedAt: Date,
    completionType: {
      type: String,
      enum: ['full_completion', 'auto_submit', 'manual_submit'],
      default: null
    },
    displayTime: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    }
  },
  {
    timestamps: true,
    collection: 'round0' // DB Migration Option A: keeping collection name 'round0' for existing data
  }
);

// Compound index for efficient queries
round1Schema.index({ teamId: 1, status: 1 });

// Index for leaderboard sorting
round1Schema.index({ score: -1 });

/**
 * Static method to find round1 record for a specific team
 */
round1Schema.statics.findByTeamId = async function (teamId) {
  return await this.findOne({ teamId });
};

/**
 * Static method to get leaderboard
 */
round1Schema.statics.getLeaderboard = async function (limit = 10) {
  return await this.find({ status: 'completed' })
    .sort({ score: -1, timeLeft: -1 })
    .limit(limit);
};

/**
 * Instance method to submit an answer
 */
round1Schema.methods.submitAnswer = function (questionId, question, answer, correctAnswer, isCorrect, timeTaken, totalQuestions) {
  this.answers.push({
    questionId,
    question,
    answer,
    correctAnswer,
    isCorrect,
    timestamp: new Date(),
    timeTaken
  });

  if (isCorrect) {
    this.score += 1;
  }

  // Calculate which question to show next
  // If all questions answered, stay on last question; otherwise move to next
  const answeredCount = this.answers.length;
  this.currentQuestion = Math.min(answeredCount, (totalQuestions || 95) - 1);

  this.lastAnswerTime = new Date();
  this.timeAtLastSubmission = this.timeLeft;
  
  // Mark status as in_progress if not already
  if (this.status === 'not_started') {
    this.status = 'in_progress';
    this.startedAt = new Date();
  }
};

/**
 * Instance method to complete the round
 */
round1Schema.methods.completeRound = function (completionType = 'manual_submit') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completionType = completionType;
  
  // displayTime is always totalTimeSpent (which is set differently for auto_submit vs others)
  // For auto_submit: totalTimeSpent = 1500 (full duration)
  // For others: totalTimeSpent = actual time taken
  this.displayTime = this.totalTimeSpent || 0;
};

const Round1 = mongoose.model('Round1', round1Schema);

export default Round1;
