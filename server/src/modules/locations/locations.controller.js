import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { resolveBusinessGoogleReviewUrl, validateGoogleReviewUrl } from '../../utils/googleUrlValidator.js';

export const listLocations = async (req, res, next) => {
  try {
    const locRes = await query(
      `SELECT b.*, i.name as industry_name, i.icon as industry_icon,
              gl.gbp_location_id, gl.gbp_place_id, gl.sync_status as google_sync_status, gl.last_synced_at as google_last_synced,
              COUNT(r.id) as total_reviews,
              COALESCE(AVG(r.rating), 0) as calculated_rating
       FROM business_locations b
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN google_locations gl ON b.id = gl.business_id
       LEFT JOIN reviews r ON b.id = r.business_id
       WHERE b.workspace_id = $1
       GROUP BY b.id, i.name, i.icon, gl.gbp_location_id, gl.gbp_place_id, gl.sync_status, gl.last_synced_at
       ORDER BY b.is_primary DESC, b.created_at ASC`,
      [req.workspaceId]
    );

    const locations = await Promise.all(
      locRes.rows.map(async (l) => {
        const resolved = await resolveBusinessGoogleReviewUrl(l.id);
        return {
          ...l,
          google_review_url: resolved.reviewUrl,
          gbp_place_id: resolved.googlePlaceId || l.gbp_place_id || null
        };
      })
    );

    res.json({
      success: true,
      total: locations.length,
      locations
    });
  } catch (err) {
    next(err);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const locRes = await query(
      `SELECT b.*, i.name as industry_name, i.icon as industry_icon, i.default_topics,
              gl.gbp_location_id, gl.sync_status as google_sync_status, gl.last_synced_at as google_last_synced
       FROM business_locations b
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN google_locations gl ON b.id = gl.business_id
       WHERE b.id = $1 AND b.workspace_id = $2`,
      [id, req.workspaceId]
    );

    if (locRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found in workspace' });
    }

    const profileRes = await query(`SELECT * FROM business_profiles WHERE business_id = $1`, [id]);
    const latestAudit = await query(`SELECT overall_score, gbp_score, local_signals_score, review_score FROM seo_audits WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]);

    res.json({
      success: true,
      location: locRes.rows[0],
      profile: profileRes.rows[0] || null,
      seoHealth: latestAudit.rows[0] || null
    });
  } catch (err) {
    next(err);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const {
      name, businessModel = 'single_location', industryId = 'restaurant', subcategoryId,
      address, city, state, country = 'India', postalCode, phone, website,
      latitude, longitude, serviceAreas = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Location name is required' });
    }

    const locRes = await query(
      `INSERT INTO business_locations (
         workspace_id, name, business_model, industry_id, subcategory_id,
         address, city, country, postal_code, phone, website,
         latitude, longitude, service_areas, is_primary
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)
       RETURNING *`,
      [
        req.workspaceId, name, businessModel, industryId, subcategoryId || null,
        address, city, country || 'India', postalCode, phone, website,
        latitude || 23.0225, longitude || 72.5714, JSON.stringify(serviceAreas)
      ]
    );

    const newLoc = locRes.rows[0];

    // Seed default business profile
    await query(
      `INSERT INTO business_profiles (
         business_id, identity, brand_voice, onboarding_completed, onboarding_score
       ) VALUES ($1, $2, 'Professional', TRUE, 100)`,
      [newLoc.id, name]
    );

    await logAudit(req.workspaceId, req.user.id, 'LOCATION_CREATED', 'business_locations', newLoc.id, { name });

    res.status(201).json({
      success: true,
      location: newLoc
    });
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, address, city, country, postalCode, phone, website,
      serviceAreas, isPrimary, healthScore
    } = req.body;

    const locRes = await query(
      `UPDATE business_locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           country = COALESCE($4, country),
           postal_code = COALESCE($5, postal_code),
           phone = COALESCE($6, phone),
           website = COALESCE($7, website),
           service_areas = COALESCE($8, service_areas),
           is_primary = COALESCE($9, is_primary),
           health_score = COALESCE($10, health_score),
           updated_at = NOW()
       WHERE id = $11 AND workspace_id = $12
       RETURNING *`,
      [
        name, address, city, country, postalCode, phone, website,
        serviceAreas ? JSON.stringify(serviceAreas) : null,
        isPrimary, healthScore,
        id, req.workspaceId
      ]
    );

    if (locRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    await logAudit(req.workspaceId, req.user.id, 'LOCATION_UPDATED', 'business_locations', id, { name });

    res.json({
      success: true,
      location: locRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const getLocationPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const perfRes = await query(
      `SELECT * FROM performance_daily
       WHERE business_id = $1
       ORDER BY date DESC LIMIT 30`,
      [id]
    );

    res.json({
      success: true,
      businessId: id,
      performance: perfRes.rows
    });
  } catch (err) {
    next(err);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check location
    const check = await query(`SELECT id, is_primary, name FROM business_locations WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    const totalInWs = await query(`SELECT COUNT(*) as count FROM business_locations WHERE workspace_id = $1`, [req.workspaceId]);
    if (parseInt(totalInWs.rows[0].count, 10) <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the only location in this workspace. Create another location first.' });
    }

    // If primary, transfer primary status to another location
    if (check.rows[0].is_primary) {
      await query(
        `UPDATE business_locations 
         SET is_primary = TRUE 
         WHERE id = (SELECT id FROM business_locations WHERE id != $1 AND workspace_id = $2 ORDER BY created_at ASC LIMIT 1)`,
        [id, req.workspaceId]
      );
    }

    await query(`DELETE FROM business_locations WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    await logAudit(req.workspaceId, req.user.id, 'LOCATION_DELETED', 'business_locations', id, { name: check.rows[0].name });

    res.json({ success: true, message: `Location "${check.rows[0].name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
};
