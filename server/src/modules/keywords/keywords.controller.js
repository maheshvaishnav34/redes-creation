import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';
import {
  discoverRealTimeKeywords,
  fetchLiveGoogleSuggestions,
  generateTopLevelKeywords,
  evolveWeeklyKeywordsForBusiness,
  getWeeklyEvolutionStatus,
  getUnifiedFlywheelSummary
} from './keywords.service.js';

export const listKeywords = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.businessId;
    const { groupId, status = 'approved', intent } = req.query;

    let sql = `
      SELECT k.*, kg.name as group_name, kg.color as group_color
      FROM keywords k
      LEFT JOIN keyword_groups kg ON k.group_id = kg.id
      WHERE k.business_id = $1
    `;
    const params = [businessId];
    let idx = 2;

    if (groupId) {
      sql += ` AND k.group_id = $${idx}`;
      params.push(groupId);
      idx++;
    }

    if (status && status !== 'all') {
      sql += ` AND k.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (intent) {
      sql += ` AND k.intent = $${idx}`;
      params.push(intent);
      idx++;
    }

    sql += ` ORDER BY k.is_primary DESC, k.current_rank ASC NULLS LAST, k.relevance DESC`;

    const kwRes = await query(sql, params);
    const groupsRes = await query(`SELECT * FROM keyword_groups WHERE business_id = $1 ORDER BY name ASC`, [businessId]);

    // Rank summary
    const summaryRes = await query(
      `SELECT 
         COUNT(*) as total_tracked,
         COUNT(CASE WHEN current_rank <= 3 THEN 1 END) as top_3_count,
         COUNT(CASE WHEN current_rank <= 10 THEN 1 END) as top_10_count,
         AVG(current_rank) as avg_rank,
         COUNT(CASE WHEN current_rank < previous_rank THEN 1 END) as improved_count,
         COUNT(CASE WHEN current_rank > previous_rank THEN 1 END) as dropped_count
       FROM keywords
       WHERE business_id = $1 AND status = 'approved'`,
      [businessId]
    );

    const enrichedKeywords = kwRes.rows.map(k => {
      let tier = 'Tier 3';
      let tier_label = 'Long-Tail / Intent';
      if (k.is_primary || k.intent === 'local' || k.intent === 'near_me') {
        tier = 'Tier 1';
        tier_label = 'Top-Level Core';
      } else if (k.intent === 'service' || k.intent === 'commercial') {
        tier = 'Tier 2';
        tier_label = 'Core Service';
      }
      return {
        ...k,
        tier,
        tier_label
      };
    });

    res.json({
      success: true,
      keywords: enrichedKeywords,
      groups: groupsRes.rows,
      summary: summaryRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const addKeyword = async (req, res, next) => {
  try {
    const { keyword, groupId, intent = 'local', isPrimary = false, searchVolume = 1000 } = req.body;
    const businessId = req.body.businessId || req.businessId;

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword string is required' });
    }

    // Determine initial rank & difficulty simulation
    const estimatedRank = Math.floor(1 + Math.random() * 8);
    const difficulty = Math.floor(25 + Math.random() * 45);

    const newKw = await query(
      `INSERT INTO keywords (
         business_id, group_id, keyword, intent, relevance, difficulty,
         search_volume, current_rank, previous_rank, best_rank, is_primary,
         status, opportunity_score, opportunity_reason, last_tracked_at
       ) VALUES ($1, $2, $3, $4, 92, $5, $6, $7, $8, $7, $9, 'approved', 85, 'Direct user addition for local targeting', NOW())
       RETURNING *`,
      [businessId, groupId || null, keyword.trim().toLowerCase(), intent, difficulty, searchVolume, estimatedRank, estimatedRank + 1, isPrimary]
    );

    // Initial snapshot
    await query(
      `INSERT INTO keyword_rank_snapshots (keyword_id, rank, visibility_score) VALUES ($1, $2, $3)`,
      [newKw.rows[0].id, estimatedRank, Math.max(10, 100 - estimatedRank * 8)]
    );

    // Update current keywords counter in subscriptions
    await query(`UPDATE subscriptions SET current_keywords = current_keywords + 1 WHERE workspace_id = $1`, [req.workspaceId]);

    await logAudit(req.workspaceId, req.user.id, 'KEYWORD_ADDED', 'keywords', newKw.rows[0].id, { keyword });

    res.status(201).json({ success: true, keyword: newKw.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const togglePrimaryKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kwRes = await query(`SELECT is_primary FROM keywords WHERE id = $1`, [id]);
    if (kwRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Keyword not found' });
    }

    const newPrimary = !kwRes.rows[0].is_primary;
    const updated = await query(`UPDATE keywords SET is_primary = $1 WHERE id = $2 RETURNING *`, [newPrimary, id]);

    res.json({ success: true, keyword: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getKeywordHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const historyRes = await query(
      `SELECT rank, visibility_score, recorded_at
       FROM keyword_rank_snapshots
       WHERE keyword_id = $1
       ORDER BY recorded_at ASC`,
      [id]
    );

    res.json({ success: true, history: historyRes.rows });
  } catch (err) {
    next(err);
  }
};

export const discoverSuggestions = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.businessId;

    // Load business intelligence profile, industry & existing keywords
    const bizRes = await query(
      `SELECT b.name, b.city, b.industry_id, b.subcategory_id, bp.services, bp.target_keywords,
              i.name as industry_name, sc.name as subcategory_name
       FROM business_locations b
       LEFT JOIN business_profiles bp ON b.id = bp.business_id
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN industry_subcategories sc ON b.subcategory_id = sc.id
       WHERE b.id = $1`,
      [businessId]
    );

    const biz = bizRes.rows[0] || {};
    const city = biz.city || 'Ahmedabad';
    const industryName = biz.industry_name || 'Business';
    const subcategoryName = biz.subcategory_name || '';
    const brandName = biz.name || 'Brand';
    
    // Normalize services
    let services = [];
    if (Array.isArray(biz.services)) {
      services = biz.services;
    } else if (typeof biz.services === 'string' && biz.services.trim()) {
      try { services = JSON.parse(biz.services); } catch { services = biz.services.split(',').map(s => s.trim()); }
    }
    if (services.length === 0) {
      services = ['Primary Service', 'Consultation', 'Quality Solutions'];
    }

    // Existing tracked keywords
    const existingRes = await query(`SELECT keyword FROM keywords WHERE business_id = $1`, [businessId]);
    const existingKeywords = new Set(existingRes.rows.map(r => r.keyword.toLowerCase()));

    // Execute real-time discovery (Google Suggest + Google Trends + 10 Group Taxonomy)
    const discoveryResult = await discoverRealTimeKeywords({
      businessName: brandName,
      industryName,
      subcategoryName,
      city,
      services,
      existingKeywords
    });

    res.json({
      success: true,
      suggestions: discoveryResult.suggestions,
      trendDemandScore: discoveryResult.trendDemandScore,
      liveQueriesCount: discoveryResult.liveQueriesCount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Live Google Suggestion instant endpoint (for typing in search bars)
 */
export const getLiveSuggestions = async (req, res, next) => {
  try {
    const { q, geo = 'in' } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, suggestions: [] });
    }
    const suggestions = await fetchLiveGoogleSuggestions(q, geo);
    res.json({ success: true, query: q, suggestions });
  } catch (err) {
    next(err);
  }
};

// Approve and add suggestion to tracked targets in 1 click
export const approveSuggestion = async (req, res, next) => {
  try {
    const { keyword, intent = 'local', searchVolume = 1500, difficulty = 35, isPrimary = false, groupId } = req.body;
    const businessId = req.body.businessId || req.businessId;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ success: false, error: 'Keyword is required' });
    }

    const estimatedRank = Math.floor(1 + Math.random() * 8);
    const kwTrimmed = keyword.trim().toLowerCase();

    // Check if exists
    const check = await query(`SELECT id FROM keywords WHERE business_id = $1 AND LOWER(keyword) = $2`, [businessId, kwTrimmed]);
    if (check.rows.length > 0) {
      await query(`UPDATE keywords SET status = 'approved', last_tracked_at = NOW() WHERE id = $1`, [check.rows[0].id]);
      return res.json({ success: true, message: 'Keyword marked as approved and active' });
    }

    const newKw = await query(
      `INSERT INTO keywords (
         business_id, group_id, keyword, intent, relevance, difficulty,
         search_volume, current_rank, previous_rank, best_rank, is_primary,
         status, opportunity_score, opportunity_reason, last_tracked_at
       ) VALUES ($1, $2, $3, $4, 94, $5, $6, $7, $8, $7, $9, 'approved', 88, 'Approved from AI Keyword Intelligence Discovery', NOW())
       RETURNING *`,
      [businessId, groupId || null, kwTrimmed, intent, difficulty, searchVolume, estimatedRank, estimatedRank + 2, isPrimary]
    );

    // Initial snapshot
    await query(
      `INSERT INTO keyword_rank_snapshots (keyword_id, rank, visibility_score) VALUES ($1, $2, $3)`,
      [newKw.rows[0].id, estimatedRank, Math.max(10, 100 - estimatedRank * 8)]
    );

    await query(`UPDATE subscriptions SET current_keywords = current_keywords + 1 WHERE workspace_id = $1`, [req.workspaceId]);
    await logAudit(req.workspaceId, req.user?.id || null, 'KEYWORD_SUGGESTION_APPROVED', 'keywords', newKw.rows[0].id, { keyword: kwTrimmed });

    res.status(201).json({ success: true, keyword: newKw.rows[0], message: 'Keyword successfully approved and tracked!' });
  } catch (err) {
    next(err);
  }
};

// Delete / Archive a keyword
export const deleteKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM keyword_rank_snapshots WHERE keyword_id = $1`, [id]);
    await query(`DELETE FROM keywords WHERE id = $1`, [id]);

    await logAudit(req.workspaceId, req.user?.id || null, 'KEYWORD_DELETED', 'keywords', id, {});
    res.json({ success: true, message: 'Keyword removed from tracking' });
  } catch (err) {
    next(err);
  }
};

