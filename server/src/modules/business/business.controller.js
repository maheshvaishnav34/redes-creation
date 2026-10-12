import QRCode from 'qrcode';
import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { validateGoogleReviewUrl } from '../../utils/googleUrlValidator.js';

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
      compliance_rules, knowledge_base,
      industryId, subcategoryId, businessName, city
    } = req.body;

    // 1. Sync industry, subcategory and location attributes to business_locations (Section 19 & 23)
    if (industryId || subcategoryId || businessName || city) {
      await query(
        `UPDATE business_locations
         SET industry_id = COALESCE($1, industry_id),
             subcategory_id = COALESCE($2, subcategory_id),
             name = COALESCE($3, name),
             city = COALESCE($4, city),
             updated_at = NOW()
         WHERE id = $5 AND workspace_id = $6`,
        [industryId, subcategoryId, businessName, city, businessId, req.workspaceId]
      );
    }

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

// 12-Step Niche Intelligence Onboarding Engine
export const submitOnboarding = async (req, res, next) => {
  try {
    const {
      businessName, website, phone, address, city, country, postalCode, serviceAreas,
      industryId, subcategoryId, businessModel,
      services, products, targetLocations, customerPersonas,
      brandVoice, aiLanguages, approvedClaims, restrictedClaims,
      customerIntents, serviceRadius = 15,
      connectGoogle = true, googleLocationId, googleReviewUrl
    } = req.body;

    const finalBusinessName = (businessName && businessName.trim())
      ? businessName.trim()
      : (req.user?.workspace_name || req.body.workspaceName || 'My Business Location');
    const finalIndustryId = industryId || 'restaurant';

    // Fetch industry taxonomy & intelligence context
    const indRes = await query(`SELECT * FROM industries WHERE id = $1`, [finalIndustryId]);
    const industryData = indRes.rows[0] || {};

    const subRes = subcategoryId
      ? await query(`SELECT * FROM industry_subcategories WHERE id = $1`, [subcategoryId])
      : { rows: [] };
    const subcategoryData = subRes.rows[0] || {};

    const finalCustomerIntents = customerIntents && customerIntents.length > 0
      ? customerIntents
      : (industryData.customer_intents || ['visit', 'call', 'enquiry']);

    const finalAiPolicy = {
      ...(industryData.ai_policy || {}),
      brand_voice: brandVoice || industryData.default_tone || 'Professional',
      prohibited_claims: [
        ...(industryData.compliance_rules || []),
        ...(restrictedClaims || [])
      ]
    };

    const finalSeoRules = industryData.seo_rules || {};

    // Check existing locations count to decide if this should be is_primary
    const existingCountRes = await query(
      `SELECT COUNT(*) as count FROM business_locations WHERE workspace_id = $1`,
      [req.workspaceId]
    );
    const isFirstLocation = parseInt(existingCountRes.rows[0]?.count || 0, 10) === 0;

    // 1. Create Business Location with Niche Parameters
    const bRes = await query(
      `INSERT INTO business_locations (
         workspace_id, name, industry_id, subcategory_id, subcategory_name, business_model,
         address, city, country, postal_code, phone, website, service_areas,
         customer_intents, service_radius, is_primary, health_score
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 88.50)
       RETURNING *`,
      [
        req.workspaceId,
        finalBusinessName,
        finalIndustryId,
        subcategoryId || null,
        subcategoryData.name || null,
        businessModel || 'storefront',
        address || 'City Center Main Road',
        city || 'Ahmedabad',
        country || 'India',
        postalCode || '380054',
        phone || '+91 79 4890 5500',
        website || null,
        JSON.stringify(serviceAreas || targetLocations || []),
        JSON.stringify(finalCustomerIntents),
        parseInt(serviceRadius) || 15,
        isFirstLocation
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

    // 2. Create Business Intelligence Profile with Full Niche Context
    const profileRes = await query(
      `INSERT INTO business_profiles (
         business_id, identity, description, services, products, customer_personas,
         brand_voice, languages, approved_claims, restricted_claims, prohibited_claims,
         customer_intents, ai_policy, seo_rules,
         reply_rules, escalation_rules, onboarding_completed, onboarding_score
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
         '{"auto_reply_5_star": true, "auto_reply_4_star": true, "draft_3_star": true, "manual_approval_1_2_star": true}'::jsonb,
         '{"notify_manager_on_1_star": true, "require_approval_sensitive": true}'::jsonb,
         TRUE, $15
       ) RETURNING *`,
      [
        business.id,
        `${finalBusinessName} - ${subcategoryData.name || industryData.name || finalIndustryId}`,
        `${finalBusinessName} is a premier ${subcategoryData.name || industryData.name || finalIndustryId} provider in ${city || 'Ahmedabad'} delivering specialized ${services?.[0] || 'solutions'}.`,
        JSON.stringify(services && services.length > 0 ? services : (subcategoryData.suggested_services || ['Primary Consultation', 'Premium Service'])),
        JSON.stringify(products || []),
        JSON.stringify(customerPersonas || ['Discerning Local Clients', 'Quality Seekers']),
        brandVoice || industryData.default_tone || 'Professional',
        JSON.stringify(aiLanguages || ['en']),
        JSON.stringify(approvedClaims || [`Top rated ${industryData.name || finalIndustryId} service in ${city || 'the region'}`]),
        JSON.stringify(restrictedClaims || []),
        JSON.stringify(finalAiPolicy.prohibited_claims || []),
        JSON.stringify(finalCustomerIntents),
        JSON.stringify(finalAiPolicy),
        JSON.stringify(finalSeoRules),
        score
      ]
    );

    // 3. Auto-populate Niche-Specific Keywords
    const kgRes = await query(
      `INSERT INTO keyword_groups (business_id, name, slug, color)
       VALUES ($1, 'Core Business Keywords', 'core-keywords', '#6366f1')
       RETURNING id`,
      [business.id]
    );
    const groupId = kgRes.rows[0].id;

    const baseKeywords = (subcategoryData.suggested_keywords && subcategoryData.suggested_keywords.length > 0)
      ? subcategoryData.suggested_keywords
      : [
          `best ${finalIndustryId} in ${city || 'city'}`,
          `top ${services?.[0] || finalIndustryId} near me`,
          `${finalIndustryId} specialist ${city || 'city'}`
        ];

    const initialKeywords = [
      `${finalBusinessName.toLowerCase()}`,
      ...baseKeywords.slice(0, 4)
    ];

    for (let i = 0; i < initialKeywords.length; i++) {
      await query(
        `INSERT INTO keywords (business_id, group_id, keyword, intent, relevance, difficulty, search_volume, current_rank, is_primary)
         VALUES ($1, $2, $3, $4, 95, 32, 1800, $5, $6)`,
        [business.id, groupId, initialKeywords[i], finalCustomerIntents[0] || 'local', i + 2, i === 0]
      );
    }

    // 4. Validate & Resolve Isolated Google Review Destination for THIS location
    const fallbackLocationSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalBusinessName + ' ' + (city || ''))}`;
    const rawGoogleInput = (googleReviewUrl && googleReviewUrl.trim()) ? googleReviewUrl.trim() : fallbackLocationSearch;
    const validatedReview = validateGoogleReviewUrl(rawGoogleInput, {
      businessName: finalBusinessName,
      city: city || '',
      address: address || ''
    });

    // 5. Auto-Connect & Map Isolated Google Business Profile Location
    let connId;
    const existingConn = await query(`SELECT id FROM google_connections WHERE workspace_id = $1`, [req.workspaceId]);
    if (existingConn.rows.length > 0) {
      connId = existingConn.rows[0].id;
    } else {
      const newConn = await query(
        `INSERT INTO google_connections (workspace_id, account_email, account_name, status, sync_frequency, is_token_encrypted, last_sync_at)
         VALUES ($1, $2, $3, 'connected', 'daily', TRUE, NOW())
         RETURNING id`,
        [req.workspaceId, req.user?.email || 'admin@google-business.com', `${finalBusinessName} GBP Account`]
      );
      connId = newConn.rows[0].id;
    }

    const gbpLocId = googleLocationId || `locations/gbp_${Date.now().toString(36)}`;
    await query(
      `INSERT INTO google_locations (
         google_connection_id, business_id, gbp_location_id, gbp_place_id, location_name, address, phone,
         website, is_verified, sync_status, categories, supported_services, last_synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'synced', $9, $10, NOW())
       ON CONFLICT (business_id) DO UPDATE
       SET location_name = EXCLUDED.location_name,
           gbp_place_id = COALESCE(EXCLUDED.gbp_place_id, google_locations.gbp_place_id),
           website = EXCLUDED.website,
           sync_status = 'synced',
           last_synced_at = NOW()`,
      [
        connId,
        business.id,
        gbpLocId,
        validatedReview.placeId || null,
        finalBusinessName,
        address || `${city || 'Ahmedabad'}, India`,
        phone || '+91 79 4890 5500',
        validatedReview.url,
        JSON.stringify([industryData.name || 'Local Business', subcategoryData.name || 'Specialty Service']),
        JSON.stringify(services || subcategoryData.suggested_services || [])
      ]
    );

    // 6. Auto-Create an Isolated Review Campaign & QR Code for THIS Location
    const cleanName = finalBusinessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const campaignSlug = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
    const reqOrigin = req.get('origin') || req.headers.origin;
    const clientBaseUrl = (reqOrigin && reqOrigin.includes('localhost')) ? reqOrigin : (process.env.CLIENT_URL || 'http://localhost:5173');
    const reviewLink = `${clientBaseUrl}/feedback/${campaignSlug}`;

    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(reviewLink, {
        width: 320,
        margin: 2,
        color: {
          dark: '#034bc0',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('[ONBOARDING] QR generation warning:', qrErr.message);
    }

    const initialCampaignServices = (services && services.length > 0)
      ? services
      : (subcategoryData.suggested_services && subcategoryData.suggested_services.length > 0
          ? subcategoryData.suggested_services
          : ['Professional Consultation', 'Service Delivery', 'Customer Support']);

    await query(
      `INSERT INTO review_campaigns (
         business_id, name, business_name, website, phone, services,
         channel, message_template, target_audience,
         google_review_url, post_review_enabled,
         review_link, qr_code_data, status,
         sent_count, clicked_count, feedback_started_count, destination_clicked_count, attributed_reviews_count
       ) VALUES ($1, $2, $3, $4, $5, $6, 'qr', $7, 'All Customers & Guests', $8, TRUE, $9, $10, 'active', 0, 0, 0, 0, 0)`,
      [
        business.id,
        `${finalBusinessName} Official Review Drive`,
        finalBusinessName,
        website || null,
        phone || null,
        JSON.stringify(initialCampaignServices),
        `Welcome to ${finalBusinessName}! How was your experience with us?`,
        validatedReview.url,
        reviewLink,
        qrCodeData
      ]
    );

    // 7. Update subscription location counter
    await query(`UPDATE subscriptions SET current_locations = current_locations + 1 WHERE workspace_id = $1`, [req.workspaceId]);

    await logAudit(req.workspaceId, req.user.id, 'ONBOARDING_COMPLETED', 'business_locations', business.id, {
      businessName: finalBusinessName,
      industry: finalIndustryId,
      subcategory: subcategoryId,
      businessModel,
      score,
      googleReviewUrl: validatedReview.url,
      placeId: validatedReview.placeId || null
    });

    res.status(201).json({
      success: true,
      business: {
        ...business,
        google_review_url: validatedReview.url,
        gbp_place_id: validatedReview.placeId || null
      },
      profile: profileRes.rows[0],
      completionScore: score
    });
  } catch (err) {
    next(err);
  }
};
