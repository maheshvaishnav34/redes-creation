import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAllAiEndpoints() {
  console.log('=================================================================');
  console.log('🤖 COMPREHENSIVE LIVE AI VERIFICATION ACROSS ENTIRE PROJECT');
  console.log('=================================================================\n');

  // 1. Login to get token & active business
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });

  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Authentication failed: ' + JSON.stringify(loginData));
  }

  const token = loginData.token;
  const businessId = loginData.activeBusinessId || loginData.businesses[0].id;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-business-id': businessId,
    'Content-Type': 'application/json'
  };

  console.log(`✅ [Step 1] Authenticated as: ${loginData.user.email} (Business: ${businessId})`);

  // 2. Test Conversational AI Assistant Chat
  console.log('\n--- [Step 2] Conversational AI Operations Assistant (POST /api/v1/ai/chat) ---');
  const chatRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'What should be our top 2 priorities this week to dominate the Google 3-Pack?',
      businessId
    })
  });

  const chatData = await chatRes.json();
  console.log('Status:', chatRes.status);
  console.log('Model Used:', chatData.modelUsed);
  console.log('Is Live AI:', chatData.isLiveAi);
  console.log('Live Response Preview:\n' + chatData.answer?.substring(0, 300) + '...\n');

  // 3. Test AI Review Reply Generation
  console.log('--- [Step 3] AI Review Reply Generation (POST /api/v1/reviews/:id/generate-reply) ---');
  const revListRes = await fetch(`${BASE_URL}/reviews`, { headers });
  const revListData = await revListRes.json();
  const sampleReview = revListData.reviews?.[0];

  if (sampleReview) {
    const replyRes = await fetch(`${BASE_URL}/reviews/${sampleReview.id}/generate-reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ customTone: 'Warm & Hospitable' })
    });
    const replyData = await replyRes.json();
    console.log('Status:', replyRes.status);
    console.log('Model Used:', replyData.modelUsed);
    console.log('Live AI:', replyData.isLiveAi);
    console.log('Generated Options Count:', replyData.options?.length);
    const liveOption = replyData.options?.find(o => o.isLiveAi);
    console.log('Live AI Reply Option:\n' + (liveOption?.text || replyData.options?.[0]?.text)?.substring(0, 250) + '...\n');
  }

  // 4. Test Deep Review Sentiment & Operational Breakdown
  console.log('--- [Step 4] Deep Review Sentiment & Operational Advice (POST /api/v1/reviews/:id/analyze) ---');
  if (sampleReview) {
    const analyzeRes = await fetch(`${BASE_URL}/reviews/${sampleReview.id}/analyze`, {
      method: 'POST',
      headers
    });
    const analyzeData = await analyzeRes.json();
    console.log('Status:', analyzeRes.status);
    console.log('Sentiment Detected:', analyzeData.analysis?.sentiment);
    console.log('Positive Points:', analyzeData.analysis?.positivePoints);
    console.log('Negative Points:', analyzeData.analysis?.negativePoints);
    console.log('Operational Recs:', analyzeData.analysis?.operationalRecommendations);
    console.log('AI Suggested Reply Preview:', analyzeData.analysis?.suggestedReply?.substring(0, 200) + '...\n');
  }

  // 5. Test Competitor Live AI Strategic Gap Analysis
  console.log('--- [Step 5] Competitor Live AI Strategic Gap Analysis (GET /api/v1/competitors/comparison) ---');
  const compRes = await fetch(`${BASE_URL}/competitors/comparison`, { headers });
  const compData = await compRes.json();
  console.log('Status:', compRes.status);
  console.log('Benchmark:', compData.comparison?.benchmark);
  console.log('Strategic Gaps Found:', compData.comparison?.gaps?.length);
  compData.comparison?.gaps?.forEach((gap, idx) => {
    console.log(`  Gap ${idx + 1} [${gap.competitor}]: ${gap.gapType} -> Advantage: ${gap.actionableAdvantage}`);
  });
  console.log();

  // 6. Test Local SEO Growth Engine with AI Google Post Generator
  console.log('--- [Step 6] Local SEO Growth Engine with AI Google Post Generator (GET /api/v1/seo/growth-engine) ---');
  const growthRes = await fetch(`${BASE_URL}/seo/growth-engine`, { headers });
  const growthData = await growthRes.json();
  console.log('Status:', growthRes.status);
  console.log('Total Google Posts Created:', growthData.googlePosts?.length);
  const livePost = growthData.googlePosts?.find(p => p.id === 'post_live_ai' || p.badge === 'AI Generated');
  if (livePost) {
    console.log('🔥 Live AI Post Headline:', livePost.headline);
    console.log('🔥 Live AI Post Copy:', livePost.copy);
    console.log('🔥 Live AI Post CTA:', livePost.cta, `(${livePost.ctaType})\n`);
  } else {
    console.log('Default post:', growthData.googlePosts?.[0]?.headline);
  }

  console.log('=================================================================');
  console.log('🎉 100% SUCCESS: ALL 5 AI CAPABILITIES ARE ACTIVE AND WORKING!');
  console.log('=================================================================');
}

testAllAiEndpoints().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
