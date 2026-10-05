import { Router } from 'express';
import {
  getSystemHealth,
  getAuditLogs,
  getPromptVersions,
  listAllWorkspaces,
  toggleWorkspaceStatus
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

export default router;
