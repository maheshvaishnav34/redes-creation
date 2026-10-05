import QRCode from 'qrcode';
import os from 'os';
import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export function getLocalNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export const listCampaigns = async (req, res, next) => {
  try {
    let businessId = req.params.businessId || req.businessId;

    // If businessId is not specified, resolve from active workspace
    if (!businessId && req.workspaceId) {
      const bRes = await query(
        `SELECT id FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1`,
        [req.workspaceId]
      );
      if (bRes.rows.length > 0) {
        businessId = bRes.rows[0].id;
      }
    }

    let queryText = `
      SELECT c.*, 
             COALESCE(NULLIF(c.business_name, ''), c.name, b.name) as business_name,
             COALESCE(NULLIF(c.website, ''), b.website) as business_website,
             COALESCE(NULLIF(c.phone, ''), b.phone) as business_phone,
             COALESCE(c.google_review_url, 'https://www.google.com/maps/search/?api=1&query=' || COALESCE(NULLIF(c.business_name, ''), c.name, b.name)) as google_review_url,
             COALESCE(c.post_review_enabled, true) as post_review_enabled,
             b.city,
             (SELECT COUNT(*) FROM review_feedback rf WHERE rf.campaign_id = c.id) as real_feedback_count
      FROM review_campaigns c
      LEFT JOIN business_locations b ON c.business_id = b.id
    `;
    const params = [];

    if (businessId) {
      queryText += ` WHERE c.business_id = $1 OR c.business_id IS NULL`;
      params.push(businessId);
    } else if (req.workspaceId) {
      queryText += ` WHERE b.workspace_id = $1 OR c.business_id IS NULL`;
      params.push(req.workspaceId);
    }

    queryText += ` ORDER BY c.created_at DESC`;

    const campRes = await query(queryText, params);

    res.json({ 
      success: true, 
      campaigns: campRes.rows,
      serverIp: getLocalNetworkIp()
    });
  } catch (err) {
    next(err);
  }
};

