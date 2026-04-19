import express from 'express';
import { register, login, getTeam } from '../controllers/authController.js';

const router = express.Router();

// Input validation helper
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    next();
  };
};

/**
 * POST /api/auth/register
 * Register a new team
 */
router.post(
  '/register',
  validateRequiredFields(['teamName', 'teamId', 'password', 'members']),
  register
);

/**
 * POST /api/auth/login
 * Login with team credentials (supports guest login)
 */
router.post(
  '/login',
  validateRequiredFields(['teamId', 'password']),
  login
);

/**
 * GET /api/auth/team/:teamId
 * Get team progress and details
 */
router.get('/team/:teamId', getTeam);

export default router;
