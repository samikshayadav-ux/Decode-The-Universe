import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isConnected = readyState === 1;
  const statusCode = isConnected ? 200 : 503;
  const status = isConnected ? 'ok' : 'error';

  res.status(statusCode).json({
    status,
    message: isConnected 
      ? 'Server and database are healthy' 
      : 'Database connection issue',
    timestamp: new Date().toISOString(),
    database: connectionStates[readyState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
