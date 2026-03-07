const topics = require('./constants/topics.js');
const resources = require('./constants/resources.js');
const authSchema = require('./schemas/auth.schema.js');
const planSchema = require('./schemas/plan.schema.js');
const profileSchema = require('./schemas/profile.schema.js');

module.exports = {
  ...topics,
  ...resources,
  ...authSchema,
  ...planSchema,
  ...profileSchema,
};
