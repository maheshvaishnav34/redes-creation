import { prisma } from '../config/database.js';
import { accountService } from '../services/google/accountService.js';
import { locationService } from '../services/google/locationService.js';

export const businessController = {
  /**
   * Fetches authorized Google accounts: GET /api/google/accounts
   */
  async getGoogleAccounts(req, res, next) {
    try {
      const userId = req.user?.id || 'default_user';
      const result = await accountService.fetchGoogleAccounts(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Fetches Google locations: GET /api/google/accounts/:accountId/locations
   */
  async getGoogleLocations(req, res, next) {
    try {
      const userId = req.user?.id || 'default_user';
      const { accountId } = req.params;
      const { pageToken } = req.query;

      const result = await locationService.fetchAccountLocations(userId, accountId, pageToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Creates a business location: POST /api/businesses
   */
  async createBusiness(req, res, next) {
    try {
      const { locationName, address, city, phone, websiteUrl, googleReviewUrl, category } = req.body;

      // Find first workspace or create fallback workspace if needed
      const firstWorkspace = await prisma.workspaces.findFirst();
      const workspaceId = firstWorkspace?.id;

      const newLocation = await prisma.businessLocation.create({
        data: {
          name: locationName,
          address: address || null,
          city: city || null,
          phone: phone || null,
          website: websiteUrl || null,
          isPrimary: true,
          workspace_id: workspaceId,
        },
      });

      res.status(201).json({
        success: true,
        business: {
          id: newLocation.id,
          locationName: newLocation.name,
          address: newLocation.address,
          city: newLocation.city,
          phone: newLocation.phone,
          website: newLocation.website,
          isPrimary: newLocation.isPrimary,
          createdAt: newLocation.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists businesses: GET /api/businesses
   */
  async getBusinesses(req, res, next) {
    try {
      const locations = await prisma.businessLocation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          google_locations: true,
          _count: {
            select: { reviews: true },
          },
        },
      });

      const formatted = locations.map((loc) => ({
        id: loc.id,
        locationName: loc.name,
        address: loc.address,
        city: loc.city,
        phone: loc.phone,
        websiteUrl: loc.website,
        isPrimary: loc.isPrimary,
        reviewCount: loc._count.reviews,
        googleLinked: Boolean(loc.google_locations),
        googleLocation: loc.google_locations ? {
          gbpLocationId: loc.google_locations.gbp_location_id,
          gbpPlaceId: loc.google_locations.gbp_place_id,
          locationName: loc.google_locations.location_name,
        } : null,
        createdAt: loc.createdAt,
      }));

      res.json({
        success: true,
        businesses: formatted,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets single business location: GET /api/businesses/:businessId
   */
  async getBusinessById(req, res, next) {
    try {
      const { businessId } = req.params;

      const location = await prisma.businessLocation.findUnique({
        where: { id: businessId },
        include: {
          google_locations: true,
          reviews: {
            orderBy: { reviewDate: 'desc' },
            take: 10,
            include: { review_responses: true },
          },
          seo_audits: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { reviews: true },
          },
        },
      });

      if (!location) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Business location not found.',
        });
      }

      res.json({
        success: true,
        business: {
          id: location.id,
          locationName: location.name,
          address: location.address,
          city: location.city,
          phone: location.phone,
          websiteUrl: location.website,
          isPrimary: location.isPrimary,
          reviewCount: location._count.reviews,
          recentReviews: location.reviews,
          latestAudit: location.seo_audits[0] || null,
          googleLinked: Boolean(location.google_locations),
          createdAt: location.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
