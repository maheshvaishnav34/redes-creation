import dns from 'dns';
import axios from 'axios';
import { URL } from 'url';

/**
 * Checks whether an IP address is private, loopback, or link-local to prevent SSRF
 */
export function isPrivateOrReservedIP(ip) {
  if (!ip) return true;

  // IPv4 checks
  if (ip.startsWith('127.')) return true; // Loopback
  if (ip.startsWith('10.')) return true; // RFC 1918
  if (ip.startsWith('192.168.')) return true; // RFC 1918
  if (ip.startsWith('169.254.')) return true; // Link-local / Cloud Metadata (AWS, GCP, etc.)
  if (ip === '0.0.0.0') return true;

  // 172.16.0.0 - 172.31.255.255
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.startsWith('fc00:') || ip.startsWith('fe80:')) {
    return true;
  }

  return false;
}

/**
 * Validates target host via DNS resolution to protect against SSRF attacks
 */
export async function validateHostAgainstSSRF(hostname) {
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateOrReservedIP(record.address)) {
        throw new Error(`SSRF Prevention: Hostname '${hostname}' resolves to private or reserved IP (${record.address}). Access denied.`);
      }
    }
    return true;
  } catch (err) {
    throw new Error(`Invalid host or network security violation: ${err.message}`);
  }
}

/**
 * Crawls a single URL securely with SSRF protection, size limits, and timeouts
 */
export async function crawlUrl(targetUrl, maxRedirects = 3) {
  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const parsed = new URL(currentUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid protocol '${parsed.protocol}'. Only http and https are permitted.`);
    }

    // SSRF Check for current hop
    await validateHostAgainstSSRF(parsed.hostname);

    const response = await axios.get(currentUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || (status >= 300 && status < 400),
      timeout: 8000,
      maxContentLength: 5 * 1024 * 1024, // 5 MB limit
      headers: {
        'User-Agent': 'RedesLocalSEO-Audit-Bot/1.0 (+https://redescreation.in)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    // Handle redirects with re-validation
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers['location'];
      if (!location) {
        throw new Error(`Redirect with status ${response.status} missing Location header.`);
      }

      currentUrl = new URL(location, currentUrl).toString();
      redirectCount++;
      continue;
    }

    return {
      finalUrl: currentUrl,
      statusCode: response.status,
      headers: response.headers,
      html: response.data,
      redirects: redirectCount,
    };
  }

  throw new Error(`Too many redirects (exceeded ${maxRedirects}).`);
}
