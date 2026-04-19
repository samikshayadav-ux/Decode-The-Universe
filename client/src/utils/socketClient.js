import io from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.IO connection to backend
 * @param {string} serverURL - Backend server URL (default: http://localhost:5000)
 * @returns {Object} - Socket.IO instance
 */
export const initializeSocket = (serverURL = 'http://localhost:5000') => {
  if (socket && socket.connected) {
    console.log('[Socket.IO] Already connected');
    return socket;
  }

  try {
    socket = io(serverURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection event
    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected with ID: ${socket.id}`);
    });

    // Disconnection event
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });

    // Error event
    socket.on('error', (error) => {
      console.error('[Socket.IO] Error:', error);
    });

    // Team score change event
    socket.on('team:scoreChange', (data) => {
      console.log('[Socket.IO] Team score changed:', data);
      // This event can be listened to by components updating leaderboard
    });

    // Leaderboard update event
    socket.on('leaderboard:update', (data) => {
      console.log('[Socket.IO] Leaderboard updated:', data);
      // This event broadcasts real-time leaderboard changes
    });

    return socket;
  } catch (error) {
    console.error('[Socket.IO] Initialization error:', error);
    return null;
  }
};

/**
 * Join a specific round leaderboard room
 * @param {number} roundNumber - Round number (0, 1, 2, 3)
 */
export const joinRound = (roundNumber) => {
  if (!socket || !socket.connected) {
    console.error('[Socket.IO] Socket not connected');
    return;
  }

  try {
    socket.emit('join_round', { roundNumber });
    console.log(`[Socket.IO] Joined round ${roundNumber} leaderboard`);
  } catch (error) {
    console.error('[Socket.IO] Error joining round:', error);
  }
};

/**
 * Leave a specific round leaderboard room
 * @param {number} roundNumber - Round number (0, 1, 2, 3)
 */
export const leaveRound = (roundNumber) => {
  if (!socket || !socket.connected) {
    console.error('[Socket.IO] Socket not connected');
    return;
  }

  try {
    socket.emit('leave_round', { roundNumber });
    console.log(`[Socket.IO] Left round ${roundNumber} leaderboard`);
  } catch (error) {
    console.error('[Socket.IO] Error leaving round:', error);
  }
};

/**
 * Subscribe to leaderboard updates
 * @param {Function} callback - Callback function that receives leaderboard data
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToLeaderboard = (callback) => {
  if (!socket) {
    console.error('[Socket.IO] Socket not initialized');
    return () => {};
  }

  socket.on('leaderboard:update', callback);

  // Return unsubscribe function
  return () => {
    socket.off('leaderboard:update', callback);
  };
};

/**
 * Subscribe to team score changes
 * @param {Function} callback - Callback function that receives score change data
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToScoreChanges = (callback) => {
  if (!socket) {
    console.error('[Socket.IO] Socket not initialized');
    return () => {};
  }

  socket.on('team:scoreChange', callback);

  // Return unsubscribe function
  return () => {
    socket.off('team:scoreChange', callback);
  };
};

/**
 * Get the current socket instance
 * @returns {Object|null} - Socket.IO instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect from Socket.IO server
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log('[Socket.IO] Disconnected');
  }
};

export default {
  initializeSocket,
  joinRound,
  leaveRound,
  subscribeToLeaderboard,
  subscribeToScoreChanges,
  getSocket,
  disconnectSocket
};
