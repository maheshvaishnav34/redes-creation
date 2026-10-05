import { Router } from 'express';
import {
  listNotifications,
  markAsRead,
  dismissNotification
} from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, tenantIsolation);

router.get('/', listNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', dismissNotification);

export default router;
