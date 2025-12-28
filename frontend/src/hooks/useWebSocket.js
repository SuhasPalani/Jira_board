// frontend/src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import { initializeWebSocket, disconnectWebSocket } from '../services/websocket';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = initializeWebSocket();
    setSocket(ws);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return socket;
};