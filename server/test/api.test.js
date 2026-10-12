import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api/v1';

test('1. System Health Check', async () => {
  const res = await fetch('http://localhost:5000/health');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.ok(data.database.includes('PostgreSQL') || data.database === 'connected');
  assert.equal(data.dbConnected, true);
});

test('2. Authentication & Tenant Token Generation', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.email, 'owner@redescreation.com');
  assert.ok(data.businesses.length >= 2);
});

test('3. Industry Taxonomy & Multi-Niche Customization', async () => {
  const res = await fetch(`${BASE_URL}/business/industries`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);

  const restaurant = data.industries.find(i => i.id === 'restaurant');
  const dental = data.industries.find(i => i.id === 'dental');

  assert.ok(restaurant, 'Restaurant industry exists');
  assert.ok(dental, 'Dental industry exists');

  // Verify niches behave materially differently
  assert.notEqual(restaurant.default_tone, dental.default_tone);
  assert.ok(dental.compliance_rules.length > 0, 'Dental has clinical compliance rules');
});

test('4. Reviews Inbox & AI Reply Generation Workflow', async () => {
  // Login first
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });
  const { token, activeBusinessId } = await loginRes.json();

  // List reviews
  const listRes = await fetch(`${BASE_URL}/reviews`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': activeBusinessId
    }
  });
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.success, true);
  assert.ok(listData.reviews.length > 0);

  // Test AI reply generation on first review
  const firstReview = listData.reviews[0];
  const aiGenRes = await fetch(`${BASE_URL}/reviews/${firstReview.id}/generate-reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': activeBusinessId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ customTone: 'Warm & Hospitable' })
  });

  assert.equal(aiGenRes.status, 200);
  const aiData = await aiGenRes.json();
  assert.equal(aiData.success, true);
  assert.ok(aiData.options.length >= 2, 'Generated 2-3 reply options');
  assert.ok(aiData.safetyChecks.fact_check === 'passed', 'Fact check passed');
});

test('5. Geo-Grid Local SERP Scan', async () => {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });
  const { token, activeBusinessId } = await loginRes.json();

  const scanRes = await fetch(`${BASE_URL}/geo-grid/latest`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': activeBusinessId
    }
  });

  assert.equal(scanRes.status, 200);
  const scanData = await scanRes.json();
  assert.equal(scanData.success, true);
  assert.ok(scanData.points.length > 0, 'Grid points generated');
  assert.ok(scanData.scan.visibility_percentage > 0, 'Visibility calculated');
});

test('6. SEO Recommendations to Task Conversion', async () => {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });
  const { token, activeBusinessId } = await loginRes.json();

  const recsRes = await fetch(`${BASE_URL}/seo/recommendations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': activeBusinessId
    }
  });

  assert.equal(recsRes.status, 200);
  const recsData = await recsRes.json();
  assert.ok(recsData.recommendations.length > 0);

  const targetRec = recsData.recommendations[0];
  const convertRes = await fetch(`${BASE_URL}/seo/recommendations/${targetRec.id}/convert-to-task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dueDate: '2026-10-15' })
  });

  assert.equal(convertRes.status, 200);
  const convertData = await convertRes.json();
  assert.equal(convertData.success, true);
  assert.equal(convertData.task.source, 'recommendations');
});

test('7. Review Collection Campaigns CRUD & Admin Management', async () => {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });
  const { token, activeBusinessId } = await loginRes.json();

  // Create campaign
  const createRes = await fetch(`${BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-business-id': activeBusinessId
    },
    body: JSON.stringify({
      name: 'Automated Suite Test Campaign',
      businessName: 'Redes Creation QA Lounge',
      website: 'https://redescreation.in',
      googleReviewUrl: 'https://maps.google.com/?cid=11111',
      channel: 'qr'
    })
  });

  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  assert.equal(createData.success, true);
  assert.ok(createData.campaign.id);
  assert.ok(createData.campaign.qr_code_data);
  const campId = createData.campaign.id;

  // Admin Update
  const updateRes = await fetch(`${BASE_URL}/campaigns/${campId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-business-id': activeBusinessId
    },
    body: JSON.stringify({
      name: 'Updated Suite Test Campaign',
      businessName: 'Redes Creation QA Lounge Premium',
      status: 'active'
    })
  });
  assert.equal(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.equal(updateData.success, true);
  assert.equal(updateData.campaign.name, 'Updated Suite Test Campaign');

  // Status toggle
  const toggleRes = await fetch(`${BASE_URL}/campaigns/${campId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-business-id': activeBusinessId
    },
    body: JSON.stringify({ status: 'paused' })
  });
  assert.equal(toggleRes.status, 200);
  const toggleData = await toggleRes.json();
  assert.equal(toggleData.campaign.status, 'paused');
});

test('8. Customer Feedback Submission & Real-Time Stats Attribution', async () => {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@redescreation.com', password: 'Password123!' })
  });
  const { token, activeBusinessId } = await loginRes.json();

  // Create campaign
  const createRes = await fetch(`${BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-business-id': activeBusinessId
    },
    body: JSON.stringify({
      name: 'Customer Feedback QA Campaign',
      businessName: 'Redes Test Business',
      channel: 'qr'
    })
  });
  const { campaign } = await createRes.json();

  // Customer opens public link (simulating QR scan)
  const slug = campaign.review_link.split('/feedback/')[1];
  const publicRes = await fetch(`${BASE_URL}/campaigns/public/${slug}`);
  assert.equal(publicRes.status, 200);
  const publicData = await publicRes.json();
  assert.equal(publicData.success, true);

  // Customer submits feedback
  const feedbackRes = await fetch(`${BASE_URL}/campaigns/public/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: campaign.id,
      customerName: 'Rohit Sharma',
      rating: 5,
      serviceExperienced: 'Website Designing',
      feedbackText: 'Superb quality and friendly support!',
      proceededToGoogle: true
    })
  });
  assert.equal(feedbackRes.status, 200);

  // Verify feedbacks list
  const fbListRes = await fetch(`${BASE_URL}/campaigns/${campaign.id}/feedbacks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-business-id': activeBusinessId
    }
  });
  assert.equal(fbListRes.status, 200);
  const fbListData = await fbListRes.json();
  assert.ok(fbListData.feedbacks.length > 0);
  assert.equal(fbListData.feedbacks[0].customer_name, 'Rohit Sharma');
});

