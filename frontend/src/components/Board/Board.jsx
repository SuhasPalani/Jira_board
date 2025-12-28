// frontend/src/components/Board/Board.jsx
import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useBoard } from '../../contexts/BoardContext';
import Column from './Column';
import TaskModal from '../Tasks/TaskModal';
import AITaskCreator from '../Tasks/AITaskCreator';
import TaskCard from './TaskCard';
import { moveTask } from '../../services/api';
import './Board.css';

const Board = () => {
  const { currentBoard, tasks, loading } = useBoard();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(t => t._id === active.id);
    const overColumnId = over.id.startsWith('column-') ? over.id.replace('column-', '') : over.data.current?.columnId;

    if (activeTask && overColumnId && activeTask.column !== overColumnId) {
      try {
        const newColumnTasks = tasks.filter(t => t.column === overColumnId);
        await moveTask(activeTask._id, overColumnId, newColumnTasks.length);
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }

    setActiveId(null);
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="spinner"></div>
        <p>Loading board...</p>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="board-empty">
        <h2>No boards yet</h2>
        <p>Create your first board to get started</p>
      </div>
    );
  }

  const columns = currentBoard.columns || [];
  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board-container">
        <div className="board-header">
          <div>
            <h1 className="board-title">{currentBoard.name}</h1>
            {currentBoard.description && (
              <p className="board-description">{currentBoard.description}</p>
            )}
          </div>
          <div className="board-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAICreatorOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              AI Create Task
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Task
            </button>
          </div>
        </div>

        <div className="board-columns">
          {columns.map((column) => (
            <Column
              key={column._id}
              column={column}
              tasks={tasks.filter(t => t.column === column._id)}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} columnId={activeTask.column} isDragging />
          ) : null}
        </DragOverlay>

        {isTaskModalOpen && (
          <TaskModal
            task={selectedTask}
            onClose={() => {
              setIsTaskModalOpen(false);
              setSelectedTask(null);
            }}
          />
        )}

        {isAICreatorOpen && (
          <AITaskCreator
            onClose={() => setIsAICreatorOpen(false)}
          />
        )}
      </div>
    </DndContext>
  );
};

export default Board;