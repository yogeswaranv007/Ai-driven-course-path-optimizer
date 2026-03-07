const mongoose = require('mongoose');

const skillProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: [
      {
        topic: {
          type: String,
          required: true,
        },
        level: {
          type: Number,
          min: 0,
          max: 5,
          required: true,
        },
      },
    ],
    marks: [
      {
        topic: {
          type: String,
          required: true,
        },
        scorePercent: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster user lookups
skillProfileSchema.index({ userId: 1 });

const SkillProfile = mongoose.model('SkillProfile', skillProfileSchema);

module.exports = { SkillProfile };
