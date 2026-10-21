import 'dotenv/config';
import { query } from '../config/db.js';

export async function migrateDualConnections() {
  console.log('🔄 Running Dual Connection & Multi-Tenant Schema Migration...');

  try {
    // 1. Add dual-connection fields to google_connections
    await query(`
      ALTER TABLE google_connections
      ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'business_profile',
      ADD COLUMN IF NOT EXISTS place_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'connected',
      ADD COLUMN IF NOT EXISTS total_reviews_indexed INTEGER DEFAULT 0;
    `);
    console.log('  ✓ Updated google_connections table');

    // 2. Add connection_type to google_locations
    await query(`
      ALTER TABLE google_locations
      ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'business_profile',
      ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(50) DEFAULT 'daily';
    `);
    console.log('  ✓ Updated google_locations table');

    // 3. Ensure business_locations supports Google Place ID and Maps review URL directly
    await query(`
      ALTER TABLE business_locations
      ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS google_review_url TEXT;
    `);
    console.log('  ✓ Updated business_locations table');

    console.log('✅ Dual Connection Schema migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('migrate_dual_connection.js')) {
  migrateDualConnections()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
