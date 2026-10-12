import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'redes_creation_default_secret_jwt';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Also check query param or x-auth-token if available
  if (!token && req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists in database or attach decoded
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'owner',
      fullName: decoded.fullName || decoded.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid or has expired.',
    });
  }
}

/**
 * Optional authentication middleware: if token present, sets req.user; otherwise continues
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'owner',
    };
  } catch {
    req.user = null;
  }
  next();
}
