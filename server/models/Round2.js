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
    // Stage tracking
    currentStage: {
      type: Number,
      default: 1,
      index: true
    },
    // Progress tracking
    answers: [
      {
        stageId: Number,
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
    // Status tracking
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    }
  },
  {
    timestamps: true,
    collection: 'round2'
  }
);

// Compound index for efficient queries
round2Schema.index({ teamId: 1, status: 1 });

// Index for time-based leaderboard sorting
round2Schema.index({ totalTimeSpent: 1 });

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

const Round2 = mongoose.model('Round2', round2Schema);

export default Round2;
