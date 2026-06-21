const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track which room each socket belongs to
const socketRooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socketRooms[socket.id] = roomId;
    console.log(`User ${socket.id} joined room ${roomId}`);

    // Count how many people are now in this room (including the one who just joined)
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

    // Tell the joiner how many people are in the room now
    socket.emit('room-status', { count: roomSize });

    // Tell everyone ELSE in the room that a new player joined
    socket.to(roomId).emit('player-joined', { id: socket.id });
  });

  socket.on('make-move', ({ roomId, move }) => {
    console.log(`Move made in room ${roomId}:`, move);
    socket.to(roomId).emit('move-made', move);
  });

  socket.on('reset-game', (roomId) => {
    socket.to(roomId).emit('game-reset');
  });

  // Explicit leave (player clicks "Change Mode" or leaves voluntarily)
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    delete socketRooms[socket.id];
    socket.to(roomId).emit('player-left');
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socketRooms[socket.id];
    if (roomId) {
      socket.to(roomId).emit('player-left');
      delete socketRooms[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
