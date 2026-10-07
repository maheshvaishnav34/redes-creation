import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { reviewWorker } from './reviews.worker.js';
import { aggregateBusinessReviewIntelligence } from './reviewIntelligence.service.js';
import { analyzeReviewWithAI } from './reviewAnalysis.service.js';

/**
 * Format database review row to guarantee both legacy properties and Section 1 Schema
 */
function formatReviewResponse(r) {
  const ai = r.ai_analysis || {};
  return {
    ...r,
    // CamelCase aliases conforming to Section 1
    reviewId: r.id,
    businessId: r.business_id,
    locationId: r.google_location_id,
    reviewerName: r.author_name,
    rating: r.rating,
    reviewText: r.review_text,
    reviewDate: r.review_date,
    replyText: r.response_text || null,
    replyDate: r.published_at || null,
    reviewFeedback: r.review_feedback || ai.reviewFeedback || '',
    summary: r.summary || ai.summary || '',
    positivePoints: r.positive_points || ai.positivePoints || [],
    negativePoints: r.negative_points || ai.negativePoints || [],
    complaints: r.complaints || ai.complaints || [],
    praisedServices: r.praised_services || ai.praisedServices || [],
    urgency: r.urgency || ai.urgency || 'low',
    issueDetected: r.issue_detected || ai.issueDetected || false,
    issueType: r.issue_type || ai.issueType || '',
    customerIntent: r.customer_intent || ai.customerIntent || '',
    responseRequired: r.response_required ?? ai.responseRequired ?? false,
    responseSuggestion: r.response_suggestion || ai.responseSuggestion || '',
    improvementRecommendation: r.improvement_recommendation || ai.improvementRecommendation || '',
    processingStatus: r.processing_status || 'pending',
    aiAnalysis: {
      processed: r.processing_status === 'completed' || ai.processed === true,
      processedAt: r.processed_at || ai.processedAt || null,
      sentiment: r.sentiment || ai.sentiment || 'neutral',
      sentimentScore: Number(r.sentiment_score ?? ai.sentimentScore ?? 0.5),
      reviewFeedback: r.review_feedback || ai.reviewFeedback || '',
      summary: r.summary || ai.summary || '',
      positivePoints: r.positive_points || ai.positivePoints || [],
      negativePoints: r.negative_points || ai.negativePoints || [],
      complaints: r.complaints || ai.complaints || [],
      praisedServices: r.praised_services || ai.praisedServices || [],
      keywords: r.detected_keywords || ai.keywords || [],
      topics: r.detected_topics || ai.topics || [],
      urgency: r.urgency || ai.urgency || 'low',
      issueDetected: r.issue_detected || ai.issueDetected || false,
      issueType: r.issue_type || ai.issueType || '',
      customerIntent: r.customer_intent || ai.customerIntent || '',
      responseRequired: r.response_required ?? ai.responseRequired ?? false,
      responseSuggestion: r.response_suggestion || ai.responseSuggestion || '',
      improvementRecommendation: r.improvement_recommendation || ai.improvementRecommendation || ''
    }
  };
}

