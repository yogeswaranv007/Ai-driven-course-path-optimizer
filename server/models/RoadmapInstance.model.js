const mongoose = require('mongoose');

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

const learningResourceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['youtube', 'documentation', 'tutorial', 'article', 'course'],
      default: 'documentation',
    },
    channelName: String,
    source: {
      type: String,
      enum: ['curated', 'ai'],
      default: 'curated',
    },
  },
  { _id: false }
);

const dayContentSchema = new mongoose.Schema(
  {
    learningObjectives: {
      type: [String],
      default: [],
    },
    whyImportant: {
      type: String,
      default: '',
    },
    practiceTask: {
      title: String,
      description: String,
      estimatedMinutes: Number,
    },
    resources: {
      type: [learningResourceSchema],
      default: [],
    },
    generatedAt: Date,
    generatedBy: {
      type: String,
      enum: ['groq', 'fallback', 'curated-only'],
    },
    generationVersion: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const roadmapDaySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'skipped'],
      default: 'pending',
    },
    completedAt: Date,
    contentStatus: {
      type: String,
      enum: ['not-generated', 'generated', 'failed'],
      default: 'not-generated',
      index: true,
    },
    content: dayContentSchema,
  },
  { _id: false }
);

const roadmapPhaseSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true,
    },
    phaseName: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    startDay: {
      type: Number,
      required: true,
    },
    endDay: {
      type: Number,
      required: true,
    },
    days: {
      type: [roadmapDaySchema],
      default: [],
    },
  },
  { _id: false }
);

// Legacy weekly schema (kept for backward compatibility with existing UI code)
const legacyTaskSchema = new mongoose.Schema(
  {
    taskId: String,
    title: String,
    description: String,
    skill: String,
    estimatedMinutes: Number,
    dayNumber: Number,
    weekNumber: Number,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'skipped'],
      default: 'pending',
    },
    completedAt: Date,
    reason: String,
  },
  { _id: false }
);

const legacyWeekSchema = new mongoose.Schema(
  {
    weekNumber: Number,
    topic: String,
    totalMinutes: Number,
    tasks: {
      type: [legacyTaskSchema],
      default: [],
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
    roadmapName: {
      type: String,
      trim: true,
      default: function () {
        return `${this.roleName || 'Learning'} Roadmap`;
      },
    },
    trackChosen: String,

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

    // Structure-first roadmap (MVP)
    phases: {
      type: [roadmapPhaseSchema],
      default: [],
    },

    // Optional computed summary values
    totalPhases: {
      type: Number,
      default: 0,
    },
    totalDays: {
      type: Number,
      default: 0,
    },

    // Legacy weekly structure (optional, backward compatible)
    weeks: {
      type: [legacyWeekSchema],
      default: [],
    },

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
      generationStage: {
        type: String,
        enum: ['structure-generated', 'content-partial', 'content-complete'],
        default: 'structure-generated',
      },
      generatedAt: Date,
      aiProvider: String,
      aiModel: String,
      daysWithGeneratedContent: {
        type: Number,
        default: 0,
      },
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
roadmapInstanceSchema.index({ roadmapName: 1 });
roadmapInstanceSchema.index({ 'phases.days.dayNumber': 1 });

// Method to calculate completion percentage
roadmapInstanceSchema.methods.calculateCompletionPercentage = function () {
  const allDays = (this.phases || []).flatMap((phase) => phase.days || []);
  if (allDays.length > 0) {
    const completedDays = allDays.filter((day) => day.status === 'completed').length;
    return Math.round((completedDays / allDays.length) * 100);
  }

  // Legacy fallback
  let totalTasks = 0;
  let completedTasks = 0;
  (this.weeks || []).forEach((week) => {
    (week.tasks || []).forEach((task) => {
      totalTasks++;
      if (task.status === 'completed') completedTasks++;
    });
  });
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

roadmapInstanceSchema.methods.getDayByNumber = function (dayNumber) {
  for (const phase of this.phases || []) {
    const day = (phase.days || []).find((d) => d.dayNumber === Number(dayNumber));
    if (day) {
      return { phase, day };
    }
  }
  return null;
};

roadmapInstanceSchema.methods.updateDayStatus = function (dayNumber, newStatus) {
  const result = this.getDayByNumber(dayNumber);
  if (result) {
    result.day.status = newStatus;
    if (newStatus === 'completed') {
      result.day.completedAt = new Date();
    } else if (newStatus === 'pending' || newStatus === 'in-progress') {
      result.day.completedAt = null;
    }
    this.completionPercentage = this.calculateCompletionPercentage();
    this.lastAccessedAt = new Date();
    return true;
  }
  return false;
};

roadmapInstanceSchema.methods.getTaskById = function (taskId) {
  const id = String(taskId || '');

  // Support day-based identifiers like: day-1 or day1-anything
  const dayMatch = id.match(/^day-?(\d+)$/i) || id.match(/^day(\d+)-/i);
  if (dayMatch) {
    const dayNumber = Number(dayMatch[1]);
    const dayResult = this.getDayByNumber(dayNumber);
    if (dayResult) {
      return {
        type: 'day',
        phase: dayResult.phase,
        task: dayResult.day,
      };
    }
  }

  // Legacy fallback: weekly task IDs/keys
  for (const week of this.weeks || []) {
    for (const task of week.tasks || []) {
      if (task.taskId === id || task.taskKey === id) {
        return {
          type: 'legacy-task',
          week,
          task,
        };
      }
    }
  }

  return null;
};

roadmapInstanceSchema.methods.updateTaskStatus = function (taskId, newStatus) {
  const id = String(taskId || '');

  const dayMatch = id.match(/^day-?(\d+)$/i) || id.match(/^day(\d+)-/i);
  if (dayMatch) {
    const dayNumber = Number(dayMatch[1]);
    return this.updateDayStatus(dayNumber, newStatus);
  }

  // Legacy fallback: weekly tasks
  for (const week of this.weeks || []) {
    for (const task of week.tasks || []) {
      if (task.taskId === id || task.taskKey === id) {
        task.status = newStatus;
        task.completedAt = newStatus === 'completed' ? new Date() : null;
        this.completionPercentage = this.calculateCompletionPercentage();
        this.lastAccessedAt = new Date();
        return true;
      }
    }
  }

  return false;
};

const RoadmapInstance = mongoose.model('RoadmapInstance', roadmapInstanceSchema);

module.exports = { RoadmapInstance };
