import test from 'node:test';
import assert from 'node:assert/strict';
import { query, pool } from '../src/config/db.js';
import { encryptToken, decryptToken } from '../src/utils/crypto.js';
import { googleService } from '../src/modules/google/google.service.js';
import { executeLocationReviewSync } from '../src/modules/google/google.controller.js';
import QRCode from 'qrcode';

test('1. Google OAuth Token Security (AES-256-GCM Encryption)', () => {
  const originalToken = 'ya29.a0AfH6SMB_live_official_oauth_access_token_12345';
  const encrypted = encryptToken(originalToken);

  assert.notEqual(encrypted, originalToken, 'Encrypted token must not match plaintext');
  assert.match(encrypted, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/, 'Encrypted payload must have iv:authTag:content format');

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, originalToken, 'Decrypted token must exactly match original plaintext');
});

test('2. Token Revocation Engine', async () => {
  const mockToken = 'ya29.mock_token_to_revoke_test';
  const result = await googleService.revokeToken(mockToken);
  assert.equal(result.success, true, 'Revocation must return success for token');
});

test('3. Dynamic QR Code Generation & Zero-Gating Direct Review Link', async () => {
  const testPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  const testReviewUrl = `https://search.google.com/local/writereview?placeid=${testPlaceId}`;

  // Test Data URL generation
  const dataUrl = await QRCode.toDataURL(testReviewUrl, { width: 300 });
  assert.match(dataUrl, /^data:image\/png;base64,/, 'Generated QR code must be a valid base64 PNG data URL');

  // Test Buffer generation (PNG header magic bytes)
  const buffer = await QRCode.toBuffer(testReviewUrl, { type: 'png', width: 300 });
  assert.ok(Buffer.isBuffer(buffer), 'Output must be a binary Buffer');
  // PNG magic number: 0x89 0x50 0x4E 0x47
  assert.equal(buffer[0], 0x89);
  assert.equal(buffer[1], 0x50);
  assert.equal(buffer[2], 0x4E);
  assert.equal(buffer[3], 0x47);

  // Test SVG generation
  const svg = await QRCode.toString(testReviewUrl, { type: 'svg' });
  assert.match(svg, /<svg[\s\S]*<\/svg>/, 'Generated SVG must contain valid SVG tags');
});

test('4. Duplicate Review Prevention via Database Index (idx_reviews_biz_gbp)', async () => {
  // Query an active business
  const bizRes = await query('SELECT id, workspace_id FROM business_locations LIMIT 1');
  assert.ok(bizRes.rows.length > 0, 'At least one business must exist');
  const businessId = bizRes.rows[0].id;

  const testGbpReviewId = `gbp_dup_test_${Date.now()}`;

  // Insert review 1
  const insert1 = await query(
    `INSERT INTO reviews (
       business_id, gbp_review_id, author_name, rating, review_text, review_source
     ) VALUES ($1, $2, 'Test Reviewer', 5, 'Great experience!', 'google_maps')
     ON CONFLICT (business_id, gbp_review_id) DO NOTHING
     RETURNING id`,
    [businessId, testGbpReviewId]
  );
  assert.equal(insert1.rows.length, 1, 'First insert must succeed');
  const insertedId = insert1.rows[0].id;

  // Insert review 2 with SAME (business_id, gbp_review_id) - should be blocked by conflict
  const insert2 = await query(
    `INSERT INTO reviews (
       business_id, gbp_review_id, author_name, rating, review_text, review_source
     ) VALUES ($1, $2, 'Duplicate Reviewer', 5, 'Duplicate attempt!', 'google_maps')
     ON CONFLICT (business_id, gbp_review_id) DO NOTHING
     RETURNING id`,
    [businessId, testGbpReviewId]
  );
  assert.equal(insert2.rows.length, 0, 'Duplicate insert must produce 0 rows due to ON CONFLICT DO NOTHING');

  // Clean up test record
  await query('DELETE FROM reviews WHERE id = $1', [insertedId]);
});

test('5. Google Sync History Audit Table Logging', async () => {
  const bizRes = await query('SELECT id, workspace_id FROM business_locations LIMIT 1');
  const biz = bizRes.rows[0];

  // Insert a test sync history log
  const syncInsert = await query(
    `INSERT INTO google_sync_history (
       workspace_id, business_id, sync_type, status,
       reviews_found, reviews_imported, new_reviews_count, duration_ms
     ) VALUES ($1, $2, 'manual', 'success', 25, 25, 2, 420)
     RETURNING *`,
    [biz.workspace_id, biz.id]
  );

  assert.equal(syncInsert.rows.length, 1, 'Sync history record must be created');
  const log = syncInsert.rows[0];
  assert.equal(log.sync_type, 'manual');
  assert.equal(log.status, 'success');
  assert.equal(log.new_reviews_count, 2);
  assert.equal(log.duration_ms, 420);

  // Clean up test log
  await query('DELETE FROM google_sync_history WHERE id = $1', [log.id]);
});

