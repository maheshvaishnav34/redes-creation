import { oauthService } from '../services/google/oauthService.js';
import { prisma } from '../config/database.js';

export const authController = {
  /**
   * Health Check endpoint: GET /api/health
   */
  async getHealth(req, res) {
    try {
      const dbCheck = await prisma.$queryRaw`SELECT 1 as healthy`;
      res.json({
        status: 'healthy',
        app: 'Google Review + Local SEO Intelligence System',
        database: 'PostgreSQL (Prisma ORM)',
        dbStatus: dbCheck ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message,
      });
    }
  },

  /**
   * Generates Google OAuth consent URL: GET /api/auth/google/connect
   */
  async getGoogleConnectUrl(req, res, next) {
    try {
      const userId = req.user?.id || req.query.userId || 'default_user';
      const { url, state } = oauthService.generateAuthUrl(userId);
      res.json({
        success: true,
        authUrl: url,
        state,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Handles Google OAuth callback: GET /api/auth/google/callback
   */
  async handleGoogleCallback(req, res, next) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({
          error: 'Google Authorization Denied',
          details: error,
        });
      }

      if (!code) {
        return res.status(400).json({
          error: 'Missing Authorization Code',
          message: 'No authorization code returned from Google.',
        });
      }

      const userId = oauthService.validateState(state) || req.user?.id || 'default_user';
      const connection = await oauthService.handleCallback(code, userId);

      // If user came via browser redirect, redirect to frontend Google connection page
      const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      if (req.headers.accept?.includes('text/html')) {
        return res.redirect(`${frontendUrl}/google?status=connected&email=${encodeURIComponent(connection.accountEmail || '')}`);
      }

      res.json({
        success: true,
        message: 'Google account connected successfully.',
        connection: {
          id: connection.id,
          accountEmail: connection.accountEmail,
          status: connection.status,
          updatedAt: connection.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Disconnects Google Connection: POST /api/auth/google/disconnect
   */
  async disconnectGoogle(req, res, next) {
    try {
      const userId = req.user?.id || 'default_user';
      const result = await oauthService.disconnect(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
