import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Unified /api endpoints (Section 11)
import apiRoutes from './routes/api.js';

// Modular v1 endpoints for client dashboard features
import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspaces/workspaces.routes.js';
import businessRoutes from './modules/business/business.routes.js';
import industryRoutes from './modules/industries/industries.routes.js';
import locationRoutes from './modules/locations/locations.routes.js';
import googleRoutes from './modules/google/google.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import campaignRoutes from './modules/campaigns/campaigns.routes.js';
import keywordRoutes from './modules/keywords/keywords.routes.js';
import geogridRoutes from './modules/geogrid/geogrid.routes.js';
import competitorRoutes from './modules/competitors/competitors.routes.js';
import seoRoutes from './modules/seo/seo.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import automationRoutes from './modules/automation/automation.routes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security & Utility Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'https://client-seven-lemon-73.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-business-id'],
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Root
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await prisma.$queryRaw`SELECT 1 as healthy`;
    res.json({
      status: 'healthy',
      app: 'Google Review + Local SEO Intelligence System',
      version: '1.0.0',
      database: 'PostgreSQL (Prisma ORM)',
      dbConnected: Boolean(dbCheck),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Mount Section 11 Specification Endpoints at /api
app.use('/api', apiRoutes);

// Mount Modular Endpoints at /api/v1 for Client Dashboard Components
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/industries', industryRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/google', googleRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/review-campaigns', campaignRoutes);
app.use('/api/v1/keywords', keywordRoutes);
app.use('/api/v1/rank-tracking', keywordRoutes);
app.use('/api/v1/geo-grid', geogridRoutes);
app.use('/api/v1/competitors', competitorRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/api/v1/jobs', automationRoutes);

// Serve React Frontend in Production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Centralized Error Handler
app.use(errorHandler);

export default app;
