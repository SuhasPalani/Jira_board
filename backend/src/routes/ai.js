// Placeholder for ai routes
// backend/src/routes/ai.js
const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { createTaskFromText, transcribeAudio, improveTaskDescription, generateSubtasks, chatWithAI } = require('../services/aiService');

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Create task from natural language
router.post('/create-task', protect, async (req, res) => {
  try {
    const { text, boardId } = req.body;

    if (!text || !boardId) {
      return res.status(400).json({ error: 'Text and boardId are required' });
    }

    const taskData = await createTaskFromText(text, boardId);

    res.json({ taskData });
  } catch (error) {
    console.error('AI create task error:', error);
    res.status(500).json({ error: error.message || 'Failed to create task from text' });
  }
});

// Transcribe audio and create task
router.post('/transcribe', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { boardId } = req.body;

    // Transcribe audio
    const transcription = await transcribeAudio(req.file.buffer, req.file.mimetype);

    // Create task from transcription
    const taskData = await createTaskFromText(transcription, boardId);

    res.json({
      transcription,
      taskData
    });
  } catch (error) {
    console.error('AI transcribe error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

// Improve task description
router.post('/improve-description', protect, async (req, res) => {
  try {
    const { description, title } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const improvedDescription = await improveTaskDescription(description, title);

    res.json({ improvedDescription });
  } catch (error) {
    console.error('AI improve description error:', error);
    res.status(500).json({ error: error.message || 'Failed to improve description' });
  }
});

// Generate subtasks
router.post('/generate-subtasks', protect, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const subtasks = await generateSubtasks(title, description);

    res.json({ subtasks });
  } catch (error) {
    console.error('AI generate subtasks error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate subtasks' });
  }
});

// Chat with AI assistant
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatWithAI(message, context);

    res.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI response' });
  }
});

module.exports = router;