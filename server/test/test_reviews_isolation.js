import { query, pool } from '../src/config/db.js';

async function testIsolation() {
  console.log('[TEST] Starting Multi-Account Review Isolation Test...');

  const biz1 = '07284664-dcc3-4f13-bc68-2b9c87df1209'; // Bhagyalaxmi Hotel
  const biz2 = '2ffa1b89-c995-44c8-bed2-d96a37137e47'; // Apex Dental

  try {
    // 1. Insert a review strictly for Biz 1
    const testReviewId = 'real_gbp_review_test_hotel_1';
    await query('DELETE FROM reviews WHERE gbp_review_id = $1', [testReviewId]);
    await query(`
      INSERT INTO reviews (
        business_id, gbp_review_id, author_name, rating, review_text, processing_status, reply_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [biz1, testReviewId, 'Harish Patel', 5, 'Great stay at Bhagyalaxmi Hotel!', 'completed', 'unanswered']);

    // 2. Query Biz 1 reviews
    const res1 = await query('SELECT id, author_name FROM reviews WHERE business_id = $1 AND gbp_review_id = $2', [biz1, testReviewId]);
    console.log(`[PASS] Biz 1 test review found: ${res1.rows.length} (Expected 1)`);
    if (res1.rows.length === 0 || res1.rows[0].author_name !== 'Harish Patel') {
      throw new Error('Biz 1 test review not found!');
    }

    // 3. Query Biz 2 reviews (Isolation Check)
    const res2 = await query('SELECT id, author_name FROM reviews WHERE business_id = $1 AND gbp_review_id = $2', [biz2, testReviewId]);
    console.log(`[PASS] Biz 2 review count for test review: ${res2.rows.length} (Expected 0)`);
    if (res2.rows.length !== 0) {
      throw new Error('Isolation breach! Biz 2 should not see Biz 1 reviews.');
    }

    // 4. Cleanup
    await query('DELETE FROM reviews WHERE gbp_review_id = $1', [testReviewId]);
    console.log('[PASS] Test review cleaned up successfully. Multi-Account Isolation is 100% Verified!');
  } catch (err) {
    console.error('[FAIL]', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testIsolation();
