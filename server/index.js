require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { initSocket } = require('./socket');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://aura-test1.netlify.app",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".netlify.app") // This allows all Netlify preview/branch deploys
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
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
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('CRITICAL: MONGO_URI is not defined in environment variables!');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('CRITICAL: MongoDB connection failed!', err));

module.exports = { app, server, io };

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
