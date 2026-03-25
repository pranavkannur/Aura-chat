require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { initSocket } = require('./socket');

// Validate critical environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`CRITICAL: Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://aura-test2.netlify.app",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".netlify.app")
    ) {
      callback(null, true);
    } else {
      console.warn(`CORS Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io - MUST be before routes
initSocket(server, corsOptions);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/messages', require('./routes/message.routes'));

const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    if (require.main === module) {
      server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
    }
  })
  .catch(err => {
    console.error('CRITICAL: MongoDB connection failed!');
    console.error(err);
    process.exit(1);
  });

module.exports = { app, server };