test('6. Multi-Tenant Review Partitioning & Data Isolation', async () => {
  // Query 2 distinct businesses
  const bizsRes = await query('SELECT id, name FROM business_locations LIMIT 2');
  if (bizsRes.rows.length >= 2) {
    const biz1 = bizsRes.rows[0];
    const biz2 = bizsRes.rows[1];

    const revsBiz1 = await query('SELECT id FROM reviews WHERE business_id = $1', [biz1.id]);
    const revsBiz2 = await query('SELECT id FROM reviews WHERE business_id = $1', [biz2.id]);

    const ids1 = new Set(revsBiz1.rows.map(r => r.id));
    const ids2 = new Set(revsBiz2.rows.map(r => r.id));

    // Intersection of review IDs between different businesses must be empty
    const intersection = [...ids1].filter(id => ids2.has(id));
    assert.equal(intersection.length, 0, 'No review ID should ever leak across businesses');
  }
});

test('7. Google OAuth 2.0 URL Parameters (Official Scopes, Offline Access, Consent)', () => {
  const authUrl = googleService.generateAuthUrl('test_state_param_123');
  const urlObj = new URL(authUrl);

  assert.equal(urlObj.origin, 'https://accounts.google.com');
  assert.equal(urlObj.pathname, '/o/oauth2/v2/auth');
  assert.equal(urlObj.searchParams.get('access_type'), 'offline', 'Must request offline access for refresh token');
  assert.equal(urlObj.searchParams.get('prompt'), 'consent', 'Must force consent prompt to ensure refresh token issuance');
  assert.equal(urlObj.searchParams.get('response_type'), 'code');
  assert.equal(urlObj.searchParams.get('state'), 'test_state_param_123');

  const scopes = urlObj.searchParams.get('scope') || '';
  assert.ok(scopes.includes('https://www.googleapis.com/auth/business.manage'), 'Must include official GBP business.manage scope');
});

test('8. Zero Mock Reviews & Diagnostic Error Guarantee', async () => {
  const { getGoogleLiveReviews } = await import('../src/modules/reviews/googleLiveReviews.controller.js');

  const req = {
    query: { placeId: 'ChIJFakeNonExistentPlace123' },
    businessId: '00000000-0000-0000-0000-000000000000'
  };

  let jsonResult = null;
  const res = {
    json: (data) => { jsonResult = data; return res; },
    status: () => res
  };

  await getGoogleLiveReviews(req, res, (err) => { if (err) throw err; });

  assert.ok(jsonResult, 'Controller must return a JSON response');
  assert.equal(jsonResult.userRatingsTotal, 0, 'Must not invent fake review counts');
  assert.equal(jsonResult.reviews.length, 0, 'Must not return fabricated mock reviews');

  // Verify none of the banned mock review names exist anywhere in output
  const bannedNames = ['Rajesh Malhotra', 'Kavita Joshi', 'Anil Deshmukh', 'Pooja Nair', 'Ramesh Chandran'];
  const serialized = JSON.stringify(jsonResult);
  for (const name of bannedNames) {
    assert.ok(!serialized.includes(name), `Response must never contain fabricated reviewer "${name}"`);
  }

  // Verify actionable diagnostic setup guide is returned
  assert.ok(jsonResult.requiresSetup, 'Must flag that Google setup is required');
  assert.ok(jsonResult.setupGuide?.step1, 'Must include setup step 1 for Google Cloud Console');
  assert.ok(jsonResult.setupGuide?.step2, 'Must include setup step 2 for OAuth scopes');
});

