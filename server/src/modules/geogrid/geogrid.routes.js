import { Router } from 'express';
import {
  getLatestScan,
  runNewScan,
  getScanHistory,
  getPointDetails,
  getProvidersStatus
} from './geogrid.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Geo-Grid Scan Endpoints
router.get('/latest', getLatestScan);
router.get('/history', getScanHistory);
router.get('/point/:pointId', getPointDetails);
router.get('/providers', getProvidersStatus);

// Real-Time Scan Execution
router.post('/scan', authorize(['client', 'owner', 'admin']), runNewScan);

export default router;
