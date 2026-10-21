import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import 'dotenv/config';
import { query } from '../src/config/db.js';
import { validateGoogleReviewUrl, isPrivateOrBlockedHost } from '../src/utils/googleUrlValidator.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

test('MASTER SAAS ARCHITECTURAL COMPLIANCE SUITE', async (t) => {
  let userAToken = null;
  let userAWorkspaceId = null;
  let userAHotelId = null;

  let userBToken = null;
  let userBWorkspaceId = null;

  const timestamp = Date.now();
  const emailA = `hotel_owner_a_${timestamp}@testsaas.com`;
  const emailB = `hotel_owner_b_${timestamp}@testsaas.com`;

  // ----------------------------------------------------
  // Test 1: User Registration & Authentication (Section 11)
  // ----------------------------------------------------
  await t.test('1. User Registration & Authentication (/api/auth/register, /api/auth/login, /api/auth/me)', async () => {
    // Register User A
    const regResA = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: emailA,
      password: 'SecurePassword123!',
      fullName: 'Tenant A Owner',
      businessName: `Grand Heritage Hotel ${timestamp}`,
      role: 'owner'
    });

    assert.equal(regResA.status, 201);
    assert.ok(regResA.data.token, 'Token must be issued upon registration');
    userAToken = regResA.data.token;
    userAWorkspaceId = regResA.data.user.workspaceId;

    // Login User A
    const loginResA = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: emailA,
      password: 'SecurePassword123!'
    });
    assert.equal(loginResA.status, 200);
    assert.ok(loginResA.data.token);

    // Verify /api/auth/me
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.user.email, emailA);

    // Register User B (Independent Tenant)
    const regResB = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: emailB,
      password: 'SecurePassword123!',
      fullName: 'Tenant B Owner',
      businessName: `Boutique Seaside Villa ${timestamp}`,
      role: 'owner'
    });
    assert.equal(regResB.status, 201);
    userBToken = regResB.data.token;
    userBWorkspaceId = regResB.data.user.workspaceId;
    assert.notEqual(userAWorkspaceId, userBWorkspaceId, 'Workspaces must be strictly independent');
  });

  // ----------------------------------------------------
  // Test 2: Hotel Creation & Canonical Hotel Routes
  // ----------------------------------------------------
  await t.test('2. Hotel Creation & Canonical Routes (/api/hotels, /api/hotels/maps-link)', async () => {
    const hotelRes = await axios.post(
      `${BASE_URL}/api/hotels`,
      {
        name: `Palace Grand Resort ${timestamp}`,
        address: '123 Heritage Way',
        city: 'Jaipur',
        phone: '+91 98765 43210',
        website: 'https://palacegrandresort.com'
      },
      {
        headers: {
          Authorization: `Bearer ${userAToken}`,
          'x-workspace-id': userAWorkspaceId
        }
      }
    );

    assert.equal(hotelRes.status, 201);
    assert.ok(hotelRes.data.hotel.id);
    userAHotelId = hotelRes.data.hotel.id;

    // List hotels for Tenant A
    const listRes = await axios.get(`${BASE_URL}/api/hotels`, {
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'x-workspace-id': userAWorkspaceId
      }
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.data.hotels.some(h => h.id === userAHotelId));
  });

  // ----------------------------------------------------
  // Test 3: Strict Cross-Tenant Isolation Enforcement
  // ----------------------------------------------------
  await t.test('3. Cross-Tenant Security Enforcement: User B cannot access or modify User A hotel', async () => {
    // Attempt 1: User B listing hotels must NOT see User A's hotel
    const listResB = await axios.get(`${BASE_URL}/api/hotels`, {
      headers: {
        Authorization: `Bearer ${userBToken}`,
        'x-workspace-id': userBWorkspaceId
      }
    });
    assert.equal(listResB.status, 200);
    const hasUserAHotel = listResB.data.hotels.some(h => h.id === userAHotelId);
    assert.equal(hasUserAHotel, false, 'Tenant B must have zero visibility of Tenant A hotel');

    // Attempt 2: User B querying User A's hotel details directly by ID -> Must return 404 or 403
    try {
      await axios.get(`${BASE_URL}/api/hotels/${userAHotelId}`, {
        headers: {
          Authorization: `Bearer ${userBToken}`,
          'x-workspace-id': userBWorkspaceId
        }
      });
      assert.fail('Should have thrown 403/404 for cross-tenant access');
    } catch (err) {
      assert.ok([403, 404].includes(err.response?.status), `Expected 403 or 404, got ${err.response?.status}`);
    }

    // Attempt 3: User B triggering sync on User A's hotel -> Must return 403
    try {
      await axios.post(
        `${BASE_URL}/api/hotels/${userAHotelId}/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userBToken}`,
            'x-workspace-id': userBWorkspaceId
          }
        }
      );
      assert.fail('Should have blocked cross-tenant sync');
    } catch (err) {
      assert.equal(err.response?.status, 403, 'Cross-tenant sync must return 403 Forbidden');
    }

    // Attempt 4: User B attempting to delete User A's hotel -> Must return 403
    try {
      await axios.delete(`${BASE_URL}/api/hotels/${userAHotelId}`, {
        headers: {
          Authorization: `Bearer ${userBToken}`,
          'x-workspace-id': userBWorkspaceId
        }
      });
      assert.fail('Should have blocked cross-tenant deletion');
    } catch (err) {
      assert.equal(err.response?.status, 403, 'Cross-tenant deletion must return 403 Forbidden');
    }
  });

  // ----------------------------------------------------
  // Test 4: SSRF Defense & Google URL Security
  // ----------------------------------------------------
  await t.test('4. Google URL Validation & Bulletproof SSRF Defense', () => {
    // SSRF Private IPs must be blocked
    assert.equal(isPrivateOrBlockedHost('localhost'), true);
    assert.equal(isPrivateOrBlockedHost('127.0.0.1'), true);
    assert.equal(isPrivateOrBlockedHost('169.254.169.254'), true);
    assert.equal(isPrivateOrBlockedHost('10.0.0.1'), true);
    assert.equal(isPrivateOrBlockedHost('192.168.1.1'), true);
    assert.equal(isPrivateOrBlockedHost('172.20.0.5'), true);

    // Public valid Google hosts must NOT be blocked
    assert.equal(isPrivateOrBlockedHost('search.google.com'), false);
    assert.equal(isPrivateOrBlockedHost('maps.google.com'), false);

    // SSRF URL validation test
    const ssrfResult = validateGoogleReviewUrl('http://127.0.0.1:8080/internal/admin');
    assert.equal(ssrfResult.isValid, false);
    assert.equal(ssrfResult.type, 'blocked_private_host');

    // Valid Google Review URL
    const validResult = validateGoogleReviewUrl('https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4');
    assert.equal(validResult.isValid, true);
    assert.equal(validResult.placeId, 'ChIJN1t_tDeuEmsRUsoyG83frY4');
    assert.ok(validResult.disclaimer.includes('Google Places API provides public access to top reviews only'));
  });

  // ----------------------------------------------------
  // Test 5: Review Ingestion & Duplicate Prevention
  // ----------------------------------------------------
  await t.test('5. Review Ingestion & 100% Duplicate Prevention', async () => {
    const gbpReviewId = `test_gbp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    // First insert
    const insertRes1 = await query(
      `INSERT INTO reviews (
         business_id, gbp_review_id, author_name, rating, review_text, review_date
       ) VALUES ($1, $2, 'Jane Doe', 5, 'Superb stay and wonderful breakfast!', NOW())
       ON CONFLICT (gbp_review_id) DO UPDATE
       SET business_id = EXCLUDED.business_id, review_text = EXCLUDED.review_text, rating = EXCLUDED.rating
       RETURNING id, (xmax = 0) AS is_new`,
      [userAHotelId, gbpReviewId]
    );

    assert.equal(insertRes1.rows[0].is_new, true, 'First review ingestion must be marked is_new');

    // Second insert with updated text
    const insertRes2 = await query(
      `INSERT INTO reviews (
         business_id, gbp_review_id, author_name, rating, review_text, review_date
       ) VALUES ($1, $2, 'Jane Doe', 5, 'Updated review: Truly world-class resort hospitality!', NOW())
       ON CONFLICT (gbp_review_id) DO UPDATE
       SET business_id = EXCLUDED.business_id, review_text = EXCLUDED.review_text, rating = EXCLUDED.rating
       RETURNING id, (xmax = 0) AS is_new`,
      [userAHotelId, gbpReviewId]
    );

    assert.equal(insertRes2.rows[0].is_new, false, 'Duplicate review ingestion must update existing record, not create duplicate');
    assert.equal(insertRes1.rows[0].id, insertRes2.rows[0].id, 'Must refer to the identical review row');

    // Verify row count in database
    const countRes = await query(
      `SELECT COUNT(*) as count FROM reviews WHERE business_id = $1 AND gbp_review_id = $2`,
      [userAHotelId, gbpReviewId]
    );
    assert.equal(parseInt(countRes.rows[0].count, 10), 1, 'Exactly 1 review row must exist');
  });

  // ----------------------------------------------------
  // Test 6: Rating Breakdown & Telemetry Endpoints
  // ----------------------------------------------------
  await t.test('6. Review Summary & Sync Status (/api/hotels/:id/review-summary, /api/hotels/:id/sync-status)', async () => {
    // Review Summary
    const summaryRes = await axios.get(`${BASE_URL}/api/hotels/${userAHotelId}/review-summary`, {
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'x-workspace-id': userAWorkspaceId
      }
    });
    assert.equal(summaryRes.status, 200);
    assert.ok(summaryRes.data.distribution);
    assert.equal(summaryRes.data.distribution[5] >= 1, true, 'Distribution must record 5-star review');
    assert.ok(summaryRes.data.distributionNotice);
    assert.equal(summaryRes.data.attribution, 'Powered by Google');

    // Sync Status
    const statusRes = await axios.get(`${BASE_URL}/api/hotels/${userAHotelId}/sync-status`, {
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'x-workspace-id': userAWorkspaceId
      }
    });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.data.success, true);
    assert.equal(typeof statusRes.data.totalReviewsLocal, 'number');
  });

  // ----------------------------------------------------
  // Test 7: Review Sync Trigger & Worker Enqueue
  // ----------------------------------------------------
  await t.test('7. Review Sync Trigger (/api/hotels/:id/sync)', async () => {
    const syncRes = await axios.post(
      `${BASE_URL}/api/hotels/${userAHotelId}/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userAToken}`,
          'x-workspace-id': userAWorkspaceId
        }
      }
    );

    assert.equal(syncRes.status, 202);
    assert.ok(syncRes.data.jobId);
    assert.ok(syncRes.data.message.includes('Review synchronization initiated'));
  });

  // ----------------------------------------------------
  // Test 8: Real-Time SSE Stream Endpoint (/api/events)
  // ----------------------------------------------------
  await t.test('8. Real-Time SSE Event Stream (/api/events)', async () => {
    const sseRes = await axios.get(`${BASE_URL}/api/events?businessId=${userAHotelId}`, {
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'x-workspace-id': userAWorkspaceId
      },
      responseType: 'stream'
    });

    assert.equal(sseRes.status, 200);
    assert.equal(sseRes.headers['content-type'], 'text/event-stream');
    assert.ok(sseRes.headers['cache-control'].includes('no-cache'), 'Cache-Control must specify no-cache');

    // Consume first event and close stream
    await new Promise((resolve) => {
      sseRes.data.on('data', (chunk) => {
        const text = chunk.toString();
        if (text.includes('event: connected') || text.includes('connected')) {
          sseRes.data.destroy();
          resolve();
        }
      });
      setTimeout(() => {
        sseRes.data.destroy();
        resolve();
      }, 3000);
    });
  });

  // ----------------------------------------------------
  // Test 9: Google Cloud Pub/Sub Webhook Receiver
  // ----------------------------------------------------
  await t.test('9. Google Cloud Pub/Sub Webhook (/api/webhooks/google-pubsub)', async () => {
    const payload = {
      eventType: 'NEW_REVIEW',
      location: 'locations/1234567890',
      account: 'accounts/987654321',
      reviewId: 'pubsub_review_1'
    };

    const pubSubMessage = {
      message: {
        data: Buffer.from(JSON.stringify(payload)).toString('base64'),
        messageId: `msg_${Date.now()}`
      },
      subscription: 'projects/hotel-review-saas/subscriptions/gbp-review-sub'
    };

    const webhookRes = await axios.post(`${BASE_URL}/api/webhooks/google-pubsub`, pubSubMessage);
    assert.equal(webhookRes.status, 200);
    assert.equal(webhookRes.data.received, true);
  });

  // ----------------------------------------------------
  // Test 10: Super Admin Role & Sync Health Security
  // ----------------------------------------------------
  await t.test('10. Super Admin Sync Health (/api/admin/sync-health)', async () => {
    // 1. Regular client attempt must be BLOCKED with 403 Forbidden
    try {
      await axios.get(`${BASE_URL}/api/admin/sync-health`, {
        headers: {
          Authorization: `Bearer ${userAToken}`,
          'x-workspace-id': userAWorkspaceId
        }
      });
      assert.fail('Client role must be blocked from admin endpoints');
    } catch (err) {
      assert.equal(err.response?.status, 403, 'Must return 403 Forbidden for client role');
    }

    // 2. Explicitly promote User A to super_admin in DB
    await query(`UPDATE users SET role = 'super_admin' WHERE email = $1`, [emailA]);

    // Re-login to generate super_admin JWT token
    const superLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: emailA,
      password: 'SecurePassword123!'
    });
    const superAdminToken = superLogin.data.token;

    // 3. Super admin query must succeed with 200 OK
    const healthRes = await axios.get(`${BASE_URL}/api/admin/sync-health`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'x-workspace-id': userAWorkspaceId
      }
    });

    assert.equal(healthRes.status, 200);
    assert.ok(healthRes.data.queueHealth);
    assert.ok(healthRes.data.infrastructureTotals);
    assert.ok(healthRes.data.last24HoursTelemetry);
  });

  // Cleanup test data
  await t.test('Cleanup: Remove temporary test accounts', async () => {
    if (userAHotelId) {
      await query(`DELETE FROM business_locations WHERE id = $1`, [userAHotelId]);
    }
    if (userAWorkspaceId) {
      await query(`DELETE FROM workspaces WHERE id = $1`, [userAWorkspaceId]);
    }
    if (userBWorkspaceId) {
      await query(`DELETE FROM workspaces WHERE id = $1`, [userBWorkspaceId]);
    }
  });
});
