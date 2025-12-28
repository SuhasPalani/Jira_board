// Placeholder for websocket service
// backend/src/services/websocketService.js
const connectedUsers = new Map();

exports.initializeWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-board', (boardId) => {
      socket.join(boardId);
      console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on('leave-board', (boardId) => {
      socket.leave(boardId);
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on('user-online', ({ userId, boardId }) => {
      connectedUsers.set(socket.id, { userId, boardId });
      io.to(boardId).emit('user-presence', {
        userId,
        status: 'online'
      });
    });

    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        io.to(userData.boardId).emit('user-presence', {
          userId: userData.userId,
          status: 'offline'
        });
        connectedUsers.delete(socket.id);
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};