import { Router } from 'express';
import {
  getAnalyticsOverview,
  getRealtimeVisitors,
  getUtmCampaigns,
  getCustomEvents,
  saveCustomEvent,
  exportReport,
  getOAuthUrl,
  handleOAuthCallback,
  disconnectGA4
} from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, tenantIsolation);

router.get('/overview', getAnalyticsOverview);
router.get('/realtime', getRealtimeVisitors);
router.get('/campaigns', getUtmCampaigns);
router.get('/events', getCustomEvents);
router.post('/events', saveCustomEvent);
router.get('/export', exportReport);
router.get('/auth/url', getOAuthUrl);
router.post('/auth/callback', handleOAuthCallback);
router.post('/disconnect', disconnectGA4);

export default router;
