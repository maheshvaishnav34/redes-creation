import axios from 'axios';
import { prisma } from '../../config/database.js';
import { oauthService } from './oauthService.js';

export const accountService = {
  /**
   * Fetches accessible Google Business Profile accounts using the authorized connection
   */
  async fetchGoogleAccounts(userId) {
    const connection = await prisma.googleConnection.findFirst({
      where: { userId, status: 'connected' },
    });

    if (!connection) {
      return {
        connected: false,
        accounts: [],
        message: 'No Google account connected. Please connect Google Business Profile.',
      };
    }

    try {
      const accessToken = await oauthService.getValidAccessToken(connection.id);

      // Call Google Business Profile Account Management API v1
      const response = await axios.get(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      const rawAccounts = response.data.accounts || [];

      // Persist accounts in PostgreSQL
      const savedAccounts = [];
      for (const acc of rawAccounts) {
        const saved = await prisma.businessAccount.upsert({
          where: {
            googleConnectionId_accountId: {
              googleConnectionId: connection.id,
              accountId: acc.name, // e.g. "accounts/11223344"
            },
          },
          update: {
            accountName: acc.accountName || acc.name,
            role: acc.role || 'OWNER',
          },
          create: {
            googleConnectionId: connection.id,
            accountId: acc.name,
            accountName: acc.accountName || acc.name,
            role: acc.role || 'OWNER',
          },
        });
        savedAccounts.push(saved);
      }

      return {
        connected: true,
        connectionId: connection.id,
        accountEmail: connection.accountEmail,
        accounts: savedAccounts,
      };
    } catch (err) {
      console.error('[Google Account Service] Error fetching accounts:', err.response?.data || err.message);
      
      const status = err.response?.status;
      let errorMessage = 'Failed to fetch Google accounts';

      if (status === 401) {
        errorMessage = 'Google authorization expired. Please reconnect your Google account.';
      } else if (status === 403) {
        errorMessage = 'Google Business Profile API access has not been approved or is restricted for this Google Cloud project.';
      } else if (status === 404) {
        errorMessage = 'No Google Business Profile accounts found under this email.';
      }

      return {
        connected: true,
        accounts: await prisma.businessAccount.findMany({
          where: { googleConnectionId: connection.id },
        }),
        error: errorMessage,
        apiDetails: err.response?.data?.error || null,
      };
    }
  },
};
