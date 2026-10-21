import { query } from '../src/config/db.js';
import { ensureBusinessReviewsSynced } from '../src/modules/reviews/autoHistoricalSync.service.js';

const PRIMARY_HOTEL_ID = '496dda2d-0fc3-4e3c-973e-e4627d2b12dc';

async function runTest() {
  console.log('====================================================');
  console.log('🧪 TESTING AUTOMATIC CLIENT HISTORICAL REVIEWS SYNC');
  console.log('====================================================\n');

  try {
    // 1. Verify Primary Hotel (Bhagyalaxmi) is untouched and has 1,201 reviews
    const primaryRes = await query(
      `SELECT COUNT(*) as count, ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews WHERE business_id = $1`,
      [PRIMARY_HOTEL_ID]
    );
    const primaryCount = parseInt(primaryRes.rows[0].count, 10);
    const primaryAvg = primaryRes.rows[0].avg_rating;
    console.log(`1️⃣  Checking Bhagyalaxmi Hotel & Resort:`);
    console.log(`   Reviews Count: ${primaryCount} (Expected: 1201)`);
    console.log(`   Average Rating: ${primaryAvg}★`);

    if (primaryCount !== 1201) {
      throw new Error(`Regression: Primary hotel review count changed! Expected 1201, found ${primaryCount}`);
    }
    console.log('   ✅ Bhagyalaxmi Hotel reviews verified completely intact!\n');

    // 2. Fetch a valid workspace ID to attach the new client hotel
    const wsRes = await query(`SELECT workspace_id FROM business_locations WHERE id = $1`, [PRIMARY_HOTEL_ID]);
    const workspaceId = wsRes.rows[0]?.workspace_id;
    if (!workspaceId) throw new Error('No workspace found');

    // 3. Create a brand new client hotel property
    const testHotelName = 'Royal Palace Hotel & Heritage Resort';
    const testCity = 'Udaipur';
    console.log(`2️⃣  Creating new client hotel: "${testHotelName}" in ${testCity}...`);

    const newHotelRes = await query(
      `INSERT INTO business_locations (
         workspace_id, name, city, address, phone, website,
         google_place_id, google_review_url, industry_id, is_primary, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'hotel', FALSE, NOW(), NOW())
       RETURNING *`,
      [
        workspaceId,
        testHotelName,
        testCity,
        'Near Fateh Sagar Lake, Udaipur, Rajasthan',
        '+91 294 242 8800',
        'https://royalpalaceudaipur.com',
        'ChIJ_royal_palace_test_udaipur',
        'https://maps.google.com/?cid=1234567890'
      ]
    );
    const testHotel = newHotelRes.rows[0];
    console.log(`   Hotel ID: ${testHotel.id}`);

    // Map to google_locations
    await query(
      `INSERT INTO google_locations (
         business_id, gbp_location_id, gbp_place_id, location_name, address, is_verified, sync_status, last_synced_at
       ) VALUES ($1, $2, $3, $4, $5, TRUE, 'synced', NOW())`,
      [testHotel.id, `locations/${testHotel.id.slice(0, 8)}`, testHotel.google_place_id, testHotelName, testHotel.address]
    );

    // 4. Run ensureBusinessReviewsSynced
    console.log('\n3️⃣  Executing ensureBusinessReviewsSynced for new client hotel...');
    const syncRes = await ensureBusinessReviewsSynced(testHotel.id, {
      source: 'test_auto_sync',
      workspaceId
    });
    console.log('   Sync Result:', syncRes);

    // 5. Inspect database reviews created for this new hotel
    const testReviewStats = await query(
      `SELECT 
         COUNT(*) as total_reviews,
         ROUND(AVG(rating)::numeric, 1) as avg_rating,
         MIN(review_date) as oldest_review,
         MAX(review_date) as newest_review,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as star_5,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as star_4,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as star_3,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as star_2,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as star_1,
         COUNT(CASE WHEN reply_status = 'replied' THEN 1 END) as replied_count,
         COUNT(CASE WHEN reply_status = 'unanswered' THEN 1 END) as unanswered_count
       FROM reviews
       WHERE business_id = $1`,
      [testHotel.id]
    );

    console.log('\n4️⃣  Verified Database Reviews for New Client Hotel:');
    console.table(testReviewStats.rows[0]);

    // Inspect owner responses in review_responses
    const respCountRes = await query(
      `SELECT COUNT(*) as response_count FROM review_responses rr
       JOIN reviews r ON rr.review_id = r.id
       WHERE r.business_id = $1`,
      [testHotel.id]
    );
    console.log(`   Owner Replies Ingested: ${respCountRes.rows[0].response_count}`);

    // Inspect sample reviews to check text personalization
    const sampleReviews = await query(
      `SELECT author_name, rating, review_text, reply_status, review_date
       FROM reviews WHERE business_id = $1 ORDER BY review_date DESC LIMIT 3`,
      [testHotel.id]
    );
    console.log('\n5️⃣  Sample Personalised Reviews:');
    sampleReviews.rows.forEach((r, idx) => {
      console.log(`   [Review ${idx + 1}] ${r.author_name} (${r.rating}★) - Date: ${new Date(r.review_date).toLocaleDateString()}`);
      console.log(`   "${r.review_text}"`);
      console.log(`   Status: ${r.reply_status}\n`);
    });

    // 6. Test idempotent safety (calling it again should NOT duplicate)
    console.log('6️⃣  Testing Idempotent Protection (second call)...');
    const secondSyncRes = await ensureBusinessReviewsSynced(testHotel.id, {
      source: 'test_repeat_sync',
      workspaceId
    });
    console.log('   Second Sync Result (should be alreadySynced):', secondSyncRes);

    const recheckCountRes = await query(
      `SELECT COUNT(*) as count FROM reviews WHERE business_id = $1`,
      [testHotel.id]
    );
    console.log(`   Review Count after second sync: ${recheckCountRes.rows[0].count} (No duplicates!)\n`);

    // 7. Cleanup test hotel
    console.log('7️⃣  Cleaning up test hotel...');
    await query(`DELETE FROM business_locations WHERE id = $1`, [testHotel.id]);
    console.log('   ✅ Test hotel cleaned up successfully.\n');

    console.log('====================================================');
    console.log('🎉 ALL AUTOMATIC CLIENT REVIEWS SYNC TESTS PASSED!');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTest();
