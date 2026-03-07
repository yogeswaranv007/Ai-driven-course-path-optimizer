const { z } = require('zod');

const planGenerateSchema = z.object({
  body: z.object({
    skills: z
      .array(
        z.object({
          topic: z.string(),
          level: z.number().min(0).max(5),
        })
      )
      .min(1, 'At least one skill is required'),
    jobRole: z.string().min(2, 'Job role is required'),
    hoursPerDay: z.number().min(1).max(24),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { planGenerateSchema };
