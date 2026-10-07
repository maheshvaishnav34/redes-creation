/**
 * Review Intelligence & Local SEO Aggregation Engine
 * Computes business-level analytics, trend comparisons, and Local SEO topic signals
 * from analyzed customer reviews.
 */
import { query } from '../../config/db.js';

export async function aggregateBusinessReviewIntelligence(businessId) {
  // 1. Fetch all reviews with AI analysis for this business
  const reviewsRes = await query(
    `SELECT id, author_name, rating, review_text, review_date,
            sentiment, sentiment_score, review_feedback, summary,
            positive_points, negative_points, complaints, praised_services,
            urgency, issue_detected, issue_type, detected_keywords, detected_topics,
            ai_analysis, processing_status
     FROM reviews
     WHERE business_id = $1
     ORDER BY review_date DESC`,
    [businessId]
  );

  const allReviews = reviewsRes.rows;
  const totalCount = allReviews.length;

  if (totalCount === 0) {
    return {
      totalReviews: 0,
      sentimentBreakdown: { positivePercent: 0, negativePercent: 0, mixedPercent: 0, neutralPercent: 0 },
      frequentlyPraisedTopics: [],
      frequentlyComplainedTopics: [],
      topPositiveKeywords: [],
      topNegativeKeywords: [],
      mostFrequentComplaints: [],
      trendingIssues: [],
      reviewTrends: { complaintGrowth: 0, periodComparisonInsight: 'No reviews found for trend analysis.' },
      localSeoSignals: [],
      overallFeedbackSummary: 'No customer reviews recorded yet.'
    };
  }

  // 2. Sentiment distribution
  let positiveCount = 0;
  let negativeCount = 0;
  let mixedCount = 0;
  let neutralCount = 0;

  const praisedCounts = {};
  const complaintCounts = {};
  const positiveKwCounts = {};
  const negativeKwCounts = {};
  const issueCounts = {};

  // For Trend Comparison (Recent 30 days vs Previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

  let recentComplaintsCount = 0;
  let previousComplaintsCount = 0;
  let recentWaitingComplaints = 0;
  let previousWaitingComplaints = 0;

  allReviews.forEach(rev => {
    const s = rev.sentiment || 'neutral';
    if (s === 'positive') positiveCount++;
    else if (s === 'negative') negativeCount++;
    else if (s === 'mixed') mixedCount++;
    else neutralCount++;

    // Praised services / topics
    const praised = Array.isArray(rev.praised_services) ? rev.praised_services : [];
    praised.forEach(p => {
      praisedCounts[p] = (praisedCounts[p] || 0) + 1;
    });

    // Complaints
    const comp = Array.isArray(rev.complaints) ? rev.complaints : [];
    comp.forEach(c => {
      complaintCounts[c] = (complaintCounts[c] || 0) + 1;
    });

    // Positive / Negative points as keywords
    const posPts = Array.isArray(rev.positive_points) ? rev.positive_points : [];
    posPts.forEach(pt => {
      positiveKwCounts[pt] = (positiveKwCounts[pt] || 0) + 1;
    });

    const negPts = Array.isArray(rev.negative_points) ? rev.negative_points : [];
    negPts.forEach(pt => {
      negativeKwCounts[pt] = (negativeKwCounts[pt] || 0) + 1;
    });

    if (rev.issue_type) {
      issueCounts[rev.issue_type] = (issueCounts[rev.issue_type] || 0) + 1;
    }

    // Trend analysis
    const revDate = new Date(rev.review_date || rev.created_at);
    if (revDate >= thirtyDaysAgo) {
      if (rev.issue_detected || comp.length > 0) recentComplaintsCount++;
      if (rev.issue_type === 'waiting_time' || (rev.review_text && rev.review_text.toLowerCase().includes('wait'))) {
        recentWaitingComplaints++;
      }
    } else if (revDate >= sixtyDaysAgo) {
      if (rev.issue_detected || comp.length > 0) previousComplaintsCount++;
      if (rev.issue_type === 'waiting_time' || (rev.review_text && rev.review_text.toLowerCase().includes('wait'))) {
        previousWaitingComplaints++;
      }
    }
  });

  const positivePercent = Math.round((positiveCount / totalCount) * 100);
  const negativePercent = Math.round((negativeCount / totalCount) * 100);
  const mixedPercent = Math.round((mixedCount / totalCount) * 100);
  const neutralPercent = Math.round((neutralCount / totalCount) * 100);

  // Sort helper
  const topList = (obj, limit = 5) => Object.entries(obj)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const frequentlyPraisedTopics = topList(praisedCounts, 5);
  const frequentlyComplainedTopics = topList(complaintCounts, 5);
  const topPositiveKeywords = topList(positiveKwCounts, 6);
  const topNegativeKeywords = topList(negativeKwCounts, 6);
  const mostFrequentComplaints = topList(complaintCounts, 5);
  const trendingIssues = topList(issueCounts, 4);

  // Section 12: Trend Detection & Comparison
  let trendInsight = '';
  let trendPriority = 'MEDIUM';
  let trendRecommendation = '';

  const complaintGrowth = previousComplaintsCount > 0
    ? Math.round(((recentComplaintsCount - previousComplaintsCount) / previousComplaintsCount) * 100)
    : (recentComplaintsCount > 0 ? 100 : 0);

  if (recentWaitingComplaints > 0) {
    trendInsight = `Waiting time has appeared in ${recentWaitingComplaints} reviews during the last 30 days.`;
    trendPriority = recentWaitingComplaints >= 3 ? 'HIGH' : 'MEDIUM';
    trendRecommendation = 'Consider increasing staffing during peak hours and improving appointment/service scheduling.';
  } else if (recentComplaintsCount > 0) {
    trendInsight = `Recent customer reviews indicate ${recentComplaintsCount} operational inquiries over the last 30 days.`;
    trendPriority = 'MEDIUM';
    trendRecommendation = 'Review feedback patterns and coordinate with front-desk staff to address recurring customer friction points.';
  } else {
    trendInsight = `Customer satisfaction is steady with strong praise for service quality across the last 30 days.`;
    trendPriority = 'LOW';
    trendRecommendation = 'Maintain current team operational workflow and continue encouraging verified 5-star Google reviews.';
  }

  // Section 9: Overall Feedback summary
  const topPraiseStr = frequentlyPraisedTopics.map(t => t.name).slice(0, 2).join(' and ') || 'staff behaviour and service quality';
  const topComplaintStr = frequentlyComplainedTopics[0]?.name || 'waiting time';
  const overallFeedback = `Customers frequently appreciate the ${topPraiseStr}, while ${topComplaintStr} is the most common customer inquiry.`;

  // Section 13: Local SEO Intelligence (Topic & Customer Language Signals)
  // Extract natural customer phrasing from positive points, keywords, and topics
  const seoSignals = [
    ...topPositiveKeywords.map(k => ({
      phrase: k.name.toLowerCase(),
      mentions: k.count,
      category: 'Customer Search Signal',
      opportunity: 'Incorporate into Google Business Profile service descriptions & website FAQ.'
    })),
    ...frequentlyPraisedTopics.map(p => ({
      phrase: p.name.toLowerCase(),
      mentions: p.count,
      category: 'Service Strength',
      opportunity: 'Highlight in GBP primary categories, posts, and local landing page copy.'
    }))
  ].slice(0, 6);

  return {
    totalReviews: totalCount,
    sentimentBreakdown: {
      positivePercent,
      negativePercent,
      mixedPercent,
      neutralPercent
    },
    frequentlyPraisedTopics,
    frequentlyComplainedTopics,
    topPositiveKeywords,
    topNegativeKeywords,
    mostFrequentComplaints,
    trendingIssues,
    reviewTrends: {
      recentComplaints: recentComplaintsCount,
      previousComplaints: previousComplaintsCount,
      complaintGrowth,
      insight: trendInsight,
      priority: trendPriority,
      recommendation: trendRecommendation
    },
    localSeoSignals: seoSignals,
    overallFeedbackSummary: overallFeedback
  };
}
