// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (username, email, password) => {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Users & Friends
export const searchUsers = async (query) => {
  const { data } = await api.get(`/users/search?q=${query}`);
  return data;
};

export const sendFriendRequest = async (userId) => {
  const { data } = await api.post(`/users/friends/request/${userId}`);
  return data;
};

export const acceptFriendRequest = async (requestId) => {
  const { data } = await api.post(`/users/friends/accept/${requestId}`);
  return data;
};

export const getFriends = async () => {
  const { data } = await api.get('/users/friends');
  return data;
};

export const getFriendRequests = async () => {
  const { data } = await api.get('/users/friends/requests');
  return data;
};

// Boards
export const getBoards = async () => {
  const { data } = await api.get('/boards');
  return data;
};

export const getBoard = async (boardId) => {
  const { data } = await api.get(`/boards/${boardId}`);
  return data;
};

export const createBoard = async (name, description) => {
  const { data } = await api.post('/boards', { name, description });
  return data;
};

export const updateBoard = async (boardId, updates) => {
  const { data } = await api.put(`/boards/${boardId}`, updates);
  return data;
};

export const addColumn = async (boardId, name) => {
  const { data } = await api.post(`/boards/${boardId}/columns`, { name });
  return data;
};

export const updateColumn = async (boardId, columnId, updates) => {
  const { data } = await api.put(`/boards/${boardId}/columns/${columnId}`, updates);
  return data;
};

export const deleteColumn = async (boardId, columnId) => {
  const { data } = await api.delete(`/boards/${boardId}/columns/${columnId}`);
  return data;
};

// Tasks
export const createTask = async (taskData) => {
  const { data } = await api.post('/tasks', taskData);
  return data;
};

export const updateTask = async (taskId, updates) => {
  const { data } = await api.put(`/tasks/${taskId}`, updates);
  return data;
};

export const moveTask = async (taskId, newColumnId, newOrder) => {
  const { data } = await api.patch(`/tasks/${taskId}/move`, { newColumnId, newOrder });
  return data;
};

export const deleteTask = async (taskId) => {
  const { data } = await api.delete(`/tasks/${taskId}`);
  return data;
};

// AI
export const createTaskFromText = async (text, boardId) => {
  const { data } = await api.post('/ai/create-task', { text, boardId });
  return data;
};

export const transcribeAudio = async (audioBlob, boardId) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('boardId', boardId);

  const { data } = await api.post('/ai/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

export const improveDescription = async (description, title) => {
  const { data } = await api.post('/ai/improve-description', { description, title });
  return data;
};

export const generateSubtasks = async (title, description) => {
  const { data } = await api.post('/ai/generate-subtasks', { title, description });
  return data;
};

export const chatWithAI = async (message, context) => {
  const { data } = await api.post('/ai/chat', { message, context });
  return data;
};

export default api;

// frontend/src/services/websocket.js
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

let socket = null;

export const initializeWebSocket = () => {
  const token = localStorage.getItem('token');
  
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeWebSocket();
  }
  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};