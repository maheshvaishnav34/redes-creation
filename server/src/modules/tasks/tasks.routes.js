import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTaskStatus,
  deleteTask
} from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - tasks.view ✅
router.get('/', listTasks);

// Level 2: Update - tasks.update ⚠️ (Client can create and update task status on Kanban board)
router.post('/', authorize(['client', 'owner', 'admin']), createTask);
router.put('/:id', authorize(['client', 'owner', 'admin']), updateTaskStatus);

// Level 3: Task deletion restricted to agency owner/admin
router.delete('/:id', authorize(['owner', 'admin']), deleteTask);

export default router;
