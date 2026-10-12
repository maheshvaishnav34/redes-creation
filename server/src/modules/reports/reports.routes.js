import { Router } from 'express';
import {
  listReports,
  generateReport,
  getReportById,
  listReportSchedules,
  createReportSchedule,
  deleteReportSchedule
} from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View & Download - reports.view, reports.download
router.get('/', listReports);
router.get('/schedules', listReportSchedules);
router.get('/:id', getReportById);

// Level 2 & 3: Management
router.post('/generate', authorize(['client', 'owner', 'admin']), generateReport);
router.post('/schedules', authorize(['client', 'owner', 'admin']), createReportSchedule);
router.delete('/schedules/:id', authorize(['client', 'owner', 'admin']), deleteReportSchedule);

export default router;

