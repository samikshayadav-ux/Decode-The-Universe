import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './db.js';
import Round from '../models/Round.js';
import Team from '../models/Team.js';
import Round1 from '../models/Round1.js';
import Round2 from '../models/Round2.js';
import FinalRound from '../models/FinalRound.js';

dotenv.config();

const resetDb = async () => {
  try {
    await connectDB();
    console.log('[Reset] Connected to database');

    // 1. Clear existing data
    console.log('[Reset] Clearing old data...');
    await Round.deleteMany({});
    await Team.deleteMany({});
    await Round1.deleteMany({});
    await Round2.deleteMany({});
    await FinalRound.deleteMany({});
    console.log('[Reset] Cleared all collections');

    // 2. Initialize Rounds (1, 2, 3)
    console.log('[Reset] Initializing fresh rounds...');
    const rounds = [
      {
        roundNumber: 1,
        title: 'ROUND 1',
        displayName: 'Filtering Sequence',
        description: 'Phase 1: Knowledge Assessment',
        status: 'pending'
      },
      {
        roundNumber: 2,
        title: 'ROUND 2',
        displayName: 'Challenge Sequence',
        description: 'Phase 2: Technical Prowess',
        status: 'pending'
      },
      {
        roundNumber: 3,
        title: 'FINAL ROUND',
        displayName: 'Final Sequence',
        description: 'Phase 3: Core Decryption',
        status: 'pending'
      }
    ];

    await Round.insertMany(rounds);
    console.log('[Reset] Inserted 3 rounds (1, 2, 3)');

    console.log(`
╔═══════════════════════════════════════════╗
║   DATABASE RESET COMPLETED SUCCESSFULLY   ║
╠═══════════════════════════════════════════╣
║  Rounds: 3 initialized (1, 2, 3)          ║
║  Teams: All cleared                       ║
║  Round Data: All cleared                  ║
╚═══════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('[Reset] Failed to reset database:', error);
    process.exit(1);
  }
};

resetDb();
