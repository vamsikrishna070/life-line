import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (userId, userType) => {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
    
    if (userId && userType) {
      socket.emit('join', { userId, userType });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from Socket.IO server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinLocationRooms = (city, bloodGroup) => {
  if (socket) {
    socket.emit('joinLocation', { city, bloodGroup });
  }
};
