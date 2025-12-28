
// frontend/src/contexts/BoardContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getBoards, getBoard, createBoard as apiCreateBoard } from '../services/api';

const BoardContext = createContext();

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return context;
};

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useWebSocket();

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (!socket || !currentBoard) return;

    socket.emit('join-board', currentBoard._id);

    socket.on('taskCreated', (task) => {
      // Only add if it doesn't already exist (prevent duplicates)
      setTasks(prev => {
        const exists = prev.some(t => t._id === task._id);
        if (exists) return prev;
        return [...prev, task];
      });
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    socket.on('taskDeleted', ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    socket.on('taskMoved', ({ taskId, newColumnId, newOrder }) => {
      setTasks(prev => prev.map(t => 
        t._id === taskId ? { ...t, column: newColumnId, order: newOrder } : t
      ));
    });

    return () => {
      socket.emit('leave-board', currentBoard._id);
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('taskMoved');
    };
  }, [socket, currentBoard]);

  const loadBoards = async () => {
    try {
      const data = await getBoards();
      setBoards(data.boards);
      
      if (data.boards.length > 0 && !currentBoard) {
        await loadBoard(data.boards[0]._id);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadBoard = async (boardId) => {
    setLoading(true);
    try {
      const data = await getBoard(boardId);
      setCurrentBoard(data.board);
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (name, description) => {
    const data = await apiCreateBoard(name, description);
    setBoards(prev => [...prev, data.board]);
    await loadBoard(data.board._id);
    return data.board;
  };

  const addTask = (task) => {
    // Only add if it doesn't already exist
    setTasks(prev => {
      const exists = prev.some(t => t._id === task._id);
      if (exists) return prev;
      return [...prev, task];
    });
  };

  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
  };

  const removeTask = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  return (
    <BoardContext.Provider value={{
      boards,
      currentBoard,
      tasks,
      loading,
      loadBoards,
      loadBoard,
      createBoard,
      addTask,
      updateTask,
      removeTask
    }}>
      {children}
    </BoardContext.Provider>
  );
};