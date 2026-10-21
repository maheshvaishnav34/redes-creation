import jwt from 'jsonwebtoken';
import { query } from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise';

async function runIsolationVerification() {
  console.log('🧪 Starting Strict Multi-Client Isolation Verification Suite...\n');

  try {
    const API_BASE = 'http://localhost:5000/api/v1';

    // Setup: Create a fresh isolated test client with 0 hotels
    const testWsName = `Isolated Hotel Group ${Date.now()}`;
    const testSlug = `isolated-hotel-${Date.now()}`;
    const wsRes = await query(`
      INSERT INTO workspaces (name, slug, country, default_language, plan)
      VALUES ($1, $2, 'India', 'en', 'starter')
      RETURNING id, name
    `, [testWsName, testSlug]);
    const testWs = wsRes.rows[0];

    const testEmail = `owner_${Date.now()}@test-hotel.com`;
    const userRes = await query(`
      INSERT INTO users (workspace_id, email, password_hash, full_name, role)
      VALUES ($1, $2, 'mock_hash', 'Isolated Owner', 'client')
      RETURNING id, email, role, workspace_id
    `, [testWs.id, testEmail]);
    const client1 = userRes.rows[0];

    console.log(`👤 Client 1 (Fresh Account): ${client1.email} (Workspace: ${testWs.name}, ID: ${client1.workspace_id})`);

    // Fetch Client 2 (Redes Enterprise workspace with existing hotels)
    const client2Res = await query(`
      SELECT u.id, u.email, u.workspace_id, u.role, w.name as workspace_name
      FROM users u
      JOIN workspaces w ON u.workspace_id = w.id
      WHERE u.email = 'client@saffronbistro.com'
    `);
    const client2 = client2Res.rows[0];
    console.log(`👤 Client 2 (Enterprise Account): ${client2.email} (Workspace: ${client2.workspace_name}, ID: ${client2.workspace_id})\n`);

    const token1 = jwt.sign(
      { userId: client1.id, workspaceId: client1.workspace_id, role: client1.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const token2 = jwt.sign(
      { userId: client2.id, workspaceId: client2.workspace_id, role: client2.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test 1: Client 1 queries /google-live with 0 hotels configured
    console.log('Test 1: Client 1 queries /google-live with 0 hotels configured in workspace...');
    const res1 = await fetch(`${API_BASE}/reviews/google-live`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
        'x-workspace-id': client1.workspace_id
      }
    });
    const data1 = await res1.json();
    console.log('  Response source:', data1.source);
    console.log('  Reviews count:', data1.reviews?.length || 0);
    console.log('  Message:', data1.message);

    if (data1.source !== 'unconfigured' || data1.reviews?.length !== 0) {
      throw new Error('❌ Test 1 FAILED: Client 1 did NOT get unconfigured response! Data leaked.');
    }
    console.log('  ✅ Test 1 PASSED: Zero cross-tenant data leak. Clean unconfigured state returned.\n');

    // Test 2: Client 1 creates a new hotel property under their workspace
    console.log('Test 2: Client 1 creates "Isolated Heritage Resort" hotel...');
    const createHotelRes = await fetch(`${API_BASE}/hotels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
        'x-workspace-id': client1.workspace_id
      },
      body: JSON.stringify({
        name: 'Isolated Heritage Resort',
        city: 'Udaipur',
        address: 'Lake Pichola Road, Udaipur, Rajasthan',
        mapsUrl: 'https://maps.google.com/?q=place_id:ChIJ1234567890IsolatedHeritage'
      })
    });
    const hotel1Data = await createHotelRes.json();
    if (!hotel1Data.success || !hotel1Data.hotel) {
      throw new Error(`❌ Test 2 FAILED to create hotel: ${hotel1Data.error}`);
    }
    const hotel1 = hotel1Data.hotel;
    console.log(`  Created Hotel ID: ${hotel1.id}, Name: ${hotel1.name}, Workspace: ${hotel1.workspace_id}`);
    if (hotel1.workspace_id !== client1.workspace_id) {
      throw new Error('❌ Test 2 FAILED: Hotel created under wrong workspace!');
    }
    console.log('  ✅ Test 2 PASSED: Hotel created strictly under Client 1 workspace.\n');

    // Test 3: Client 1 lists their hotels
    console.log('Test 3: Client 1 lists their hotels via /hotels...');
    const list1Res = await fetch(`${API_BASE}/hotels`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
        'x-workspace-id': client1.workspace_id
      }
    });
    const list1Data = await list1Res.json();
    console.log(`  Client 1 sees ${list1Data.hotels.length} hotel(s):`, list1Data.hotels.map(h => h.name));
    if (list1Data.hotels.length !== 1 || list1Data.hotels[0].name !== 'Isolated Heritage Resort') {
      throw new Error('❌ Test 3 FAILED: Client 1 does not see exactly their own hotel.');
    }
    console.log('  ✅ Test 3 PASSED: Client 1 sees only their private hotel.\n');

    // Test 4: Client 2 lists their hotels
    console.log('Test 4: Client 2 lists their hotels via /hotels...');
    const list2Res = await fetch(`${API_BASE}/hotels`, {
      headers: {
        'Authorization': `Bearer ${token2}`,
        'x-workspace-id': client2.workspace_id
      }
    });
    const list2Data = await list2Res.json();
    console.log(`  Client 2 sees ${list2Data.hotels.length} hotel(s):`, list2Data.hotels.map(h => h.name));
    const client2HasIsolated = list2Data.hotels.some(h => h.name.includes('Isolated Heritage'));
    if (client2HasIsolated) {
      throw new Error('❌ Test 4 FAILED: Client 2 can see Client 1 hotel!');
    }
    console.log('  ✅ Test 4 PASSED: Client 2 has zero visibility into Client 1 hotel.\n');

    // Test 5: Cross-Tenant Access Attack (Client 2 attempts to query Client 1 hotel reviews)
    console.log('Test 5: Client 2 attempts unauthorized access to Client 1 hotel reviews...');
    const crossReq = await fetch(`${API_BASE}/hotels/${hotel1.id}/reviews`, {
      headers: {
        'Authorization': `Bearer ${token2}`,
        'x-workspace-id': client2.workspace_id
      }
    });
    console.log(`  Cross-tenant query HTTP status: ${crossReq.status}`);
    if (crossReq.status !== 403) {
      throw new Error(`❌ Test 5 FAILED: Expected 403 Forbidden, got ${crossReq.status}`);
    }
    console.log('  ✅ Test 5 PASSED: Cross-tenant unauthorized access successfully blocked with 403 Forbidden.\n');

    // Cleanup test workspace
    await query(`DELETE FROM workspaces WHERE id = $1`, [testWs.id]);
    console.log('🧹 Cleaned up temporary test workspace.');

    console.log('\n🎉 ALL MULTI-CLIENT STRICT ISOLATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Isolation Verification Suite Error:', err.message);
    process.exit(1);
  }
}

runIsolationVerification();
