// Placeholder for users routes
// backend/src/routes/users.js
const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Search users
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } }
      ]
    })
    .select('username email avatar')
    .limit(10);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/friends/request/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    if (req.user.friends.includes(userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === req.user._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    targetUser.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });

    await targetUser.save();

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/friends/accept/:requestId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.friendRequests.id(req.params.requestId);

    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    request.status = 'accepted';
    user.friends.push(request.from);

    const friend = await User.findById(request.from);
    friend.friends.push(user._id);

    await user.save();
    await friend.save();

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friends list
router.get('/friends', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email avatar');

    res.json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend requests
router.get('/friends/requests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.from', 'username email avatar');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({ requests: pendingRequests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;