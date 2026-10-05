import { query } from '../config/db.js';

export const logAudit = async (workspaceId, userId, action, entityType, entityId, details, ipAddress = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (workspace_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [workspaceId, userId, action, entityType, entityId, JSON.stringify(details || {}), ipAddress]
    );
  } catch (err) {
    console.error('[AUDIT_LOG] Failed to record audit log:', err);
  }
};
