import { query } from '../config/db.js';

/**
 * Checks whether an IP or hostname resolves to private/internal network subnets (SSRF protection)
 */
export const isPrivateOrBlockedHost = (hostname) => {
  if (!hostname || typeof hostname !== 'string') return true;
  const lower = hostname.toLowerCase().trim();

  // Localhost & loopback
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0') {
    return true;
  }

  // AWS/GCP/Cloud metadata service
  if (lower === '169.254.169.254' || lower.includes('metadata.google.internal')) {
    return true;
  }

  // Private IPv4 ranges
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const oct1 = parseInt(ipv4Match[1], 10);
    const oct2 = parseInt(ipv4Match[2], 10);

    // 10.0.0.0/8
    if (oct1 === 10) return true;
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;
    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (oct1 === 169 && oct2 === 254) return true;
    // 127.0.0.0/8 (loopback)
    if (oct1 === 127) return true;
  }

  return false;
};

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

const PLACES_API_DISCLAIMER = 'Google Places API provides public access to top reviews only (typically up to 5). For complete historical synchronization, connect the official Google Business Profile via OAuth.';

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
      message: 'No Google review URL configured. Using default Google Maps search fallback.',
      disclaimer: PLACES_API_DISCLAIMER
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
        message: `Configured URL contains placeholder/dummy token ("${dummy}"). Fallback generated.`,
        disclaimer: PLACES_API_DISCLAIMER
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
      message: 'Constructed direct Google write-review URL from Place ID.',
      disclaimer: PLACES_API_DISCLAIMER
    };
  }

  // Protocol normalization & security
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
      message: 'Invalid URL format. Fallback generated.',
      disclaimer: PLACES_API_DISCLAIMER
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;

  // SSRF Protection: Reject private/internal networks immediately
  if (isPrivateOrBlockedHost(hostname)) {
    return {
      isValid: false,
      isFallback: true,
      url: fallbackUrl,
      originalUrl: rawUrl,
      type: 'blocked_private_host',
      placeId: null,
      message: 'Access to private, localhost, or internal hostnames is prohibited (SSRF protection).',
      disclaimer: PLACES_API_DISCLAIMER
    };
  }

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
      message: 'Verified Google direct write-review URL.',
      disclaimer: PLACES_API_DISCLAIMER
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
      message: 'Verified Google Business Profile short review link (g.page).',
      disclaimer: PLACES_API_DISCLAIMER
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
      message: 'Verified Google Maps shortlink (maps.app.goo.gl).',
      disclaimer: PLACES_API_DISCLAIMER
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
      message: 'Verified Google Maps location/review URL.',
      disclaimer: PLACES_API_DISCLAIMER
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
    message: `Domain ${hostname} is not an official Google review domain. Fallback generated.`,
    disclaimer: PLACES_API_DISCLAIMER
  };
};

/**
 * Automatically expands Google Maps shortlinks (maps.app.goo.gl, goo.gl/maps, g.page)
 * and extracts Place ID, CID, and Canonical Maps URL.
 */
