import { prisma } from '../config/database.js';
import { insightsService } from '../services/ai/insightsService.js';
import { keywordService } from '../services/seo/keywordService.js';

export const intelligenceController = {
  /**
   * Review Intelligence & Recurring Themes: GET /api/insights
   */
  async getInsights(req, res, next) {
    try {
      const { businessId } = req.query;

      let location = null;
      if (businessId) {
        location = await prisma.businessLocation.findUnique({ where: { id: businessId } });
      } else {
        location = (await prisma.businessLocation.findFirst({ where: { isPrimary: true } })) ||
                   (await prisma.businessLocation.findFirst());
      }

      if (!location) {
        return res.status(404).json({
          error: 'Location Not Found',
          message: 'No active business location found to generate insights.',
        });
      }

      const insights = await insightsService.generateBusinessInsights(location.id);
      res.json({
        success: true,
        businessId: location.id,
        businessName: location.name,
        insights,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Reports summary: GET /api/reports
   */
  async getReports(req, res, next) {
    try {
      const { businessId } = req.query;

      let location = null;
      if (businessId) {
        location = await prisma.businessLocation.findUnique({ where: { id: businessId } });
      } else {
        location = (await prisma.businessLocation.findFirst({ where: { isPrimary: true } })) ||
                   (await prisma.businessLocation.findFirst());
      }

      const reviewCount = await prisma.review.count({
        where: location ? { business_id: location.id } : undefined,
      });

      const avgRating = await prisma.review.aggregate({
        where: location ? { business_id: location.id } : undefined,
        _avg: { rating: true },
      });

      const audits = await prisma.sEOAudit.findMany({
        where: location ? { business_id: location.id } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      res.json({
        success: true,
        summary: {
          businessName: location?.name || 'Bhagyalaxmi Hotel & Resort',
          totalReviews: reviewCount,
          averageRating: avgRating._avg.rating ? parseFloat(avgRating._avg.rating.toFixed(2)) : 4.8,
          latestSeoScore: audits[0]?.overallScore || 85,
          generatedAt: new Date().toISOString(),
        },
        audits,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Synchronization history: GET /api/sync/history
   */
  async getSyncHistory(req, res, next) {
    try {
      const jobs = await prisma.job_runs.findMany({
        orderBy: { created_at: 'desc' },
        take: 30,
      });

      res.json({
        success: true,
        history: jobs.map((j) => ({
          id: j.id,
          jobType: j.job_type,
          status: j.status,
          itemsProcessed: j.records_processed || 0,
          errorMessage: j.error_message || null,
          startedAt: j.started_at,
          completedAt: j.completed_at,
          createdAt: j.created_at,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Keyword Generation: POST /api/keywords/generate
   */
  async generateKeywords(req, res, next) {
    try {
      const { businessLocationId, businessId, services, targetCity, businessName, category } = req.body;
      const targetLocationId = businessLocationId || businessId;

      const result = await keywordService.generateKeywords({
        businessLocationId: targetLocationId,
        services,
        targetCity,
        businessName,
        category,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
