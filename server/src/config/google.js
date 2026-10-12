import { google } from 'googleapis';
import { decryptToken } from '../utils/crypto.js';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

/**
 * Creates and returns a new OAuth2 client using current environment settings
 */
export function getOAuth2Client(redirectUri = process.env.GOOGLE_REDIRECT_URI) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn('[Google Config] Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured.');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri || 'http://localhost:5000/api/auth/google/callback'
  );
}

/**
 * Creates an authorized OAuth2 client instance using a stored GoogleConnection record
 */
export function getAuthorizedClient(connection) {
  const oauth2Client = getOAuth2Client();

  let refreshToken = connection.encryptedRefreshToken;
  if (refreshToken) {
    refreshToken = decryptToken(refreshToken);
  }

  oauth2Client.setCredentials({
    access_token: connection.accessToken || undefined,
    refresh_token: refreshToken || undefined,
    expiry_date: connection.tokenExpiry ? new Date(connection.tokenExpiry).getTime() : undefined,
  });

  return oauth2Client;
}
