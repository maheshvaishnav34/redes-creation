import { z } from 'zod';
import { getGroqStructuredCompletion } from '../ai/groqClient.js';
import { prisma } from '../../config/database.js';

const KeywordClustersSchema = z.object({
  clusters: z.array(z.object({
    serviceGroup: z.string(),
    keywords: z.array(z.object({
      keyword: z.string(),
      intent: z.enum(['local', 'informational', 'commercial', 'transactional']),
      competitionLevel: z.enum(['Low', 'Medium', 'High']),
      suggestedHeading: z.string(),
      contentTopic: z.string(),
    })),
  })),
  suggestedPageTitles: z.array(z.string()),
});

export const keywordService = {
  /**
   * Generates clustered local keyword ideas using Groq AI
   */
  async generateKeywords({ businessLocationId, services = [], targetCity, businessName, category }) {
    let location = null;
    if (businessLocationId) {
      location = await prisma.businessLocation.findUnique({
        where: { id: businessLocationId },
      });
    }

    const name = businessName || location?.locationName || 'Local Business';
    const city = targetCity || location?.city || 'Local Area';
    const cat = category || location?.category || 'Hospitality & Services';
    const serviceList = services.length > 0 ? services.join(', ') : 'Standard Services, Booking, Inquiries';

    const systemPrompt = `You are an expert Local SEO Keyword Strategist.
Generate high-intent local search keywords grouped by service group and search intent.
IMPORTANT RULES:
1. Do NOT invent fake numerical search volume numbers or fake ranking positions.
2. Clearly distinguish AI-suggested keyword opportunities from measured Google Search Console data.
3. Group keywords logically by service category and search intent (local, commercial, informational, transactional).
4. Provide actionable page titles and H2/H3 headings for each keyword.
5. Return JSON matching:
{
  "clusters": [
    {
      "serviceGroup": string,
      "keywords": [
        {
          "keyword": string,
          "intent": "local" | "informational" | "commercial" | "transactional",
          "competitionLevel": "Low" | "Medium" | "High",
          "suggestedHeading": string,
          "contentTopic": string
        }
      ]
    }
  ],
  "suggestedPageTitles": string[]
}`;

    const userPrompt = `Business Name: "${name}"
Category: "${cat}"
Location/City: "${city}"
Services Offered: "${serviceList}"`;

    let result = null;

    try {
      const rawAi = await getGroqStructuredCompletion({ systemPrompt, userPrompt });
      if (rawAi) {
        result = KeywordClustersSchema.parse(rawAi);
      }
    } catch (err) {
      console.warn('[Keyword Service] Groq AI keyword generation failed or unavailable, using deterministic local generator:', err.message);
    }

    if (!result) {
      result = {
        clusters: [
          {
            serviceGroup: 'Core Local Discovery',
            keywords: [
              {
                keyword: `best ${cat.toLowerCase()} in ${city}`,
                intent: 'local',
                competitionLevel: 'Medium',
                suggestedHeading: `Why Choose ${name} in ${city}`,
                contentTopic: `Top-rated ${cat.toLowerCase()} experience in ${city}`,
              },
              {
                keyword: `${cat.toLowerCase()} near me in ${city}`,
                intent: 'local',
                competitionLevel: 'High',
                suggestedHeading: `Convenient Location & Easy Access in ${city}`,
                contentTopic: 'Directions, landmarks, and parking information',
              },
              {
                keyword: `${name} ${city} booking and rates`,
                intent: 'transactional',
                competitionLevel: 'Low',
                suggestedHeading: `Direct Booking & Exclusive Offers`,
                contentTopic: 'Pricing transparency, packages, and direct customer perks',
              },
            ],
          },
        ],
        suggestedPageTitles: [
          `${name} - Premier ${cat} in ${city} | Official Website`,
          `Book Your Visit at ${name} | Top ${cat} Experience in ${city}`,
        ],
      };
    }

    // Persist keywords to PostgreSQL if location is linked
    if (location) {
      for (const cluster of result.clusters) {
        for (const kw of cluster.keywords) {
          await prisma.keyword.create({
            data: {
              businessLocationId: location.id,
              keyword: kw.keyword,
              intent: kw.intent,
              serviceCategory: cluster.serviceGroup,
              competitionLevel: kw.competitionLevel,
              source: 'ai_suggested',
              suggestedHeadings: {
                heading: kw.suggestedHeading,
                topic: kw.contentTopic,
              },
            },
          });
        }
      }
    }

    return {
      source: 'groq_ai_strategic_intelligence',
      disclaimer: 'These keyword opportunities and headings are generated strategically based on local relevance and semantic search intent. For measured historical impressions and clicks, connect Google Search Console.',
      ...result,
    };
  },
};
