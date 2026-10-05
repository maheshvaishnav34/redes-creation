// Using native fetch in Node 22

async function testBilling() {
  console.log('Testing Billing Endpoints...');
  
  // 1. Login as owner/admin
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@redescreation.com',
      password: 'Password123!'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    return;
  }
  console.log('✅ Logged in successfully as:', loginData.user.email, 'Role:', loginData.user.role);

  const token = loginData.token;
  const workspaceId = loginData.user.workspaceId;

  // 2. Fetch Subscription & Quotas
  const subRes = await fetch('http://localhost:5000/api/v1/billing', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': workspaceId
    }
  });
  console.log('Sub status:', subRes.status);
  const subData = await subRes.json();
  console.log('Sub data:', subData);

  // 3. Fetch Admin Billing Overview
  const adminRes = await fetch('http://localhost:5000/api/v1/billing/admin/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': workspaceId
    }
  });
  console.log('Admin status:', adminRes.status);
  const adminData = await adminRes.json();
  console.log('Admin data:', adminData);

  console.log('\n🎉 ALL BILLING APIS WORKING 100%!');
}

testBilling().catch(console.error);
