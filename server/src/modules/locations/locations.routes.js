import { Router } from 'express';
import {
  listLocations,
  getLocationById,
  createLocation,
  updateLocation,
  getLocationPerformance,
  deleteLocation
} from './locations.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - Accessible to Client & Team (locations.view)
router.get('/', listLocations);
router.get('/:id', getLocationById);
router.get('/:id/performance', getLocationPerformance);

// Level 2 & 3: Management - Accessible to owner, admin, manager
router.post('/', authorize(['owner', 'admin', 'manager']), createLocation);
router.put('/:id', authorize(['owner', 'admin', 'manager']), updateLocation);
router.delete('/:id', authorize(['owner', 'admin']), deleteLocation);

export default router;
