import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database.js';
import { encryptToken, decryptToken } from '../src/utils/crypto.js';
import { oauthService } from '../src/services/google/oauthService.js';
import { isPrivateOrReservedIP, validateHostAgainstSSRF } from '../src/services/seo/crawlerService.js';
import { calculateSeoScore } from '../src/services/seo/scoringService.js';
import { runTechnicalSeoChecks } from '../src/services/seo/technicalChecks.js';
import { replyService } from '../src/services/ai/replyService.js';

test('1. Prisma PostgreSQL Database Connectivity & Data Models', async () => {
  const usersCount = await prisma.user.count();
  const locationsCount = await prisma.businessLocation.count();
  const reviewsCount = await prisma.review.count();

  assert.ok(typeof usersCount === 'number');
  assert.ok(typeof locationsCount === 'number');
  assert.ok(typeof reviewsCount === 'number');
  assert.ok(usersCount >= 1, 'At least 1 user should exist in PostgreSQL');
  assert.ok(locationsCount >= 1, 'At least 1 business location should exist');
  assert.ok(reviewsCount >= 1, 'Reviews exist in PostgreSQL');
});

test('2. OAuth Token AES-256-GCM Encryption & Decryption at Rest', () => {
  const sampleRefreshToken = '1//04test_google_refresh_token_very_long_string_12345';
  const encrypted = encryptToken(sampleRefreshToken);

  assert.ok(encrypted);
  assert.notEqual(encrypted, sampleRefreshToken);
  assert.ok(encrypted.includes(':'), 'Encrypted token format should contain iv:tag:data');

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, sampleRefreshToken, 'Decrypted token must exactly match original plaintext');
});

test('3. Google OAuth 2.0 State Generation & CSRF Protection', () => {
  const userId = 'test-user-uuid-123';
  const { url, state } = oauthService.generateAuthUrl(userId);

  assert.ok(url.includes('accounts.google.com/o/oauth2/v2/auth'));
  assert.ok(url.includes('business.manage'));
  assert.ok(state);

  // Validate state
  const validatedUserId = oauthService.validateState(state);
  assert.equal(validatedUserId, userId, 'State must resolve to original userId');

  // Second validation must fail (single-use CSRF token)
  const reused = oauthService.validateState(state);
  assert.equal(reused, null, 'State must not be reusable');
});

test('4. SSRF Protection: Loopback, RFC 1918, and Cloud Metadata Blocked', async () => {
  // Direct IP checks
  assert.equal(isPrivateOrReservedIP('127.0.0.1'), true, '127.0.0.1 must be blocked');
  assert.equal(isPrivateOrReservedIP('10.0.0.1'), true, '10.x must be blocked');
  assert.equal(isPrivateOrReservedIP('192.168.1.1'), true, '192.168.x must be blocked');
  assert.equal(isPrivateOrReservedIP('169.254.169.254'), true, 'AWS/GCP metadata IP must be blocked');
  assert.equal(isPrivateOrReservedIP('8.8.8.8'), false, 'Public IP 8.8.8.8 must be allowed');

  // Hostname validation
  await assert.rejects(
    async () => {
      await validateHostAgainstSSRF('localhost');
    },
    /SSRF Prevention/,
    'localhost must be rejected by SSRF protection'
  );
});

test('5. Local SEO Scoring Engine: Transparent Rule-based Penalty Calculations', () => {
  const perfectIssues = [
    { category: 'technical', severity: 'passed', title: 'HTTP 200' },
    { category: 'meta', severity: 'passed', title: 'Title' },
    { category: 'local', severity: 'passed', title: 'Schema' },
  ];

  const perfectScore = calculateSeoScore(perfectIssues);
  assert.equal(perfectScore.overallScore, 100);
  assert.ok(perfectScore.methodology.weights);

  // Deductions: 1 critical (-15) in technical
  const issuesWithCritical = [
    { category: 'technical', severity: 'critical', title: 'Missing Title' },
    { category: 'meta', severity: 'warning', title: 'Meta description length' },
  ];
  const flawedScore = calculateSeoScore(issuesWithCritical);
  assert.ok(flawedScore.overallScore < 100);
  assert.ok(flawedScore.overallScore >= 10);
});

test('6. HTML Technical Checks with Cheerio', async () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Bhagyalaxmi Hotel & Resort | Best Luxury Stay in Abu Road</title>
      <meta name="description" content="Experience comfort and serene hospitality at Bhagyalaxmi Hotel & Resort in Abu Road, Rajasthan. Book your premium stay today.">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="canonical" href="https://bhagyalaxmihotel.com">
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Hotel",
          "name": "Bhagyalaxmi Hotel & Resort"
        }
      </script>
    </head>
    <body>
      <h1>Luxury Hotel in Abu Road</h1>
      <p>Contact us at +91 98765 43210 for bookings.</p>
      <img src="hotel.jpg" alt="Bhagyalaxmi Hotel Exterior">
    </body>
    </html>
  `;

  const results = await runTechnicalSeoChecks({
    targetUrl: 'https://bhagyalaxmihotel.com',
    html: sampleHtml,
    statusCode: 200,
  });

  assert.equal(results.title, 'Bhagyalaxmi Hotel & Resort | Best Luxury Stay in Abu Road');
  assert.equal(results.h1, 'Luxury Hotel in Abu Road');
  
  // Verify critical elements passed
  const schemaPass = results.issues.find((i) => i.title.includes('LocalBusiness Schema'));
  assert.equal(schemaPass.severity, 'passed');

  const viewportPass = results.issues.find((i) => i.title.includes('Mobile Viewport'));
  assert.equal(viewportPass.severity, 'passed');
});

test('7. Review Reply Draft Generation (English & Hindi)', async () => {
  const reviews = await prisma.review.findMany({ take: 1 });
  if (reviews.length > 0) {
    const draft = await replyService.generateReplyDraft(reviews[0].id);
    assert.ok(draft.reply);
    assert.ok(draft.draft.englishReply.length > 10, 'English reply must be non-empty');
    assert.ok(draft.draft.hindiReply.length > 10, 'Hindi reply must be non-empty');
  }
});

test.after(async () => {
  await prisma.$disconnect();
});

