import { verifyToken } from '../utils/jwt.js';

/**
 * Admin authentication middleware - requires admin credentials
 * Supports both hardcoded admin and JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    // Check for Bearer token first (JWT admin token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Admin access token required'
        });
      }

      try {
        const decoded = verifyToken(token);
        
        // Verify this is an admin token (can be extended with isAdmin flag)
        if (decoded.teamId && decoded.teamId !== 'admin') {
          return res.status(403).json({
            status: 'error',
            message: 'Insufficient privileges'
          });
        }

        req.admin = decoded;
        return next();
      } catch (error) {
        // Token verification failed, fall through to basic auth
      }
    }

    // Check for Basic Authentication (hardcoded admin credentials)
    const basicAuth = req.headers['x-admin-auth'];
    if (basicAuth) {
      // Expect format: {"adminId":"admin123","password":"Jayy@admin.123"}
      try {
        const auth = typeof basicAuth === 'string' ? JSON.parse(basicAuth) : basicAuth;
        
        if (auth.adminId === 'admin123' && auth.password === 'Jayy@admin.123') {
          req.admin = {
            adminId: 'admin123',
            role: 'admin'
          };
          return next();
        } else {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid admin credentials'
          });
        }
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid authentication format'
        });
      }
    }

    // No authentication method provided
    return res.status(401).json({
      status: 'error',
      message: 'Admin authentication required. Use x-admin-auth header or Authorization Bearer token'
    });
  } catch (error) {
    console.error(`[Admin Auth Middleware] Error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};
