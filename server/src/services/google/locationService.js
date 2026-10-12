import axios from 'axios';
import { prisma } from '../../config/database.js';
import { oauthService } from './oauthService.js';

export const locationService = {
  /**
   * Fetches locations from Google Business Information API v1
   */
  async fetchAccountLocations(userId, accountId, pageToken = null) {
    const connection = await prisma.googleConnection.findFirst({
      where: { userId, status: 'connected' },
    });

    if (!connection) {
      throw new Error('No active Google connection found.');
    }

    const accessToken = await oauthService.getValidAccessToken(connection.id);

    try {
      const readMask = 'name,title,storefrontAddress,websiteUri,phoneNumbers,categories';
      const cleanAccountId = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;

      const response = await axios.get(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanAccountId}/locations`,
        {
          params: {
            readMask,
            pageSize: 50,
            pageToken: pageToken || undefined,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      const locations = response.data.locations || [];
      const nextPageToken = response.data.nextPageToken || null;

      return {
        success: true,
        locations: locations.map((loc) => ({
          googleLocationId: loc.name, // e.g. "locations/12345"
          locationName: loc.title,
          address: loc.storefrontAddress?.addressLines?.join(', ') || null,
          city: loc.storefrontAddress?.locality || null,
          state: loc.storefrontAddress?.administrativeArea || null,
          postalCode: loc.storefrontAddress?.postalCode || null,
          phone: loc.phoneNumbers?.primaryPhone || null,
          websiteUrl: loc.websiteUri || null,
          category: loc.categories?.primaryCategory?.displayName || null,
        })),
        nextPageToken,
      };
    } catch (err) {
      console.error('[Google Location Service] Error:', err.response?.data || err.message);
      
      const status = err.response?.status;
      let userMessage = 'Unable to retrieve locations from Google Business Profile.';

      if (status === 403) {
        userMessage = 'API access not approved for this Google Cloud project or insufficient permissions for this account.';
      } else if (status === 404) {
        userMessage = 'The requested account or locations could not be found.';
      }

      return {
        success: false,
        locations: [],
        error: userMessage,
        details: err.response?.data?.error || err.message,
      };
    }
  },

  /**
   * Imports and associates a selected Google location with the user's BusinessLocation record
   */
  async linkGoogleLocation(userId, businessAccountId, locationData) {
    const { googleLocationId, locationName, address, city, phone, websiteUrl, googlePlaceId, category } = locationData;

    // Check if business location already exists for this user and googleLocationId
    let location = await prisma.businessLocation.findFirst({
      where: {
        userId,
        googleLocationId,
      },
    });

    if (location) {
      location = await prisma.businessLocation.update({
        where: { id: location.id },
        data: {
          locationName: locationName || location.locationName,
          address: address || location.address,
          city: city || location.city,
          phone: phone || location.phone,
          websiteUrl: websiteUrl || location.websiteUrl,
          googlePlaceId: googlePlaceId || location.googlePlaceId,
          category: category || location.category,
          businessAccountId,
          lastSyncAt: new Date(),
        },
      });
    } else {
      location = await prisma.businessLocation.create({
        data: {
          userId,
          businessAccountId,
          googleLocationId,
          googlePlaceId,
          locationName,
          address,
          city,
          phone,
          websiteUrl,
          category,
          isPrimary: true,
          lastSyncAt: new Date(),
        },
      });
    }

    return location;
  },
};
