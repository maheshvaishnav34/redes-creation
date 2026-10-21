import 'dotenv/config';
import { query } from '../config/db.js';

export async function migrateStrictTenantIsolation() {
  console.log('🔄 Running Strict Multi-Tenant Schema & Index Migration...');

  try {
    // 1. Ensure unique constraint on workspace_id for google_connections (per-workspace 1:1 connection)
    // First, deduplicate if any duplicates exist per workspace
    await query(`
      DELETE FROM google_connections
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT DISTINCT ON (workspace_id) id
          FROM google_connections
          WHERE workspace_id IS NOT NULL
          ORDER BY workspace_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        ) t
      ) AND workspace_id IS NOT NULL;
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_google_connections_workspace 
      ON google_connections(workspace_id);
    `);
    console.log('  ✓ Unique index on google_connections(workspace_id) established');

    // 2. High-performance tenant isolation indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_business_locations_workspace 
      ON business_locations(workspace_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_business_id 
      ON reviews(business_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_review_campaigns_business_id 
      ON review_campaigns(business_id);
    `);
    console.log('  ✓ Multi-tenant scoping indexes established');

    console.log('✅ Strict Multi-Tenant Schema Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('migrate_strict_tenant_isolation.js')) {
  migrateStrictTenantIsolation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
