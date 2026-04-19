import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './utils/db.js';
import { initializeChangeStreams } from './utils/changeStreams.js';
import { fixLeaderboardTimes } from './utils/fixLeaderboardTime.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import adminRoutes from './routes/admin.js';
import leaderboardRoutes from './routes/leaderboard.js';
import gatewayRoutes from './routes/gateway.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Middleware: Security Headers
app.use(helmet());

// Middleware: CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-auth']
};
app.use(cors(corsOptions));

// Middleware: Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware: Request Logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Make io instance available to routes
app.set('io', io);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/gateway', gatewayRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Handle team joining leaderboard
  socket.on('join_round', (data) => {
    const { roundNumber } = data;
    const room = `round_${roundNumber}`;
    socket.join(room);
    console.log(`[Socket.IO] Client ${socket.id} joined room ${room}`);
  });

  // Handle team leaving leaderboard
  socket.on('leave_round', (data) => {
    const { roundNumber } = data;
    const room = `round_${roundNumber}`;
    socket.leave(room);
    console.log(`[Socket.IO] Client ${socket.id} left room ${room}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`[Socket.IO] Error for client ${socket.id}: ${error}`);
  });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('[MongoDB] Database connection established');

    // Fix old leaderboard records with missing displayTime
    try {
      await fixLeaderboardTimes();
    } catch (fixError) {
      console.warn('[Server] Warning: Could not fix leaderboard times:', fixError.message);
      // Don't fail server startup if migration fails
    }

    // Initialize Change Streams for real-time updates
    initializeChangeStreams(io);
    console.log('[Socket.IO] Change Streams initialized for real-time leaderboard updates');

    // Start HTTP server (which serves Express app)
    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║   Technical Treasure Hunt Backend API     ║
╠═══════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}
║  WebSocket: ws://localhost:${PORT}
║  Environment: ${NODE_ENV}
║  CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}
║  Health API: /api/health/*
║  Auth API: /api/auth/*
║  Quiz API: /api/quiz/*
║  Admin API: /api/admin/* (protected)
║  Gateway API: /api/gateway/* (protected)
║  Leaderboard API: /api/leaderboard/*
║  Real-time Events: Socket.IO enabled
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  process.exit(1);
});

// Start the server
startServer();
