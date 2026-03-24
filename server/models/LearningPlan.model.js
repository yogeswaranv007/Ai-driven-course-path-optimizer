const mongoose = require('mongoose');

// Define task schema explicitly
const taskSchema = new mongoose.Schema(
  {
    taskKey: String,
    title: String,
    topic: String,
    type: String, // 'study', 'exercise', 'project'
    durationMinutes: Number,
    reason: String, // Why this task is needed
    resourceLinks: [String], // Added field that was in the service but missing from schema
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    completedAt: Date,
  },
  { _id: false }
);

// Define day schema explicitly
const daySchema = new mongoose.Schema(
  {
    dayNumber: Number,
    tasks: [taskSchema],
  },
  { _id: false }
);

// Define AI content schemas
const aiTaskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    durationMinutes: Number,
    difficulty: String, // 'beginner', 'intermediate', 'advanced'
  },
  { _id: false }
);

const aiExerciseSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    durationMinutes: Number,
  },
  { _id: false }
);

const aiProjectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    durationMinutes: Number,
  },
  { _id: false }
);

const aiContentSchema = new mongoose.Schema(
  {
    topic: String,
    why: String, // Why this week matters for the target role
    tasks: [aiTaskSchema],
    exercises: [aiExerciseSchema],
    project: aiProjectSchema,
  },
  { _id: false }
);

// Define week schema explicitly
const weekSchema = new mongoose.Schema(
  {
    weekNumber: Number,
    days: [daySchema],
    aiContent: aiContentSchema,
  },
  { _id: false }
);

const learningPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planVersion: {
      type: Number,
      default: 4, // Version with job-role-based planning and Groq integration
    },
    skillGaps: [
      {
        topic: String,
        category: String,
        currentLevel: Number,
        requiredLevel: Number,
        scorePercent: Number,
        gapScore: Number,
      },
    ],
    weeks: [weekSchema],
    explainability: [
      {
        taskKey: String,
        reasons: [String],
      },
    ],
    roadmapMetadata: {
      roadmapId: String,
      selectedTrackId: String,
      actualDays: Number,
      bufferDays: Number,
      milestoneCount: Number,
      nodeCount: Number,
      metrics: {
        skillFitScore: Number,
        feasibilityScore: Number,
        marketScore: Number,
        finalScore: Number,
      },
    },
    // Job role and learning configuration
    jobRoleMetadata: {
      jobRole: String, // Target job role
      hoursPerDay: Number, // Daily learning hours
      computedDays: Number, // Total days required
      totalHours: Number, // Total learning hours
      weeksRequired: Number, // Number of weeks
      aiEnhanced: Boolean, // Whether AI was used to generate tasks
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningPlanSchema.index({ userId: 1, createdAt: -1 });
learningPlanSchema.index({ userId: 1, isActive: 1 });

const LearningPlan = mongoose.model('LearningPlan', learningPlanSchema);

module.exports = { LearningPlan };
