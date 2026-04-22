import mongoose from 'mongoose';

const round2Schema = new mongoose.Schema(
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
    // Stage tracking (1-3)
    currentStage: {
      type: Number,
      default: 1,
      index: true
    },
    // Stage 1 answers (10 questions with auto-submit)
    stage1Answers: [
      {
        questionId: Number,
        answer: String,
        isCorrect: Boolean,
        timestamp: Date
      }
    ],
    // Total time spent in round (in seconds)
    totalTimeSpent: {
      type: Number,
      default: 0
    },
    // Time for each stage
    stageTimes: [
      {
        stageId: {
          type: Number,
          required: true
        },
        timeSpent: {
          type: Number,
          default: 0
        },
        startedAt: Date,
        completedAt: Date
      }
    ],
    // Last answer timestamp
    lastAnswerTime: Date,
    // Completion timestamps
    completedAt: Date,
    startedAt: Date,
    // Completion type
    completionType: {
      type: String,
      enum: ['full_completion', 'auto_submit', 'manual_submit', null],
      default: null
    },
    // Display time (formatted for leaderboard)
    displayTime: {
      type: Number,
      default: 0
    },
    // Status tracking
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    }
  },
  {
    timestamps: true,
    collection: 'round1' // DB Migration Option A: keeping collection name 'round1' for existing data
  }
);

// Compound index for efficient queries
round2Schema.index({ teamId: 1, status: 1 });

// Index for time-based leaderboard sorting
round2Schema.index({ totalTimeSpent: 1 });

// Index for stage tracking
round2Schema.index({ teamId: 1, currentStage: 1 });

/**
 * Static method to find round2 record for a specific team
 */
round2Schema.statics.findByTeamId = async function (teamId) {
  return await this.findOne({ teamId });
};

/**
 * Static method to get leaderboard (sorted by time - fastest first)
 */
round2Schema.statics.getLeaderboard = async function (limit = 10) {
  return await this.find({ status: 'completed' })
    .sort({ totalTimeSpent: 1 })
    .limit(limit);
};

/**
 * Instance method to submit Stage 1 answer (auto-submit pattern)
 */
round2Schema.methods.submitStage1Answer = function (questionId, answer, isCorrect) {
  this.stage1Answers.push({
    questionId,
    answer,
    isCorrect: isCorrect || false,
    timestamp: new Date()
  });

  this.lastAnswerTime = new Date();
};

/**
 * Instance method to mark stage as completed with timing
 */
round2Schema.methods.completeStage = function (stageId) {
  const stageTime = this.stageTimes.find(st => st.stageId === stageId);
  if (stageTime) {
    stageTime.completedAt = new Date();
    if (stageTime.startedAt) {
      stageTime.timeSpent = Math.floor((stageTime.completedAt - stageTime.startedAt) / 1000);
    }
  } else {
    const now = new Date();
    this.stageTimes.push({
      stageId,
      timeSpent: 0,
      startedAt: now,
      completedAt: now
    });
  }
};

/**
 * Instance method to move to next stage
 */
round2Schema.methods.moveToNextStage = function () {
  if (this.currentStage < 10) {
    this.currentStage += 1;
    // Initialize new stage timing
    this.stageTimes.push({
      stageId: this.currentStage,
      timeSpent: 0,
      startedAt: new Date(),
      completedAt: null
    });
  }
};

/**
 * Instance method to start a stage and initialize timing
 */
round2Schema.methods.startStage = function (stageId) {
  const stageExists = this.stageTimes.find(st => st.stageId === stageId);
  if (!stageExists) {
    this.stageTimes.push({
      stageId,
      timeSpent: 0,
      startedAt: new Date(),
      completedAt: null
    });
  }
  this.currentStage = stageId;
};

const Round2 = mongoose.model('Round2', round2Schema);

export default Round2;
