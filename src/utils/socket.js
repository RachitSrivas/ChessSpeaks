import { io } from 'socket.io-client';

// In production, this would point to the deployed server URL (set in Vercel Env Vars)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false // Connect only when a user explicitly joins a room
});
