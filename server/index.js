require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { initSocket } = require('./socket');

const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174", 
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server, corsOptions);

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

module.exports = { app, server, io };

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
