// frontend/src/components/Tasks/TaskModal.jsx
import React, { useState, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { createTask, updateTask, deleteTask, improveDescription, generateSubtasks, getFriends } from '../../services/api';

const TaskModal = ({ task, onClose }) => {
  const { currentBoard, addTask, updateTask: updateBoardTask, removeTask } = useBoard();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    columnId: '',
    assignee: '',
    dueDate: '',
    tags: []
  });
  const [subtasks, setSubtasks] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        columnId: task.column,
        assignee: task.assignee?._id || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: task.tags || []
      });
      setSubtasks(task.subtasks || []);
    } else {
      setFormData(prev => ({
        ...prev,
        columnId: currentBoard?.columns?.[0]?._id || ''
      }));
    }

    loadFriends();
  }, [task, currentBoard]);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data.friends);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        ...formData,
        boardId: currentBoard._id,
        subtasks
      };

      if (task) {
        const { task: updatedTask } = await updateTask(task._id, taskData);
        updateBoardTask(task._id, updatedTask);
      } else {
        // Just create the task - WebSocket will handle adding it to UI
        await createTask(taskData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(task._id);
      removeTask(task._id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleImproveDescription = async () => {
    if (!formData.description) return;

    setAiLoading(true);
    try {
      const { improvedDescription } = await improveDescription(formData.description, formData.title);
      setFormData(prev => ({ ...prev, description: improvedDescription }));
    } catch (error) {
      console.error('Failed to improve description:', error);
      alert('Failed to improve description');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateSubtasks = async () => {
    setAiLoading(true);
    try {
      const { subtasks: generated } = await generateSubtasks(formData.title, formData.description);
      setSubtasks(generated);
    } catch (error) {
      console.error('Failed to generate subtasks:', error);
      alert('Failed to generate subtasks');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'Create Task'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Task title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
            />
            {formData.description && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleImproveDescription}
                disabled={aiLoading}
                style={{ marginTop: '8px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                AI Improve
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Column</label>
              <select
                className="form-select"
                value={formData.columnId}
                onChange={(e) => setFormData({ ...formData, columnId: e.target.value })}
                required
              >
                {currentBoard?.columns?.map(col => (
                  <option key={col._id} value={col._id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Assignee</label>
              <select
                className="form-select"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              >
                <option value="">Unassigned</option>
                {friends.map(friend => (
                  <option key={friend._id} value={friend._id}>{friend.username}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label" style={{ marginBottom: 0 }}>Subtasks</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleGenerateSubtasks}
                disabled={aiLoading || !formData.title}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                AI Generate
              </button>
            </div>
            {subtasks.map((subtask, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={(e) => {
                    const updated = [...subtasks];
                    updated[idx].completed = e.target.checked;
                    setSubtasks(updated);
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={subtask.title}
                  onChange={(e) => {
                    const updated = [...subtasks];
                    updated[idx].title = e.target.value;
                    setSubtasks(updated);
                  }}
                  placeholder="Subtask"
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSubtasks([...subtasks, { title: '', completed: false }])}
            >
              + Add Subtask
            </button>
          </div>

          <div className="flex gap-2 mt-6" style={{ justifyContent: task ? 'space-between' : 'flex-end' }}>
            {task && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : task ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;