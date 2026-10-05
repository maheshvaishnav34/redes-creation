import { Router } from 'express';
import {
  getCurrentWorkspace,
  updateWorkspace,
  getMembers,
  addMember,
  updateMemberRole,
  getClients,
  createClient
} from './workspaces.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - Client can view workspace info and member list
router.get('/current', getCurrentWorkspace);
router.get('/members', getMembers);
router.get('/clients', getClients);

// Level 3: Restricted - Client has users.manage ❌ & settings.manage ❌
router.put('/current', authorize(['owner', 'admin']), updateWorkspace);
router.post('/members', authorize(['owner', 'admin']), addMember);
router.put('/members/:id/role', authorize(['owner', 'admin']), updateMemberRole);
router.post('/clients', authorize(['owner', 'admin']), createClient);

export default router;
