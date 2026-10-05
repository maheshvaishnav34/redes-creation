import { Router } from 'express';
import {
  getLatestAudit,
  runNewAudit,
  listRecommendations,
  convertToTask,
  getReviewSeoIntelligence
} from './seo.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - seo_audit.view ✅, recommendations.view ✅
router.get('/audit', getLatestAudit);
router.get('/review-intelligence', getReviewSeoIntelligence);
router.get('/recommendations', listRecommendations);

// Level 2: Execute Audit & Convert recommendation to task
router.post('/audit/run', authorize(['client', 'owner', 'admin']), runNewAudit);
router.post('/recommendations/:id/convert-to-task', authorize(['client', 'owner', 'admin']), convertToTask);

export default router;
