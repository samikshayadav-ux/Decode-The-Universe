import bcryptjs from 'bcryptjs';
import { Team } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new team
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { teamName, teamId, password, members } = req.body;

    // Validate required fields
    if (!teamName || !teamId || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'teamName, teamId, and password are required'
      });
    }

    if (!members || !Array.isArray(members) || members.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'At least 3 team members are required'
      });
    }

    // Check if team already exists
    const existingTeam = await Team.findOne({ teamId });
    if (existingTeam) {
      return res.status(409).json({
        status: 'error',
        message: 'Team ID already registered'
      });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Transform members array from strings to objects with name and position
    const formattedMembers = members
      .filter(name => name && name.trim().length > 0)
      .map((name, index) => ({
        name: name.trim(),
        position: index + 1
      }))
      .slice(0, 4); // Limit to 4 members

    // Create new team
    const team = new Team({
      teamId: teamId.trim(),
      teamName: teamName.trim(),
      password: hashedPassword,
      members: formattedMembers
    });

    // Save to database
    await team.save();

    console.log(`[Auth Controller] Team registered successfully: ${teamId}`);

    // Generate JWT token
    const token = generateToken({
      teamId: team.teamId,
      teamName: team.teamName,
      isGuest: false
    });

    // Return response
    return res.status(201).json({
      status: 'success',
      message: 'Team registered successfully',
      token,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        currentRound: team.currentRound,
        unlockedRounds: team.unlockedRounds,
        isGuest: false
      }
    });
  } catch (error) {
    console.error(`[Auth Controller] Registration error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login with team credentials (supports guest login)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { teamId, password } = req.body;

    // Validate required fields
    if (!teamId || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId and password are required'
      });
    }

    // Check for guest login
    if (teamId.toUpperCase() === 'GUEST' && password === 'guest@123') {
      console.log('[Auth Controller] Guest login successful');

      const token = generateToken({
        teamId: 'GUEST',
        teamName: 'Guest User',
        isGuest: true
      });

      return res.status(200).json({
        status: 'success',
        message: 'Guest login successful',
        token,
        team: {
          teamId: 'GUEST',
          teamName: 'Guest User',
          isGuest: true
        }
      });
    }

    // Regular login - query database
    const team = await Team.findOne({ teamId: teamId.trim() });

    if (!team) {
      console.log(`[Auth Controller] Login failed - team not found: ${teamId}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid team ID or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, team.password);

    if (!isPasswordValid) {
      console.log(`[Auth Controller] Login failed - invalid password: ${teamId}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid team ID or password'
      });
    }

    console.log(`[Auth Controller] Team login successful: ${teamId}`);

    // Generate JWT token
    const token = generateToken({
      teamId: team.teamId,
      teamName: team.teamName,
      isGuest: false
    });

    // Return response
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        currentRound: team.currentRound,
        unlockedRounds: team.unlockedRounds,
        isGuest: false
      }
    });
  } catch (error) {
    console.error(`[Auth Controller] Login error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get team progress and details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        status: 'error',
        message: 'teamId parameter is required'
      });
    }

    // Query database
    const team = await Team.findOne({ teamId: teamId.trim() });

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    console.log(`[Auth Controller] Team data retrieved: ${teamId}`);

    // Return response with team data
    return res.status(200).json({
      status: 'success',
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        members: team.members,
        createdAt: team.createdAt
      }
    });
  } catch (error) {
    console.error(`[Auth Controller] Get team error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve team data',
      error: error.message
    });
  }
};
