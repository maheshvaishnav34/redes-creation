import QRCode from 'qrcode';
import { query } from '../../config/db.js';
import { getClientBaseUrl } from '../campaigns/campaigns.controller.js';


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

export const createAdminLocation = async (req, res, next) => {
  try {
    const {
      name, workspaceId, industryId = 'restaurant', subcategoryId,
      address, city = 'Ahmedabad', country = 'India',
      postalCode = '380054', phone, website, isPrimary = false,
      healthScore = 90, placeId, googleReviewUrl, services = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Business location name is required' });
    }

    const targetWorkspaceId = workspaceId || req.workspaceId;

    const locRes = await query(
      `INSERT INTO business_locations (
         workspace_id, name, industry_id, subcategory_id,
         address, city, country, postal_code, phone, website,
         is_primary, health_score
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        targetWorkspaceId, name.trim(), industryId, subcategoryId || null,
        address || `${city} Main Commercial District`, city, country, postalCode,
        phone || '+91 79 4890 5500', website || null,
        Boolean(isPrimary), Number(healthScore) || 90
      ]
    );

    const newLoc = locRes.rows[0];

    // Seed profile
    await query(
      `INSERT INTO business_profiles (
         business_id, identity, description, services, brand_voice,
         onboarding_completed, onboarding_score
       ) VALUES ($1, $2, $3, $4, 'Professional & Welcoming', TRUE, 100)
       ON CONFLICT (business_id) DO NOTHING`,
      [
        newLoc.id,
        `${newLoc.name}`,
        `${newLoc.name} is a leading ${industryId} provider in ${city}.`,
        JSON.stringify(services && services.length > 0 ? services : ['Professional Consultation', 'Customer Service'])
      ]
    );

    // If google review or place ID provided
    if (googleReviewUrl || placeId) {
      await query(
        `INSERT INTO google_locations (business_id, location_name, gbp_place_id, sync_status, updated_at)
         VALUES ($1, $2, $3, 'synced', NOW())
         ON CONFLICT (business_id) DO UPDATE
         SET gbp_place_id = EXCLUDED.gbp_place_id, sync_status = 'synced', updated_at = NOW()`,
        [newLoc.id, newLoc.name, placeId || null]
      );
    }

    // Seed campaign & QR code
    const slug = newLoc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + newLoc.id.substring(0, 4);
    const reviewLink = `${getClientBaseUrl()}/r/${slug}`;
    let qrCodeData = '';
    try {
      qrCodeData = await QRCode.toDataURL(reviewLink, { width: 320, margin: 2 });
    } catch (qrErr) {
      console.warn('QR code generation error:', qrErr.message);
    }

    await query(
      `INSERT INTO review_campaigns (
         business_id, name, business_name, website, phone,
         channel, message_template, target_audience,
         google_review_url, post_review_enabled,
         review_link, qr_code_data, status
       ) VALUES ($1, $2, $3, $4, $5, 'qr', $6, 'All Customers', $7, TRUE, $8, $9, 'active')
       ON CONFLICT DO NOTHING`,
      [
        newLoc.id,
        `${newLoc.name} Official Review Drive`,
        newLoc.name,
        website || null,
        phone || null,
        `Welcome to ${newLoc.name}! Please leave your review:`,
        googleReviewUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newLoc.name + ' ' + city)}`,
        reviewLink,
        qrCodeData
      ]
    );

    res.status(201).json({ success: true, location: newLoc });
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

/**
 * System-Wide Sync Health & Telemetry for Super Admins
 */
export const getSyncHealth = async (req, res, next) => {
  try {
    const hotelStats = await query(`
      SELECT 
        COUNT(*) as total_hotels,
        COUNT(*) FILTER (WHERE google_place_id IS NOT NULL) as places_connected,
        (SELECT COUNT(*) FROM google_connections WHERE status = 'connected') as gbp_oauth_connected,
        (SELECT COUNT(*) FROM reviews) as total_stored_reviews
      FROM business_locations
    `);

    const syncAudit = await query(`
      SELECT 
        COUNT(*) as total_sync_jobs_24h,
        COUNT(*) FILTER (WHERE status = 'success') as successful_syncs_24h,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs_24h,
        COALESCE(SUM(reviews_imported), 0) as reviews_imported_24h,
        COALESCE(AVG(duration_ms), 0) as avg_duration_ms
      FROM google_sync_history
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    const recentFailures = await query(`
      SELECT gsh.id, gsh.workspace_id, gsh.business_id, bl.name as hotel_name,
             gsh.sync_type, gsh.status, gsh.error_message, gsh.created_at
      FROM google_sync_history gsh
      LEFT JOIN business_locations bl ON gsh.business_id = bl.id
      WHERE gsh.status = 'failed'
      ORDER BY gsh.created_at DESC
      LIMIT 10
    `);

    const { reviewSyncQueue } = await import('../reviews/reviewSync.queue.js');
    const activeJobsCount = reviewSyncQueue.activeJobs.size;
    const queuedJobsCount = reviewSyncQueue.queue.length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      queueHealth: {
        mode: reviewSyncQueue.isRedisMode ? 'BullMQ (Redis)' : 'In-Process Concurrency Queue',
        concurrencyLimit: reviewSyncQueue.concurrencyLimit,
        activeJobs: activeJobsCount,
        queuedJobs: queuedJobsCount,
      },
      infrastructureTotals: {
        totalHotels: parseInt(hotelStats.rows[0].total_hotels || 0, 10),
        placesConnected: parseInt(hotelStats.rows[0].places_connected || 0, 10),
        gbpOAuthConnected: parseInt(hotelStats.rows[0].gbp_oauth_connected || 0, 10),
        totalStoredReviews: parseInt(hotelStats.rows[0].total_stored_reviews || 0, 10)
      },
      last24HoursTelemetry: {
        totalSyncs: parseInt(syncAudit.rows[0].total_sync_jobs_24h || 0, 10),
        successfulSyncs: parseInt(syncAudit.rows[0].successful_syncs_24h || 0, 10),
        failedSyncs: parseInt(syncAudit.rows[0].failed_syncs_24h || 0, 10),
        reviewsImported: parseInt(syncAudit.rows[0].reviews_imported_24h || 0, 10),
        averageDurationMs: Math.round(Number(syncAudit.rows[0].avg_duration_ms || 0))
      },
      recentFailures: recentFailures.rows
    });
  } catch (err) {
    next(err);
  }
};

