// backend/src/routes/boardInvitations.js 
const express = require('express');
const crypto = require('crypto');
const Board = require('../models/Board');
const User = require('../models/User');
const { protect, requireBoardMember, requireBoardAdmin } = require('../middleware/auth');

const router = express.Router();

// Invite user to board
router.post('/:boardId/invitations', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const board = req.board;

    // Check if user exists
    const targetUser = await User.findOne({ email });

    if (targetUser) {
      // Check if already a member
      if (board.isMember(targetUser._id)) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      // Check if user is friend (optional validation)
      if (!req.user.friends.includes(targetUser._id)) {
        return res.status(400).json({ 
          error: 'Can only invite friends. Please send a friend request first.' 
        });
      }
    }

    // Check for existing pending invitation
    const existingInvite = board.invitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );

    if (existingInvite) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    board.invitations.push({
      email,
      invitedBy: req.user._id,
      role,
      token,
      expiresAt,
      status: 'pending'
    });

    await board.save();

    // TODO: Send email notification
    // await sendInvitationEmail(email, board.name, token);

    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      invitation: board.invitations[board.invitations.length - 1]
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get board invitations
router.get('/:boardId/invitations', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('invitations.invitedBy', 'username email');

    res.json({ invitations: board.invitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept invitation
router.post('/invitations/:token/accept', protect, async (req, res) => {
  try {
    const board = await Board.findOne({
      'invitations.token': req.params.token,
      'invitations.status': 'pending'
    });

    if (!board) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    const invitation = board.invitations.find(
      inv => inv.token === req.params.token && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check expiry
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await board.save();
      return res.status(400).json({ error: 'Invitation expired' });
    }

    // Check if email matches
    if (invitation.email !== req.user.email) {
      return res.status(403).json({ error: 'This invitation is for a different email' });
    }

    // Check if already a member
    if (board.isMember(req.user._id)) {
      invitation.status = 'accepted';
      await board.save();
      return res.status(400).json({ error: 'You are already a member' });
    }

    // Add user as member
    board.members.push({
      user: req.user._id,
      role: invitation.role
    });

    invitation.status = 'accepted';
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('members.user', 'username email avatar')
      .populate('owner', 'username email');

    res.json({ 
      success: true, 
      message: 'Invitation accepted',
      board: populatedBoard
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revoke invitation
router.delete('/:boardId/invitations/:invitationId', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const board = req.board;
    const invitation = board.invitations.id(req.params.invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Can only revoke pending invitations' });
    }

    invitation.status = 'revoked';
    await board.save();

    res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's pending invitations
router.get('/invitations/pending', protect, async (req, res) => {
  try {
    const boards = await Board.find({
      'invitations.email': req.user.email,
      'invitations.status': 'pending'
    })
    .populate('owner', 'username email')
    .populate('invitations.invitedBy', 'username email');

    const pendingInvitations = [];

    boards.forEach(board => {
      board.invitations.forEach(inv => {
        if (inv.email === req.user.email && inv.status === 'pending' && inv.expiresAt > new Date()) {
          pendingInvitations.push({
            _id: inv._id,
            boardId: board._id,
            boardName: board.name,
            boardDescription: board.description,
            role: inv.role,
            invitedBy: inv.invitedBy,
            expiresAt: inv.expiresAt,
            token: inv.token
          });
        }
      });
    });

    res.json({ invitations: pendingInvitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from board
router.delete('/:boardId/members/:userId', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const board = req.board;

    if (board.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove board owner' });
    }

    const memberIndex = board.members.findIndex(
      m => m.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    board.members.splice(memberIndex, 1);
    await board.save();

    // Notify via WebSocket
    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberRemoved', { 
      boardId: board._id,
      userId: req.params.userId 
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member role
router.patch('/:boardId/members/:userId/role', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const board = req.board;

    if (board.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    const member = board.members.find(m => m.user.toString() === req.params.userId);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    member.role = role;
    await board.save();

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberRoleUpdated', { 
      boardId: board._id,
      userId: req.params.userId,
      role 
    });

    res.json({ success: true, message: 'Role updated', member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;