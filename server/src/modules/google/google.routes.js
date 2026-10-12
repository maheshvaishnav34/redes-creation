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
  updateGoogleReviewUrl
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

// Google Review Destination Management (Fetch & Validate Configured Google Review URL)
router.get('/review-url', getGoogleReviewUrl);
router.get('/review-url/:businessId', getGoogleReviewUrl);
router.put('/review-url', authorize(['client', 'owner', 'admin']), updateGoogleReviewUrl);
router.put('/review-url/:businessId', authorize(['client', 'owner', 'admin']), updateGoogleReviewUrl);

// Level 1: View & Sync (locations.view, google telemetry view)
router.get('/status', getConnectionStatus);
router.get('/performance', getPerformanceMetrics);
router.get('/discover-locations', discoverLocations);
router.post('/sync', authorize(['client', 'owner', 'admin']), syncNow);

// Section 14 REST Specification Endpoints: /google/connections/* and /google/sync/*
router.get('/connections/status', getConnectionStatus);
router.get('/connections/locations', discoverLocations);
router.post('/connections/connect', authorize(['owner', 'admin']), connectOAuth);
router.post('/connections/disconnect', authorize(['owner', 'admin']), disconnectGoogle);
router.post('/connections/map-location', authorize(['owner', 'admin']), mapLocation);

router.post('/sync/now', authorize(['client', 'owner', 'admin']), syncNow);
router.get('/sync/performance', getPerformanceMetrics);

// Level 3: Restricted - Location mapping & OAuth management
router.post('/map-location', authorize(['owner', 'admin']), mapLocation);
router.post('/connect', authorize(['owner', 'admin']), connectOAuth);
router.post('/disconnect', authorize(['owner', 'admin']), disconnectGoogle);

export default router;

