import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspaces/workspaces.routes.js';
import businessRoutes from './modules/business/business.routes.js';
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
import { reviewWorker } from './modules/reviews/reviews.worker.js';

import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Security & Utility Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://client-seven-lemon-73.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
  // Allow any device on the local network (QR scan from phones, tablets, etc.)
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    // In development, log but allow all origins
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[CORS] Allowing dev origin: ${origin}`);
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-business-id'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      app: 'Redes Creation SaaS Backend',
      version: '1.0.0',
      database: dbCheck.rows.length > 0 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/api/v1/health', async (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Register Modular API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/google', googleRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/reviews', reviewRoutes); // Direct alias for Section 16 requirements
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/keywords', keywordRoutes);
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

// Serve React Frontend in Production (single-server deployment)
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  // All non-API routes → React SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Centralized Error Handling
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Redes Creation Backend running on http://localhost:${PORT}`);
  console.log(`🛡️  PostgreSQL 18 Multi-Tenant Engine Active`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  if (isProduction) console.log(`🌐 Serving React frontend from /client/dist`);
  console.log(`=======================================================`);

  // Start background worker for automatic review analysis
  reviewWorker.start();
});

export default app;
