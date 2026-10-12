import { prisma } from '../config/database.js';

/**
 * Middleware ensuring the authenticated user owns the specified businessLocationId
 */
export function requireBusinessOwnership(paramName = 'businessId') {
  return async (req, res, next) => {
    try {
      const businessId = req.params[paramName] || req.body[paramName] || req.query[paramName] || req.headers['x-business-id'];
      
      if (!businessId) {
        return res.status(400).json({
          error: 'Missing Business Identifier',
          message: `The required parameter '${paramName}' was not provided.`,
        });
      }

      const location = await prisma.businessLocation.findUnique({
        where: { id: businessId },
        select: { id: true, userId: true, locationName: true },
      });

      if (!location) {
        return res.status(404).json({
          error: 'Business Not Found',
          message: 'The requested business location does not exist.',
        });
      }

      // Check ownership (admins can bypass if needed)
      if (location.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access Denied',
          message: 'You are not authorized to access or modify this business location.',
        });
      }

      req.businessLocation = location;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware ensuring the user has role 'admin'
 */
export function requireRole(allowedRoles = ['admin']) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to perform this operation.',
      });
    }
    next();
  };
}
