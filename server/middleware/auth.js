import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware - requires valid JWT token
 * Attaches decoded token payload to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`[Auth Middleware] Token verification error: ${error.message}`);
    
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware - token is optional
 * If valid token exists, attaches decoded payload to req.user
 * If token is missing or invalid, sets req.user to null and continues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid or expired, but that's okay for optional auth
    console.log(`[Optional Auth] Token verification skipped: ${error.message}`);
    req.user = null;
    next();
  }
};
