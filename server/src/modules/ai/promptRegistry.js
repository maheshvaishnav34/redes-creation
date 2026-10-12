import { query } from '../../config/db.js';

// Cache for active prompt versions (refreshed on updates or 5-min TTL)
const promptCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Built-in production versioned prompt templates (Section 12)
 */
export const DEFAULT_PROMPT_TEMPLATES = {
  review_reply: {
    version: 'v2.2-production',
    systemPrompt: `You are the AI Reputation & Customer Care Specialist for {{business_name}} operating in the {{industry_name}} niche (Subcategory: {{subcategory_name}}).
Adopt the brand voice: {{brand_voice}}.
Authorized languages: {{languages}}.
Your replies must strictly honor the following facts and constraints:
- Approved facts/claims: {{approved_claims}}
- Disallowed claims: {{restricted_claims}}
- Brand Tone: {{brand_voice}}
- Reply Rules: {{reply_rules}}
- Escalation Protocol: {{escalation_rules}}
- Compliance Rules: {{compliance_rules}}

Never fabricate customer interactions or invent details not present in the customer review. Never guarantee that keywords will alter rankings.`,
    userPromptTemplate: `Draft natural, courteous responses for the following customer review:
Customer: {{author_name}}
Rating: {{rating}} / 5 Stars
Review Text: "{{review_text}}"
Detected Topics: {{detected_topics}}
Brand Voice Requested: {{tone_requested}}

Provide 2 to 3 distinct response variations (Professional, Warm, and Concise) that address the customer's specific remarks directly.`,
    safetyInstructions: `1. Never make medical, legal, or unverified claims.
2. If review mentions safety hazards, food poisoning, or legal threats, route immediately for manager approval.
3. No keyword stuffing or artificial keyword injection.`
  },

  review_analysis: {
    version: 'v2.2-production',
    systemPrompt: `You are an expert NLP Customer Sentiment & Intent Analyst specializing in {{industry_name}} businesses.
Analyze customer feedback objectively against business services: {{services}} and compliance rules: {{compliance_rules}}.`,
    userPromptTemplate: `Analyze this review for {{business_name}}:
Author: {{author_name}} (Rating: {{rating}}/5)
Text: "{{review_text}}"
Extract sentiment, key praise/complaint topics, customer intent, urgency (critical/high/medium/low), and strategic insight.`,
    safetyInstructions: `Detect allergen, safety, harassment, or financial dispute flags with highest priority.`
  },

  seo_posts: {
    version: 'v2.2-production',
    systemPrompt: `You are the Google Business Profile Growth Strategist for {{business_name}} located in {{city}}, {{country}}.
Niche: {{industry_name}} ({{subcategory_name}}).
Target keywords for context: {{target_keywords}}.
Excluded terms: {{excluded_keywords}}.
Brand voice: {{brand_voice}}.

Guidelines: Write compelling, authentic Google Posts with clear Call-to-Actions (CTAs) that inform real customers without keyword stuffing.`,
    userPromptTemplate: `Generate 3 distinct Google Business Profile Post ideas for {{business_name}}:
1. Offer / Promotion Post (CTA: Claim Offer or Call Now)
2. What's New / Community Update Post (CTA: Learn More or Visit Website)
3. Behind-the-Scenes / Customer Story Post (CTA: Book Now or Message)

For each post, include: headline, post copy (under 150 words), photo visual suggestion, and suggested CTA button.`,
    safetyInstructions: `Do not promise rank guarantees. Align strictly with Google Business Profile posting policies.`
  },

  maps_growth: {
    version: 'v2.2-production',
    systemPrompt: `You are the Local Maps Engine Specialist for {{business_name}}.
Evaluate category alignment, service itemization, and photo upload cadence for maximum local relevance.`,
    userPromptTemplate: `Evaluate local signals for {{business_name}} in {{city}}.
Primary Category: {{primary_category}}
Existing Services: {{services}}
Target Keywords: {{target_keywords}}
Identify high-impact secondary categories and catalog itemization recommendations.`,
    safetyInstructions: `Only recommend legitimate primary/secondary categories recognized by Google Maps taxonomy.`
  },

  competitor_gap: {
    version: 'v2.2-production',
    systemPrompt: `You are the Competitive Market Analyst for {{business_name}}.
Benchmark against local competitors: {{competitors}}.
Never copy competitor reviews or content. Focus on authentic positioning advantages and unmet customer needs.`,
    userPromptTemplate: `Analyze gaps between {{business_name}} and competitors. Identify unmet customer needs from review themes and local visibility gaps.`,
    safetyInstructions: `Strictly prohibit copying competitor text, reviews, or intellectual property.`
  },

  assistant_chat: {
    version: 'v2.2-production',
    systemPrompt: `You are the AI Executive Operations Assistant for {{business_name}} ({{industry_name}}).
You have real-time access to the location's Business Intelligence Profile:
- Services: {{services}}
- Target Keywords: {{target_keywords}}
- Brand Voice: {{brand_voice}}
- Reply & Escalation Rules: {{reply_rules}}
Answer the business owner with concise, evidence-based metrics and actionable insights.`,
    userPromptTemplate: `Owner Query: "{{message}}"
Provide measured data, relevant context, and recommended next steps.`,
    safetyInstructions: `Be transparent, respectful, and never fabricate metrics.`
  }
};

/**
 * Loads the complete 15-field Business Intelligence Profile for a location (Section 12)
 */
