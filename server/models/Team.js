import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    teamName: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    members: [
      {
        name: {
          type: String,
          required: true
        },
        position: {
          type: Number,
          min: 1,
          max: 4
        }
      }
    ],
    frozen_until: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'teams'
  }
);

// Indexes for common queries
teamSchema.index({ teamId: 1 });
teamSchema.index({ createdAt: -1 });

const Team = mongoose.model('Team', teamSchema);

export default Team;
