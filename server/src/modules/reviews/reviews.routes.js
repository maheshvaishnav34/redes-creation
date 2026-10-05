import { Router } from 'express';
import {
  listReviews,
  getReviewById,
  generateAIReply,
  approveAndPublishReply
} from './reviews.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - Client can view all synced Google reviews (reviews.view ✅)
router.get('/', listReviews);
router.get('/:id', getReviewById);

// Level 2: Approve & Execute - Client can generate AI replies and approve/publish (ai.generate ✅, reviews.approve_reply ✅)
router.post('/:id/generate-reply', authorize(['client', 'owner', 'admin']), generateAIReply);
router.post('/:id/approve', authorize(['client', 'owner', 'admin']), approveAndPublishReply);

// Level 3: Restricted - reviews.delete ❌ (Google policy & system restriction: Reviews cannot be deleted by client)

export default router;
