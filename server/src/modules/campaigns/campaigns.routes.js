import { Router } from 'express';
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  duplicateCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignFeedbacks,
  getPublicCampaignDetails,
  submitCustomerFeedback,
  listQrCodes,
  saveQrCode,
  deleteQrCode,
  listCustomers,
  createCustomer,
  importCustomers,
  deleteCustomer,
  getCampaignAnalyticsOverview,
  generateAiCampaignMessage,
  trackCampaignEvent,
  autoPostReviewToGoogle,
  getPublicBusinessReviewUrl
} from './campaigns.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

// Public feedback & event endpoints (accessible without login)
router.get('/public/review-url', getPublicBusinessReviewUrl);
router.get('/public/review-url/:businessId', getPublicBusinessReviewUrl);
router.get('/public/:slug', getPublicCampaignDetails);
router.post('/public/feedback', submitCustomerFeedback);
router.post('/public/auto-post-review', autoPostReviewToGoogle);
router.post('/public/event', trackCampaignEvent);

// Authenticated SaaS endpoints
router.use(authenticate, tenantIsolation);

// Analytics Overview
router.get('/analytics/overview', getCampaignAnalyticsOverview);

// QR Codes Management
router.get('/qr-codes', listQrCodes);
router.post('/qr-codes', authorize(['client', 'owner', 'admin']), saveQrCode);
router.delete('/qr-codes/:id', authorize(['client', 'owner', 'admin']), deleteQrCode);

// Customer Management
router.get('/customers', listCustomers);
router.post('/customers', authorize(['client', 'owner', 'admin']), createCustomer);
router.post('/customers/import', authorize(['client', 'owner', 'admin']), importCustomers);
router.delete('/customers/:id', authorize(['owner', 'admin']), deleteCustomer);

// AI Message Assistant
router.post('/ai-message', generateAiCampaignMessage);

// Campaigns CRUD
router.get('/', listCampaigns);
router.get('/:id', getCampaignById);
router.get('/:id/feedbacks', getCampaignFeedbacks);
router.post('/', authorize(['client', 'owner', 'admin']), createCampaign);
router.post('/:id/duplicate', authorize(['client', 'owner', 'admin']), duplicateCampaign);
router.put('/:id', authorize(['client', 'owner', 'admin']), updateCampaign);
router.patch('/:id/status', authorize(['client', 'owner', 'admin']), updateCampaignStatus);
router.delete('/:id', authorize(['owner', 'admin']), deleteCampaign);

export default router;
