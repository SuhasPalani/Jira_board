// frontend/src/components/Tasks/AITaskCreator.jsx
import React, { useState } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { createTaskFromText, transcribeAudio, createTask } from '../../services/api';
import VoiceRecorder from './VoiceRecorder';

const AITaskCreator = ({ onClose }) => {
  const { currentBoard, addTask } = useBoard();
  const [mode, setMode] = useState('text'); // 'text' or 'voice'
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskPreview, setTaskPreview] = useState(null);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const { taskData } = await createTaskFromText(text, currentBoard._id);
      setTaskPreview(taskData);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task from text');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob) => {
    setLoading(true);
    try {
      const { transcription, taskData } = await transcribeAudio(audioBlob, currentBoard._id);
      setText(transcription);
      setTaskPreview(taskData);
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskPreview) return;

    setLoading(true);
    try {
      const column = currentBoard.columns.find(c => c.name === taskPreview.suggestedColumn) || currentBoard.columns[0];
      
      // Just create the task - WebSocket will handle adding it to UI
      await createTask({
        title: taskPreview.title,
        description: taskPreview.description,
        priority: taskPreview.priority,
        columnId: column._id,
        boardId: currentBoard._id,
        tags: taskPreview.tags,
        aiGenerated: true
      });

      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">AI Task Creator</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="flex gap-2">
            <button
              className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('text')}
            >
              Text Input
            </button>
            <button
              className={`btn ${mode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('voice')}
            >
              Voice Input
            </button>
          </div>
        </div>

        {mode === 'text' ? (
          <form onSubmit={handleTextSubmit}>
            <div className="form-group">
              <label className="form-label">Describe your task</label>
              <textarea
                className="form-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Example: Create a high priority task to optimize database queries and assign it to the backend team"
                rows={4}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !text.trim()}
            >
              {loading ? 'Processing...' : 'Generate Task'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-sm text-gray mb-4">
              Record your voice to create a task. Speak naturally about what you need to do.
            </p>
            <VoiceRecorder onRecordingComplete={handleVoiceRecording} disabled={loading} />
            
            {text && (
              <div className="mt-4 p-4 bg-100 rounded-md">
                <p className="text-sm font-medium mb-2">Transcription:</p>
                <p className="text-sm text-gray">{text}</p>
              </div>
            )}
          </div>
        )}

        {taskPreview && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'var(--primary-100)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-200)">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              AI Generated Task Preview
            </h3>

            <div className="mb-3">
              <p className="text-sm font-medium text-gray">Title:</p>
              <p className="font-semibold">{taskPreview.title}</p>
            </div>

            {taskPreview.description && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray">Description:</p>
                <p className="text-sm">{taskPreview.description}</p>
              </div>
            )}

            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-gray">Priority:</p>
                <span className={`badge badge-${taskPreview.priority}`}>
                  {taskPreview.priority}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray">Suggested Column:</p>
                <p className="text-sm font-medium">{taskPreview.suggestedColumn}</p>
              </div>
            </div>

            {taskPreview.tags && taskPreview.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray mb-2">Tags:</p>
                <div className="flex gap-2 flex-wrap">
                  {taskPreview.tags.map((tag, idx) => (
                    <span key={idx} className="task-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={handleCreateTask}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setTaskPreview(null);
                  setText('');
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITaskCreator;