// Update keyword properties (intent, primary, group)
export const updateKeyword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { intent, isPrimary, groupId, status } = req.body;

    const updated = await query(
      `UPDATE keywords
       SET intent = COALESCE($1, intent),
           is_primary = COALESCE($2, is_primary),
           group_id = COALESCE($3, group_id),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [intent, isPrimary, groupId, status, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Keyword not found' });
    }

    res.json({ success: true, keyword: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Automatically Generate and Seed Top-Level Keywords (Tier 1 & Tier 2) for Business
 */
export const autoSeedTopKeywords = async (req, res, next) => {
  try {
    const businessId = req.body.businessId || req.businessId;

    // Load business intelligence profile, industry & existing keywords
    const bizRes = await query(
      `SELECT b.name, b.city, b.industry_id, b.subcategory_id, bp.services,
              i.name as industry_name, sc.name as subcategory_name
       FROM business_locations b
       LEFT JOIN business_profiles bp ON b.id = bp.business_id
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN industry_subcategories sc ON b.subcategory_id = sc.id
       WHERE b.id = $1`,
      [businessId]
    );

    const biz = bizRes.rows[0] || {};
    const city = biz.city || 'Ahmedabad';
    const industryName = biz.industry_name || 'Business';
    const subcategoryName = biz.subcategory_name || '';
    const brandName = biz.name || 'Brand';

    // Normalize services
    let services = [];
    if (Array.isArray(biz.services)) {
      services = biz.services;
    } else if (typeof biz.services === 'string' && biz.services.trim()) {
      try { services = JSON.parse(biz.services); } catch { services = biz.services.split(',').map(s => s.trim()); }
    }

    const topKeywords = await generateTopLevelKeywords({
      businessName: brandName,
      industryName,
      subcategoryName,
      city,
      services
    });

    // Check existing keywords to avoid duplicates
    const existingRes = await query(`SELECT id, keyword, is_primary FROM keywords WHERE business_id = $1`, [businessId]);
    const existingSet = new Set(existingRes.rows.map(r => r.keyword.toLowerCase()));
    const hasPrimary = existingRes.rows.some(r => r.is_primary);

    // Get or create default group "Primary Core"
    let groupRes = await query(`SELECT id FROM keyword_groups WHERE business_id = $1 AND name = 'Primary Core' LIMIT 1`, [businessId]);
    let defaultGroupId = groupRes.rows[0]?.id;
    if (!defaultGroupId) {
      const createdGroup = await query(
        `INSERT INTO keyword_groups (business_id, name, color) VALUES ($1, 'Primary Core', '#034bc0') RETURNING id`,
        [businessId]
      );
      defaultGroupId = createdGroup.rows[0]?.id;
    }

    const insertedKeywords = [];

    for (let i = 0; i < topKeywords.length; i++) {
      const candidate = topKeywords[i];
      if (existingSet.has(candidate.keyword.toLowerCase())) continue;

      const shouldBePrimary = !hasPrimary && (candidate.isPrimary || i === 0);
      const estimatedRank = Math.floor(1 + (i % 6));

      const newKw = await query(
        `INSERT INTO keywords (
           business_id, group_id, keyword, intent, relevance, difficulty,
           search_volume, current_rank, previous_rank, best_rank, is_primary,
           status, opportunity_score, opportunity_reason, last_tracked_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $8, $10, 'approved', $11, $12, NOW())
         RETURNING *`,
        [
          businessId,
          defaultGroupId,
          candidate.keyword.toLowerCase().trim(),
          candidate.intent,
          candidate.relevance,
          candidate.difficulty,
          candidate.searchVolume,
          estimatedRank,
          estimatedRank + 1,
          shouldBePrimary,
          Math.min(99, Math.round(candidate.relevance * 0.6 + (100 - candidate.difficulty) * 0.4)),
          candidate.reason
        ]
      );

      const kwObj = newKw.rows[0];
      // Insert initial rank snapshot
      await query(
        `INSERT INTO keyword_rank_snapshots (keyword_id, rank, visibility_score) VALUES ($1, $2, $3)`,
        [kwObj.id, estimatedRank, Math.max(10, 100 - estimatedRank * 8)]
      );

      insertedKeywords.push({
        ...kwObj,
        tier: candidate.tier,
        tier_label: candidate.tier_label
      });
    }

    await logAudit(req.workspaceId, req.user?.id || null, 'KEYWORDS_AUTO_SEEDED', 'keywords', null, {
      count: insertedKeywords.length,
      businessName: brandName,
      city
    });

    res.status(201).json({
      success: true,
      message: `Successfully auto-generated and seeded ${insertedKeywords.length} top-level keywords!`,
      keywords: insertedKeywords,
      totalSeeded: insertedKeywords.length
    });
  } catch (err) {
    next(err);
  }
};

export const getWeeklyEvolution = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID required' });
    }

    const status = await getWeeklyEvolutionStatus(businessId);
    res.json({
      success: true,
      evolution: status
    });
  } catch (err) {
    next(err);
  }
};

export const triggerWeeklyEvolution = async (req, res, next) => {
  try {
    const businessId = req.body.businessId || req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID required' });
    }

    const force = req.body.force !== false;
    const result = await evolveWeeklyKeywordsForBusiness({
      businessId,
      force,
      workspaceId: req.workspaceId
    });

    await logAudit(req.workspaceId, req.user?.id || null, 'KEYWORDS_WEEKLY_EVOLVED', 'keywords', null, {
      businessId,
      newSuggestionsCount: result.newSuggestions?.length || 0,
      retiredCount: result.retiredCount || 0
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getFlywheelSummary = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID required' });
    }

    const data = await getUnifiedFlywheelSummary(businessId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};


