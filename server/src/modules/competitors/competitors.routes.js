import { Router } from 'express';
import {
  listCompetitors,
  addCompetitor,
  deleteCompetitor,
  discoverCompetitors,
  getComparisonMatrix
} from './competitors.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - competitors.view ✅
router.get('/', listCompetitors);
router.get('/discover', discoverCompetitors);
router.get('/comparison', getComparisonMatrix);
router.get('/matrix', getComparisonMatrix);

// Competitor tracking
router.post('/', authorize(['client', 'owner', 'admin']), addCompetitor);
router.delete('/:id', authorize(['client', 'owner', 'admin']), deleteCompetitor);

export default router;
