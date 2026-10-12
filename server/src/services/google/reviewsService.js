import axios from 'axios';
import { prisma } from '../../config/database.js';
import { oauthService } from './oauthService.js';

export const reviewsService = {
  /**
   * Fetches real authorized reviews from Google Business Profile Reviews API and upserts into PostgreSQL
   */
  async syncReviews(businessLocationId, userId, pageToken = null) {
    const location = await prisma.businessLocation.findUnique({
      where: { id: businessLocationId },
      include: {
        businessAccount: {
          include: {
            googleConnection: true,
          },
        },
      },
    });

    if (!location) {
      throw new Error('Business location not found.');
    }

    if (location.userId !== userId) {
      throw new Error('Access denied. You do not own this business location.');
    }

    // Start a SyncJob record in PostgreSQL
    const syncJob = await prisma.syncJob.create({
      data: {
        businessLocationId: location.id,
        jobType: 'reviews_sync',
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Check if we have an authorized Google connection & location ID
    const connection = location.businessAccount?.googleConnection;
    if (!connection || !location.googleLocationId || !location.businessAccount?.accountId) {
      // Record in sync job and return persisted local reviews
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'completed',
          errorMessage: 'No authorized Google connection or Google Location ID configured. Serving local persisted reviews.',
          completedAt: new Date(),
        },
      });

      const existingReviews = await prisma.review.findMany({
        where: { businessLocationId },
        orderBy: { reviewDate: 'desc' },
        include: { reply: true },
      });

      return {
        success: true,
        source: 'database',
        syncJobId: syncJob.id,
        reviews: existingReviews,
        message: 'No live Google Business Profile connection associated. Displaying persisted database records.',
      };
    }

    try {
      const accessToken = await oauthService.getValidAccessToken(connection.id);
      const accountId = location.businessAccount.accountId;
      const locationId = location.googleLocationId;
      
      // Google Business Profile Reviews API v1: accounts/{accountId}/locations/{locationId}/reviews
      const cleanParent = `${accountId}/${locationId}`;
      const url = `https://mybusiness.googleapis.com/v1/${cleanParent}/reviews`;

      const response = await axios.get(url, {
        params: {
          pageSize: 50,
          pageToken: pageToken || undefined,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 12000,
      });

      const rawReviews = response.data.reviews || [];
      let upsertedCount = 0;

      for (const rev of rawReviews) {
        // Map Google star rating: STAR_RATING_UNSPECIFIED, ONE, TWO, THREE, FOUR, FIVE
        const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
        const ratingNum = ratingMap[rev.starRating] || (typeof rev.starRating === 'number' ? rev.starRating : 5);
        const reviewDate = rev.createTime ? new Date(rev.createTime) : new Date();

        const providerReviewId = rev.reviewId || rev.name;

        // Upsert review record in PostgreSQL using unique composite constraint
        const savedReview = await prisma.review.upsert({
          where: {
            businessLocationId_providerReviewId: {
              businessLocationId: location.id,
              providerReviewId,
            },
          },
          update: {
            rating: ratingNum,
            comment: rev.comment || '',
            reviewerName: rev.reviewer?.displayName || 'Anonymous Reviewer',
            reviewerPhotoUrl: rev.reviewer?.profilePhotoUrl || null,
            reviewDate,
            replyStatus: rev.reviewReply ? 'replied' : 'unanswered',
          },
          create: {
            businessLocationId: location.id,
            providerReviewId,
            rating: ratingNum,
            comment: rev.comment || '',
            reviewerName: rev.reviewer?.displayName || 'Anonymous Reviewer',
            reviewerPhotoUrl: rev.reviewer?.profilePhotoUrl || null,
            reviewDate,
            replyStatus: rev.reviewReply ? 'replied' : 'unanswered',
            sentiment: ratingNum >= 4 ? 'positive' : ratingNum === 3 ? 'neutral' : 'negative',
          },
        });

        // If Google already has a reply from the owner, store/sync it
        if (rev.reviewReply?.comment) {
          await prisma.reviewReply.upsert({
            where: { reviewId: savedReview.id },
            update: {
              publishedComment: rev.reviewReply.comment,
              publishedAt: rev.reviewReply.updateTime ? new Date(rev.reviewReply.updateTime) : new Date(),
              status: 'published',
            },
            create: {
              reviewId: savedReview.id,
              publishedComment: rev.reviewReply.comment,
              publishedAt: rev.reviewReply.updateTime ? new Date(rev.reviewReply.updateTime) : new Date(),
              status: 'published',
            },
          });
        }

        upsertedCount++;
      }

      // Update location review totals and syncJob status
      const totalReviews = await prisma.review.count({ where: { businessLocationId: location.id } });
      const avgAggregate = await prisma.review.aggregate({
        where: { businessLocationId: location.id },
        _avg: { rating: true },
      });

      await prisma.businessLocation.update({
        where: { id: location.id },
        data: {
          lastSyncAt: new Date(),
          reviewCount: totalReviews,
          rating: avgAggregate._avg.rating ? parseFloat(avgAggregate._avg.rating.toFixed(2)) : 5.0,
        },
      });

      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'completed',
          itemsProcessed: upsertedCount,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        source: 'google_api',
        syncedCount: upsertedCount,
        nextPageToken: response.data.nextPageToken || null,
      };
    } catch (err) {
      console.error('[Reviews Service] Live sync error:', err.response?.data || err.message);

      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'failed',
          errorMessage: err.response?.data?.error?.message || err.message,
          completedAt: new Date(),
        },
      });

      throw new Error(`Google Reviews API synchronization failed: ${err.response?.data?.error?.message || err.message}`);
    }
  },

  /**
   * Publishes an approved reply to Google Business Profile API
   */
  async publishReplyToGoogle(reviewId, replyText, userId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        businessLocation: {
          include: {
            businessAccount: {
              include: {
                googleConnection: true,
              },
            },
          },
        },
        reply: true,
      },
    });

    if (!review) {
      throw new Error('Review not found.');
    }

    if (review.businessLocation.userId !== userId) {
      throw new Error('Access denied. You do not own this business location.');
    }

    const connection = review.businessLocation.businessAccount?.googleConnection;
    const accountId = review.businessLocation.businessAccount?.accountId;
    const locationId = review.businessLocation.googleLocationId;

    if (!connection || !accountId || !locationId) {
      // Record approval in database even if live API connection is not currently configured
      const replyRecord = await prisma.reviewReply.upsert({
        where: { reviewId: review.id },
        update: {
          publishedComment: replyText,
          status: 'approved',
          publishedAt: new Date(),
        },
        create: {
          reviewId: review.id,
          publishedComment: replyText,
          status: 'approved',
          publishedAt: new Date(),
        },
      });

      await prisma.review.update({
        where: { id: review.id },
        data: { replyStatus: 'replied' },
      });

      return {
        success: true,
        mode: 'persisted_local',
        reply: replyRecord,
        message: 'Reply approved and recorded in local database (Google Business Profile not linked).',
      };
    }

    const accessToken = await oauthService.getValidAccessToken(connection.id);
    const reviewPath = review.providerReviewId.startsWith('accounts/')
      ? review.providerReviewId
      : `${accountId}/${locationId}/reviews/${review.providerReviewId}`;

    const url = `https://mybusiness.googleapis.com/v1/${reviewPath}/reply`;

    try {
      const response = await axios.put(
        url,
        { comment: replyText },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const replyRecord = await prisma.reviewReply.upsert({
        where: { reviewId: review.id },
        update: {
          publishedComment: replyText,
          status: 'published',
          publishedAt: new Date(),
          apiError: null,
        },
        create: {
          reviewId: review.id,
          publishedComment: replyText,
          status: 'published',
          publishedAt: new Date(),
          apiError: null,
        },
      });

      await prisma.review.update({
        where: { id: review.id },
        data: { replyStatus: 'replied' },
      });

      return {
        success: true,
        mode: 'google_api',
        googleReply: response.data,
        reply: replyRecord,
      };
    } catch (err) {
      console.error('[Reviews Service] Reply publish error:', err.response?.data || err.message);

      const errorMsg = err.response?.data?.error?.message || err.message;
      await prisma.reviewReply.upsert({
        where: { reviewId: review.id },
        update: {
          status: 'failed',
          apiError: errorMsg,
        },
        create: {
          reviewId: review.id,
          draftComment: replyText,
          status: 'failed',
          apiError: errorMsg,
        },
      });

      throw new Error(`Google API reply publication failed: ${errorMsg}`);
    }
  },
};
