import { Router } from 'express';
import {
  getApprovalQueue,
  approveAction,
  rejectAction,
  chatAssistant,
  listGenerations,
  generateTrendCampaign
} from './ai.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

router.get('/approval-queue', getApprovalQueue);
router.post('/approvals/:id/approve', authorize(['client']), approveAction);
router.post('/approvals/:id/reject', authorize(['client']), rejectAction);
router.post('/chat', chatAssistant);
router.get('/generations', listGenerations);
router.post('/generate-campaign', generateTrendCampaign);

export default router;
