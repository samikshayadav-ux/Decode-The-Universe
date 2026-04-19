import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token with the provided payload
 * @param {Object} payload - Token payload (e.g., { teamId, teamName, isGuest })
 * @returns {string} - Generated JWT token
 * @throws {Error} - If JWT_SECRET is not set
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    return token;
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid, expired, or JWT_SECRET is missing
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
};
