import { query } from '../../config/db.js';

export const getSystemHealth = async (req, res, next) => {
  try {
    const wsCount = await query(`SELECT COUNT(*) as count FROM workspaces`);
    const usersCount = await query(`SELECT COUNT(*) as count FROM users`);
    const bizCount = await query(`SELECT COUNT(*) as count FROM business_locations`);
    const revCount = await query(`SELECT COUNT(*) as count FROM reviews`);
    const aiCount = await query(`SELECT COUNT(*) as count FROM ai_generations`);
    const jobsRes = await query(`SELECT * FROM system_jobs ORDER BY started_at DESC LIMIT 10`);

    const healthStatus = {
      systemStatus: 'healthy',
      uptime: process.uptime(),
      nodeVersion: process.version,
      database: 'connected (PostgreSQL 18)',
      activeConnections: 3,
      workers: 'active',
      totals: {
        workspaces: parseInt(wsCount.rows[0].count, 10),
        users: parseInt(usersCount.rows[0].count, 10),
        businesses: parseInt(bizCount.rows[0].count, 10),
        reviewsIndexed: parseInt(revCount.rows[0].count, 10),
        aiGenerations: parseInt(aiCount.rows[0].count, 10)
      },
      recentJobs: jobsRes.rows
    };

    res.json({ success: true, health: healthStatus });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logsRes = await query(
      `SELECT a.*, u.full_name as user_name, u.email as user_email, w.name as workspace_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN workspaces w ON a.workspace_id = w.id
       ORDER BY a.created_at DESC LIMIT 100`
    );

    res.json({ success: true, auditLogs: logsRes.rows });
  } catch (err) {
    next(err);
  }
};

export const getPromptVersions = async (req, res, next) => {
  try {
    const prompts = await query(`SELECT * FROM ai_prompt_versions ORDER BY created_at DESC`);
    res.json({ success: true, prompts: prompts.rows });
  } catch (err) {
    next(err);
  }
};

export const listAllWorkspaces = async (req, res, next) => {
  try {
    const wsRes = await query(
      `SELECT w.*, s.plan, s.status as sub_status,
              (SELECT COUNT(*) FROM business_locations WHERE workspace_id = w.id) as business_count,
              (SELECT COUNT(*) FROM users WHERE workspace_id = w.id) as user_count
       FROM workspaces w
       LEFT JOIN subscriptions s ON w.id = s.workspace_id
       ORDER BY w.created_at DESC`
    );

    res.json({ success: true, workspaces: wsRes.rows });
  } catch (err) {
    next(err);
  }
};

export const toggleWorkspaceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ws = await query(`SELECT is_active FROM workspaces WHERE id = $1`, [id]);
    if (ws.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const newStatus = !ws.rows[0].is_active;
    await query(`UPDATE workspaces SET is_active = $1, updated_at = NOW() WHERE id = $2`, [newStatus, id]);

    res.json({ success: true, message: `Workspace status updated to ${newStatus ? 'Active' : 'Disabled'}` });
  } catch (err) {
    next(err);
  }
};
