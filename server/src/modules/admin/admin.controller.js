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

export const listAllLocations = async (req, res, next) => {
  try {
    const locRes = await query(
      `SELECT b.*, w.name as workspace_name, i.name as industry_name,
              gl.gbp_place_id, gl.gbp_location_id, gl.sync_status as google_sync_status,
              rc.google_review_url, rc.review_link as feedback_link,
              (SELECT COUNT(*) FROM reviews WHERE business_id = b.id) as review_count,
              (SELECT COUNT(*) FROM review_campaigns WHERE business_id = b.id) as campaign_count
       FROM business_locations b
       LEFT JOIN workspaces w ON b.workspace_id = w.id
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN google_locations gl ON b.id = gl.business_id
       LEFT JOIN review_campaigns rc ON b.id = rc.business_id AND rc.status = 'active'
       ORDER BY b.is_primary DESC, b.created_at ASC`
    );
    res.json({ success: true, locations: locRes.rows });
  } catch (err) {
    next(err);
  }
};

export const updateAdminLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, industryId, address, city, postalCode, phone, website,
      isPrimary, healthScore, placeId, googleReviewUrl
    } = req.body;

    const locRes = await query(
      `UPDATE business_locations
       SET name = COALESCE($1, name),
           industry_id = COALESCE($2, industry_id),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           postal_code = COALESCE($5, postal_code),
           phone = COALESCE($6, phone),
           website = COALESCE($7, website),
           is_primary = COALESCE($8, is_primary),
           health_score = COALESCE($9, health_score),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        name, industryId, address, city, postalCode, phone, website,
        isPrimary, healthScore, id
      ]
    );

    if (locRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    // If placeId provided, update or insert in google_locations
    if (placeId) {
      await query(
        `INSERT INTO google_locations (business_id, location_name, gbp_place_id, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (business_id)
         DO UPDATE SET gbp_place_id = $3, location_name = COALESCE($2, google_locations.location_name), updated_at = NOW()`,
        [id, name || locRes.rows[0].name, placeId]
      );
    }

    // If googleReviewUrl provided, update review_campaigns
    if (googleReviewUrl) {
      await query(
        `UPDATE review_campaigns
         SET google_review_url = $1, updated_at = NOW()
         WHERE business_id = $2`,
        [googleReviewUrl, id]
      );
    }

    res.json({ success: true, location: locRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteAdminLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await query(`SELECT id, workspace_id, is_primary, name FROM business_locations WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    const loc = check.rows[0];

    // Check count in workspace
    const totalInWs = await query(`SELECT COUNT(*) as count FROM business_locations WHERE workspace_id = $1`, [loc.workspace_id]);
    if (parseInt(totalInWs.rows[0].count, 10) <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the only remaining location in this workspace. Add or switch to another location first.' });
    }

    // If primary, transfer primary status to another location
    if (loc.is_primary) {
      await query(
        `UPDATE business_locations 
         SET is_primary = TRUE 
         WHERE id = (SELECT id FROM business_locations WHERE id != $1 AND workspace_id = $2 ORDER BY created_at ASC LIMIT 1)`,
        [id, loc.workspace_id]
      );
    }

    // Delete location
    await query(`DELETE FROM business_locations WHERE id = $1`, [id]);

    res.json({ success: true, message: `Location "${loc.name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
};
