const { z } = require('zod');

const skillSchema = z.object({
  name: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
});

const roadmapGenerateSchema = z.object({
  body: z.object({
    roadmapName: z.string().trim().min(2).max(100).optional(),
    roleName: z.string().min(2, 'roleName is required'),
    dailyLearningMinutes: z.number().min(30).max(480),
    skillSource: z.enum(['profile', 'custom']),
    skills: z.array(skillSchema).optional().default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const roadmapIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, 'roadmap id is required'),
  }),
  query: z.object({}).optional(),
});

const roadmapDayParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, 'roadmap id is required'),
    dayNumber: z.string().regex(/^\d+$/, 'dayNumber must be a positive integer'),
  }),
  query: z.object({}).optional(),
});

const roadmapTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'in-progress', 'completed', 'skipped']),
  }),
  params: z.object({
    id: z.string().min(1, 'roadmap id is required'),
    taskId: z.string().min(1, 'task id is required'),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  roadmapGenerateSchema,
  roadmapIdParamSchema,
  roadmapDayParamSchema,
  roadmapTaskStatusSchema,
};
