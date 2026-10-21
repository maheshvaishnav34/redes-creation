import { Router } from 'express';
import {
  getIndustries,
  listBusinesses,
  getBusinessProfile,
  updateBusinessProfile,
  submitOnboarding,
  aiEnrichBusinessLocation
} from './business.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

// Public industries taxonomy endpoint (business.view)
router.get('/industries', getIndustries);

// Authenticated & Tenant-aware endpoints
router.use(authenticate, tenantIsolation);

// Level 1: View - Accessible to Client (business.view, locations.view)
router.get('/list', listBusinesses);
router.get('/:id', getBusinessProfile);
router.get('/current/profile', getBusinessProfile);

// Level 2: Onboarding & AI Location Enrichment
router.post('/ai-enrich', authorize(['owner', 'admin', 'client', 'manager', 'staff']), aiEnrichBusinessLocation);
router.post('/onboarding', authorize(['owner', 'admin', 'client', 'manager', 'staff']), submitOnboarding);
router.put('/:id/profile', authorize(['owner', 'admin', 'client']), updateBusinessProfile);

export default router;