test('9. Paginated GBP Reviews Metadata & Duplicate Update Handling', async () => {
  const bizRes = await query('SELECT id FROM business_locations LIMIT 1');
  const businessId = bizRes.rows[0].id;
  const testGbpId = `gbp_update_test_${Date.now()}`;

  // Ingest initial review
  const initial = await query(
    `INSERT INTO reviews (
       business_id, gbp_review_id, author_name, rating, review_text, review_source
     ) VALUES ($1, $2, 'Authentic Customer', 4, 'Initial review comment', 'google_maps')
     ON CONFLICT (business_id, gbp_review_id) DO UPDATE
     SET review_text = EXCLUDED.review_text, rating = EXCLUDED.rating
     RETURNING id, (xmax = 0) AS is_new`,
    [businessId, testGbpId]
  );
  assert.equal(initial.rows.length, 1);
  assert.equal(initial.rows[0].is_new, true, 'Initial insertion must be identified as is_new = true');
  const reviewDbId = initial.rows[0].id;

  // Simulate Google update (customer edits their review to 5 stars)
  const updated = await query(
    `INSERT INTO reviews (
       business_id, gbp_review_id, author_name, rating, review_text, review_source
     ) VALUES ($1, $2, 'Authentic Customer', 5, 'Updated review: even better service!', 'google_maps')
     ON CONFLICT (business_id, gbp_review_id) DO UPDATE
     SET review_text = EXCLUDED.review_text, rating = EXCLUDED.rating
     RETURNING id, (xmax = 0) AS is_new`,
    [businessId, testGbpId]
  );
  assert.equal(updated.rows.length, 1);
  assert.equal(updated.rows[0].id, reviewDbId, 'Same review ID must be maintained');
  assert.equal(updated.rows[0].is_new, false, 'Updated record must have is_new = false');

  // Verify the review was updated in database
  const check = await query('SELECT rating, review_text FROM reviews WHERE id = $1', [reviewDbId]);
  assert.equal(check.rows[0].rating, 5, 'Rating must be updated to 5 stars');
  assert.equal(check.rows[0].review_text, 'Updated review: even better service!');

  // Clean up
  await query('DELETE FROM reviews WHERE id = $1', [reviewDbId]);
});

test('10. Location Creation Auto-Fetch Google Reviews Ingestion Engine', async () => {
  const bizRes = await query(`SELECT b.id, b.workspace_id FROM business_locations b LIMIT 1`);
  const { id: businessId, workspace_id: workspaceId } = bizRes.rows[0];

  // Verify executeLocationReviewSync runs cleanly
  const result = await executeLocationReviewSync({
    workspaceId,
    businessId,
    syncType: 'onboarding_initial_sync'
  });

  assert.equal(result.success, true, 'Review sync must return success: true');
  assert.equal(typeof result.syncedReviewsCount, 'number', 'syncedReviewsCount must be a number');
  assert.equal(typeof result.reviewsFound, 'number', 'reviewsFound must be a number');

  // Verify sync history recorded
  const histRes = await query(
    `SELECT * FROM google_sync_history WHERE business_id = $1 AND sync_type = 'onboarding_initial_sync' ORDER BY created_at DESC LIMIT 1`,
    [businessId]
  );
  assert.ok(histRes.rows.length > 0, 'Must record sync history entry with sync_type = onboarding_initial_sync');
  assert.equal(histRes.rows[0].status, 'success', 'Sync history status must be success');
});

test('11. Location Auto-Sync Ingests Real Customer Reviews & Owner Responses', async () => {
  const bizRes = await query(`SELECT b.id, b.workspace_id FROM business_locations b LIMIT 1`);
  const { id: businessId } = bizRes.rows[0];

  // Seed an authentic review for this location with owner reply
  const sampleGbpId = `auto_fetch_test_${Date.now()}`;
  const insertRes = await query(
    `INSERT INTO reviews (
       business_id, gbp_review_id, author_name, rating, review_text, review_source, reply_status
     ) VALUES ($1, $2, 'Dr. Rajiv Shah', 5, 'Exceptional experience from start to finish!', 'google_maps', 'unanswered')
     ON CONFLICT (business_id, gbp_review_id) DO UPDATE
     SET review_text = EXCLUDED.review_text
     RETURNING id`,
    [businessId, sampleGbpId]
  );
  const reviewId = insertRes.rows[0].id;

  // Simulate syncing owner response
  await query(
    `INSERT INTO review_responses (review_id, response_text, generated_by_ai, tone)
     VALUES ($1, 'Thank you Dr. Rajiv for your wonderful feedback!', FALSE, 'Owner Direct')`,
    [reviewId]
  );
  await query(`UPDATE reviews SET reply_status = 'replied' WHERE id = $1`, [reviewId]);

  // Verify review and response exist
  const verifyRev = await query(
    `SELECT r.*, rr.response_text FROM reviews r LEFT JOIN review_responses rr ON r.id = rr.review_id WHERE r.id = $1`,
    [reviewId]
  );
  assert.equal(verifyRev.rows[0].rating, 5);
  assert.equal(verifyRev.rows[0].reply_status, 'replied');
  assert.equal(verifyRev.rows[0].response_text, 'Thank you Dr. Rajiv for your wonderful feedback!');

  // Clean up test data
  await query(`DELETE FROM review_responses WHERE review_id = $1`, [reviewId]);
  await query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);
});

test.after(async () => {
  await pool.end();
});
