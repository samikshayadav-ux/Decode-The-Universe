import mongoose from 'mongoose';

const finalRoundSchema = new mongoose.Schema(
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
    clueIds: {
      type: [Number],
      default: []
    },
    currentClueId: {
      type: Number,
      default: null
    },
    timerSeconds: {
      type: Number,
      default: 0,
      index: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    startedAt: Date,
    completedAt: Date,
    score: {
      type: Number,
      default: 0
    },
    clueProgress: [
      {
        clueId: Number,
        unlockedAt: Date,
        solvedAt: Date,
        attempts: Number,
        timeTaken: Number
      }
    ]
  },
  {
    timestamps: true,
    collection: 'final_round'
  }
);

// Compound index for efficient queries
finalRoundSchema.index({ teamId: 1, status: 1 });

// Index for leaderboard sorting (fastest completion time)
finalRoundSchema.index({ timerSeconds: 1 });

// Index for time-based queries
finalRoundSchema.index({ completedAt: 1 });

/**
 * Static method to find final_round record for a specific team
 */
finalRoundSchema.statics.findByTeamId = async function (teamId) {
  return await this.findOne({ teamId });
};

/**
 * Static method to get leaderboard
 */
finalRoundSchema.statics.getLeaderboard = async function (limit = 10) {
  return await this.find({ status: 'completed' })
    .sort({ timerSeconds: 1 })
    .limit(limit);
};

/**
 * Instance method to unlock a clue
 */
finalRoundSchema.methods.unlockClue = function (clueId) {
  if (!this.clueIds.includes(clueId)) {
    this.clueIds.push(clueId);
  }
  this.currentClueId = clueId;
  this.lastUpdated = new Date();
};

/**
 * Instance method to solve a clue
 */
finalRoundSchema.methods.solveClue = function (clueId, timeTaken) {
  const existingProgress = this.clueProgress.find(p => p.clueId === clueId);
  
  if (existingProgress) {
    existingProgress.solvedAt = new Date();
    existingProgress.timeTaken = timeTaken;
  } else {
    this.clueProgress.push({
      clueId,
      solvedAt: new Date(),
      timeTaken
    });
  }
  
  this.lastUpdated = new Date();
};

/**
 * Instance method to complete the round
 */
finalRoundSchema.methods.completeRound = function () {
  this.status = 'completed';
  this.completedAt = new Date();
};

/**
 * Instance method to update timer
 */
finalRoundSchema.methods.updateTimer = function (seconds) {
  this.timerSeconds = seconds;
  this.lastUpdated = new Date();
};

const FinalRound = mongoose.model('FinalRound', finalRoundSchema);

export default FinalRound;
