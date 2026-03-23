require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/messages', require('./routes/message.routes'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('CRITICAL: MongoDB connection failed!', err));

// Socket.io logic
let onlineUsers = {}; // { userId: socketId }

// Function to get receiver's socket ID
const getReceiverSocketId = (receiverId) => {
  return onlineUsers[receiverId];
};

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

module.exports = { app, server, io, getReceiverSocketId };

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
