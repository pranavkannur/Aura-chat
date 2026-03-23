const { Server } = require('socket.io');

let io;
let onlineUsers = {}; // { userId: socketId }

const initSocket = (server, corsOptions) => {
  io = new Server(server, {
    cors: corsOptions
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      onlineUsers[userId] = socket.id;
      io.emit('getOnlineUsers', Object.keys(onlineUsers));
    }

    socket.on('disconnect', () => {
      if (userId) {
        delete onlineUsers[userId];
        io.emit('getOnlineUsers', Object.keys(onlineUsers));
      }
    });
  });

  return io;
};

const getReceiverSocketId = (receiverId) => {
  return onlineUsers[receiverId];
};

module.exports = { initSocket, getReceiverSocketId, get io() { return io; } };