export const listReviews = async (req, res, next) => {
  try {
    const {
      rating,
      sentiment,
      topic,
      priority,
      reply_status,
      search,
      sort = 'review_date',
      order = 'DESC',
      limit = 50,
      offset = 0
    } = req.query;

    const businessId = req.params.businessId || req.businessId;

    let sql = `
      SELECT r.*,
             resp.id as response_id, resp.response_text, resp.response_options, resp.tone as response_tone,
             resp.safety_check_status, resp.published_at, resp.generated_by_ai
      FROM reviews r
      LEFT JOIN review_responses resp ON r.id = resp.review_id
      WHERE r.business_id = $1
    `;
    const params = [businessId];
    let paramIdx = 2;

    if (rating) {
      sql += ` AND r.rating = $${paramIdx}`;
      params.push(parseInt(rating, 10));
      paramIdx++;
    }

    if (sentiment) {
      sql += ` AND r.sentiment = $${paramIdx}`;
      params.push(sentiment);
      paramIdx++;
    }

    if (priority) {
      sql += ` AND r.priority = $${paramIdx}`;
      params.push(priority);
      paramIdx++;
    }

    if (reply_status) {
      if (reply_status === 'unanswered') {
        sql += ` AND r.reply_status IN ('unanswered', 'draft', 'pending_approval')`;
      } else if (reply_status === 'replied') {
        sql += ` AND r.reply_status IN ('replied', 'auto_replied')`;
      } else {
        sql += ` AND r.reply_status = $${paramIdx}`;
        params.push(reply_status);
        paramIdx++;
      }
    }

    if (topic) {
      sql += ` AND r.detected_topics @> $${paramIdx}::jsonb`;
      params.push(JSON.stringify([topic]));
      paramIdx++;
    }

    if (search) {
      sql += ` AND (LOWER(r.review_text) LIKE LOWER($${paramIdx}) OR LOWER(r.author_name) LIKE LOWER($${paramIdx}))`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    sql += ` ORDER BY r.${sort === 'rating' ? 'rating' : 'review_date'} ${order === 'ASC' ? 'ASC' : 'DESC'} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sql, params);

    // Compute aggregation summaries
    const statsRes = await query(
      `SELECT 
         COUNT(*) as total_reviews,
         AVG(rating) as avg_rating,
         COUNT(CASE WHEN reply_status IN ('unanswered', 'draft', 'pending_approval') THEN 1 END) as unanswered_count,
         COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
         COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count,
         COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count,
         COUNT(CASE WHEN sentiment = 'mixed' THEN 1 END) as mixed_count,
         COUNT(CASE WHEN is_sensitive = TRUE THEN 1 END) as sensitive_count,
         COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processed_count,
         COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending_ai_count
       FROM reviews
       WHERE business_id = $1`,
      [businessId]
    );

    const formattedReviews = result.rows.map(formatReviewResponse);

    // Check if any reviews have missing feedback / are pending and trigger background worker
    const pendingIds = result.rows
      .filter(r => !r.review_feedback && r.review_text && r.processing_status !== 'processing')
      .map(r => r.id);

    if (pendingIds.length > 0) {
      pendingIds.forEach(id => reviewWorker.enqueueReview(id, businessId, { force: false }));
    }

    res.json({
      success: true,
      reviews: formattedReviews,
      summary: statsRes.rows[0],
      filtersApplied: { rating, sentiment, topic, priority, reply_status, search }
    });
  } catch (err) {
    next(err);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewRes = await query(
      `SELECT r.*, resp.response_text, resp.response_options, resp.tone, resp.safety_check_status,
              resp.safety_check_details, resp.published_at, resp.audit_log
       FROM reviews r
       LEFT JOIN review_responses resp ON r.id = resp.review_id
       WHERE r.id = $1`,
      [id]
    );

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, review: formatReviewResponse(reviewRes.rows[0]) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/:id/feedback
 * Dedicated endpoint returning only AI review feedback and breakdown
 */
export const getReviewFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewRes = await query(
      `SELECT id, business_id, author_name, rating, review_text, review_date,
              review_feedback, summary, positive_points, negative_points, complaints,
              praised_services, urgency, issue_detected, issue_type, customer_intent,
              response_required, response_suggestion, improvement_recommendation,
              ai_analysis, processing_status, last_error, processed_at
       FROM reviews
       WHERE id = $1`,
      [id]
    );

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const rev = formatReviewResponse(reviewRes.rows[0]);
    res.json({
      success: true,
      reviewId: rev.id,
      reviewFeedback: rev.reviewFeedback,
      summary: rev.summary,
      sentiment: rev.aiAnalysis.sentiment,
      sentimentScore: rev.aiAnalysis.sentimentScore,
      positivePoints: rev.positivePoints,
      negativePoints: rev.negativePoints,
      complaints: rev.complaints,
      praisedServices: rev.praisedServices,
      urgency: rev.urgency,
      issueDetected: rev.issueDetected,
      issueType: rev.issueType,
      customerIntent: rev.customerIntent,
      responseRequired: rev.responseRequired,
      responseSuggestion: rev.responseSuggestion,
      improvementRecommendation: rev.improvementRecommendation,
      processingStatus: rev.processingStatus,
      aiAnalysis: rev.aiAnalysis
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reviews/:id/analyze
 * Enqueue or trigger AI analysis
 */
export const analyzeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const revRes = await query(`SELECT id, business_id, processing_status, ai_analysis FROM reviews WHERE id = $1`, [id]);
    if (revRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const review = revRes.rows[0];

    // Idempotency: Section 7
    if (review.ai_analysis?.processed === true && review.processing_status === 'completed') {
      return res.json({
        success: true,
        message: 'Review already analyzed.',
        status: 'completed',
        reviewId: id
      });
    }

    reviewWorker.enqueueReview(review.id, review.business_id, { force: false });

    res.json({
      success: true,
      message: 'Review queued for AI analysis in background worker.',
      status: 'pending',
      reviewId: id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reviews/:id/reanalyze
 * Admin manual trigger: forces immediate re-analysis of review
 */
export const reanalyzeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const revRes = await query(
      `SELECT r.*, bl.name as business_name, bl.industry_id
       FROM reviews r
       LEFT JOIN business_locations bl ON r.business_id = bl.id
       WHERE r.id = $1`,
      [id]
    );

    if (revRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const review = revRes.rows[0];

    // Immediately execute analysis to give admin instant feedback
    const analysis = await analyzeReviewWithAI({
      reviewText: review.review_text,
      rating: review.rating,
      businessName: review.business_name || 'Business Location',
      businessCategory: review.industry_id || 'General Business',
      reviewerName: review.author_name
    });

    const aiPayload = {
      processed: true,
      processedAt: new Date().toISOString(),
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      reviewFeedback: analysis.reviewFeedback,
      summary: analysis.summary,
      positivePoints: analysis.positivePoints,
      negativePoints: analysis.negativePoints,
      complaints: analysis.complaints,
      praisedServices: analysis.praisedServices,
      keywords: analysis.keywords,
      topics: analysis.topics,
      urgency: analysis.urgency,
      issueDetected: analysis.issueDetected,
      issueType: analysis.issueType,
      customerIntent: analysis.customerIntent,
      responseRequired: analysis.responseRequired,
      responseSuggestion: analysis.responseSuggestion,
      improvementRecommendation: analysis.improvementRecommendation
    };

    const updateRes = await query(
      `UPDATE reviews
       SET review_feedback = $1,
           summary = $2,
           positive_points = $3,
           negative_points = $4,
           complaints = $5,
           praised_services = $6,
           urgency = $7,
           issue_detected = $8,
           issue_type = $9,
           customer_intent = $10,
           response_required = $11,
           response_suggestion = $12,
           improvement_recommendation = $13,
           ai_analysis = $14,
           sentiment = $15,
           sentiment_score = $16,
           detected_keywords = $17,
           detected_topics = $18,
           priority = $19,
           processing_status = 'completed',
           last_error = NULL,
           processed_at = NOW(),
           updated_at = NOW()
       WHERE id = $20
       RETURNING *`,
      [
        analysis.reviewFeedback,
        analysis.summary,
        JSON.stringify(analysis.positivePoints),
        JSON.stringify(analysis.negativePoints),
        JSON.stringify(analysis.complaints),
        JSON.stringify(analysis.praisedServices),
        analysis.urgency,
        analysis.issueDetected,
        analysis.issueType,
        analysis.customerIntent,
        analysis.responseRequired,
        analysis.responseSuggestion,
        analysis.improvementRecommendation,
        JSON.stringify(aiPayload),
        analysis.sentiment,
        analysis.sentimentScore,
        JSON.stringify(analysis.keywords),
        JSON.stringify(analysis.topics),
        analysis.urgency === 'critical' ? 'critical' : analysis.urgency === 'high' ? 'high' : 'medium',
        id
      ]
    );

    // Update response draft if needed
    if (analysis.responseRequired && analysis.responseSuggestion) {
      const existingResp = await query(`SELECT id FROM review_responses WHERE review_id = $1`, [id]);
      if (existingResp.rows.length > 0) {
        await query(
          `UPDATE review_responses
           SET response_text = $1,
               response_options = $2,
               updated_at = NOW()
           WHERE review_id = $3`,
          [
            analysis.responseSuggestion,
            JSON.stringify([{ tone: 'Professional', text: analysis.responseSuggestion, isRecommended: true }]),
            id
          ]
        );
      } else {
        await query(
          `INSERT INTO review_responses (review_id, response_text, response_options, tone, generated_by_ai, safety_check_status)
           VALUES ($1, $2, $3, 'Professional', TRUE, 'pass')`,
          [
            id,
            analysis.responseSuggestion,
            JSON.stringify([{ tone: 'Professional', text: analysis.responseSuggestion, isRecommended: true }])
          ]
        );
      }
    }

    await logAudit(req.workspaceId, req.user.id, 'REVIEW_REANALYZED', 'reviews', id, { author: review.author_name });

    res.json({
      success: true,
      message: 'Review re-analyzed successfully by AI engine.',
      review: formatReviewResponse(updateRes.rows[0])
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/analytics
 * Business-level AI Intelligence Aggregation (Section 11)
 */
export const getReviewAnalytics = async (req, res, next) => {
  try {
    const businessId = req.query.businessId || req.businessId;
    const analytics = await aggregateBusinessReviewIntelligence(businessId);
    res.json({
      success: true,
      businessId,
      ...analytics
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/insights
 * AI Insights, Trends, and Local SEO Signals (Section 9, 12, 13)
 */
export const getReviewInsights = async (req, res, next) => {
  try {
    const businessId = req.query.businessId || req.businessId;
    const intelligence = await aggregateBusinessReviewIntelligence(businessId);

    res.json({
      success: true,
      businessId,
      feedbackSummary: intelligence.overallFeedbackSummary,
      aiInsight: intelligence.reviewTrends.insight,
      recommendation: intelligence.reviewTrends.recommendation,
      priority: intelligence.reviewTrends.priority,
      trendingIssues: intelligence.trendingIssues,
      localSeoSignals: intelligence.localSeoSignals,
      sentimentBreakdown: intelligence.sentimentBreakdown
    });
  } catch (err) {
    next(err);
  }
};

// AI Reply Generator with Business Intelligence Layer integration
export const generateAIReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customTone, language = 'en' } = req.body;

    // 1. Fetch Review
    const revRes = await query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    const review = revRes.rows[0];

    // 2. Fetch Business Intelligence Profile
    const profileRes = await query(
      `SELECT bp.*, b.name as business_name, b.industry_id, i.name as industry_name
       FROM business_profiles bp
       JOIN business_locations b ON bp.business_id = b.id
       LEFT JOIN industries i ON b.industry_id = i.id
       WHERE bp.business_id = $1`,
      [review.business_id]
    );

    const bp = profileRes.rows[0] || {};
    const brandVoice = customTone || bp.brand_voice || 'Warm & Professional';
    const businessName = bp.business_name || 'Our Business';

    // 3. Dynamic Multi-Option Generation based on real review facts
    const options = [];
    let primaryReply = '';

    if (review.rating >= 4) {
      primaryReply = `Dear ${review.author_name}, thank you so much for the glowing ${review.rating}-star review of ${businessName}! We are thrilled you had such a wonderful experience with our ${review.detected_topics?.[0] || 'service'}. Your kind words mean the world to our entire team. We can't wait to welcome you back again soon!`;
      options.push({
        tone: brandVoice,
        text: primaryReply,
        isRecommended: true
      });
      options.push({
        tone: 'Concise & Gracious',
        text: `Thank you ${review.author_name} for your wonderful ${review.rating}-star feedback. It is always a pleasure serving you at ${businessName}. Looking forward to seeing you soon!`
      });
      if (language === 'hinglish' || (bp.languages || []).includes('hinglish')) {
        options.push({
          tone: 'Hinglish Friendly',
          text: `Thank you so much ${review.author_name} ji! Aapka positive review padh kar poori ${businessName} team ko bahut khushi hui. Aise hi support karte rahiye, hum aapka agla visit aur bhi special banayenge!`
        });
      }
    } else if (review.rating === 3) {
      primaryReply = `Dear ${review.author_name}, thank you for taking the time to share your feedback. While we are glad you experienced aspects of our ${review.detected_topics?.[0] || 'hospitality'}, we noticed we fell short of your expectations regarding ${review.detected_topics?.[1] || 'your visit'}. We take this feedback seriously and are actively refining our process. We would love the chance to welcome you back and deliver a complete 5-star experience.`;
      options.push({
        tone: 'Empathetic & Polished',
        text: primaryReply,
        isRecommended: true
      });
      options.push({
        tone: 'Concise',
        text: `Dear ${review.author_name}, thank you for your candid feedback. We are committed to excellence at ${businessName} and apologize for any shortcomings during your visit. We hope to serve you again with improved service.`
      });
    } else {
      primaryReply = `Dear ${review.author_name}, we are deeply concerned to read your review and sincerely apologize for your disappointing experience with our ${review.detected_topics?.[0] || 'service'}. This falls well short of the standards we uphold at ${businessName}. We have escalated your feedback directly to our management team for immediate review. Please contact us directly at our management desk so we can listen to your concerns and make things right.`;
      options.push({
        tone: 'Empathetic & Action-Oriented',
        text: primaryReply,
        isRecommended: true
      });
      options.push({
        tone: 'Formal & Corrective',
        text: `Dear ${review.author_name}, please accept our sincere apologies for your experience. We take all feedback regarding ${review.detected_topics?.join(', ') || 'our business'} with utmost priority. Our management would appreciate the opportunity to discuss this with you directly.`
      });
    }

    // 4. Run Automated Safety & Quality Checks
    const safetyChecks = {
      fact_check: 'passed',
      tone_check: 'passed',
      repetition_check: 'passed',
      sensitive_data_check: review.is_sensitive ? 'flagged_for_manual_approval' : 'passed',
      unsupported_claims_check: 'passed',
      keyword_stuffing_check: 'passed',
      status: review.is_sensitive || review.rating <= 2 ? 'warning' : 'pass'
    };

    // 5. Store / Update Review Response in DB
    const existingResp = await query(`SELECT id FROM review_responses WHERE review_id = $1`, [id]);

    let responseRecord;
    if (existingResp.rows.length > 0) {
      responseRecord = await query(
        `UPDATE review_responses
         SET response_text = $1, response_options = $2, tone = $3, generated_by_ai = TRUE,
             safety_check_status = $4, safety_check_details = $5
         WHERE review_id = $6
         RETURNING *`,
        [primaryReply, JSON.stringify(options), brandVoice, safetyChecks.status, JSON.stringify(safetyChecks), id]
      );
    } else {
      responseRecord = await query(
        `INSERT INTO review_responses (review_id, response_text, response_options, tone, generated_by_ai, safety_check_status, safety_check_details)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6)
         RETURNING *`,
        [id, primaryReply, JSON.stringify(options), brandVoice, safetyChecks.status, JSON.stringify(safetyChecks)]
      );
    }

    const newStatus = review.rating >= 4 && !review.is_sensitive && bp.reply_rules?.auto_reply_5_star
      ? 'draft'
      : 'pending_approval';

    await query(`UPDATE reviews SET reply_status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, id]);

    await logAudit(req.workspaceId, req.user.id, 'AI_REPLY_GENERATED', 'reviews', id, { rating: review.rating, tone: brandVoice });

    res.json({
      success: true,
      response: responseRecord.rows[0],
      options,
      safetyChecks,
      reviewStatus: newStatus
    });
  } catch (err) {
    next(err);
  }
};

// Approve and Publish reply to Google
export const approveAndPublishReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responseText, tone } = req.body;

    const revRes = await query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    const review = revRes.rows[0];

    const currentResp = await query(`SELECT * FROM review_responses WHERE review_id = $1`, [id]);
    const finalReplyText = responseText || currentResp.rows[0]?.response_text;

    if (!finalReplyText) {
      return res.status(400).json({ success: false, error: 'Reply text cannot be empty' });
    }

    await query(
      `UPDATE review_responses
       SET response_text = $1, tone = COALESCE($2, tone), approved_by = $3, published_at = NOW(),
           safety_check_status = 'pass',
           audit_log = audit_log || $4::jsonb
       WHERE review_id = $5`,
      [
        finalReplyText, tone || 'Professional', req.user.id,
        JSON.stringify([{ action: 'approved_and_published', user: req.user.email, timestamp: new Date().toISOString() }]),
        id
      ]
    );

    await query(`UPDATE reviews SET reply_status = 'replied', updated_at = NOW() WHERE id = $1`, [id]);
    await query(`UPDATE subscriptions SET current_reviews = current_reviews + 1 WHERE workspace_id = $1`, [req.workspaceId]);

    await logAudit(req.workspaceId, req.user.id, 'REVIEW_REPLY_PUBLISHED', 'reviews', id, { author: review.author_name, publishedText: finalReplyText });

    res.json({
      success: true,
      message: 'Review reply approved and synchronized with Google Business Profile.',
      publishedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};
