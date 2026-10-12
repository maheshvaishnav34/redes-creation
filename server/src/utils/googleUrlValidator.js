import { query } from '../config/db.js';

/**
 * Known dummy/placeholder strings that should be treated as unconfigured
 */
const DUMMY_PATTERNS = [
  'example.com',
  'placeholder',
  'ChIJr2oQ32_9XzkRLw5P7A8V-uU', // Legacy dummy place ID
  '0x00000000',
  'undefined',
  'null',
  '[object Object]'
];

/**
 * Validates and sanitizes a Google Review URL.
 * 
 * Supports:
 * - Direct Write-Review: https://search.google.com/local/writereview?placeid=...
 * - GBP Shortlink: https://g.page/r/.../review or https://g.page/.../review
 * - Maps App Shortlink: https://maps.app.goo.gl/...
 * - Google Maps URL with CID: https://maps.google.com/?cid=...
 * - Google Maps Search: https://www.google.com/maps/search/?api=1&query=...
 * - Raw Place ID: ChIJ... (automatically converts to write-review URL)
 * 
 * @param {string} rawUrl - The input URL or Place ID to validate
 * @param {object} context - Optional context: { businessName, city, address }
 * @returns {object} Validation result
 */
export const validateGoogleReviewUrl = (rawUrl, context = {}) => {
  const businessName = context.businessName || 'Business';
  const city = context.city || '';
  const fallbackQuery = encodeURIComponent(`${businessName} ${city}`.trim());
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${fallbackQuery}`;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      isFallback: true,
      url: fallbackUrl,
      originalUrl: rawUrl || '',
      type: 'fallback_search',
      placeId: null,
      message: 'No Google review URL configured. Using default Google Maps search fallback.'
    };
  }

  let cleaned = rawUrl.trim();

  // Check for dummy / placeholder tokens
  const lower = cleaned.toLowerCase();
  for (const dummy of DUMMY_PATTERNS) {
    if (lower.includes(dummy.toLowerCase())) {
      return {
        isValid: false,
        isFallback: true,
        url: fallbackUrl,
        originalUrl: rawUrl,
        type: 'fallback_search',
        placeId: null,
        message: `Configured URL contains placeholder/dummy token ("${dummy}"). Fallback generated.`
      };
    }
  }

  // Check if raw Place ID was provided (e.g. starts with ChIJ or similar 20+ char alphanumeric)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(cleaned) && !cleaned.includes('/') && !cleaned.includes('.')) {
    const directUrl = `https://search.google.com/local/writereview?placeid=${cleaned}`;
    return {
      isValid: true,
      isFallback: false,
      url: directUrl,
      originalUrl: rawUrl,
      type: 'place_id_writereview',
      placeId: cleaned,
      message: 'Constructed direct Google write-review URL from Place ID.'
    };
  }

  // Protocol normalization
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  } else if (/^http:\/\//i.test(cleaned)) {
    // Upgrade http to https for Google services
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    return {
      isValid: false,
      isFallback: true,
      url: fallbackUrl,
      originalUrl: rawUrl,
      type: 'fallback_search',
      placeId: null,
      message: 'Invalid URL format. Fallback generated.'
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;

  // 1. search.google.com/local/writereview?placeid=...
  if (hostname.includes('search.google.com') && pathname.includes('/writereview')) {
    const placeId = searchParams.get('placeid');
    return {
      isValid: true,
      isFallback: false,
      url: cleaned,
      originalUrl: rawUrl,
      type: 'place_id_writereview',
      placeId: placeId || null,
      message: 'Verified Google direct write-review URL.'
    };
  }

  // 2. g.page/r/.../review or g.page/.../review
  if (hostname === 'g.page' || hostname.endsWith('.g.page')) {
    return {
      isValid: true,
      isFallback: false,
      url: cleaned,
      originalUrl: rawUrl,
      type: 'gbp_shortlink',
      placeId: null,
      message: 'Verified Google Business Profile short review link (g.page).'
    };
  }

  // 3. maps.app.goo.gl/...
  if (hostname === 'maps.app.goo.gl' || hostname.endsWith('.goo.gl')) {
    return {
      isValid: true,
      isFallback: false,
      url: cleaned,
      originalUrl: rawUrl,
      type: 'maps_app',
      placeId: null,
      message: 'Verified Google Maps shortlink (maps.app.goo.gl).'
    };
  }

  // 4. google.com/maps or maps.google.com
  if (hostname.includes('google.') && (pathname.includes('/maps') || hostname.startsWith('maps.'))) {
    const cid = searchParams.get('cid');
    const placeId = searchParams.get('placeid') || searchParams.get('ftid');
    const isSearch = pathname.includes('/search') || searchParams.has('query');

    return {
      isValid: true,
      isFallback: false,
      url: cleaned,
      originalUrl: rawUrl,
      type: cid ? 'maps_cid' : (placeId ? 'place_id_writereview' : (isSearch ? 'maps_search' : 'maps_location')),
      placeId: placeId || null,
      message: 'Verified Google Maps location/review URL.'
    };
  }

  // Unknown domain
  return {
    isValid: false,
    isFallback: true,
    url: fallbackUrl,
    originalUrl: rawUrl,
    type: 'fallback_search',
    placeId: null,
    message: `Domain ${hostname} is not an official Google review domain. Fallback generated.`
  };
};

/**
 * Resolves the configured Google Review URL for a business/location.
 * 
 * Resolution Order:
 * 1. google_locations: gbp_place_id -> https://search.google.com/local/writereview?placeid=...
 * 2. google_locations: website (if matching Google pattern)
 * 3. review_campaigns: Active campaign configured google_review_url for this specific business
 * 4. Specific environment variable IF business is explicitly Bhagyalaxmi
 * 5. Dynamic location-specific Google Maps Search URL: https://www.google.com/maps/search/?api=1&query=...
 * 
 * @param {string} businessId - Business or Location UUID
 * @returns {Promise<object>} Resolved URL, metadata, and validation
 */
export const resolveBusinessGoogleReviewUrl = async (businessId) => {
  let targetBizId = businessId;

  // If no businessId provided, fetch primary or first business
  if (!targetBizId) {
    const primaryBizRes = await query(
      `SELECT id FROM business_locations ORDER BY is_primary DESC, created_at ASC LIMIT 1`
    );
    targetBizId = primaryBizRes.rows[0]?.id || null;
  }

  if (!targetBizId) {
    const fallbackName = 'My Business Location';
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackName)}`;
    return {
      businessId: null,
      businessName: fallbackName,
      city: '',
      configuredUrl: fallbackUrl,
      googlePlaceId: null,
      validation: validateGoogleReviewUrl(fallbackUrl, { businessName: fallbackName, city: '' })
    };
  }

  // 1. Fetch business details
  const bizRes = await query(
    `SELECT b.id, b.name, b.city, b.address, b.website, b.phone,
            gl.gbp_location_id, gl.gbp_place_id, gl.website as google_website,
            gl.location_name as google_location_name, gl.is_verified, gl.sync_status
     FROM business_locations b
     LEFT JOIN google_locations gl ON b.id = gl.business_id
     WHERE b.id = $1`,
    [targetBizId]
  );

  const biz = bizRes.rows[0];
  if (!biz) {
    const fallbackName = 'Business Location';
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackName)}`;
    return {
      businessId: targetBizId,
      businessName: fallbackName,
      city: '',
      configuredUrl: fallbackUrl,
      googlePlaceId: null,
      validation: validateGoogleReviewUrl(fallbackUrl, { businessName: fallbackName, city: '' })
    };
  }

  const businessContext = {
    businessName: biz.name || 'Business',
    city: biz.city || '',
    address: biz.address || ''
  };

  let candidateUrl = null;
  let detectedPlaceId = biz.gbp_place_id || null;

  // Step 1: If gbp_place_id exists and is not dummy
  if (biz.gbp_place_id && !DUMMY_PATTERNS.some(d => biz.gbp_place_id.includes(d))) {
    candidateUrl = `https://search.google.com/local/writereview?placeid=${biz.gbp_place_id}`;
  }

  // Step 2: Check google_locations website if it is a google link
  if (!candidateUrl && biz.google_website) {
    const testValidation = validateGoogleReviewUrl(biz.google_website, businessContext);
    if (testValidation.isValid) {
      candidateUrl = testValidation.url;
      detectedPlaceId = detectedPlaceId || testValidation.placeId;
    }
  }

  // Step 3: Check review_campaigns for this business
  if (!candidateUrl) {
    const campRes = await query(
      `SELECT google_review_url 
       FROM review_campaigns 
       WHERE business_id = $1 AND google_review_url IS NOT NULL AND TRIM(google_review_url) != ''
       ORDER BY updated_at DESC, created_at DESC 
       LIMIT 1`,
      [biz.id]
    );
    if (campRes.rows.length > 0 && campRes.rows[0].google_review_url) {
      const campUrl = campRes.rows[0].google_review_url.trim();
      const testValidation = validateGoogleReviewUrl(campUrl, businessContext);
      if (testValidation.isValid) {
        candidateUrl = testValidation.url;
        detectedPlaceId = detectedPlaceId || testValidation.placeId;
      }
    }
  }

  // Step 4: Check environment default ONLY if this business is explicitly Bhagyalaxmi
  const envUrl = process.env.VITE_GOOGLE_REVIEW_URL || process.env.GOOGLE_REVIEW_URL;
  const isBhagyalaxmi = (biz.name || '').toLowerCase().includes('bhagyalaxmi');
  if (!candidateUrl && envUrl && isBhagyalaxmi) {
    candidateUrl = envUrl.trim();
  }

  // Step 5: Fallback to this specific location's Google Maps search query (NEVER fallback to another business!)
  if (!candidateUrl) {
    candidateUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${biz.name} ${biz.city || ''}`.trim())}`;
  }

  // Validate the final candidate
  const validation = validateGoogleReviewUrl(candidateUrl, businessContext);

  return {
    businessId: biz.id,
    businessName: biz.name,
    city: biz.city,
    address: biz.address,
    googleLocationId: biz.gbp_location_id || null,
    googlePlaceId: detectedPlaceId || validation.placeId || null,
    configuredUrl: candidateUrl || validation.url,
    reviewUrl: validation.url,
    validation
  };
};
