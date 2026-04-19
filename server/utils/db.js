import mongoose from 'mongoose';
import Round from '../models/Round.js';

// Initialize default rounds if they don't exist
const initializeRounds = async () => {
  try {
    const roundCount = await Round.countDocuments();
    if (roundCount === 0) {
      console.log('[MongoDB] Initializing default rounds...');
      const defaultRounds = [
        {
          roundNumber: 1,
          status: 'pending',
          title: 'Quiz Round',
          displayName: 'Round 1',
          description: 'Answer trivia questions to earn points'
        },
        {
          roundNumber: 2,
          status: 'pending',
          title: 'Challenge Round',
          displayName: 'Round 2',
          description: 'Solve puzzles and riddles'
        },
        {
          roundNumber: 3,
          status: 'pending',
          title: 'Final Round',
          displayName: 'Final Round',
          description: 'Follow final clues to treasure location'
        }
      ];

      await Round.insertMany(defaultRounds);
      console.log('[MongoDB] Default rounds initialized successfully');
    }
  } catch (error) {
    console.error('[MongoDB] Error initializing rounds:', error.message);
  }
};

const connectDB = async (retries = 3) => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${retries}...`);

      const conn = await mongoose.connect(MONGODB_URI, mongooseOptions);
      
      console.log(`[MongoDB] Connected successfully to database: ${conn.connection.name}`);

      // Initialize default rounds
      await initializeRounds();

      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        console.log('[MongoDB] Connection event: connected');
      });

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection event: error', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('[MongoDB] Connection event: disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Connection event: reconnected');
      });

      return conn;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
      }

      // Wait before retrying
      console.log(`[MongoDB] Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

export default connectDB;
