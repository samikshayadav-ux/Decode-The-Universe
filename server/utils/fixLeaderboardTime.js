/**
 * Utility to fix leaderboard times for completed quizzes
 * This handles old quiz records that don't have displayTime set
 */

import Round0 from '../models/Round0.js';

export const fixLeaderboardTimes = async () => {
  try {
    console.log('[Fix Leaderboard] Starting to fix old quiz records...');
    
    // Find all completed Round0 records with missing or zero displayTime
    const recordsToFix = await Round0.find({
      status: 'completed',
      $or: [
        { displayTime: { $exists: false } },
        { displayTime: 0 }
      ]
    });
    
    console.log(`[Fix Leaderboard] Found ${recordsToFix.length} records to fix`);
    
    let fixed = 0;
    for (const record of recordsToFix) {
      // Determine displayTime based on completion type
      let displayTime = 0;
      
      if (record.completionType === 'auto_submit') {
        displayTime = 1500;
      } else {
        // For full_completion or manual_submit, use totalTimeSpent
        displayTime = record.totalTimeSpent || record.timeAtLastSubmission || 0;
      }
      
      // Update the record
      record.displayTime = displayTime;
      await record.save();
      fixed++;
      
      console.log(`[Fix Leaderboard] Fixed ${record.teamId}: displayTime = ${displayTime}s (${Math.floor(displayTime / 60)}:${(displayTime % 60).toString().padStart(2, '0')})`);
    }
    
    console.log(`[Fix Leaderboard] Successfully fixed ${fixed} records`);
    return fixed;
  } catch (error) {
    console.error(`[Fix Leaderboard] Error: ${error.message}`);
    throw error;
  }
};
