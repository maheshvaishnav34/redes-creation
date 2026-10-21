import fetch from 'node-fetch';

async function testGoogleLiveEndpoint() {
  console.log('[TEST] Testing GET /api/v1/reviews/google-live endpoint...');

  const hotelBizId = '07284664-dcc3-4f13-bc68-2b9c87df1209'; // Bhagyalaxmi Hotel & Resort

  try {
    const res = await fetch(`http://localhost:5000/api/v1/reviews/google-live?businessId=${hotelBizId}`);
    if (!res.ok) {
      throw new Error(`Endpoint returned status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log('[TEST] Response received successfully:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Source: ${data.source}`);
    console.log(`- Business Name: ${data.businessName}`);
    console.log(`- Rating: ${data.rating} / 5.0`);
    console.log(`- Total Reviews: ${data.userRatingsTotal}`);
    console.log(`- Attribution: ${data.attribution}`);
    console.log(`- Google Maps URL: ${data.googleMapsUrl}`);
    console.log(`- Write Review URL: ${data.writeReviewUrl}`);
    console.log(`- Star Distribution:`, data.starDistribution);
    console.log(`- Reviews Returned: ${data.reviews?.length || 0}`);

    if (data.reviews && data.reviews.length > 0) {
      const first = data.reviews[0];
      console.log(`\nSample Review:`);
      console.log(`- Reviewer: ${first.reviewer?.displayName}`);
      console.log(`- Rating: ${first.starRating}★`);
      console.log(`- Relative Time: ${first.relativeTimeDescription}`);
      console.log(`- Comment: "${first.comment.slice(0, 80)}..."`);
    }

    if (data.success && data.userRatingsTotal > 0 && data.rating > 0 && data.attribution === 'Powered by Google') {
      console.log('\n[PASS] GET /api/v1/reviews/google-live passed 100% of requirement assertions!');
    } else {
      console.error('\n[FAIL] Response did not meet all schema expectations.');
      process.exit(1);
    }
  } catch (err) {
    console.error('[TEST ERROR]', err.message);
    process.exit(1);
  }
}

testGoogleLiveEndpoint();
