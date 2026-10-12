import { z } from 'zod';
import { getGroqStructuredCompletion } from './groqClient.js';
import { prisma } from '../../config/database.js';

const SentimentResultSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  sentimentScore: z.number().min(-1).max(1),
  issueCategory: z.string(),
  urgency: z.enum(['low', 'medium', 'high']),
  topics: z.array(z.string()).default([]),
  summary: z.string(),
});

export const sentimentService = {
  /**
   * Analyzes an individual review's sentiment and issue category
   */
  async analyzeReview(reviewId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { business_locations: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const comment = review.review_text || review.comment || '';
    const rating = review.rating;

    // Build prompt with reviewer privacy redaction
    const systemPrompt = `You are a Local Business Review Intelligence AI.
Analyze the following customer review and return structured JSON only with this schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": float between -1.0 and 1.0,
  "issueCategory": string (e.g. "Customer Service", "Pricing", "Cleanliness", "Room Quality", "Food & Dining", "Staff Behavior", "Check-in", "General Praise"),
  "urgency": "low" | "medium" | "high",
  "topics": string[],
  "summary": string
}
Do not include any text outside the JSON.`;

    const locationName = review.business_locations?.name || 'Local Business';
    const userPrompt = `Business: "${locationName}"
Star Rating: ${rating}/5
Review Text: "${comment.replace(/"/g, "'")}"`;

    let parsedResult = null;

    try {
      const rawAi = await getGroqStructuredCompletion({ systemPrompt, userPrompt });
      if (rawAi) {
        parsedResult = SentimentResultSchema.parse(rawAi);
      }
    } catch (err) {
      console.warn('[Sentiment Service] Groq AI parsing failed or unavailable, using deterministic rules:', err.message);
    }

    // Deterministic fallback if Groq key not set or failed
    if (!parsedResult) {
      const isPositive = rating >= 4;
      const isNegative = rating <= 2;
      const sentiment = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
      const sentimentScore = isPositive ? 0.8 : isNegative ? -0.8 : 0.0;
      const urgency = rating === 1 ? 'high' : rating === 2 ? 'medium' : 'low';
      
      let issueCategory = 'General Experience';
      const lower = comment.toLowerCase();
      if (lower.includes('clean') || lower.includes('dirty') || lower.includes('washroom') || lower.includes('bed')) issueCategory = 'Cleanliness';
      else if (lower.includes('staff') || lower.includes('service') || lower.includes('rude') || lower.includes('manager')) issueCategory = 'Customer Service';
      else if (lower.includes('food') || lower.includes('breakfast') || lower.includes('restaurant') || lower.includes('dinner')) issueCategory = 'Food & Dining';
      else if (lower.includes('price') || lower.includes('expensive') || lower.includes('charge') || lower.includes('money')) issueCategory = 'Pricing & Value';

      parsedResult = {
        sentiment,
        sentimentScore,
        issueCategory,
        urgency,
        topics: [issueCategory, `Rating-${rating}`],
        summary: comment.slice(0, 150) || `Rated ${rating} stars without text.`,
      };
    }

    // Update review record in PostgreSQL
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        sentiment: parsedResult.sentiment,
        sentimentScore: parsedResult.sentimentScore,
        issueCategory: parsedResult.issueCategory,
        urgency: parsedResult.urgency,
      },
      include: { reply: true },
    });

    return {
      review: updatedReview,
      analysis: parsedResult,
    };
  },
};
