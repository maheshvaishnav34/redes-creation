import { Router } from 'express';
import { query } from '../../config/db.js';

const router = Router();

/**
 * GET /api/v1/industries
 * List all supported industries with their subcategories & default taxonomies (Section 14 & 19)
 */
router.get('/', async (req, res, next) => {
  try {
    const indRes = await query(`SELECT * FROM industries ORDER BY name ASC`);
    const subRes = await query(`SELECT * FROM industry_subcategories ORDER BY name ASC`);

    const industriesWithSubs = indRes.rows.map(ind => ({
      ...ind,
      subcategories: subRes.rows.filter(s => s.industry_id === ind.id)
    }));

    res.json({
      success: true,
      total: industriesWithSubs.length,
      industries: industriesWithSubs
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/industries/:id
 * Get single industry profile with prompt packs, audit rules, and compliance
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const indRes = await query(`SELECT * FROM industries WHERE id = $1`, [id]);

    if (indRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Industry not found' });
    }

    const subRes = await query(`SELECT * FROM industry_subcategories WHERE industry_id = $1 ORDER BY name ASC`, [id]);
    const promptsRes = await query(`SELECT * FROM ai_prompt_versions WHERE industry_id = $1 AND is_active = TRUE`, [id]);

    res.json({
      success: true,
      industry: indRes.rows[0],
      subcategories: subRes.rows,
      activePromptPacks: promptsRes.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/industries/:id/templates
 * Get keyword templates and review topic presets for an industry
 */
router.get('/:id/templates', async (req, res, next) => {
  try {
    const { id } = req.params;
    const indRes = await query(`SELECT * FROM industries WHERE id = $1`, [id]);

    if (indRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Industry not found' });
    }

    const ind = indRes.rows[0];
    const subRes = await query(`SELECT * FROM industry_subcategories WHERE industry_id = $1`, [id]);

    const keywordTemplates = [];
    subRes.rows.forEach(sub => {
      if (Array.isArray(sub.keywords)) {
        sub.keywords.forEach(kw => {
          keywordTemplates.push({ subcategory: sub.name, keyword: kw });
        });
      }
    });

    res.json({
      success: true,
      industryId: id,
      industryName: ind.name,
      defaultTopics: ind.default_topics || [],
      complianceRules: ind.compliance_rules || [],
      keywordTemplates,
      seoRules: ind.seo_rules || {}
    });
  } catch (err) {
    next(err);
  }
});

export default router;
