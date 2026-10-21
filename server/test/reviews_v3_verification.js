import { query, pool } from '../src/config/db.js';
import { aggregateBusinessReviewIntelligence } from '../src/modules/reviews/reviewIntelligence.service.js';

async function verifyReviewsV3() {
  console.log('[VERIFICATION] Starting Reviews & Local SEO Intelligence Verification...');

  // 1. Check all businesses have reviews
  const bizRes = await query('SELECT id, name FROM business_locations');
  console.log(`[VERIFICATION] Verifying ${bizRes.rows.length} businesses...`);

  for (const b of bizRes.rows) {
    const revRes = await query('SELECT count(*) as count FROM reviews WHERE business_id = $1', [b.id]);
    const count = parseInt(revRes.rows[0].count, 10);
    console.log(`✓ Business "${b.name}" (${b.id.slice(0, 8)}...): ${count} Google reviews`);
    if (count === 0) {
      throw new Error(`Business "${b.name}" has 0 reviews! Every account must have full reviews.`);
    }
  }

  // 2. Check Review ID types
  const sampleRev = await query(`
    SELECT id, gbp_review_id, author_name, author_type, author_level, author_review_count, review_source, review_url, has_photos, photo_count
    FROM reviews
    LIMIT 3
  `);
  console.log('\n[VERIFICATION] Sample Review ID Types:');
  sampleRev.rows.forEach(r => {
    console.log(`- Author: ${r.author_name} | Type: ${r.author_type} (Lv ${r.author_level}) | ID: ${r.gbp_review_id} | URL: ${r.review_url}`);
    if (!r.gbp_review_id || !r.author_type || !r.review_url) {
      throw new Error('Missing review ID structure!');
    }
  });

  // 3. Test Review & Local SEO Intelligence Aggregation
  const saffronId = '60ebc30d-4e54-4d5c-921c-34878b67ce27';
  const intel = await aggregateBusinessReviewIntelligence(saffronId);
  console.log('\n[VERIFICATION] Review & Local SEO Intelligence for Saffron:');
  console.log(`- Total Reviews: ${intel.totalReviews}`);
  console.log(`- Overall Review Authority: ${intel.localSeoScorecard?.overallReviewAuthority}/100`);
  console.log(`- Review Velocity: ${intel.localSeoScorecard?.reviewVelocity}`);
  console.log(`- Local Pack Visibility Boost: ${intel.localSeoScorecard?.localPackVisibilityBoost}`);
  console.log(`- Keyword Rank Correlations (${intel.keywordRankCorrelations?.length}):`, intel.keywordRankCorrelations?.slice(0, 2));
  console.log(`- Untracked Opportunities (${intel.untrackedOpportunities?.length}):`, intel.untrackedOpportunities?.slice(0, 2));

  console.log('\n[VERIFICATION] ALL TESTS PASSED SUCCESSFULLY! ✓');
  await pool.end();
}

verifyReviewsV3()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
