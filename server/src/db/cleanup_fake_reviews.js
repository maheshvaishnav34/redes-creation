import { query, pool } from '../config/db.js';

async function cleanupFakeReviews() {
  console.log('[CLEANUP] Starting cleanup of synthetic/mock reviews...');
  try {
    // Delete reviews matching legacy test prefixes or invalid author names
    const res = await query(`
      DELETE FROM reviews 
      WHERE gbp_review_id LIKE 'gbp_sync_%'
         OR gbp_review_id LIKE 'gpost_%'
         OR gbp_review_id LIKE 'camp_%'
         OR gbp_review_id LIKE 'gbp_rev_%'
         OR gbp_review_id LIKE 'accounts/1089283748291029%'
         OR LENGTH(author_name) > 60
    `);
    console.log(`[CLEANUP] Successfully purged ${res.rowCount} synthetic mock reviews!`);

    // Clean review responses linked to non-existent reviews
    await query(`
      DELETE FROM review_responses 
      WHERE review_id NOT IN (SELECT id FROM reviews)
    `);

    console.log('[CLEANUP] Database is clean and ready for real Google reviews.');
  } catch (err) {
    console.error('[CLEANUP] Error during cleanup:', err.message);
  } finally {
    await pool.end();
  }
}

cleanupFakeReviews();
