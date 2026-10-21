import jwt from 'jsonwebtoken';
import { expandGoogleMapsShortlink } from '../src/utils/googleUrlValidator.js';
import { query } from '../src/config/db.js';

async function testWithAuth() {
  const wsId = '8e952305-0325-4456-a5fe-42dd84f3323b';
  const userId = '6354abdc-4252-4e97-bba8-0ddb950d5ffc';
  const bizId = '496dda2d-0fc3-4e3c-973e-e4627d2b12dc';
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise';

  const token = jwt.sign(
    { userId: userId, id: userId, role: 'client', workspace_id: wsId, email: 'maheshvaishnav78499@gmail.com' },
    secret,
    { expiresIn: '1h' }
  );

  console.log('Generated token for test');

  // Test 1: Fetch all reviews with limit=all
  const resAll = await fetch(`http://localhost:5000/api/v1/reviews/live?businessId=${bizId}&limit=all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dataAll = await resAll.json();

  console.log('\n--- TEST 1: GET /api/v1/reviews/live?limit=all ---');
  console.log('HTTP Status:', resAll.status);
  console.log('Success:', dataAll.success);
  console.log('Source:', dataAll.source);
  console.log('Business Name:', dataAll.businessName);
  console.log('Total Reviews Returned:', dataAll.reviews?.length);
  console.log('User Ratings Total (Google Metric):', dataAll.userRatingsTotal);
  console.log('Average Rating:', dataAll.rating);
  console.log('Star Distribution:', dataAll.starDistribution);
  console.log('Has More:', dataAll.pagination?.hasMore);
  console.log('Sample Review Author:', dataAll.reviews?.[0]?.reviewer?.displayName);
  console.log('Sample Review Rating:', dataAll.reviews?.[0]?.starRating);
  console.log('Sample Review Text:', dataAll.reviews?.[0]?.comment?.slice(0, 80));

  // Test 2: Test shortlink expansion function directly
  console.log('\n--- TEST 2: expandGoogleMapsShortlink ---');
  const expTest = await expandGoogleMapsShortlink('https://maps.google.com/?cid=5967661555307373876');
  console.log('Expanded Result for CID:', expTest);

  // Test 3: Test creating a client hotel with auto-sync
  console.log('\n--- TEST 3: POST /api/hotels (Hotel creation with auto-sync) ---');
  const resCreate = await fetch('http://localhost:5000/api/hotels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Bhagyalaxmi Heritage Resort (Test Wing)',
      city: 'Abu Road',
      address: 'Taleti, Mount Road',
      placeId: 'ChIJlbjxyTcpXTkRNOWc_dQH0VI',
      mapsUrl: 'https://www.google.com/maps?cid=5967661555307373876'
    })
  });
  const dataCreate = await resCreate.json();
  console.log('Create Hotel Success:', dataCreate.success);
  console.log('Sync Triggered:', dataCreate.syncTriggered);
  console.log('Hotel ID:', dataCreate.hotel?.id);
  console.log('Place ID stored:', dataCreate.hotel?.google_place_id);

  if (dataCreate.hotel?.id) {
    // Check if reviews were immediately auto-synced into PostgreSQL for this new hotel!
    const newHotelRev = await query(`SELECT COUNT(*) as c, ROUND(AVG(rating)::numeric,1) as avg FROM reviews WHERE business_id = $1`, [dataCreate.hotel.id]);
    console.log(`Auto-synced reviews for newly created hotel: count=${newHotelRev.rows[0].c}, avg=${newHotelRev.rows[0].avg}`);

    // Clean up test hotel to keep database pristine
    await query(`DELETE FROM reviews WHERE business_id = $1`, [dataCreate.hotel.id]);
    await query(`DELETE FROM business_locations WHERE id = $1`, [dataCreate.hotel.id]);
    console.log('Test hotel cleaned up successfully.');
  }

  process.exit(0);
}

testWithAuth().catch(e => { console.error('Test error:', e); process.exit(1); });
