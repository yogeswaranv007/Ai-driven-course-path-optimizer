const mongoose = require('mongoose');

const deletedRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalRoadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    roadmapName: {
      type: String,
      default: '',
      trim: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dailyLearningMinutes: {
      type: Number,
      default: 0,
    },
    createdAtOriginal: {
      type: Date,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    roadmapData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

deletedRoadmapSchema.index({ userId: 1, deletedAt: -1 });

const DeletedRoadmap = mongoose.model('DeletedRoadmap', deletedRoadmapSchema);

module.exports = { DeletedRoadmap };
