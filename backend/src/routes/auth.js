// backend/src/routes/auth.js 
const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  return {
    device: /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop',
    browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 
             ua.includes('Safari') ? 'Safari' : 'Unknown',
    os: /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'MacOS' : 
        /linux/i.test(ua) ? 'Linux' : /android/i.test(ua) ? 'Android' : 
        /ios/i.test(ua) ? 'iOS' : 'Unknown'
  };
};

// Register
router.post('/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      const user = await User.create({ username, email, password });

      // Create session
      const deviceInfo = {
        ...parseUserAgent(req.headers['user-agent']),
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const session = await Session.create({
        user: user._id,
        token: jwt.sign({ temp: Date.now() }, process.env.JWT_SECRET),
        deviceInfo,
        expiresAt
      });

      const token = generateToken(user._id, session._id);
      session.token = token;
      await session.save();

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create new session
      const deviceInfo = {
        ...parseUserAgent(req.headers['user-agent']),
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const session = await Session.create({
        user: user._id,
        token: jwt.sign({ temp: Date.now() }, process.env.JWT_SECRET),
        deviceInfo,
        expiresAt
      });

      const token = generateToken(user._id, session._id);
      session.token = token;
      await session.save();

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      friends: req.user.friends
    }
  });
});

// Get active sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user._id,
      isActive: true
    }).select('-token').sort('-lastActivity');

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (current session)
router.post('/logout', protect, async (req, res) => {
  try {
    if (req.sessionId) {
      await Session.findByIdAndUpdate(req.sessionId, { isActive: false });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout from all devices
router.post('/logout-all', protect, async (req, res) => {
  try {
    await Session.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false }
    );
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revoke specific session
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;