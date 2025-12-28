// Placeholder for boards routes
// backend/src/routes/boards.js
const express = require('express');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create board
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    const board = await Board.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id]
    });

    // Create default columns
    const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
    const columns = await Promise.all(
      defaultColumns.map((colName, index) =>
        Column.create({
          name: colName,
          board: board._id,
          order: index
        })
      )
    );

    board.columns = columns.map(col => col._id);
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('columns')
      .populate('members', 'username email');

    res.status(201).json({ board: populatedBoard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all boards for user
router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({
      members: req.user._id
    })
    .populate('owner', 'username email')
    .populate('members', 'username email')
    .sort('-updatedAt');

    res.json({ boards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single board with all data
router.get('/:boardId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('columns')
      .populate('members', 'username email avatar')
      .populate('owner', 'username email');

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!board.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all tasks for this board
    const tasks = await Task.find({ board: board._id })
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email')
      .sort('order');

    res.json({ board, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update board
router.put('/:boardId', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only board owner can update' });
    }

    const { name, description } = req.body;
    if (name) board.name = name;
    if (description !== undefined) board.description = description;

    await board.save();

    res.json({ board });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add column
router.post('/:boardId/columns', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board || !board.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name } = req.body;
    const column = await Column.create({
      name,
      board: board._id,
      order: board.columns.length
    });

    board.columns.push(column._id);
    await board.save();

    const io = req.app.get('io');
    io.to(req.params.boardId).emit('columnAdded', column);

    res.status(201).json({ column });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update column
router.put('/:boardId/columns/:columnId', protect, async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const { name, order } = req.body;
    if (name) column.name = name;
    if (order !== undefined) column.order = order;

    await column.save();

    const io = req.app.get('io');
    io.to(req.params.boardId).emit('columnUpdated', column);

    res.json({ column });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete column
router.delete('/:boardId/columns/:columnId', protect, async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    // Delete all tasks in column
    await Task.deleteMany({ column: column._id });

    // Remove column from board
    await Board.findByIdAndUpdate(req.params.boardId, {
      $pull: { columns: column._id }
    });

    await column.deleteOne();

    const io = req.app.get('io');
    io.to(req.params.boardId).emit('columnDeleted', { columnId: column._id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;