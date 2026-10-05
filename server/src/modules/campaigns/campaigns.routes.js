import { Router } from 'express';
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignFeedbacks,
  getPublicCampaignDetails,
  submitCustomerFeedback
} from './campaigns.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

// Public feedback endpoints (accessible by customers scanning QR or opening links without auth)
router.get('/public/:slug', getPublicCampaignDetails);
router.post('/public/feedback', submitCustomerFeedback);

// Authenticated SaaS endpoints
router.use(authenticate, tenantIsolation);

// Level 1: View campaigns & real-time customer feedback submissions
router.get('/', listCampaigns);
router.get('/:id', getCampaignById);
router.get('/:id/feedbacks', getCampaignFeedbacks);

// Level 2: Create, Update, and Change Status
router.post('/', authorize(['client', 'owner', 'admin']), createCampaign);
router.put('/:id', authorize(['client', 'owner', 'admin']), updateCampaign);
router.patch('/:id/status', authorize(['client', 'owner', 'admin']), updateCampaignStatus);

// Level 3: Delete restricted to agency owner/admin
router.delete('/:id', authorize(['owner', 'admin']), deleteCampaign);

export default router;
