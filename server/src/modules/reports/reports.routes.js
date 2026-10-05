import { Router } from 'express';
import { listReports, generateReport, getReportById } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View & Download - reports.view ✅, reports.download ✅
router.get('/', listReports);
router.get('/:id', getReportById);
router.post('/generate', authorize(['client', 'owner', 'admin']), generateReport);

export default router;