export async function expandGoogleMapsShortlink(shortUrl) {
  if (!shortUrl || typeof shortUrl !== 'string') return { expandedUrl: shortUrl, placeId: null, cid: null };
  const trimmed = shortUrl.trim();
  if (!trimmed.includes('goo.gl') && !trimmed.includes('g.page')) {
    const cidMatch = trimmed.match(/[?&]cid=([0-9]+)/i);
    const placeIdMatch = trimmed.match(/place_id=([a-zA-Z0-9_\-]+)/i) || trimmed.match(/place\/[^\/]+\/([a-zA-Z0-9_\-]+)/i);
    return {
      expandedUrl: trimmed,
      placeId: placeIdMatch ? placeIdMatch[1] : null,
      cid: cidMatch ? cidMatch[1] : null
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(trimmed, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    const finalUrl = res.url || trimmed;
    const cidMatch = finalUrl.match(/[?&]cid=([0-9]+)/i);
    const placeIdMatch = finalUrl.match(/place_id=([a-zA-Z0-9_\-]+)/i) || 
                         finalUrl.match(/place\/[^\/]+\/([a-zA-Z0-9_\-]+)/i) ||
                         finalUrl.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/i);

    let extractedPlaceId = placeIdMatch ? placeIdMatch[1] : null;
    let extractedCid = cidMatch ? cidMatch[1] : null;

    if (extractedPlaceId && extractedPlaceId.startsWith('0x') && extractedPlaceId.includes(':0x')) {
      try {
        const parts = extractedPlaceId.split(':');
        if (parts[1]) {
          const hexPart = parts[1].replace(/^0x/, '');
          const decCid = BigInt('0x' + hexPart).toString(10);
          extractedCid = extractedCid || decCid;
        }
      } catch {}
    }

    return {
      expandedUrl: finalUrl,
      placeId: extractedPlaceId,
      cid: extractedCid
    };
  } catch (err) {
    console.warn('[URL_VALIDATOR] expandGoogleMapsShortlink warning:', err.message);
    return { expandedUrl: trimmed, placeId: null, cid: null };
  }
}

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
export const resolveBusinessGoogleReviewUrl = async (businessId, options = {}) => {
  let targetBizId = businessId;

  // If no businessId provided but workspaceId is provided, fetch primary for that workspace
  if (!targetBizId && options?.workspaceId) {
    const primaryBizRes = await query(
      `SELECT id FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1`,
      [options.workspaceId]
    );
    targetBizId = primaryBizRes.rows[0]?.id || null;
  }

  // If options.testUrl is passed (e.g. from hotel creation before db insert)
  if (!targetBizId && options?.testUrl) {
    let resolvedUrl = options.testUrl;
    let extractedPid = null;
    let extractedCid = null;

    if (options.testUrl.includes('goo.gl') || options.testUrl.includes('g.page')) {
      const exp = await expandGoogleMapsShortlink(options.testUrl);
      resolvedUrl = exp.expandedUrl || options.testUrl;
      extractedPid = exp.placeId;
      extractedCid = exp.cid;
    }

    const testVal = validateGoogleReviewUrl(resolvedUrl, { businessName: options.testName || 'Business Location' });
    const finalPlaceId = extractedPid || testVal.placeId || null;

    return {
      businessId: null,
      businessName: options.testName || 'Business Location',
      city: '',
      configuredUrl: resolvedUrl,
      googlePlaceId: finalPlaceId,
      cid: extractedCid,
      reviewUrl: testVal.url,
      validation: testVal
    };
  }

  if (!targetBizId) {
    return {
      businessId: null,
      businessName: null,
      city: '',
      configuredUrl: null,
      googlePlaceId: null,
      reviewUrl: null,
      validation: { isValid: false, reason: 'No business location configured for this workspace' }
    };
  }

  // 1. Fetch business details
  const bizRes = await query(
    `SELECT b.id, b.name, b.city, b.address, b.website, b.phone,
            b.google_place_id, b.google_review_url,
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
  let detectedPlaceId = biz.google_place_id || biz.gbp_place_id || null;

  // Step 1: If google_place_id / gbp_place_id exists and is not dummy
  const activePlaceId = biz.google_place_id || biz.gbp_place_id;
  if (activePlaceId && !DUMMY_PATTERNS.some(d => activePlaceId.includes(d))) {
    candidateUrl = `https://search.google.com/local/writereview?placeid=${activePlaceId}`;
    detectedPlaceId = activePlaceId;
  }

  // Step 1b: If google_review_url is stored on business_locations
  if (!candidateUrl && biz.google_review_url) {
    let revUrl = biz.google_review_url;
    if (revUrl.includes('goo.gl') || revUrl.includes('g.page')) {
      const exp = await expandGoogleMapsShortlink(revUrl);
      revUrl = exp.expandedUrl || revUrl;
      if (exp.placeId) detectedPlaceId = detectedPlaceId || exp.placeId;
    }
    candidateUrl = revUrl;
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

  // Step 4: Fallback to this specific location's Google Maps search query (NEVER fallback to another business!)
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
