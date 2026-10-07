import { query, pool } from '../config/db.js';

async function migrateReviewsAi() {
  console.log('[MIGRATION] Adding AI Analysis & Review Feedback columns to `reviews` table...');
  try {
    // 1. Add columns to reviews table
    await query(`
      ALTER TABLE reviews 
        ADD COLUMN IF NOT EXISTS review_feedback TEXT,
        ADD COLUMN IF NOT EXISTS summary TEXT,
        ADD COLUMN IF NOT EXISTS positive_points JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS negative_points JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS complaints JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS praised_services JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS urgency VARCHAR(50) DEFAULT 'low',
        ADD COLUMN IF NOT EXISTS issue_detected BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS issue_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS customer_intent TEXT,
        ADD COLUMN IF NOT EXISTS response_required BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS response_suggestion TEXT,
        ADD COLUMN IF NOT EXISTS improvement_recommendation TEXT,
        ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS last_error TEXT,
        ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Add performance indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_processing_status ON reviews (processing_status);
      CREATE INDEX IF NOT EXISTS idx_reviews_business_created ON reviews (business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reviews_business_gbp ON reviews (business_id, gbp_review_id);
    `);

    console.log('✅ [MIGRATION] Successfully updated `reviews` table with AI analysis schema.');
  } catch (err) {
    console.error('❌ [MIGRATION] Migration failed:', err);
    throw err;
  }
}

migrateReviewsAi()
  .then(() => {
    console.log('[MIGRATION] Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
