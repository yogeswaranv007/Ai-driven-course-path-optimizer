const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      // Required only if not using OAuth
      required: function () {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    // Persistent user skills for SaaS V2
    skills: [
      {
        name: {
          type: String,
          required: true,
        },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    profile: {
      interests: [String], // e.g., ['Web Development', 'Machine Learning']
      dailyMinutes: {
        type: Number,
        default: 60, // Default 1 hour per day
      },
      goal: {
        type: String,
        default: 'General Learning',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