export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campRes = await query(
      `SELECT c.*, 
              COALESCE(NULLIF(c.business_name, ''), c.name, b.name) as business_name,
              COALESCE(NULLIF(c.website, ''), b.website) as business_website,
              COALESCE(NULLIF(c.phone, ''), b.phone) as business_phone,
              COALESCE(c.google_review_url, 'https://www.google.com/maps/search/?api=1&query=' || COALESCE(NULLIF(c.business_name, ''), c.name, b.name)) as google_review_url,
              COALESCE(c.post_review_enabled, true) as post_review_enabled,
              b.city
       FROM review_campaigns c
       LEFT JOIN business_locations b ON c.business_id = b.id
       WHERE c.id = $1`,
      [id]
    );

    if (campRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, campaign: campRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { 
      name, 
      businessName, 
      website, 
      phone, 
      services, 
      channel = 'qr', 
      messageTemplate, 
      targetAudience,
      googleReviewUrl,
      postReviewEnabled = true
    } = req.body;
    let businessId = req.body.businessId || req.businessId;

    if (!businessId && req.workspaceId) {
      const bRes = await query(
        `SELECT id FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1`,
        [req.workspaceId]
      );
      if (bRes.rows.length > 0) {
        businessId = bRes.rows[0].id;
      }
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' });
    }

    const trimmedName = name.trim();
    const finalBusinessName = businessName && businessName.trim() ? businessName.trim() : trimmedName;

    // Format website URL if provided
    let formattedWebsite = website ? website.trim() : null;
    if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    // Direct Google Review Link:
    let finalGoogleReviewUrl = googleReviewUrl ? googleReviewUrl.trim() : null;
    if (finalGoogleReviewUrl && !/^https?:\/\//i.test(finalGoogleReviewUrl)) {
      finalGoogleReviewUrl = `https://${finalGoogleReviewUrl}`;
    }
    if (!finalGoogleReviewUrl) {
      finalGoogleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalBusinessName)}`;
    }

    // Process services array
    let servicesJson = [];
    if (Array.isArray(services)) {
      servicesJson = services;
    } else if (typeof services === 'string' && services.trim()) {
      try {
        servicesJson = JSON.parse(services);
      } catch {
        servicesJson = services.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (!servicesJson || servicesJson.length === 0) {
      const lower = `${finalBusinessName} ${trimmedName}`.toLowerCase();
      if (lower.includes('training') || lower.includes('code') || lower.includes('tech') || lower.includes('dev') || lower.includes('institute') || lower.includes('academy')) {
        servicesJson = ['Full Stack Web Development', 'Python Programming', 'Software Engineering', 'MERN Stack Development', 'Career Placement Support'];
      } else if (lower.includes('dental') || lower.includes('clinic') || lower.includes('teeth') || lower.includes('doctor')) {
        servicesJson = ['Dental Consultation', 'Teeth Whitening', 'Root Canal Treatment', 'Dental Implants', 'Orthodontic Aligners'];
      } else if (lower.includes('dine') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('food') || lower.includes('bistro')) {
        servicesJson = ['A La Carte Dining', 'Banquet Catering', 'Family Dinners', 'Special Events', 'Private Parties'];
      } else {
        servicesJson = ['Website Designing & Development', 'Google Review Optimization', 'Local SEO & Geo-Grid', 'Digital Marketing Support', 'Technical Consulting'];
      }
    }

    // Generate campaign ID and public URL slug
    const cleanName = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const campaignSlug = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const reviewLink = `${clientBaseUrl}/feedback/${campaignSlug}`;

    // Generate high-resolution QR code
    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(reviewLink, {
        width: 320,
        margin: 2,
        color: {
          dark: '#034bc0', // Redes Creation Royal Blue
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('[CAMPAIGN] QR Code generation warning:', qrErr.message);
    }

    const newCamp = await query(
      `INSERT INTO review_campaigns (
         business_id, name, business_name, website, phone, services,
         channel, message_template, target_audience,
         google_review_url, post_review_enabled,
         review_link, qr_code_data, status,
         sent_count, clicked_count, feedback_started_count, destination_clicked_count, attributed_reviews_count
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', 0, 0, 0, 0, 0)
       RETURNING *`,
      [
        businessId || null, 
        trimmedName, 
        finalBusinessName, 
        formattedWebsite, 
        phone ? phone.trim() : null, 
        JSON.stringify(servicesJson),
        channel, 
        messageTemplate || null, 
        targetAudience || null, 
        finalGoogleReviewUrl,
        postReviewEnabled !== false,
        reviewLink, 
        qrCodeData
      ]
    );

    await logAudit(req.workspaceId, req.user?.id || null, 'CAMPAIGN_CREATED', 'review_campaigns', newCamp.rows[0].id, { 
      name: trimmedName, 
      businessName: finalBusinessName,
      channel, 
      website: formattedWebsite,
      googleReviewUrl: finalGoogleReviewUrl
    });

    res.status(201).json({ success: true, campaign: newCamp.rows[0] });
  } catch (err) {
    console.error('[CAMPAIGN] createCampaign error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create campaign' });
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      businessName,
      website,
      phone,
      services,
      channel,
      messageTemplate,
      targetAudience,
      googleReviewUrl,
      postReviewEnabled,
      status
    } = req.body;

    const existingRes = await query(`SELECT * FROM review_campaigns WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    const current = existingRes.rows[0];

    const finalName = name !== undefined && name.trim() ? name.trim() : current.name;
    const finalBusinessName = businessName !== undefined ? (businessName.trim() || finalName) : (current.business_name || finalName);

    let formattedWebsite = website !== undefined ? (website ? website.trim() : null) : current.website;
    if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    let finalGoogleReviewUrl = googleReviewUrl !== undefined ? (googleReviewUrl ? googleReviewUrl.trim() : null) : current.google_review_url;
    if (finalGoogleReviewUrl && !/^https?:\/\//i.test(finalGoogleReviewUrl)) {
      finalGoogleReviewUrl = `https://${finalGoogleReviewUrl}`;
    }
    if (!finalGoogleReviewUrl) {
      finalGoogleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalBusinessName)}`;
    }

    let servicesJson = current.services;
    if (services !== undefined) {
      if (Array.isArray(services)) {
        servicesJson = JSON.stringify(services);
      } else if (typeof services === 'string') {
        try {
          JSON.parse(services);
          servicesJson = services;
        } catch {
          servicesJson = JSON.stringify(services.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    }

    const finalStatus = status !== undefined ? status : current.status;
    const finalChannel = channel !== undefined ? channel : current.channel;
    const finalAudience = targetAudience !== undefined ? targetAudience : current.target_audience;
    const finalTemplate = messageTemplate !== undefined ? messageTemplate : current.message_template;
    const finalPostReview = postReviewEnabled !== undefined ? Boolean(postReviewEnabled) : current.post_review_enabled;

    // Check if QR code needs regenerating if review_link was empty
    let qrData = current.qr_code_data;
    if (!qrData && current.review_link) {
      try {
        qrData = await QRCode.toDataURL(current.review_link, {
          width: 320,
          margin: 2,
          color: { dark: '#034bc0', light: '#ffffff' }
        });
      } catch (e) {
        console.warn('[CAMPAIGN] QR refresh warning:', e.message);
      }
    }

    const updateRes = await query(
      `UPDATE review_campaigns
       SET name = $1,
           business_name = $2,
           website = $3,
           phone = $4,
           services = $5,
           channel = $6,
           message_template = $7,
           target_audience = $8,
           google_review_url = $9,
           post_review_enabled = $10,
           status = $11,
           qr_code_data = COALESCE($12, qr_code_data),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        finalName,
        finalBusinessName,
        formattedWebsite,
        phone !== undefined ? (phone ? phone.trim() : null) : current.phone,
        servicesJson,
        finalChannel,
        finalTemplate,
        finalAudience,
        finalGoogleReviewUrl,
        finalPostReview,
        finalStatus,
        qrData,
        id
      ]
    );

    await logAudit(req.workspaceId, req.user?.id || null, 'CAMPAIGN_UPDATED', 'review_campaigns', id, {
      name: finalName,
      businessName: finalBusinessName,
      status: finalStatus,
      googleReviewUrl: finalGoogleReviewUrl
    });

    res.json({ success: true, campaign: updateRes.rows[0], message: 'Campaign updated successfully' });
  } catch (err) {
    console.error('[CAMPAIGN] updateCampaign error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update campaign' });
  }
};

