require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit('getOnlineUsers', Object.keys(onlineUsers));
  });

  socket.on('sendMessage', (data) => {
    const { receiverId } = data;
    if (onlineUsers[receiverId]) {
      io.to(onlineUsers[receiverId]).emit('getMessage', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    io.emit('getOnlineUsers', Object.keys(onlineUsers));
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
