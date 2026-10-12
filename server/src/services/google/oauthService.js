import crypto from 'crypto';
import { getOAuth2Client, GOOGLE_SCOPES } from '../../config/google.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';
import { prisma } from '../../config/database.js';

// Cache in-memory for oauth state validation (CSRF defense)
const stateStore = new Map();

export const oauthService = {
  /**
   * Generates a secure authorization URL with CSRF state
   */
  generateAuthUrl(userId) {
    const oauth2Client = getOAuth2Client();
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with userId and 15-minute expiration
    stateStore.set(state, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Ensure we receive a refresh_token
      scope: GOOGLE_SCOPES,
      state,
    });

    return { url, state };
  },

  /**
   * Validates state against stored CSRF token
   */
  validateState(state) {
    if (!state || !stateStore.has(state)) {
      return null;
    }
    const record = stateStore.get(state);
    stateStore.delete(state); // Single-use state
    if (Date.now() > record.expiresAt) {
      return null;
    }
    return record.userId;
  },

  /**
   * Exchanges authorization code for tokens, encrypts refresh token, and saves connection
   */
  async handleCallback(code, userId) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info from Google
    let accountEmail = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userinfo = await oauth2.userinfo.get();
      accountEmail = userinfo.data.email;
    } catch {
      // If userinfo fails, proceed with connection
    }

    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null;

    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Check if user already has a connection
    const existingConnection = await prisma.googleConnection.findFirst({
      where: { userId },
    });

    let connection;
    if (existingConnection) {
      connection = await prisma.googleConnection.update({
        where: { id: existingConnection.id },
        data: {
          accountEmail: accountEmail || existingConnection.accountEmail,
          accessToken: tokens.access_token || existingConnection.accessToken,
          encryptedRefreshToken: encryptedRefreshToken || existingConnection.encryptedRefreshToken,
          tokenExpiry: tokenExpiry || existingConnection.tokenExpiry,
          scope: tokens.scope || existingConnection.scope,
          status: 'connected',
          updatedAt: new Date(),
        },
      });
    } else {
      connection = await prisma.googleConnection.create({
        data: {
          userId,
          accountEmail,
          accessToken: tokens.access_token,
          encryptedRefreshToken,
          tokenExpiry,
          scope: tokens.scope,
          status: 'connected',
        },
      });
    }

    return connection;
  },

  /**
   * Disconnects and deletes stored credentials
   */
  async disconnect(userId) {
    const connection = await prisma.googleConnection.findFirst({
      where: { userId },
    });

    if (!connection) {
      return { success: true, message: 'No active connection found' };
    }

    // Attempt token revocation if refresh token is present
    if (connection.encryptedRefreshToken) {
      try {
        const rawRefresh = decryptToken(connection.encryptedRefreshToken);
        const oauth2Client = getOAuth2Client();
        if (rawRefresh) {
          await oauth2Client.revokeToken(rawRefresh);
        }
      } catch (err) {
        console.warn('[OAuth] Could not revoke token on Google server:', err.message);
      }
    }

    await prisma.googleConnection.delete({
      where: { id: connection.id },
    });

    return { success: true, message: 'Google connection removed successfully' };
  },

  /**
   * Gets an active, refreshed access token for a GoogleConnection
   */
  async getValidAccessToken(connectionId) {
    const connection = await prisma.googleConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const isExpired = !connection.tokenExpiry || new Date() >= new Date(connection.tokenExpiry);
    if (!isExpired && connection.accessToken) {
      return connection.accessToken;
    }

    if (!connection.encryptedRefreshToken) {
      throw new Error('No refresh token available. Re-authentication required.');
    }

    const refreshToken = decryptToken(connection.encryptedRefreshToken);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.googleConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    return credentials.access_token;
  },
};
