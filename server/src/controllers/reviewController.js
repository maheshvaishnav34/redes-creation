import { prisma } from '../config/database.js';
import { reviewsService } from '../services/google/reviewsService.js';
import { sentimentService } from '../services/ai/sentimentService.js';
import { replyService } from '../services/ai/replyService.js';

export const reviewController = {
  /**
   * Lists reviews with pagination, filtering, and search: GET /api/reviews
   */
  async getReviews(req, res, next) {
    try {
      const {
        businessId,
        rating,
        sentiment,
        replyStatus,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take = parseInt(limit, 10);

      const where = {};

      if (businessId) {
        where.business_id = businessId;
      }
      if (rating) {
        where.rating = parseInt(rating, 10);
      }
      if (sentiment) {
        where.sentiment = sentiment;
      }
      if (replyStatus) {
        where.replyStatus = replyStatus;
      }
      if (search) {
        where.OR = [
          { author_name: { contains: search, mode: 'insensitive' } },
          { review_text: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [reviews, totalCount] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { reviewDate: 'desc' },
          skip,
          take,
          include: {
            review_responses: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
            business_locations: {
              select: { id: true, name: true, city: true },
            },
          },
        }),
        prisma.review.count({ where }),
      ]);

      // Calculate rating breakdown & sentiment totals
      const agg = await prisma.review.aggregate({
        where: businessId ? { business_id: businessId } : undefined,
        _avg: { rating: true },
        _count: { id: true },
      });

      const formatted = reviews.map((r) => ({
        id: r.id,
        businessId: r.business_id,
        businessName: r.business_locations?.name || 'Hotel Bhagyalaxmi & Resort',
        reviewerName: r.author_name,
        reviewerPhotoUrl: r.author_photo_url,
        rating: r.rating,
        comment: r.review_text,
        reviewDate: r.reviewDate,
        sentiment: r.sentiment,
        sentimentScore: r.sentimentScore ? parseFloat(r.sentimentScore) : 0,
        replyStatus: r.replyStatus,
        urgency: r.urgency,
        summary: r.summary,
        detectedTopics: r.detected_topics || [],
        latestReply: r.review_responses[0]?.response_text || null,
        replyOptions: r.review_responses[0]?.response_options || null,
        createdAt: r.createdAt,
      }));

      res.json({
        success: true,
        reviews: formatted,
        pagination: {
          total: totalCount,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(totalCount / take),
        },
        metrics: {
          totalReviews: agg._count.id,
          averageRating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(2)) : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Triggers review synchronization: POST /api/reviews/sync
   */
  async syncReviews(req, res, next) {
    try {
      const { businessLocationId, businessId } = req.body;
      const targetId = businessLocationId || businessId;

      let location = null;
      if (targetId) {
        location = await prisma.businessLocation.findUnique({ where: { id: targetId } });
      } else {
        location = await prisma.businessLocation.findFirst({ where: { isPrimary: true } });
      }

      if (!location) {
        return res.status(404).json({
          error: 'Business Not Found',
          message: 'No primary business location found to synchronize.',
        });
      }

      const syncResult = await reviewsService.syncReviews(location.id, req.user?.id || 'default_user');
      res.json(syncResult);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Analyzes an individual review: POST /api/reviews/:reviewId/analyze
   */
  async analyzeReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const result = await sentimentService.analyzeReview(reviewId);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generates a review reply draft: POST /api/reviews/:reviewId/reply-draft
   */
  async generateReplyDraft(req, res, next) {
    try {
      const { reviewId } = req.params;
      const result = await replyService.generateReplyDraft(reviewId);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Publishes an approved reply: POST /api/reviews/:reviewId/publish-reply
   */
  async publishReply(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { replyText } = req.body;

      if (!replyText || replyText.trim().length < 2) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Reply text cannot be empty.',
        });
      }

      // Check review
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      // Record published response in review_responses table
      const responseRecord = await prisma.review_responses.create({
        data: {
          review_id: review.id,
          response_text: replyText,
          tone: 'Professional',
          generated_by_ai: true,
          published_at: new Date(),
        },
      });

      // Update review status to replied
      await prisma.review.update({
        where: { id: review.id },
        data: { replyStatus: 'replied' },
      });

      res.json({
        success: true,
        message: 'Review reply published and recorded successfully.',
        response: responseRecord,
      });
    } catch (err) {
      next(err);
    }
  },
};
