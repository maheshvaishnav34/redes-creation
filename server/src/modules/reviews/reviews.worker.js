/**
 * Google Review + Local SEO Intelligence System
 * Background Queue & Worker for Automatic Review Feedback Analysis
 * 
 * Pipeline:
 * Google Review Sync -> Database -> Review Analysis Queue -> AI Worker
 * -> Database Update -> Analytics Aggregation -> Dashboard
 */
import { query } from '../../config/db.js';
import { analyzeReviewWithAI } from './reviewAnalysis.service.js';

class ReviewAnalysisWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.activeJobs = new Set(); // businessId + reviewId deduplication set
    this.maxRetries = 3;
    this.syncInterval = null;
  }

  /**
   * Initialize worker and start 15-minute background sync polling
   */
  start() {
    console.log('🚀 [REVIEW_WORKER] Background Review Analysis Worker started.');
    // Check for any backlog of pending reviews immediately on boot
    this.scanAndEnqueuePendingReviews().catch(err => {
      console.error('[REVIEW_WORKER] Error in initial scan:', err.message);
    });

    // Run periodic sync / sweep every 15 minutes as per Section 8
    this.syncInterval = setInterval(() => {
      console.log('⏰ [REVIEW_WORKER] Running periodic review synchronization sweep (15m interval)...');
      this.scanAndEnqueuePendingReviews().catch(err => {
        console.error('[REVIEW_WORKER] Periodic sync sweep error:', err.message);
      });
    }, 15 * 60 * 1000);
  }

  stop() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    console.log('[REVIEW_WORKER] Background Review Analysis Worker stopped.');
  }

  /**
   * Idempotent Enqueue
   * Prevents duplicate jobs using `businessId + reviewId`
   */
  enqueueReview(reviewId, businessId, { force = false } = {}) {
    const jobKey = `${businessId}:${reviewId}`;

    if (!force && this.activeJobs.has(jobKey)) {
      console.log(`[REVIEW_WORKER] Job already in queue for review ${reviewId}, skipping.`);
      return false;
    }

    this.activeJobs.add(jobKey);
    this.queue.push({
      reviewId,
      businessId,
      jobKey,
      force,
      enqueuedAt: new Date()
    });

    console.log(`📥 [REVIEW_WORKER] Enqueued review ${reviewId} (Queue size: ${this.queue.length})`);
    this.triggerProcessing();
    return true;
  }

  /**
   * Scan database for any reviews with pending status or unprocessed AI analysis
   */
  async scanAndEnqueuePendingReviews(specificBusinessId = null) {
    try {
      let sql = `
        SELECT r.id, r.business_id, r.processing_status, r.ai_analysis
        FROM reviews r
        WHERE (r.processing_status = 'pending' 
           OR r.ai_analysis IS NULL 
           OR (r.ai_analysis->>'processed') IS NULL 
           OR (r.ai_analysis->>'processed') != 'true')
      `;
      const params = [];
      if (specificBusinessId) {
        sql += ` AND r.business_id = $1`;
        params.push(specificBusinessId);
      }
      sql += ` ORDER BY r.created_at DESC LIMIT 50`;

      const result = await query(sql, params);
      for (const row of result.rows) {
        this.enqueueReview(row.id, row.business_id, { force: false });
      }
    } catch (err) {
      console.error('[REVIEW_WORKER] Failed to scan pending reviews:', err.message);
    }
  }

  /**
   * Worker Loop
   */
  triggerProcessing() {
    if (this.isProcessing) return;
    this.processNextJob();
  }

  async processNextJob() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      await this.processJob(job);
    } catch (err) {
      console.error(`❌ [REVIEW_WORKER] Job failed for review ${job.reviewId}:`, err);
    } finally {
      this.activeJobs.delete(job.jobKey);
      // Process next job asynchronously
      setImmediate(() => this.processNextJob());
    }
  }

  /**
   * Core Job Processor
   */
  async processJob(job) {
    const { reviewId, businessId, force } = job;
    console.log(`⚙️ [REVIEW_WORKER] Processing review analysis for ID: ${reviewId} (Business: ${businessId})`);

    // 1. Fetch review and full niche intelligence context
    const reviewRes = await query(
      `SELECT r.*, bl.name as business_name, bl.industry_id, bl.subcategory_name, bl.city,
              bp.services, bp.brand_voice, bp.prohibited_claims, bp.customer_intents
       FROM reviews r
       LEFT JOIN business_locations bl ON r.business_id = bl.id
       LEFT JOIN business_profiles bp ON bl.id = bp.business_id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (reviewRes.rows.length === 0) {
      console.warn(`[REVIEW_WORKER] Review ${reviewId} not found in database.`);
      return;
    }

    const review = reviewRes.rows[0];

    // Duplicate check: Section 7 - Prevent Duplicate Processing
    if (!force && review.ai_analysis?.processed === true && review.processing_status === 'completed') {
      console.log(`[REVIEW_WORKER] Review ${reviewId} is already processed. Skipping.`);
      return;
    }

    // 2. Mark processing status
    await query(
      `UPDATE reviews SET processing_status = 'processing', updated_at = NOW() WHERE id = $1`,
      [reviewId]
    );

    // 3. Execute Niche-Aware AI Analysis
    try {
      const analysis = await analyzeReviewWithAI({
        reviewText: review.review_text,
        rating: review.rating,
        businessName: review.business_name || 'Business Location',
        businessCategory: review.industry_id || 'General Business',
        industry: review.industry_id,
        subCategory: review.subcategory_name,
        services: review.services || [],
        brandVoice: review.brand_voice,
        prohibitedClaims: review.prohibited_claims || [],
        customerIntent: review.customer_intents?.[0] || 'visit',
        location: review.city,
        reviewerName: review.author_name
      });

      console.log(`✨ [REVIEW_WORKER] AI Analysis complete for review ${reviewId}: Sentiment="${analysis.sentiment}", Score=${analysis.sentimentScore}, Feedback="${analysis.reviewFeedback.substring(0, 60)}..."`);

      // 4. Construct complete structured aiAnalysis object conforming to Section 1
      const aiAnalysisPayload = {
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

      // 5. Update Database Record
      await query(
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
         WHERE id = $20`,
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
          JSON.stringify(aiAnalysisPayload),
          analysis.sentiment,
          analysis.sentimentScore,
          JSON.stringify(analysis.keywords),
          JSON.stringify(analysis.topics),
          analysis.urgency === 'critical' ? 'critical' : analysis.urgency === 'high' ? 'high' : 'medium',
          reviewId
        ]
      );

      // 6. Section 14: If responseRequired is true and response_suggestion is available,
      // create/update response draft in review_responses if not already replied
      if (analysis.responseRequired && analysis.responseSuggestion) {
        const existingResp = await query(`SELECT id, published_at FROM review_responses WHERE review_id = $1`, [reviewId]);
        if (existingResp.rows.length === 0) {
          await query(
            `INSERT INTO review_responses (review_id, response_text, response_options, tone, generated_by_ai, safety_check_status)
             VALUES ($1, $2, $3, 'Professional', TRUE, 'pass')`,
            [
              reviewId,
              analysis.responseSuggestion,
              JSON.stringify([{ tone: 'Professional', text: analysis.responseSuggestion, isRecommended: true }])
            ]
          );
        } else if (!existingResp.rows[0].published_at) {
          await query(
            `UPDATE review_responses
             SET response_text = $1,
                 response_options = $2,
                 generated_by_ai = TRUE,
                 updated_at = NOW()
             WHERE id = $3`,
            [
              analysis.responseSuggestion,
              JSON.stringify([{ tone: 'Professional', text: analysis.responseSuggestion, isRecommended: true }]),
              existingResp.rows[0].id
            ]
          );
        }
      }

      console.log(`✅ [REVIEW_WORKER] Successfully saved review_feedback and AI analysis for review ${reviewId}`);
    } catch (err) {
      console.error(`❌ [REVIEW_WORKER] Error analyzing review ${reviewId}:`, err.message);

      // Record failure and increment retry count
      await query(
        `UPDATE reviews
         SET processing_status = 'failed',
             last_error = $1,
             retry_count = retry_count + 1,
             updated_at = NOW()
         WHERE id = $2`,
        [err.message, reviewId]
      );
      throw err;
    }
  }
}

export const reviewWorker = new ReviewAnalysisWorker();
