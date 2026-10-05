import { Router } from 'express';
import {
  listKeywords,
  addKeyword,
  togglePrimaryKeyword,
  getKeywordHistory,
  discoverSuggestions,
  approveSuggestion,
  deleteKeyword,
  updateKeyword
} from './keywords.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantIsolation } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantIsolation);

// Level 1: View - Client can view keywords and rankings (keywords.view ✅, rankings.view ✅)
router.get('/', listKeywords);
router.get('/:id/history', getKeywordHistory);
router.get('/suggestions/discover', discoverSuggestions);

// Level 2: Approve & Optional Edit - Client can approve suggestions and manage targets (keywords.approve ✅, keywords.edit ⚠️)
router.post('/approve-suggestion', authorize(['client', 'owner', 'admin']), approveSuggestion);
router.post('/', authorize(['client', 'owner', 'admin']), addKeyword);
router.put('/:id', authorize(['client', 'owner', 'admin']), updateKeyword);
router.delete('/:id', authorize(['client', 'owner', 'admin']), deleteKeyword);
router.put('/:id/primary', authorize(['client', 'owner', 'admin']), togglePrimaryKeyword);

export default router;
