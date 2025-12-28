// Placeholder for AI service
// backend/src/services/aiService.js
const openai = require('../config/openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

exports.createTaskFromText = async (text, boardId) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts task information from natural language. 
          Extract the following from the user's text:
          - title (required, concise)
          - description (optional, detailed)
          - priority (low, medium, high, or urgent)
          - suggestedColumn (Backlog, To Do, In Progress, Review, or Done)
          - tags (array of relevant tags)
          
          Respond ONLY with valid JSON in this exact format:
          {
            "title": "string",
            "description": "string",
            "priority": "medium",
            "suggestedColumn": "To Do",
            "tags": ["tag1", "tag2"]
          }`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const responseText = completion.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
    
    const taskData = JSON.parse(jsonStr);
    return {
      ...taskData,
      aiGenerated: true
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process task with AI');
  }
};

exports.transcribeAudio = async (audioBuffer, mimeType) => {
  try {
    const ext = mimeType.includes('webm') ? 'webm' : 
                mimeType.includes('mp4') ? 'mp4' : 
                mimeType.includes('wav') ? 'wav' : 'mp3';
    
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${ext}`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: "en"
    });

    fs.unlinkSync(tempFilePath);

    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

exports.improveTaskDescription = async (description, title) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that improves task descriptions. Make them clear, actionable, and well-structured. Keep the same meaning but enhance clarity and professionalism."
        },
        {
          role: "user",
          content: `Task Title: ${title}\n\nCurrent Description: ${description}\n\nPlease improve this task description.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Improve description error:', error);
    throw new Error('Failed to improve description');
  }
};

exports.generateSubtasks = async (title, description) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate 3-5 actionable subtasks for the given task. 
          Respond ONLY with valid JSON array format:
          ["Subtask 1", "Subtask 2", "Subtask 3"]`
        },
        {
          role: "user",
          content: `Task: ${title}\nDescription: ${description || 'No description provided'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
    
    const subtasks = JSON.parse(jsonStr);
    return subtasks.map(title => ({ title, completed: false }));
  } catch (error) {
    console.error('Generate subtasks error:', error);
    throw new Error('Failed to generate subtasks');
  }
};

exports.chatWithAI = async (message, context) => {
  try {
    const systemMessage = context 
      ? `You are a helpful project management assistant. Context: ${JSON.stringify(context)}`
      : 'You are a helpful project management assistant. Help users with task management, planning, and productivity.';

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Chat AI error:', error);
    throw new Error('Failed to get AI response');
  }
};

