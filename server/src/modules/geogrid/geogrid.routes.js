import { Router } from 'express';
import { getLatestScan, runNewScan } from './geogrid.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - geo_grid.view ✅
router.get('/latest', getLatestScan);

// Scan execution
router.post('/scan', authorize(['client', 'owner', 'admin']), runNewScan);

export default router;
