import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { businessController } from '../controllers/businessController.js';
import { reviewController } from '../controllers/reviewController.js';
import { seoController } from '../controllers/seoController.js';
import { intelligenceController } from '../controllers/intelligenceController.js';

import { optionalAuth } from '../middleware/authentication.js';
import { apiLimiter, authLimiter, aiLimiter } from '../middleware/rateLimiter.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = Router();

// Apply general API rate limiting
router.use(apiLimiter);

// ----------------------------------------------------
// 1. Health Check
// ----------------------------------------------------
router.get('/health', authController.getHealth);

// ----------------------------------------------------
// 2. Google OAuth 2.0 & Authentication
// ----------------------------------------------------
router.get('/auth/google/connect', authLimiter, optionalAuth, authController.getGoogleConnectUrl);
router.get('/auth/google/callback', authController.handleGoogleCallback);
router.post('/auth/google/disconnect', optionalAuth, authController.disconnectGoogle);

// ----------------------------------------------------
// 3. Google Business Profile Accounts & Locations
// ----------------------------------------------------
router.get('/google/accounts', optionalAuth, businessController.getGoogleAccounts);
router.get('/google/accounts/:accountId/locations', optionalAuth, businessController.getGoogleLocations);

// ----------------------------------------------------
// 4. Business Management
// ----------------------------------------------------
router.post('/businesses', optionalAuth, validateRequest({ body: schemas.createBusiness }), businessController.createBusiness);
router.get('/businesses', optionalAuth, businessController.getBusinesses);
router.get('/businesses/:businessId', optionalAuth, businessController.getBusinessById);

// ----------------------------------------------------
// 5. Reviews Management & Replies
// ----------------------------------------------------
router.get('/reviews', optionalAuth, reviewController.getReviews);
router.post('/reviews/sync', optionalAuth, reviewController.syncReviews);
router.post('/reviews/:reviewId/analyze', aiLimiter, optionalAuth, reviewController.analyzeReview);
router.post('/reviews/:reviewId/reply-draft', aiLimiter, optionalAuth, reviewController.generateReplyDraft);
router.post('/reviews/:reviewId/publish-reply', optionalAuth, reviewController.publishReply);

// ----------------------------------------------------
// 6. Local SEO Audit Engine & Search Console
// ----------------------------------------------------
router.post('/seo/audits', optionalAuth, seoController.runAudit);
router.get('/seo/audits/:auditId', optionalAuth, seoController.getAuditById);
router.get('/search-console/properties', optionalAuth, seoController.getSearchConsoleProperties);
router.get('/search-console/performance', optionalAuth, seoController.getSearchConsolePerformance);

// ----------------------------------------------------
// 7. Intelligence, Keywords, Reports & Sync History
// ----------------------------------------------------
router.get('/insights', optionalAuth, intelligenceController.getInsights);
router.get('/reports', optionalAuth, intelligenceController.getReports);
router.get('/sync/history', optionalAuth, intelligenceController.getSyncHistory);
router.post('/keywords/generate', aiLimiter, optionalAuth, intelligenceController.generateKeywords);

export default router;
