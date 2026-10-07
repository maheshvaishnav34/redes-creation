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
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

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
