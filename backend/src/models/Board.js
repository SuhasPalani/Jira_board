// backend/src/models/Board.js
const mongoose = require('mongoose');

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
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  columns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column'
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);

