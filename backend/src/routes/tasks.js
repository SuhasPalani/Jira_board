// backend/src/routes/tasks.js - FIXED VERSION
const express = require('express');
const Task = require('../models/Task');
const Column = require('../models/Column');
const Board = require('../models/Board');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create task - NOW PROPERLY HANDLES aiGenerated FLAG
router.post('/', protect, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      columnId, 
      boardId, 
      assignee, 
      dueDate, 
      tags,
      aiGenerated  // ADDED: Explicitly accept aiGenerated flag
    } = req.body;

    // Verify board access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const taskCount = await Task.countDocuments({ column: columnId });

    // FIXED: Now properly includes aiGenerated in task creation
    const task = await Task.create({
      title,
      description,
      priority,
      column: columnId,
      board: boardId,
      assignee: assignee || null,
      creator: req.user._id,
      order: taskCount,
      dueDate,
      tags: tags || [],
      aiGenerated: aiGenerated === true  // Explicitly set to boolean
    });

    column.tasks.push(task._id);
    await column.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email');

    const io = req.app.get('io');
    io.to(boardId).emit('taskCreated', populatedTask);

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email')
      .populate('board', 'members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (!task.board.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('board', 'members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (!task.board.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, priority, assignee, dueDate, tags, subtasks } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags) task.tags = tags;
    if (subtasks) task.subtasks = subtasks;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email');

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populatedTask);

    res.json({ task: populatedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move task to different column
router.patch('/:taskId/move', protect, async (req, res) => {
  try {
    const { newColumnId, newOrder } = req.body;
    const task = await Task.findById(req.params.taskId).populate('board', 'members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (!task.board.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldColumn = await Column.findById(task.column);
    const newColumn = await Column.findById(newColumnId);

    if (!newColumn) {
      return res.status(404).json({ error: 'Target column not found' });
    }

    oldColumn.tasks = oldColumn.tasks.filter(t => t.toString() !== task._id.toString());
    await oldColumn.save();

    newColumn.tasks.splice(newOrder, 0, task._id);
    await newColumn.save();

    task.column = newColumnId;
    task.order = newOrder;
    await task.save();

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskMoved', {
      taskId: task._id,
      oldColumnId: oldColumn._id,
      newColumnId,
      newOrder
    });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('board', 'members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (!task.board.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id }
    });

    const boardId = task.board._id.toString();
    await task.deleteOne();

    const io = req.app.get('io');
    io.to(boardId).emit('taskDeleted', { taskId: task._id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;