export const updateCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be active, paused, or completed' });
    }

    const updateRes = await query(
      `UPDATE review_campaigns
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    await logAudit(req.workspaceId, req.user?.id || null, 'CAMPAIGN_STATUS_CHANGED', 'review_campaigns', id, { status });

    res.json({ success: true, campaign: updateRes.rows[0], message: `Campaign is now ${status}` });
  } catch (err) {
    next(err);
  }
};

export const getCampaignFeedbacks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feedbackRes = await query(
      `SELECT * FROM review_feedback
       WHERE campaign_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({ success: true, feedbacks: feedbackRes.rows });
  } catch (err) {
    next(err);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM review_feedback WHERE campaign_id = $1`, [id]);
    const delRes = await query(`DELETE FROM review_campaigns WHERE id = $1 RETURNING name`, [id]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    await logAudit(req.workspaceId, req.user?.id || null, 'CAMPAIGN_DELETED', 'review_campaigns', id, {
      name: delRes.rows[0].name
    });

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getPublicCampaignDetails = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const campRes = await query(
      `SELECT c.*, 
              COALESCE(NULLIF(c.business_name, ''), c.name, b.name) as business_name, 
              COALESCE(NULLIF(c.website, ''), b.website, 'https://redescreation.in') as business_website, 
              COALESCE(NULLIF(c.phone, ''), b.phone, '+91 79 4890 5500') as business_phone, 
              b.address, b.city, bp.brand_voice, 
              COALESCE(NULLIF(c.services, '[]'::jsonb), bp.services) as services, 
              bp.identity,
              c.google_review_url,
              COALESCE(c.post_review_enabled, true) as post_review_enabled
       FROM review_campaigns c
       LEFT JOIN business_locations b ON c.business_id = b.id
       LEFT JOIN business_profiles bp ON b.id = bp.business_id
       WHERE c.review_link LIKE $1 
          OR c.id::text = $2
          OR c.review_link ILIKE $3
          OR c.name ILIKE $4
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [`%${slug}%`, slug, `%${slug.replace(/-\d+$/, '')}%`, slug.replace(/-/g, ' ')]
    );

    if (campRes.rows.length === 0) {
      const defaultBiz = await query(`SELECT b.id, b.name, b.website, b.phone, b.city FROM business_locations b LIMIT 1`);
      const fallbackName = slug ? slug.replace(/-/g, ' ') : (defaultBiz.rows[0]?.name || 'Redes Creation Partner');
      return res.json({
        success: true,
        campaign: {
          id: 'demo-campaign',
          name: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Client Experience Feedback',
          business_name: fallbackName,
          business_website: defaultBiz.rows[0]?.website || 'https://redescreation.in',
          business_phone: defaultBiz.rows[0]?.phone || '+91 79 4890 5500',
          city: defaultBiz.rows[0]?.city || 'Ahmedabad',
          services: ['Website Designing & Development', 'Google Review Intelligence', 'Local SEO & Geo-Grid', 'Digital Marketing'],
          google_review_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackName)}`,
          post_review_enabled: true
        }
      });
    }

    const campaign = campRes.rows[0];

    // Normalize & validate services array
    let finalServices = [];
    if (campaign.services) {
      if (Array.isArray(campaign.services)) {
        finalServices = campaign.services;
      } else if (typeof campaign.services === 'string') {
        try {
          finalServices = JSON.parse(campaign.services);
        } catch {
          finalServices = campaign.services.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const lowerName = `${campaign.business_name || ''} ${campaign.name || ''}`.toLowerCase();
    const isTechOrTraining = lowerName.includes('training') || lowerName.includes('code') || lowerName.includes('software') || lowerName.includes('tech') || lowerName.includes('dev') || lowerName.includes('institute') || lowerName.includes('academy');
    const isDental = lowerName.includes('dental') || lowerName.includes('teeth') || lowerName.includes('clinic');
    const isDining = lowerName.includes('dine') || lowerName.includes('restaurant') || lowerName.includes('bistro') || lowerName.includes('cafe');

    if (isTechOrTraining && (!finalServices.length || finalServices.some(s => typeof s === 'string' && (s.toLowerCase().includes('dining') || s.toLowerCase().includes('banquet'))))) {
      finalServices = ['Full Stack Web Development', 'Python Programming', 'MERN Stack Development', 'Software Testing', 'React & Node.js', 'IT Career Placement'];
    } else if (isDental && (!finalServices.length || finalServices.some(s => typeof s === 'string' && s.toLowerCase().includes('dining')))) {
      finalServices = ['Dental Consultation', 'Teeth Whitening', 'Root Canal Treatment', 'Dental Implants', 'Orthodontic Aligners'];
    } else if (!isDining && finalServices.some(s => typeof s === 'string' && s.toLowerCase().includes('dining'))) {
      finalServices = ['Website Development', 'Google Review Optimization', 'Digital Marketing', 'SEO Growth Services', 'Technical Consulting'];
    } else if (!finalServices || finalServices.length === 0) {
      finalServices = ['Professional Consultation', 'Service Delivery & Execution', 'Quality Assurance & Support', 'Customer Service'];
    }

    campaign.services = finalServices;

    if (!campaign.google_review_url) {
      campaign.google_review_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campaign.business_name || campaign.name)}`;
    }

    // Real-time counter: Increment clicked_count and sync sent_count
    await query(
      `UPDATE review_campaigns 
       SET clicked_count = clicked_count + 1,
           sent_count = GREATEST(sent_count, clicked_count + 1)
       WHERE id = $1`, 
      [campaign.id]
    );

    res.json({ success: true, campaign });
  } catch (err) {
    next(err);
  }
};

