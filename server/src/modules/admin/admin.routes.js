import { Router } from 'express';
import {
  getSystemHealth,
  getAuditLogs,
  getPromptVersions,
  listAllWorkspaces,
  toggleWorkspaceStatus,
  listAllLocations,
  updateAdminLocation,
  deleteAdminLocation
} from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, authorize(['owner', 'admin']));

router.get('/health', getSystemHealth);
router.get('/audit-logs', getAuditLogs);
router.get('/prompts', getPromptVersions);
router.get('/workspaces', listAllWorkspaces);
router.put('/workspaces/:id/toggle-status', toggleWorkspaceStatus);

// Locations Administration (Edit & Delete)
router.get('/locations', listAllLocations);
router.put('/locations/:id', updateAdminLocation);
router.delete('/locations/:id', deleteAdminLocation);

export default router;
