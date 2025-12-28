// frontend/src/components/Board/TaskCard.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ task, columnId, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: task._id,
    data: {
      columnId,
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: (isDragging || isSortableDragging) ? 0.5 : 1,
    cursor: 'move'
  };

  const priorityColors = {
    low: 'var(--bg-200)',
    medium: '#dbeafe',
    high: '#fef3c7',
    urgent: '#fee2e2'
  };

  const priorityTextColors = {
    low: 'var(--text-200)',
    medium: '#1e40af',
    high: '#92400e',
    urgent: '#991b1b'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="task-card"
      onClick={(e) => {
        // Only trigger onClick if not dragging
        if (!isSortableDragging && onClick) {
          onClick();
        }
      }}
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        {task.aiGenerated && (
          <span className="ai-badge" title="AI Generated">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </span>
        )}
      </div>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <span 
          className="priority-badge"
          style={{
            background: priorityColors[task.priority],
            color: priorityTextColors[task.priority]
          }}
        >
          {task.priority}
        </span>

        {task.assignee && (
          <div className="task-assignee" title={task.assignee.username}>
            <div className="avatar">
              {task.assignee.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="task-subtasks-progress">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9 11 12 14 22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs">
            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
          </span>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="task-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;