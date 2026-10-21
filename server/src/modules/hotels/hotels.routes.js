import { Router } from 'express';
import {
  listClientHotels,
  createClientHotel,
  getHotelById,
  deleteHotel,
  connectGoogleOAuthForHotel,
  addPlaceForHotel,
  getHotelReviews,
  getHotelReviewSummary,
  getHotelSyncStatus,
  syncHotelReviews,
  disconnectHotelConnection
} from './hotels.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

// Multi-tenant protection on all hotel routes
router.use(authenticate, tenantIsolation);

// Hotel Management Routes
router.get('/', listClientHotels);
router.post('/', authorize(['owner', 'admin', 'client']), createClientHotel);
router.get('/:id', getHotelById);
router.delete('/:id', authorize(['owner', 'admin', 'client']), deleteHotel);

// Dual Connection Routes
router.post('/:id/connect-google', authorize(['owner', 'admin', 'client']), connectGoogleOAuthForHotel);
router.post('/:id/add-place', authorize(['owner', 'admin', 'client']), addPlaceForHotel);

// Reviews, Summary & Sync Routes
router.get('/:id/reviews', getHotelReviews);
router.get('/:id/review-summary', getHotelReviewSummary);
router.get('/:id/sync-status', getHotelSyncStatus);
router.post('/:id/sync', authorize(['owner', 'admin', 'client']), syncHotelReviews);
router.delete('/:id/connection', authorize(['owner', 'admin', 'client']), disconnectHotelConnection);

export default router;

