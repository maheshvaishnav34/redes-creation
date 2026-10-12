import * as cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';

export async function runTechnicalSeoChecks({ targetUrl, html, statusCode, businessInfo = {} }) {
  const issues = [];
  const $ = cheerio.load(html || '');
  const parsedUrl = new URL(targetUrl);

  // 1. HTTP Status Code
  if (statusCode >= 200 && statusCode < 300) {
    issues.push({
      category: 'technical',
      severity: 'passed',
      title: 'HTTP Status Code',
      description: `Server responded with valid status ${statusCode} OK.`,
      evidence: `HTTP ${statusCode}`,
      fixRecommendation: null,
    });
  } else {
    issues.push({
      category: 'technical',
      severity: 'critical',
      title: 'HTTP Status Error',
      description: `Server responded with non-success status code ${statusCode}.`,
      evidence: `HTTP ${statusCode}`,
      fixRecommendation: 'Ensure the page returns HTTP 200 OK for search engine crawlers.',
    });
  }

  // 2. Page Title
  const title = $('title').text().trim();
  if (!title) {
    issues.push({
      category: 'meta',
      severity: 'critical',
      title: 'Missing Title Tag',
      description: 'The page has no <title> tag.',
      evidence: 'None',
      fixRecommendation: 'Add an optimized <title> between 30 and 60 characters containing your primary keyword and business name.',
    });
  } else if (title.length < 30 || title.length > 65) {
    issues.push({
      category: 'meta',
      severity: 'warning',
      title: 'Suboptimal Title Length',
      description: `Title length is ${title.length} characters (recommended: 30-65 characters).`,
      evidence: `Title: "${title}"`,
      fixRecommendation: 'Refactor title tag to between 30 and 65 characters to avoid truncation in Google SERP results.',
    });
  } else {
    issues.push({
      category: 'meta',
      severity: 'passed',
      title: 'Optimal Title Tag',
      description: `Title is well-optimized at ${title.length} characters.`,
      evidence: `Title: "${title}"`,
      fixRecommendation: null,
    });
  }

  // 3. Meta Description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (!metaDesc) {
    issues.push({
      category: 'meta',
      severity: 'critical',
      title: 'Missing Meta Description',
      description: 'No meta description found on page.',
      evidence: 'None',
      fixRecommendation: 'Add a compelling meta description between 120 and 160 characters describing your services and local offering.',
    });
  } else if (metaDesc.length < 100 || metaDesc.length > 165) {
    issues.push({
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description Length',
      description: `Meta description is ${metaDesc.length} characters (ideal: 120-160 characters).`,
      evidence: `Description: "${metaDesc}"`,
      fixRecommendation: 'Adjust meta description length to 120-160 characters for maximum search snippet CTR.',
    });
  } else {
    issues.push({
      category: 'meta',
      severity: 'passed',
      title: 'Optimized Meta Description',
      description: `Meta description is present with good length (${metaDesc.length} characters).`,
      evidence: metaDesc,
      fixRecommendation: null,
    });
  }

  // 4. H1 & Heading Hierarchy
  const h1Elements = $('h1');
  if (h1Elements.length === 0) {
    issues.push({
      category: 'content',
      severity: 'critical',
      title: 'Missing H1 Heading',
      description: 'Page does not contain an <h1> tag.',
      evidence: '0 H1 tags found',
      fixRecommendation: 'Include exactly one primary <h1> tag featuring the target service and location.',
    });
  } else if (h1Elements.length > 1) {
    issues.push({
      category: 'content',
      severity: 'warning',
      title: 'Multiple H1 Headings',
      description: `Page contains ${h1Elements.length} <h1> tags. Best practice is exactly one <h1>.`,
      evidence: `${h1Elements.length} H1 tags detected`,
      fixRecommendation: 'Consolidate page structure so there is only one primary <h1> tag, using <h2> and <h3> for secondary sections.',
    });
  } else {
    issues.push({
      category: 'content',
      severity: 'passed',
      title: 'Single H1 Heading Present',
      description: 'Page has exactly one H1 tag.',
      evidence: `H1: "${h1Elements.first().text().trim()}"`,
      fixRecommendation: null,
    });
  }

  // 5. Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({
      category: 'technical',
      severity: 'warning',
      title: 'Missing Canonical Tag',
      description: 'No rel="canonical" link tag specified.',
      evidence: 'None',
      fixRecommendation: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.',
    });
  } else {
    issues.push({
      category: 'technical',
      severity: 'passed',
      title: 'Canonical Tag Configured',
      description: 'rel="canonical" tag is present.',
      evidence: `Canonical: ${canonical}`,
      fixRecommendation: null,
    });
  }

  // 6. Robots Directives
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  if (robotsMeta.toLowerCase().includes('noindex')) {
    issues.push({
      category: 'technical',
      severity: 'critical',
      title: 'Noindex Tag Active',
      description: 'Page meta robots contains "noindex", which prevents Google from indexing this page.',
      evidence: `Robots: "${robotsMeta}"`,
      fixRecommendation: 'Remove "noindex" directive if you want this page to appear in Google search results.',
    });
  } else {
    issues.push({
      category: 'technical',
      severity: 'passed',
      title: 'Search Indexing Allowed',
      description: 'No blocking "noindex" robots directive detected.',
      evidence: robotsMeta || 'Indexable',
      fixRecommendation: null,
    });
  }

  // 7. Mobile Viewport Metadata
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    issues.push({
      category: 'technical',
      severity: 'critical',
      title: 'Missing Mobile Viewport Tag',
      description: 'No <meta name="viewport"> tag found.',
      evidence: 'None',
      fixRecommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for mobile responsiveness.',
    });
  } else {
    issues.push({
      category: 'technical',
      severity: 'passed',
      title: 'Mobile Viewport Present',
      description: 'Mobile responsive viewport tag is configured.',
      evidence: viewport,
      fixRecommendation: null,
    });
  }

  // 8. Missing Image Alt Attributes
  const images = $('img');
  let missingAltCount = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null || alt.trim() === '') {
      missingAltCount++;
    }
  });

  if (images.length > 0 && missingAltCount > 0) {
    issues.push({
      category: 'content',
      severity: 'warning',
      title: 'Images Missing Alt Attributes',
      description: `${missingAltCount} of ${images.length} images are missing alt attributes.`,
      evidence: `${missingAltCount} unoptimized images`,
      fixRecommendation: 'Add descriptive alt attributes with relevant keywords to all images for SEO and accessibility.',
    });
  } else if (images.length > 0) {
    issues.push({
      category: 'content',
      severity: 'passed',
      title: 'All Images Have Alt Attributes',
      description: `All ${images.length} images have alt attributes.`,
      evidence: `${images.length} images checked`,
      fixRecommendation: null,
    });
  }

  // 9. Structured Data / Schema.org (JSON-LD)
  let hasLocalBusinessSchema = false;
  let schemaType = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const type = data['@type'] || (data['@graph'] && data['@graph'][0]?.['@type']);
      if (type) {
        schemaType = type;
        if (
          type.toLowerCase().includes('localbusiness') ||
          type.toLowerCase().includes('hotel') ||
          type.toLowerCase().includes('restaurant') ||
          type.toLowerCase().includes('store') ||
          type.toLowerCase().includes('organization')
        ) {
          hasLocalBusinessSchema = true;
        }
      }
    } catch {
      // Ignore JSON parse errors in script tags
    }
  });

  if (hasLocalBusinessSchema) {
    issues.push({
      category: 'local',
      severity: 'passed',
      title: 'LocalBusiness Schema Detected',
      description: `Valid structured data detected for local search (${schemaType}).`,
      evidence: `Schema @type: ${schemaType}`,
      fixRecommendation: null,
    });
  } else {
    issues.push({
      category: 'local',
      severity: 'critical',
      title: 'Missing LocalBusiness Schema',
      description: 'No Schema.org LocalBusiness JSON-LD markup found on page.',
      evidence: 'No JSON-LD LocalBusiness found',
      fixRecommendation: 'Implement Schema.org LocalBusiness structured data with business name, address, phone number, and opening hours.',
    });
  }

  // 10. NAP (Name, Address, Phone) Presence
  const pageText = $('body').text();
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
  const hasPhone = phonePattern.test(pageText);

  if (hasPhone) {
    issues.push({
      category: 'local',
      severity: 'passed',
      title: 'Phone Number Found',
      description: 'Direct phone number found in page content for local customers.',
      evidence: 'Phone pattern detected in HTML body',
      fixRecommendation: null,
    });
  } else {
    issues.push({
      category: 'local',
      severity: 'warning',
      title: 'No Direct Phone Number Detected',
      description: 'Could not detect a clear customer phone number in the HTML text.',
      evidence: 'No telephone pattern match',
      fixRecommendation: 'Prominently display your local phone number with tel: click-to-call link for mobile users.',
    });
  }

  // 11. Check Robots.txt and Sitemap availability
  try {
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    const robotsRes = await axios.get(robotsUrl, { timeout: 3000, validateStatus: () => true });
    if (robotsRes.status === 200) {
      issues.push({
        category: 'technical',
        severity: 'passed',
        title: 'Robots.txt Available',
        description: 'robots.txt is accessible.',
        evidence: robotsUrl,
        fixRecommendation: null,
      });
    } else {
      issues.push({
        category: 'technical',
        severity: 'warning',
        title: 'Robots.txt Not Found',
        description: `robots.txt returned HTTP ${robotsRes.status}.`,
        evidence: robotsUrl,
        fixRecommendation: 'Create and deploy a robots.txt file to guide search engine crawlers.',
      });
    }
  } catch {
    issues.push({
      category: 'technical',
      severity: 'warning',
      title: 'Robots.txt Unavailable',
      description: 'Could not connect to robots.txt.',
      evidence: 'Timeout or network unreachable',
      fixRecommendation: 'Verify server configuration allows access to /robots.txt.',
    });
  }

  return {
    title,
    metaDesc,
    h1: h1Elements.first().text().trim() || null,
    canonical,
    issues,
  };
}
