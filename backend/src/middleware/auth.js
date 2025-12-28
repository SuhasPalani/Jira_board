// backend/src/middleware/auth.js 
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate session
    const session = await Session.findOne({
      _id: decoded.sessionId,
      token,
      isActive: true
    });

    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      await session.save();
      return res.status(401).json({ error: 'Session expired' });
    }

    // Get user
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.sessionId = session._id;

    // Update last activity (do this async without blocking)
    session.updateActivity().catch(err => console.error('Failed to update session activity:', err));

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

// Middleware to check if user is board member
exports.requireBoardMember = async (req, res, next) => {
  try {
    const Board = require('../models/Board');
    const boardId = req.params.boardId || req.body.boardId;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID required' });
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this board.' });
    }

    req.board = board;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check if user can edit board
exports.requireBoardEditor = async (req, res, next) => {
  try {
    if (!req.board) {
      return res.status(500).json({ error: 'Board not loaded. Use requireBoardMember first.' });
    }

    if (!req.board.canUserEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. Editor role required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check if user can admin board
exports.requireBoardAdmin = async (req, res, next) => {
  try {
    if (!req.board) {
      return res.status(500).json({ error: 'Board not loaded. Use requireBoardMember first.' });
    }

    if (!req.board.canUserAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};