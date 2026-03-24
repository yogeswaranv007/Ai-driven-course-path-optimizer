const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Session metadata
    deviceInfo: {
      userAgent: String,
      ip: String,
      device: String, // e.g., 'Desktop', 'Mobile', 'Tablet'
      browser: String, // e.g., 'Chrome', 'Firefox', 'Safari'
    },
    // Security fields
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      enum: ['logout', 'logout_all', 'security', 'token_rotation', 'expired'],
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    // Parent token for rotation tracking
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens after 7 days
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Instance methods
refreshTokenSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

refreshTokenSchema.methods.isValid = function () {
  return !this.isRevoked && !this.isExpired();
};

refreshTokenSchema.methods.revoke = function (reason = 'logout') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// Static methods
refreshTokenSchema.statics.findValidToken = async function (token) {
  return this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

refreshTokenSchema.statics.revokeAllUserTokens = async function (userId, reason = 'logout_all') {
  return this.updateMany(
    { userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

refreshTokenSchema.statics.getActiveSessions = async function (userId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select('deviceInfo lastUsedAt createdAt')
    .sort({ lastUsedAt: -1 });
};

refreshTokenSchema.statics.cleanupExpiredTokens = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = { RefreshToken };
