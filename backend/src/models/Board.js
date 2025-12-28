// backend/src/models/Board.js
const mongoose = require('mongoose');

const boardMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'editor'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'editor'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'revoked', 'expired'],
    default: 'pending'
  },
  token: {
    type: String,
    unique: true,
    sparse: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [boardMemberSchema],
  invitations: [invitationSchema],
  columns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApprovalForTasks: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Helper method to check if user is member
boardSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Helper method to get user role
boardSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Helper method to check permissions
boardSchema.methods.canUserEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const role = this.getUserRole(userId);
  return role === 'admin' || role === 'editor';
};

boardSchema.methods.canUserAdmin = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.getUserRole(userId) === 'admin';
};

// Index for faster queries
boardSchema.index({ 'members.user': 1 });
boardSchema.index({ owner: 1 });

module.exports = mongoose.model('Board', boardSchema);