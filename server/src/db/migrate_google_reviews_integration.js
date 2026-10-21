import { query, pool } from '../config/db.js';

async function migrateGoogleReviewsIntegration() {
  console.log('🚀 [MIGRATION] Starting Google Reviews Integration schema updates...');

  // 1. Create google_sync_history table
  await query(`
    CREATE TABLE IF NOT EXISTS google_sync_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
      google_connection_id UUID REFERENCES google_connections(id) ON DELETE SET NULL,
      sync_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'webhook'
      status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed', 'partial'
      reviews_found INT DEFAULT 0,
      reviews_imported INT DEFAULT 0,
      new_reviews_count INT DEFAULT 0,
      error_message TEXT,
      duration_ms INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('  ✓ Created google_sync_history table');

  // Index for fast query by business
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sync_history_biz ON google_sync_history(business_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sync_history_workspace ON google_sync_history(workspace_id, created_at DESC);
  `);
  console.log('  ✓ Created indexes on google_sync_history');

  // 2. Ensure unique index on (business_id, gbp_review_id) in reviews to guarantee 100% duplicate prevention
  // First clean up any accidental duplicates if any exist
  await query(`
    DELETE FROM reviews a USING reviews b
    WHERE a.id > b.id 
      AND a.business_id = b.business_id 
      AND a.gbp_review_id IS NOT NULL 
      AND a.gbp_review_id = b.gbp_review_id;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_biz_gbp ON reviews(business_id, gbp_review_id);
  `);
  console.log('  ✓ Created UNIQUE INDEX idx_reviews_biz_gbp on reviews(business_id, gbp_review_id)');

  // 3. Ensure columns on google_connections for token expiry and account tracking
  await query(`
    ALTER TABLE google_connections
      ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS scopes TEXT,
      ADD COLUMN IF NOT EXISTS google_account_id VARCHAR(255);
  `);
  console.log('  ✓ Ensured google_connections columns');

  console.log('🎉 [MIGRATION COMPLETE] Google Reviews integration schema ready.');
  await pool.end();
}

migrateGoogleReviewsIntegration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
