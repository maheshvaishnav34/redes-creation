import 'dotenv/config';
import app from './app.js';
import { prisma } from './config/database.js';
import { reviewWorker } from './modules/reviews/reviews.worker.js';
import { automationEngine } from './modules/automation/automation.engine.js';

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Google Review + Local SEO Intelligence System Backend`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛡️  Database: PostgreSQL via Prisma ORM Active`);
  console.log(`🔍 Section 11 API Endpoints Mounted: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  if (isProduction) console.log(`🌐 Serving React Frontend from /client/dist`);
  console.log(`=======================================================`);

  // Start background worker for automatic review analysis
  try {
    reviewWorker.start();
  } catch (err) {
    console.warn('[Review Worker] Notice:', err.message);
  }

  // Start Section 15 Automation & Background Jobs Engine
  try {
    automationEngine.start();
  } catch (err) {
    console.warn('[Automation Engine] Notice:', err.message);
  }
});

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[Prisma] Database connection closed.');
    } catch (err) {
      console.error('[Prisma] Error disconnecting:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
