import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getIndustries = async (req, res, next) => {
  try {
    const indRes = await query(`SELECT * FROM industries ORDER BY name ASC`);
    const subRes = await query(`SELECT * FROM industry_subcategories ORDER BY name ASC`);

    const industriesWithSubs = indRes.rows.map(ind => ({
      ...ind,
      subcategories: subRes.rows.filter(s => s.industry_id === ind.id)
    }));

    res.json({ success: true, industries: industriesWithSubs });
  } catch (err) {
    next(err);
  }
};

export const listBusinesses = async (req, res, next) => {
  try {
    const bizRes = await query(
      `SELECT b.*, i.name as industry_name, i.icon as industry_icon,
              bp.onboarding_completed, bp.onboarding_score, bp.brand_voice
       FROM business_locations b
       LEFT JOIN industries i ON b.industry_id = i.id
       LEFT JOIN business_profiles bp ON b.id = bp.business_id
       WHERE b.workspace_id = $1
       ORDER BY b.is_primary DESC, b.created_at ASC`,
      [req.workspaceId]
    );

    res.json({ success: true, businesses: bizRes.rows });
  } catch (err) {
    next(err);
  }
};

export const getBusinessProfile = async (req, res, next) => {
  try {
    const businessId = req.params.id || req.businessId;

    const bizRes = await query(
      `SELECT b.*, i.name as industry_name, i.icon as industry_icon, i.default_topics, i.compliance_rules as industry_compliance
       FROM business_locations b
       LEFT JOIN industries i ON b.industry_id = i.id
       WHERE b.id = $1 AND b.workspace_id = $2`,
      [businessId, req.workspaceId]
    );

    if (bizRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Business location not found' });
    }

    const profileRes = await query(
      `SELECT * FROM business_profiles WHERE business_id = $1`,
      [businessId]
    );

    res.json({
      success: true,
      business: bizRes.rows[0],
      profile: profileRes.rows[0] || null
    });
  } catch (err) {
    next(err);
  }
};

export const updateBusinessProfile = async (req, res, next) => {
  try {
    const businessId = req.params.id || req.businessId;
    const {
      identity, description, services, products, customer_personas,
      brand_voice, languages, approved_claims, restricted_claims,
      target_keywords, excluded_keywords, reply_rules, escalation_rules,
      compliance_rules, knowledge_base
    } = req.body;

    // Check if profile exists
    const existing = await query(`SELECT id FROM business_profiles WHERE business_id = $1`, [businessId]);

    let profileResult;
    if (existing.rows.length > 0) {
      profileResult = await query(
        `UPDATE business_profiles
         SET identity = COALESCE($1, identity),
             description = COALESCE($2, description),
             services = COALESCE($3, services),
             products = COALESCE($4, products),
             customer_personas = COALESCE($5, customer_personas),
             brand_voice = COALESCE($6, brand_voice),
             languages = COALESCE($7, languages),
             approved_claims = COALESCE($8, approved_claims),
             restricted_claims = COALESCE($9, restricted_claims),
             target_keywords = COALESCE($10, target_keywords),
             excluded_keywords = COALESCE($11, excluded_keywords),
             reply_rules = COALESCE($12, reply_rules),
             escalation_rules = COALESCE($13, escalation_rules),
             compliance_rules = COALESCE($14, compliance_rules),
             knowledge_base = COALESCE($15, knowledge_base),
             updated_at = NOW()
         WHERE business_id = $16
         RETURNING *`,
        [
          identity, description,
          services ? JSON.stringify(services) : null,
          products ? JSON.stringify(products) : null,
          customer_personas ? JSON.stringify(customer_personas) : null,
          brand_voice,
          languages ? JSON.stringify(languages) : null,
          approved_claims ? JSON.stringify(approved_claims) : null,
          restricted_claims ? JSON.stringify(restricted_claims) : null,
          target_keywords ? JSON.stringify(target_keywords) : null,
          excluded_keywords ? JSON.stringify(excluded_keywords) : null,
          reply_rules ? JSON.stringify(reply_rules) : null,
          escalation_rules ? JSON.stringify(escalation_rules) : null,
          compliance_rules ? JSON.stringify(compliance_rules) : null,
          knowledge_base ? JSON.stringify(knowledge_base) : null,
          businessId
        ]
      );
    } else {
      profileResult = await query(
        `INSERT INTO business_profiles (
           business_id, identity, description, services, products, customer_personas,
           brand_voice, languages, approved_claims, restricted_claims, target_keywords,
           excluded_keywords, reply_rules, escalation_rules, compliance_rules, knowledge_base,
           onboarding_completed, onboarding_score
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE, 100)
         RETURNING *`,
        [
          businessId, identity, description,
          JSON.stringify(services || []),
          JSON.stringify(products || []),
          JSON.stringify(customer_personas || []),
          brand_voice || 'Professional',
          JSON.stringify(languages || ['en']),
          JSON.stringify(approved_claims || []),
          JSON.stringify(restricted_claims || []),
          JSON.stringify(target_keywords || []),
          JSON.stringify(excluded_keywords || []),
          JSON.stringify(reply_rules || {}),
          JSON.stringify(escalation_rules || {}),
          JSON.stringify(compliance_rules || []),
          JSON.stringify(knowledge_base || [])
        ]
      );
    }

    await logAudit(req.workspaceId, req.user.id, 'BUSINESS_PROFILE_UPDATED', 'business_profiles', businessId, { brand_voice });
    res.json({ success: true, profile: profileResult.rows[0] });
  } catch (err) {
    next(err);
  }
};

