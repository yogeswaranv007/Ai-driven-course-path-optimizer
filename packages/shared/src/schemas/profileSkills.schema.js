const { z } = require('zod');

const profileSkillSchema = z.object({
  name: z.string().min(1, 'skill name is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
});

const profileAddSkillSchema = z.object({
  body: profileSkillSchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const profileUpdateSkillsSchema = z.object({
  body: z.object({
    skills: z.array(profileSkillSchema),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const profileDeleteSkillParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    skillName: z.string().min(1, 'skillName is required'),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  profileAddSkillSchema,
  profileUpdateSkillsSchema,
  profileDeleteSkillParamSchema,
};
