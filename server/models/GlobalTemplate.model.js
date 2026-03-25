const mongoose = require('mongoose');

const templatePhaseSchema = new mongoose.Schema(
  {
    phaseNumber: Number,
    phaseName: String,
    goal: String,
    startDay: Number,
    endDay: Number,
    days: [
      {
        dayNumber: Number,
        topic: String,
        estimatedMinutes: Number,
      },
    ],
  },
  { _id: false }
);

const globalTemplateSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: String,
    estimatedTotalDays: Number,
    basePhases: [templatePhaseSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
    targetFrameworks: [String], // e.g. ['React', 'Angular', 'Vue']
  },
  { timestamps: true }
);

const GlobalTemplate = mongoose.model('GlobalTemplate', globalTemplateSchema);

module.exports = { GlobalTemplate };