export const submitCustomerFeedback = async (req, res, next) => {
  try {
    const { campaignId, customerName, customerPhone, rating, serviceExperienced, feedbackText, themesSelected, proceededToGoogle } = req.body;

    const campRes = await query(
      `SELECT business_id, id FROM review_campaigns 
       WHERE id::text = $1 OR review_link LIKE $2 OR review_link ILIKE $3 
       LIMIT 1`, 
      [campaignId, `%${campaignId}%`, `%${campaignId.replace(/-\d+$/, '')}%`]
    );
    
    let businessId = campRes.rows[0]?.business_id;
    let actualCampId = campRes.rows[0]?.id || null;

    if (!businessId) {
      const fallbackBiz = await query(`SELECT id FROM business_locations LIMIT 1`);
      businessId = fallbackBiz.rows[0]?.id || null;
    }

    if (businessId) {
      await query(
        `INSERT INTO review_feedback (campaign_id, business_id, customer_name, rating, service_experienced, feedback_text, themes_selected, proceeded_to_google)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          actualCampId, businessId, customerName || 'Valued Client', rating || 5,
          serviceExperienced || 'General Service', feedbackText || '', JSON.stringify(themesSelected || []), Boolean(proceededToGoogle)
        ]
      );

      if (actualCampId) {
        await query(
          `UPDATE review_campaigns 
           SET feedback_started_count = feedback_started_count + 1,
               destination_clicked_count = destination_clicked_count + (CASE WHEN $1 = TRUE THEN 1 ELSE 0 END),
               attributed_reviews_count = attributed_reviews_count + (CASE WHEN $2 >= 4 AND $1 = TRUE THEN 1 ELSE 0 END)
           WHERE id = $3`,
          [Boolean(proceededToGoogle), rating || 5, actualCampId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Thank you for your valuable feedback! We appreciate your genuine experience.'
    });
  } catch (err) {
    next(err);
  }
};
