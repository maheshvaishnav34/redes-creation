import { Router } from 'express';
import { getDashboardOverview } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, tenantIsolation);

router.get('/overview', getDashboardOverview);

export default router;
