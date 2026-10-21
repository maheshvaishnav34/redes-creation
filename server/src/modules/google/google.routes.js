import { Router } from 'express';
import {
  getConnectionStatus,
  getOAuthUrl,
  connectOAuth,
  syncNow,
  disconnectGoogle,
  getPerformanceMetrics,
  discoverLocations,
  mapLocation,
  createGooglePost,
  listGooglePosts,
  getGoogleReviewUrl,
  updateGoogleReviewUrl,
  getGoogleReviewQrCode,
  getSyncHistory,
  getLocationReviews
} from './google.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Google Posts (What's New, Offers, Events)
router.get('/posts', listGooglePosts);
router.post('/posts', authorize(['client', 'owner', 'admin']), createGooglePost);

// Level 1: OAuth URL generation & status
router.get('/auth-url', getOAuthUrl);
router.get('/connections/auth-url', getOAuthUrl);

// Google Review Destination & QR Code Management
router.get('/review-url', getGoogleReviewUrl);
router.get('/review-url/:businessId', getGoogleReviewUrl);
router.put('/review-url', authorize(['client', 'owner', 'admin']), updateGoogleReviewUrl);
router.put('/review-url/:businessId', authorize(['client', 'owner', 'admin']), updateGoogleReviewUrl);

router.get('/review-qr', getGoogleReviewQrCode);
router.get('/review-qr/:businessId', getGoogleReviewQrCode);

// Level 1: View & Sync (locations.view, google telemetry view)
router.get('/status', getConnectionStatus);
router.get('/performance', getPerformanceMetrics);
router.get('/discover-locations', discoverLocations);
router.post('/sync', authorize(['client', 'owner', 'admin']), syncNow);
router.get('/sync/history', getSyncHistory);
router.get('/sync-history', getSyncHistory);
router.get('/sync-history/:businessId', getSyncHistory);

// Section: Live Reviews (Compliant with Google 30-Day Policy & Pagination)
router.get('/locations/:locationId/reviews', getLocationReviews);
router.get('/live-reviews', getLocationReviews);
router.get('/live-reviews/:businessId', getLocationReviews);

// Section 14 REST Specification Endpoints: /google/connections/* and /google/sync/*
router.get('/connections/status', getConnectionStatus);
router.get('/connections/locations', discoverLocations);
router.post('/connections/connect', authorize(['owner', 'admin', 'client']), connectOAuth);
router.post('/connections/disconnect', authorize(['owner', 'admin', 'client']), disconnectGoogle);
router.post('/connections/map-location', authorize(['owner', 'admin', 'client']), mapLocation);

router.post('/sync/now', authorize(['client', 'owner', 'admin']), syncNow);
router.get('/sync/performance', getPerformanceMetrics);

// Level 3: Restricted - Location mapping & OAuth management
router.post('/map-location', authorize(['owner', 'admin', 'client']), mapLocation);
router.post('/connect', authorize(['owner', 'admin', 'client']), connectOAuth);
router.post('/disconnect', authorize(['owner', 'admin', 'client']), disconnectGoogle);

export default router;

