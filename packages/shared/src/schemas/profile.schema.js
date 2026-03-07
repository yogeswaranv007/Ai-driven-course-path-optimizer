const { z } = require('zod');

const profileSchema = z.object({
  body: z.object({
    interests: z.array(z.string()).optional(),
    dailyMinutes: z.number().min(15).max(480).optional(),
    goal: z.string().min(2).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { profileSchema };