export async function getBusinessIntelligenceProfile(businessId) {
  const bizRes = await query(
    `SELECT b.*, 
            bp.identity, bp.description as bp_description, bp.services, bp.products,
            bp.customer_personas, bp.brand_voice, bp.languages, bp.approved_claims,
            bp.restricted_claims, bp.target_keywords as bp_target_keywords,
            bp.excluded_keywords as bp_excluded_keywords, bp.reply_rules,
            bp.escalation_rules, bp.compliance_rules, bp.knowledge_base,
            i.name as industry_name, i.icon as industry_icon, i.default_topics,
            sc.name as subcategory_name
     FROM business_locations b
     LEFT JOIN business_profiles bp ON b.id = bp.business_id
     LEFT JOIN industries i ON b.industry_id = i.id
     LEFT JOIN industry_subcategories sc ON b.subcategory_id = sc.id
     WHERE b.id = $1`,
    [businessId]
  );

  const biz = bizRes.rows[0] || {};

  // Fetch active keywords
  const kwRes = await query(
    `SELECT keyword, is_primary, current_rank FROM keywords WHERE business_id = $1 AND status = 'approved'`,
    [businessId]
  );
  const targetKeywords = kwRes.rows.map(k => k.keyword);

  // Fetch tracked competitors
  const compRes = await query(
    `SELECT name, rating, review_count, visibility_score FROM competitors WHERE business_id = $1`,
    [businessId]
  );
  const competitorSet = compRes.rows.map(c => `${c.name} (${c.rating}★, ${c.review_count} revs)`);

  return {
    businessId: biz.id,
    business_name: biz.name || 'Business Location',
    industry_id: biz.industry_id || 'hospitality',
    industry_name: biz.industry_name || 'Hospitality',
    subcategory_name: biz.subcategory_name || 'Fine Dining',
    business_model: biz.business_model || 'storefront',
    address: biz.address || '',
    city: biz.city || 'City',
    country: biz.country || 'India',
    phone: biz.phone || '',
    website: biz.website || '',
    service_areas: biz.service_areas || [biz.city || 'Local Area'],
    description: biz.bp_description || biz.identity || `${biz.name} in ${biz.city}`,
    services: Array.isArray(biz.services) ? biz.services : ['Primary Service'],
    products: biz.products || [],
    approved_claims: biz.approved_claims || ['Verified business operations', 'Quality guarantee'],
    restricted_claims: biz.restricted_claims || ['No medical or false claims'],
    target_keywords: targetKeywords.length > 0 ? targetKeywords : (biz.bp_target_keywords || []),
    excluded_keywords: biz.bp_excluded_keywords || ['cheap', 'free download', 'scam'],
    brand_voice: biz.brand_voice || 'Professional',
    languages: biz.languages || ['en', 'hi'],
    reply_rules: biz.reply_rules || { auto_reply_5_star: true, manual_approval_1_2_star: true },
    escalation_rules: biz.escalation_rules || { notify_manager_on_1_star: true },
    customer_personas: biz.customer_personas || ['Local residents', 'Families', 'Corporate patrons'],
    competitor_set: competitorSet,
    seo_goals: ['Top 3 Local Maps Pack rank', 'Maintain 95%+ review response rate', 'Increase customer photo volume'],
    compliance_rules: biz.compliance_rules || ['Zero tolerance for harassment', 'Truthful representations only']
  };
}

/**
 * Resolves active versioned prompt from ai_prompt_versions or falls back to default
 */
export async function getActivePrompt(moduleName, industryId = 'all') {
  const now = Date.now();
  const cacheKey = `${moduleName}:${industryId}`;

  if (now - cacheTimestamp < CACHE_TTL_MS && promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey);
  }

  try {
    const res = await query(
      `SELECT * FROM ai_prompt_versions 
       WHERE module = $1 AND is_active = TRUE AND (industry_id = $2 OR industry_id = 'all')
       ORDER BY CASE WHEN industry_id = $2 THEN 1 ELSE 2 END, created_at DESC 
       LIMIT 1`,
      [moduleName, industryId]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const promptObj = {
        version: row.version,
        systemPrompt: row.system_prompt,
        userPromptTemplate: row.user_prompt_template,
        safetyInstructions: row.safety_instructions || ''
      };
      promptCache.set(cacheKey, promptObj);
      return promptObj;
    }
  } catch (err) {
    console.warn('[PROMPT_REGISTRY] Failed to read from DB, using fallback template:', err.message);
  }

  const fallback = DEFAULT_PROMPT_TEMPLATES[moduleName] || DEFAULT_PROMPT_TEMPLATES.assistant_chat;
  promptCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Compiles template by replacing {{variable}} with context values
 */
export function compileTemplate(templateString, context = {}) {
  if (!templateString) return '';
  return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = context[key];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
}

/**
 * Ensures all default prompts exist in the database for versioning & auditability
 */
export async function syncPromptVersionsToDb() {
  try {
    for (const [moduleName, template] of Object.entries(DEFAULT_PROMPT_TEMPLATES)) {
      const existing = await query(
        `SELECT id FROM ai_prompt_versions WHERE module = $1 AND version = $2 LIMIT 1`,
        [moduleName, template.version]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO ai_prompt_versions (module, industry_id, version, system_prompt, user_prompt_template, safety_instructions, is_active)
           VALUES ($1, 'all', $2, $3, $4, $5, TRUE)`,
          [moduleName, template.version, template.systemPrompt, template.userPromptTemplate, template.safetyInstructions]
        );
      }
    }
  } catch (err) {
    console.warn('[PROMPT_REGISTRY] Sync prompts warning:', err.message);
  }
}
