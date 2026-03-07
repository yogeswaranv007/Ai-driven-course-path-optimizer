const mongoose = require('mongoose');

// Resource schema for learning materials
const resourceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['documentation', 'tutorial', 'video', 'article', 'book', 'course'],
    },
  },
  { _id: false }
);

// Exercise schema for practical work
const exerciseSchema = new mongoose.Schema(
  {
    description: String,
    expectedOutcome: String,
    estimatedMinutes: Number,
  },
  { _id: false }
);

// Task schema - core learning unit
const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    skill: String, // Which skill this task develops
    estimatedMinutes: Number,
    dayNumber: Number,
    weekNumber: Number,

    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'skipped'],
      default: 'pending',
    },
    completedAt: Date,

    reason: String, // Why this task is important
    resources: [resourceSchema],
    exercise: exerciseSchema,
  },
  { _id: false }
);

// AI-generated content for each week
const aiContentSchema = new mongoose.Schema(
  {
    why: String, // Why this week matters
    keyTakeaways: [String], // Main learning points
    summary: String, // Week overview
  },
  { _id: false }
);

// Week schema - organizes tasks by week
const weekSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
    },
    topic: String, // Main topic for the week
    totalMinutes: Number, // Total learning time for the week

    aiContent: aiContentSchema,
    tasks: [taskSchema],
  },
  { _id: false }
);

// Skills used snapshot
const skillUsedSchema = new mongoose.Schema(
  {
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
  },
  { _id: false }
);

// Main RoadmapInstance schema
const roadmapInstanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Roadmap Identity
    roleName: {
      type: String,
      required: true,
    },
    trackChosen: String, // Track ID selected

    // Learning Configuration
    dailyLearningMinutes: {
      type: Number,
      required: true,
      min: 30,
      max: 480, // 8 hours max per day
    },
    estimatedTotalHours: Number,
    estimatedCompletionDays: Number,

    // Skill Source Tracking
    skillSource: {
      type: String,
      enum: ['profile', 'custom'],
      required: true,
    },
    skillsUsed: [skillUsedSchema],

    // Weekly Structure
    weeks: [weekSchema],

    // Progress Tracking
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'abandoned'],
      default: 'active',
      index: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessedAt: Date,

    // Metadata from roadmap generation
    roadmapMetadata: {
      trackId: String,
      selectedTrackName: String,
      totalSkills: Number,
      milestoneCount: Number,
      nodeCount: Number,
      metrics: {
        skillFitScore: Number,
        feasibilityScore: Number,
        marketScore: Number,
        finalScore: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
roadmapInstanceSchema.index({ userId: 1, createdAt: -1 });
roadmapInstanceSchema.index({ userId: 1, status: 1 });
roadmapInstanceSchema.index({ roleName: 1 });

// Method to calculate completion percentage
roadmapInstanceSchema.methods.calculateCompletionPercentage = function () {
  let totalTasks = 0;
  let completedTasks = 0;

  this.weeks.forEach((week) => {
    week.tasks.forEach((task) => {
      totalTasks++;
      if (task.status === 'completed') {
        completedTasks++;
      }
    });
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

// Method to get task by ID
roadmapInstanceSchema.methods.getTaskById = function (taskId) {
  for (const week of this.weeks) {
    const task = week.tasks.find((t) => t.taskId === taskId);
    if (task) {
      return { week, task };
    }
  }
  return null;
};

// Method to update task status
roadmapInstanceSchema.methods.updateTaskStatus = function (taskId, newStatus) {
  const result = this.getTaskById(taskId);
  if (result) {
    result.task.status = newStatus;
    if (newStatus === 'completed') {
      result.task.completedAt = new Date();
    } else if (newStatus === 'pending' || newStatus === 'in-progress') {
      result.task.completedAt = null;
    }
    this.completionPercentage = this.calculateCompletionPercentage();
    this.lastAccessedAt = new Date();
    return true;
  }
  return false;
};

const RoadmapInstance = mongoose.model('RoadmapInstance', roadmapInstanceSchema);

module.exports = { RoadmapInstance };
