import { z } from 'zod';
import { getGroqStructuredCompletion } from './groqClient.js';
import { prisma } from '../../config/database.js';

const ReplyDraftSchema = z.object({
  englishReply: z.string().min(10),
  hindiReply: z.string().min(10),
  suggestedAction: z.string(),
  tone: z.string(),
});

export const replyService = {
  /**
   * Generates bilingual (English and Hindi) review reply drafts using Groq AI
   */
  async generateReplyDraft(reviewId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { business_locations: true, review_responses: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const businessName = review.business_locations?.name || 'Local Business';
    const rating = review.rating;
    const reviewerName = review.author_name || 'Customer';
    const comment = review.review_text || review.comment || 'Great experience!';

    const systemPrompt = `You are an elite Reputation Management Assistant for local businesses.
Generate professional, warm, and highly courteous review replies in both English and Hindi (Devanagari script).
Rules:
1. Express genuine gratitude for the customer's visit and feedback.
2. If negative or critical, express empathy, avoid defensive language, and invite them to contact management directly.
3. NEVER make false promises, promise monetary refunds, or admit legal liability.
4. Keep the English response under 80 words.
5. Keep the Hindi response polite, cultural, and under 80 words (शुद्ध और विनम्र हिंदी).
6. Return structured JSON matching:
{
  "englishReply": string,
  "hindiReply": string,
  "suggestedAction": string,
  "tone": string
}
Do not include any text outside the JSON.`;

    const userPrompt = `Business: "${businessName}"
Reviewer: ${reviewerName}
Rating: ${rating}/5 stars
Review: "${comment.replace(/"/g, "'")}"`;

    let draft = null;

    try {
      const rawAi = await getGroqStructuredCompletion({ systemPrompt, userPrompt });
      if (rawAi) {
        draft = ReplyDraftSchema.parse(rawAi);
      }
    } catch (err) {
      console.warn('[Reply Service] Groq AI generation failed or unavailable, using deterministic template:', err.message);
    }

    // Deterministic fallback templates
    if (!draft) {
      if (rating >= 4) {
        draft = {
          englishReply: `Dear ${reviewerName}, thank you so much for taking the time to share your wonderful feedback with us! We are thrilled to hear you had a great experience at ${businessName}. We look forward to welcoming you back soon!`,
          hindiReply: `नमस्ते ${reviewerName} जी, ${businessName} में अपना अमूल्य अनुभव साझा करने के लिए आपका बहुत-बहुत धन्यवाद! हमें खुशी है कि आपको हमारी सेवाएँ पसंद आईं। हम जल्द ही आपका पुनः स्वागत करने के लिए उत्सुक हैं।`,
          suggestedAction: 'Send a quick appreciation reply and encourage the team.',
          tone: 'Warm & Appreciative',
        };
      } else if (rating === 3) {
        draft = {
          englishReply: `Dear ${reviewerName}, thank you for sharing your honest feedback. We appreciate your insights regarding your visit to ${businessName} and will work diligently to improve. We hope to serve you even better on your next visit.`,
          hindiReply: `नमस्ते ${reviewerName} जी, ${businessName} के बारे में अपने विचार साझा करने के लिए धन्यवाद। हम आपकी प्रतिक्रिया को गंभीरता से लेते हैं और निरंतर सुधार के लिए प्रयासरत हैं। आशा है आपकी अगली यात्रा और भी सुखद होगी।`,
          suggestedAction: 'Review the points mentioned with the on-duty shift supervisor.',
          tone: 'Attentive & Receptive',
        };
      } else {
        draft = {
          englishReply: `Dear ${reviewerName}, we sincerely apologize that your experience did not meet expectations. At ${businessName}, we take customer satisfaction very seriously. Please reach out to our management directly so we can understand what happened and address this promptly.`,
          hindiReply: `नमस्ते ${reviewerName} जी, हमें खेद है कि आपका अनुभव हमारी सेवाओं के अनुरूप नहीं रहा। ${businessName} में ग्राहकों की संतुष्टि हमारी प्राथमिकता है। कृपया हमारी प्रबंधन टीम से संपर्क करें ताकि हम आपकी समस्या का उचित समाधान कर सकें।`,
          suggestedAction: 'Urgent follow-up: reach out to the customer or team manager to investigate.',
          tone: 'Empathetic & Solution-Oriented',
        };
      }
    }

    // Persist or update draft in PostgreSQL review_responses table
    const savedReply = await prisma.review_responses.create({
      data: {
        review_id: review.id,
        response_text: draft.englishReply,
        response_options: [
          { language: 'en', text: draft.englishReply },
          { language: 'hi', text: draft.hindiReply }
        ],
        tone: draft.tone || 'Professional',
        generated_by_ai: true,
      },
    });

    return {
      reviewId: review.id,
      reply: savedReply,
      draft,
    };
  },
};
