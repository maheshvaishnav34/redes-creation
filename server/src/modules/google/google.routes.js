import { Router } from 'express';
import {
  getConnectionStatus,
  connectOAuth,
  syncNow,
  disconnectGoogle,
  getPerformanceMetrics
} from './google.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View & Sync (locations.view, google telemetry view)
router.get('/status', getConnectionStatus);
router.get('/performance', getPerformanceMetrics);
router.post('/sync', authorize(['client', 'owner', 'admin']), syncNow);

// Level 3: Restricted - Client has google.connect/disconnect ❌ (Managed by Agency)
router.post('/connect', authorize(['owner', 'admin']), connectOAuth);
router.post('/disconnect', authorize(['owner', 'admin']), disconnectGoogle);

export default router;
