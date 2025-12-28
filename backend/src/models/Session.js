// backend/src/models/Session.js 
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    browser: String,
    os: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Index for automatic cleanup and fast queries
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ token: 1 });

// Update last activity
sessionSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  await this.save();
};

// Invalidate session
sessionSchema.methods.invalidate = async function() {
  this.isActive = false;
  await this.save();
};

module.exports = mongoose.model('Session', sessionSchema);