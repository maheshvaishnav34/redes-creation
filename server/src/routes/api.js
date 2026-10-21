import { Router } from 'express';

// Section 11 Controllers
import { login, register, getMe } from '../modules/auth/auth.controller.js';
import {
  listClientHotels,
  createClientHotel,
  getHotelById,
  deleteHotel,
  addPlaceForHotel,
  getHotelReviews,
  getHotelReviewSummary,
  getHotelSyncStatus,
  syncHotelReviews,
  disconnectHotelConnection
} from '../modules/hotels/hotels.controller.js';
import {
  getOAuthUrl,
  getConnectionStatus,
  disconnectGoogle,
  discoverLocations
} from '../modules/google/google.controller.js';
import { streamReviewEvents } from '../modules/reviews/googleLiveReviews.controller.js';
import { listAllWorkspaces, getSyncHealth } from '../modules/admin/admin.controller.js';
import { handleGooglePubSubNotification } from '../modules/google/googlePubSub.controller.js';

// Existing feature controllers
import { authController } from '../controllers/authController.js';
import { businessController } from '../controllers/businessController.js';
import { reviewController } from '../controllers/reviewController.js';
import { seoController } from '../controllers/seoController.js';
import { intelligenceController } from '../controllers/intelligenceController.js';

// Middleware
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenant.js';
import { authorize } from '../middleware/rbac.js';
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
// 2. Authentication (Section 11)
// ----------------------------------------------------
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ success: true, message: 'Logged out successfully.' });
});
router.get('/auth/me', authenticate, getMe);

// ----------------------------------------------------
// 3. Google OAuth 2.0 Integration (Section 11 & Section 18)
// ----------------------------------------------------
router.get('/auth/google', authenticate, tenantIsolation, getOAuthUrl);
router.get('/google/connect', authenticate, tenantIsolation, getOAuthUrl);
router.get('/google/callback', authController.handleGoogleCallback);
router.get('/google/status', authenticate, tenantIsolation, getConnectionStatus);
router.get('/google/connections', authenticate, tenantIsolation, getConnectionStatus);
router.delete('/google/connections/:id', authenticate, tenantIsolation, disconnectGoogle);
router.get('/google/accounts', authenticate, tenantIsolation, businessController.getGoogleAccounts);
router.get('/google/accounts/:accountId/locations', authenticate, tenantIsolation, businessController.getGoogleLocations);
router.get('/google/accounts/:id/locations', authenticate, tenantIsolation, businessController.getGoogleLocations);
router.get('/google/locations', authenticate, tenantIsolation, discoverLocations);
router.post('/google/disconnect', authenticate, tenantIsolation, disconnectGoogle);

// Legacy auth/google aliases
router.get('/auth/google/connect', authLimiter, optionalAuth, authController.getGoogleConnectUrl);
router.get('/auth/google/callback', authController.handleGoogleCallback);
router.post('/auth/google/disconnect', optionalAuth, authController.disconnectGoogle);

// ----------------------------------------------------
// 4. Hotel Management (Section 11)
// ----------------------------------------------------
// All hotel routes strictly enforce authentication and tenant isolation
router.get('/hotels', authenticate, tenantIsolation, listClientHotels);
router.post('/hotels', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), createClientHotel);
router.post('/hotels/maps-link', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), async (req, res, next) => {
  // Alias to create hotel directly from Google Maps URL / Place ID
  return createClientHotel(req, res, next);
});
router.get('/hotels/:id', authenticate, tenantIsolation, getHotelById);
router.delete('/hotels/:id', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), deleteHotel);
router.post('/hotels/:id/sync', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), syncHotelReviews);

// Hotel dual connection routes
router.post('/hotels/:id/add-place', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), addPlaceForHotel);
router.delete('/hotels/:id/connection', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), disconnectHotelConnection);

