// backend/src/routes/boards.js 
const express = require('express');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Task = require('../models/Task');
const { protect, requireBoardMember, requireBoardEditor, requireBoardAdmin } = require('../middleware/auth');

const router = express.Router();

// Create board
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    const board = await Board.create({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
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
      .populate('members.user', 'username email avatar');

    res.status(201).json({ board: populatedBoard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all boards for user
router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({
      'members.user': req.user._id
    })
    .populate('owner', 'username email')
    .populate('members.user', 'username email avatar')
    .sort('-updatedAt');

    res.json({ boards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single board with all data
router.get('/:boardId', protect, requireBoardMember, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('columns')
      .populate('members.user', 'username email avatar')
      .populate('owner', 'username email');

    // Get all tasks for this board
    const tasks = await Task.find({ board: board._id })
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email')
      .sort('order');

    // Include user's role in response
    const userRole = board.getUserRole(req.user._id);

    res.json({ 
      board, 
      tasks,
      userRole,
      permissions: {
        canEdit: board.canUserEdit(req.user._id),
        canAdmin: board.canUserAdmin(req.user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update board - requires editor role
router.put('/:boardId', protect, requireBoardMember, requireBoardEditor, async (req, res) => {
  try {
    const board = req.board;
    const { name, description } = req.body;
    
    if (name) board.name = name;
    if (description !== undefined) board.description = description;

    await board.save();

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('boardUpdated', board);

    res.json({ board });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add column - requires editor role
router.post('/:boardId/columns', protect, requireBoardMember, requireBoardEditor, async (req, res) => {
  try {
    const board = req.board;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Column name is required' });
    }

    const column = await Column.create({
      name: name.trim(),
      board: board._id,
      order: board.columns.length
    });

    board.columns.push(column._id);
    await board.save();

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('columnAdded', column);

    res.status(201).json({ column });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update column - requires editor role
router.put('/:boardId/columns/:columnId', protect, requireBoardMember, requireBoardEditor, async (req, res) => {
  try {
    const column = await Column.findOne({
      _id: req.params.columnId,
      board: req.params.boardId
    });

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const { name, order } = req.body;
    if (name) column.name = name.trim();
    if (order !== undefined) column.order = order;

    await column.save();

    const io = req.app.get('io');
    io.to(req.params.boardId).emit('columnUpdated', column);

    res.json({ column });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder columns - requires editor role
router.patch('/:boardId/columns/reorder', protect, requireBoardMember, requireBoardEditor, async (req, res) => {
  try {
    const { columnOrder } = req.body; // Array of column IDs in new order

    if (!Array.isArray(columnOrder)) {
      return res.status(400).json({ error: 'columnOrder must be an array' });
    }

    const board = req.board;

    // Update order for each column
    const updatePromises = columnOrder.map((columnId, index) => 
      Column.findByIdAndUpdate(columnId, { order: index })
    );

    await Promise.all(updatePromises);

    // Update board's column array order
    board.columns = columnOrder;
    await board.save();

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('columnsReordered', { columnOrder });

    res.json({ success: true, columnOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete column - requires editor role
router.delete('/:boardId/columns/:columnId', protect, requireBoardMember, requireBoardEditor, async (req, res) => {
  try {
    const column = await Column.findOne({
      _id: req.params.columnId,
      board: req.params.boardId
    });

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const taskCount = await Task.countDocuments({ column: column._id });

    if (taskCount > 0 && !req.body.confirm) {
      return res.status(400).json({ 
        error: 'Column contains tasks',
        requiresConfirmation: true,
        taskCount
      });
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

// Delete board - requires admin role
router.delete('/:boardId', protect, requireBoardMember, requireBoardAdmin, async (req, res) => {
  try {
    const board = req.board;

    // Delete all tasks
    await Task.deleteMany({ board: board._id });

    // Delete all columns
    await Column.deleteMany({ board: board._id });

    // Delete board
    await board.deleteOne();

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('boardDeleted', { boardId: board._id });

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;