import { query } from '../config/db.js';

export const tenantIsolation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User must be authenticated' });
    }

    let requestedWorkspace = req.headers['x-workspace-id'];
    if (!requestedWorkspace || requestedWorkspace === 'undefined' || requestedWorkspace === 'null') {
      requestedWorkspace = req.user.workspace_id;
    }

    // Verify workspace access (Tenant Isolation)
    if (requestedWorkspace !== req.user.workspace_id && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Tenant isolation violation: You do not have permission to access this workspace.'
      });
    }

    req.workspaceId = requestedWorkspace;

    // Resolve active business location safely for GET/POST
    let businessId = req.headers['x-business-id'] || req.query?.businessId || req.query?.business_id || req.body?.businessId || req.body?.business_id;
    if (businessId === 'undefined' || businessId === 'null') {
      businessId = null;
    }

    if (!businessId) {
      // Pick primary business location for this workspace
      const primaryRes = await query(
        `SELECT id FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1`,
        [req.workspaceId]
      );
      if (primaryRes.rows.length > 0) {
        businessId = primaryRes.rows[0].id;
      }
    } else {
      // Validate that this business actually belongs to this workspace!
      const verifyBiz = await query(
        `SELECT id FROM business_locations WHERE id = $1 AND workspace_id = $2`,
        [businessId, req.workspaceId]
      );
      if (verifyBiz.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Security alert: The requested business does not belong to your workspace.'
        });
      }
    }

    req.businessId = businessId;
    next();
  } catch (err) {
    console.error('[TENANT] Tenant isolation error:', err);
    return res.status(500).json({ success: false, error: 'Tenant context resolution failed' });
  }
};