// ----------------------------------------------------
// 5. Hotel Reviews & Analytics (Section 11)
// ----------------------------------------------------
router.get('/hotels/:id/reviews', authenticate, tenantIsolation, getHotelReviews);
router.get('/hotels/:id/review-summary', authenticate, tenantIsolation, getHotelReviewSummary);
router.get('/hotels/:id/sync-status', authenticate, tenantIsolation, getHotelSyncStatus);

// ----------------------------------------------------
// 6. Real-Time Dashboard Events / SSE (Section 11)
// ----------------------------------------------------
router.get('/events', authenticate, tenantIsolation, streamReviewEvents);

// ----------------------------------------------------
// 7. Google Cloud Pub/Sub Webhook (Section 9)
// ----------------------------------------------------
router.post('/webhooks/google-pubsub', handleGooglePubSubNotification);

// ----------------------------------------------------
// 8. Super Admin Management & Sync Health (Section 11)
// ----------------------------------------------------
router.get('/admin/tenants', authenticate, authorize(['super_admin', 'owner']), listAllWorkspaces);
router.get('/admin/sync-health', authenticate, authorize(['super_admin', 'owner']), getSyncHealth);

// ----------------------------------------------------
// 9. Canonical Section 18 SaaS Endpoints & Compatibility
// ----------------------------------------------------
// Canonical Business Locations (Section 18)
router.get('/business-locations', authenticate, tenantIsolation, listClientHotels);
router.get('/business-locations/:id/reviews', authenticate, tenantIsolation, getHotelReviews);
router.post('/business-locations/:id/reviews/sync', authenticate, tenantIsolation, authorize(['owner', 'admin', 'client']), syncHotelReviews);
router.get('/business-locations/:id/sync-status', authenticate, tenantIsolation, getHotelSyncStatus);

// Canonical Analytics (Section 18)
router.get('/analytics/overview', authenticate, tenantIsolation, intelligenceController.getInsights);
router.get('/analytics/reviews', authenticate, tenantIsolation, (req, res, next) => {
  if (req.query.businessId) {
    req.params.id = req.query.businessId;
    return getHotelReviewSummary(req, res, next);
  }
  return intelligenceController.getInsights(req, res, next);
});

// Canonical AI Review Intelligence & Reply Suggestion (Section 18)
router.post('/ai/reviews/analyze', aiLimiter, authenticate, tenantIsolation, reviewController.analyzeReview);
router.post('/ai/reviews/reply-suggestion', aiLimiter, authenticate, tenantIsolation, reviewController.generateReplyDraft);
router.post('/reviews/:id/reply', authenticate, tenantIsolation, reviewController.publishReply);

// Standard feature routes
router.post('/businesses', optionalAuth, validateRequest({ body: schemas.createBusiness }), businessController.createBusiness);
router.get('/businesses', optionalAuth, businessController.getBusinesses);
router.get('/businesses/:businessId', optionalAuth, businessController.getBusinessById);

router.get('/reviews', optionalAuth, reviewController.getReviews);
router.post('/reviews/sync', optionalAuth, reviewController.syncReviews);
router.post('/reviews/:reviewId/analyze', aiLimiter, optionalAuth, reviewController.analyzeReview);
router.post('/reviews/:reviewId/reply-draft', aiLimiter, optionalAuth, reviewController.generateReplyDraft);
router.post('/reviews/:reviewId/publish-reply', optionalAuth, reviewController.publishReply);

router.post('/seo/audits', optionalAuth, seoController.runAudit);
router.get('/seo/audits/:auditId', optionalAuth, seoController.getAuditById);
router.get('/search-console/properties', optionalAuth, seoController.getSearchConsoleProperties);
router.get('/search-console/performance', optionalAuth, seoController.getSearchConsolePerformance);

router.get('/insights', optionalAuth, intelligenceController.getInsights);
router.get('/reports', optionalAuth, intelligenceController.getReports);
router.get('/sync/history', optionalAuth, intelligenceController.getSyncHistory);
router.post('/keywords/generate', aiLimiter, optionalAuth, intelligenceController.generateKeywords);

export default router;
