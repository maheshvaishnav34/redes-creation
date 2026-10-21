import { query } from '../src/config/db.js';
import { evolveWeeklyKeywordsForBusiness, getWeeklyEvolutionStatus } from '../src/modules/keywords/keywords.service.js';

async function runTest() {
  console.log('🧪 Starting 7-Day AI Keyword Evolution Test...');

  // 1. Fetch an existing business
  const bizRes = await query(`SELECT id, name, city FROM business_locations LIMIT 1`);
  if (bizRes.rows.length === 0) {
    console.error('❌ No business location found in database to test.');
    process.exit(1);
  }

  const biz = bizRes.rows[0];
  console.log(`📍 Testing with business: "${biz.name}" (ID: ${biz.id}, City: ${biz.city || 'N/A'})`);

  // 2. Check initial evolution status
  const initialStatus = await getWeeklyEvolutionStatus(biz.id);
  console.log('📊 Initial Evolution Status:', JSON.stringify(initialStatus, null, 2));

  // 3. Trigger 7-day evolution with force=true
  console.log('⚡ Triggering 7-Day AI Evolution with live Google Trends & Autocomplete...');
  const result = await evolveWeeklyKeywordsForBusiness({
    businessId: biz.id,
    force: true
  });

  console.log('✅ Evolution Result:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Retired Stagnant Keywords: ${result.retiredCount}`);
  console.log(`- New Suggestions Generated: ${result.newSuggestions?.length || 0}`);
  if (result.newlyTrackedKeyword) {
    console.log(`- Auto-Tracked Top Keyword: "${result.newlyTrackedKeyword.keyword}" (Rank: #${result.newlyTrackedKeyword.current_rank})`);
  }
  console.log(`- Next Evolution Due: ${result.nextEvolutionDue}`);

  // 4. Verify status updated
  const updatedStatus = await getWeeklyEvolutionStatus(biz.id);
  console.log('🔄 Updated Status (Days remaining):', updatedStatus.daysRemaining);
  console.log('🔔 Last Summary Ingested:', updatedStatus.lastSummary);

  if (result.success && updatedStatus.lastEvolvedAt) {
    console.log('🎉 7-Day AI Keyword Evolution Engine test passed 100%!');
    process.exit(0);
  } else {
    console.error('❌ Test failed verification.');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('💥 Test execution error:', err);
  process.exit(1);
});
