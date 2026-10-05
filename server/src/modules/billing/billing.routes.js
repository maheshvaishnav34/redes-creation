import { Router } from 'express';
import {
  getSubscription,
  upgradePlan,
  listInvoices,
  getInvoiceHtml,
  listPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getAdminBillingOverview,
  adminUpdateSubscription,
  adminCreateInvoice
} from './billing.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View subscription, usage, invoices, and payment methods
router.get('/', getSubscription);
router.get('/invoices', listInvoices);
router.get('/invoices/:id/download', getInvoiceHtml);
router.get('/payment-methods', listPaymentMethods);

// Level 2: Upgrade plan and manage payment methods (Owner, Admin, Client)
router.post('/upgrade', authorize(['owner', 'admin', 'client']), upgradePlan);
router.post('/payment-methods', authorize(['owner', 'admin', 'client']), addPaymentMethod);
router.delete('/payment-methods/:id', authorize(['owner', 'admin', 'client']), deletePaymentMethod);
router.patch('/payment-methods/:id/default', authorize(['owner', 'admin', 'client']), setDefaultPaymentMethod);

// Level 3: Super-Admin All Access
router.get('/admin/overview', authorize(['owner', 'admin']), getAdminBillingOverview);
router.put('/admin/subscriptions/:workspaceId', authorize(['owner', 'admin']), adminUpdateSubscription);
router.post('/admin/invoices', authorize(['owner', 'admin']), adminCreateInvoice);

export default router;