// 12-Step Onboarding Engine
export const submitOnboarding = async (req, res, next) => {
  try {
    const {
      businessName, website, phone, address, city, country, postalCode, serviceAreas,
      industryId, subcategoryId, businessModel,
      services, products, targetLocations, customerPersonas,
      brandVoice, aiLanguages, approvedClaims, restrictedClaims,
      connectGoogle = false
    } = req.body;

    const finalBusinessName = (businessName && businessName.trim())
      ? businessName.trim()
      : (req.user?.workspace_name || req.body.workspaceName || 'My Business Location');
    const finalIndustryId = industryId || 'restaurant';

    // 1. Create Business Location
    const bRes = await query(
      `INSERT INTO business_locations (
         workspace_id, name, industry_id, subcategory_id, business_model,
         address, city, country, postal_code, phone, website, service_areas,
         is_primary, health_score
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, 85.00)
       RETURNING *`,
      [
        req.workspaceId, finalBusinessName, finalIndustryId, subcategoryId || null, businessModel || 'storefront',
        address, city || 'Ahmedabad', country || 'India', postalCode, phone, website,
        JSON.stringify(serviceAreas || targetLocations || [])
      ]
    );
    const business = bRes.rows[0];

    // Calculate dynamic completion score
    let score = 50;
    if (services && services.length > 0) score += 10;
    if (customerPersonas && customerPersonas.length > 0) score += 10;
    if (brandVoice) score += 10;
    if (approvedClaims && approvedClaims.length > 0) score += 10;
    if (connectGoogle) score += 10;

    // 2. Create Business Intelligence Profile
    const profileRes = await query(
      `INSERT INTO business_profiles (
         business_id, identity, description, services, products, customer_personas,
         brand_voice, languages, approved_claims, restricted_claims,
         reply_rules, escalation_rules, onboarding_completed, onboarding_score
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         '{"auto_reply_5_star": true, "auto_reply_4_star": true, "draft_3_star": true, "manual_approval_1_2_star": true}'::jsonb,
         '{"notify_manager_on_1_star": true, "require_approval_sensitive": true}'::jsonb,
         TRUE, $11
       ) RETURNING *`,
      [
        business.id,
        `${finalBusinessName} - ${finalIndustryId}`,
        `${finalBusinessName} offers high-quality ${finalIndustryId} services in ${city || 'the local market'}.`,
        JSON.stringify(services || ['Core Consultation', 'Primary Service']),
        JSON.stringify(products || []),
        JSON.stringify(customerPersonas || ['Local Quality-Seekers']),
        brandVoice || 'Professional',
        JSON.stringify(aiLanguages || ['en']),
        JSON.stringify(approvedClaims || [`Top rated service provider in ${city || 'the area'}`]),
        JSON.stringify(restrictedClaims || []),
        score
      ]
    );

    // 3. Auto-populate initial keywords based on industry & services!
    const kgRes = await query(
      `INSERT INTO keyword_groups (business_id, name, slug, color)
       VALUES ($1, 'Core Business Keywords', 'core-keywords', '#6366f1')
       RETURNING id`,
      [business.id]
    );
    const groupId = kgRes.rows[0].id;

    const initialKeywords = [
      `${finalBusinessName.toLowerCase()}`,
      `best ${finalIndustryId} in ${city || 'city'}`,
      `top ${services?.[0] || finalIndustryId} near me`,
      `${finalIndustryId} service ${city || 'local'}`
    ];

    for (let i = 0; i < initialKeywords.length; i++) {
      await query(
        `INSERT INTO keywords (business_id, group_id, keyword, intent, relevance, difficulty, search_volume, current_rank, is_primary)
         VALUES ($1, $2, $3, 'local', 95, 30, 1500, $4, $5)`,
        [business.id, groupId, initialKeywords[i], i + 2, i === 0]
      );
    }

    // 4. Update subscription location counter
    await query(`UPDATE subscriptions SET current_locations = current_locations + 1 WHERE workspace_id = $1`, [req.workspaceId]);

    await logAudit(req.workspaceId, req.user.id, 'ONBOARDING_COMPLETED', 'business_locations', business.id, { businessName, score });

    res.status(201).json({
      success: true,
      business,
      profile: profileRes.rows[0],
      completionScore: score
    });
  } catch (err) {
    next(err);
  }
};
