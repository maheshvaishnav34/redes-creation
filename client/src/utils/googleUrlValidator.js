/**
 * Known dummy/placeholder tokens that should trigger a fallback
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
 * Validates and sanitizes a Google Review URL for client-side redirection.
 *
 * @param {string} rawUrl - URL or Place ID
 * @param {object} context - { businessName, city, address }
 * @returns {object} Validation result { isValid, isFallback, url, type, placeId, message }
 */
export const validateGoogleReviewUrl = (rawUrl, context = {}) => {
  const businessName = context.businessName || 'Business';
  const city = context.city || '';
  const fallbackQuery = encodeURIComponent(`${businessName} ${city}`.trim());
  const fallbackSearchUrl = `https://www.google.com/maps/search/?api=1&query=${fallbackQuery}`;

  const isBhagyalaxmi = businessName.toLowerCase().includes('bhagyalaxmi');
  const envUrl = import.meta.env.VITE_GOOGLE_REVIEW_URL;
  const defaultUrl = (isBhagyalaxmi && envUrl) ? envUrl : fallbackSearchUrl;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      isFallback: true,
      url: defaultUrl,
      originalUrl: rawUrl || '',
      type: defaultUrl === envUrl ? 'default_env_link' : 'fallback_search',
      placeId: null,
      message: 'No review URL provided. Using location-specific Google Maps fallback.'
    };
  }

  let cleaned = rawUrl.trim();

  // Detect dummy tokens
  const lower = cleaned.toLowerCase();
  for (const dummy of DUMMY_PATTERNS) {
    if (lower.includes(dummy.toLowerCase())) {
      return {
        isValid: false,
        isFallback: true,
        url: defaultUrl,
        originalUrl: rawUrl,
        type: defaultUrl === envUrl ? 'default_env_link' : 'fallback_search',
        placeId: null,
        message: `Detected placeholder string ("${dummy}"). Using location-specific review destination.`
      };
    }
  }

  // Check if raw Place ID was provided (starts with ChIJ or 20+ char alphanumeric without slashes/dots)
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
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }

  try {
    const parsed = new URL(cleaned);
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

    // If it's another domain, fall back safely
    return {
      isValid: false,
      isFallback: true,
      url: defaultReviewUrl || fallbackSearchUrl,
      originalUrl: rawUrl,
      type: defaultReviewUrl ? 'default_env_link' : 'fallback_search',
      placeId: null,
      message: `Domain ${hostname} is not an official Google review domain. Using verified destination.`
    };
  } catch {
    return {
      isValid: false,
      isFallback: true,
      url: defaultReviewUrl || fallbackSearchUrl,
      originalUrl: rawUrl,
      type: defaultReviewUrl ? 'default_env_link' : 'fallback_search',
      placeId: null,
      message: 'Invalid URL format. Fallback generated.'
    };
  }
};
