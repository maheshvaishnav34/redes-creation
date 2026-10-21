import { Router } from 'express';
import {
  listReviews,
  getReviewById,
  getReviewFeedback,
  analyzeReview,
  reanalyzeReview,
  getReviewAnalytics,
  getReviewInsights,
  generateAIReply,
  approveAndPublishReply
} from './reviews.controller.js';
import {
  getGoogleLiveReviews,
  syncRealReviewsHandler,
  searchPlacesHandler,
  streamReviewEvents,
  getSyncTelemetryHandler
} from './googleLiveReviews.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

// Public & Authenticated Live Google Reviews & Place Showcase Endpoint
router.get('/google-live', optionalAuthenticate, getGoogleLiveReviews);
router.get('/live', optionalAuthenticate, getGoogleLiveReviews);
router.get('/search-places', optionalAuthenticate, searchPlacesHandler);
router.post('/sync-real', optionalAuthenticate, syncRealReviewsHandler);
router.get('/sync-real', optionalAuthenticate, syncRealReviewsHandler);

// Real-Time SSE Stream & Telemetry (Supports ?token= in EventSource)
router.get('/stream', authenticate, tenantIsolation, streamReviewEvents);
router.get('/sync-telemetry', authenticate, tenantIsolation, getSyncTelemetryHandler);


// Protected routes below
router.use(authenticate, tenantIsolation);

// Aggregated Intelligence Endpoints (Must be above /:id)
router.get('/analytics', getReviewAnalytics);
router.get('/insights', getReviewInsights);

// Review Listing & Details
router.get('/', listReviews);
router.get('/:id', getReviewById);
router.get('/:id/feedback', getReviewFeedback);

// AI Actions & Analysis
router.post('/:id/analyze', analyzeReview);
router.post('/:id/reanalyze', authorize(['client', 'owner', 'admin']), reanalyzeReview);
router.post('/:id/generate-response', authorize(['client', 'owner', 'admin']), generateAIReply);
router.post('/:id/generate-reply', authorize(['client', 'owner', 'admin']), generateAIReply);
router.post('/:id/approve', authorize(['client', 'owner', 'admin']), approveAndPublishReply);

export default router;
