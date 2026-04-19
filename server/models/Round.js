import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema(
  {
    roundNumber: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'live', 'ended'],
      default: 'pending',
      index: true
    },
    title: {
      type: String,
      required: true
    },
    displayName: {
      type: String
    },
    description: {
      type: String
    },
    duration: {
      type: Number,
      description: 'Duration in seconds'
    },
    startedAt: Date,
    endedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'rounds'
  }
);

// Compound indexes
roundSchema.index({ status: 1, roundNumber: 1 });

// Pre-save middleware to validate and manage live status
roundSchema.pre('save', async function (next) {
  try {
    // If status is changing to 'live', ensure only one round is live
    if (this.isModified('status') && this.status === 'live') {
      await Round.updateMany(
        { _id: { $ne: this._id }, status: 'live' },
        { status: 'pending' }
      );
      
      if (!this.startedAt) {
        this.startedAt = new Date();
      }
    }

    // If status is changing to 'ended', set endedAt
    if (this.isModified('status') && this.status === 'ended') {
      if (!this.endedAt) {
        this.endedAt = new Date();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
roundSchema.statics.setLive = async function (roundNumber) {
  // End all other live rounds
  await this.updateMany(
    { status: 'live', roundNumber: { $ne: roundNumber } },
    { status: 'pending' }
  );

  // Set specified round to live
  const round = await this.findOneAndUpdate(
    { roundNumber },
    { status: 'live', startedAt: new Date() },
    { new: true }
  );

  return round;
};

roundSchema.statics.endRound = async function (roundNumber) {
  const round = await this.findOneAndUpdate(
    { roundNumber },
    { status: 'ended', endedAt: new Date() },
    { new: true }
  );

  return round;
};

roundSchema.statics.getLiveRound = async function () {
  return await this.findOne({ status: 'live' });
};

roundSchema.statics.getAllRounds = async function () {
  return await this.find().sort({ roundNumber: 1 });
};

const Round = mongoose.model('Round', roundSchema);

export default Round;
