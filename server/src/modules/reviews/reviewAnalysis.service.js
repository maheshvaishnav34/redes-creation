/**
 * Google Review + Local SEO Intelligence System
 * AI Review Analysis Service
 * 
 * Analyzes customer reviews using Gemini AI / NLP Intelligence to extract:
 * - reviewFeedback (Customer communication summary - NEVER empty for valid text)
 * - sentiment & sentimentScore
 * - positivePoints & negativePoints
 * - complaints & praisedServices
 * - keywords & topics
 * - urgency, issueDetected, issueType
 * - customerIntent
 * - responseRequired & responseSuggestion
 * - improvementRecommendation
 */

const SYSTEM_PROMPT = `You are an expert Google Review and Local SEO Intelligence Analyst.

Analyze the customer review carefully.

Return ONLY valid JSON matching the requested schema.

Do not invent facts.

Identify:
* overall sentiment
* sentiment score
* customer feedback
* positive points
* negative points
* complaints
* praised services
* important keywords
* topics
* urgency
* detected issue
* issue type
* customer intent
* whether a response is required
* professional response suggestion
* business improvement recommendation

The review feedback must summarize what the customer actually communicated.

If the review contains both positive and negative feedback, classify it as mixed.

Do not treat a 5-star review as automatically completely positive if the text contains a complaint.

Do not treat a 1-star review as automatically completely negative if the customer praises something.

Never hallucinate information.`;

function buildUserPrompt({
  businessName,
  businessCategory,
  industry,
  subCategory,
  services,
  customerIntent,
  brandVoice,
  prohibitedClaims,
  location,
  rating,
  reviewText,
  reviewerName
}) {
  return `Business Location:
${businessName || 'Business Location'} ${location ? `(${location})` : ''}

Niche Taxonomy:
* Industry: ${industry || businessCategory || 'General Service'}
* Sub-Category: ${subCategory || 'Specialized Service'}
* Services Offered: ${(services && services.length > 0) ? services.join(', ') : 'Specialized local solutions'}
* Primary Customer Intent: ${customerIntent || 'Visit / Enquiry'}

AI Brand Voice & Policy Constraints:
* Brand Voice / Persona: ${brandVoice || 'Professional & Courteous'}
* Regulatory & Prohibited Claims Policy: ${(prohibitedClaims && prohibitedClaims.length > 0) ? prohibitedClaims.join('; ') : 'No misleading statements or privacy violations'}

Customer Review Details:
* Reviewer: ${reviewerName || 'Customer'}
* Rating: ${rating}/5 stars
* Review Text: ${reviewText || 'No review text provided.'}

Instructions:
Analyze this review through the lens of this exact business niche.
When generating responseSuggestion and improvementRecommendation:
1. Embody the specified Brand Voice and specialized niche vocabulary.
2. Address specific services praised or complained about.
3. STRICTLY observe prohibited claims and regulatory policies.
4. Return ONLY valid JSON matching the required schema.`;
}

/**
 * Validates and normalizes AI output against required Section 6 Schema
 */
export function validateAndNormalizeAnalysis(raw, { reviewText, rating, businessName }) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI_INVALID_RESPONSE: Response is not a valid JSON object');
  }

  // 1. Sentiment validation
  let sentiment = String(raw.sentiment || '').toLowerCase().trim();
  if (!['positive', 'neutral', 'negative', 'mixed'].includes(sentiment)) {
    if (rating >= 4) sentiment = 'positive';
    else if (rating === 3) sentiment = 'neutral';
    else sentiment = 'negative';
  }

  // 2. Sentiment score (0 to 1)
  let sentimentScore = Number(raw.sentimentScore);
  if (isNaN(sentimentScore) || sentimentScore < 0 || sentimentScore > 1) {
    if (sentiment === 'positive') sentimentScore = Number((0.75 + (rating / 20)).toFixed(2));
    else if (sentiment === 'negative') sentimentScore = Number((0.15 + (rating / 20)).toFixed(2));
    else if (sentiment === 'mixed') sentimentScore = 0.55;
    else sentimentScore = 0.50;
  }

  // 3. Lists extraction & sanitization
  const cleanList = (val) => Array.isArray(val)
    ? val.map(item => String(item).trim()).filter(Boolean)
    : [];

  const positivePoints = cleanList(raw.positivePoints);
  const negativePoints = cleanList(raw.negativePoints);
  const complaints = cleanList(raw.complaints);
  const praisedServices = cleanList(raw.praisedServices);
  const keywords = cleanList(raw.keywords);
  const topics = cleanList(raw.topics);

  // 4. Urgency
  let urgency = String(raw.urgency || '').toLowerCase().trim();
  if (!['low', 'medium', 'high', 'critical'].includes(urgency)) {
    if (rating <= 2 || complaints.length > 0) urgency = rating === 1 ? 'critical' : 'high';
    else if (rating === 3 || negativePoints.length > 0) urgency = 'medium';
    else urgency = 'low';
  }

  // 5. Issue Detection
  const issueDetected = Boolean(raw.issueDetected || complaints.length > 0 || negativePoints.length > 0 || rating <= 2);
  let issueType = String(raw.issueType || '').trim();
  if (issueDetected && !issueType) {
    issueType = complaints[0] || negativePoints[0] || 'service_experience';
  }

  // 6. Critical Requirement: reviewFeedback MUST NEVER REMAIN EMPTY for non-empty review text
  let reviewFeedback = String(raw.reviewFeedback || '').trim();
  let summary = String(raw.summary || '').trim();

  if (!reviewFeedback && reviewText && reviewText.trim().length > 0) {
    reviewFeedback = generateFallbackFeedback(reviewText, rating, sentiment, praisedServices, complaints);
  }

  if (!summary && reviewFeedback) {
    summary = reviewFeedback.length > 120 ? reviewFeedback.substring(0, 117) + '...' : reviewFeedback;
  }

  // 7. Customer intent
  let customerIntent = String(raw.customerIntent || '').trim();
  if (!customerIntent) {
    if (complaints.length > 0) {
      customerIntent = `Customer desires resolution and improved service regarding ${complaints.join(', ')}.`;
    } else if (sentiment === 'positive') {
      customerIntent = 'Customer wanted to share their appreciation and recommend the business.';
    } else {
      customerIntent = 'Customer provided general feedback on their visit experience.';
    }
  }

  // 8. Response Required & Suggestions
  const responseRequired = typeof raw.responseRequired === 'boolean'
    ? raw.responseRequired
    : (rating <= 3 || issueDetected || true); // Best practice: acknowledge all reviews

  let responseSuggestion = String(raw.responseSuggestion || '').trim();
  if (!responseSuggestion && responseRequired) {
    responseSuggestion = generateFallbackResponse({
      businessName,
      rating,
      sentiment,
      positivePoints,
      complaints
    });
  }

  let improvementRecommendation = String(raw.improvementRecommendation || '').trim();
  if (!improvementRecommendation) {
    if (complaints.length > 0) {
      improvementRecommendation = `Review and address customer concerns regarding ${complaints.join(', ')} to prevent recurring issues.`;
    } else {
      improvementRecommendation = `Maintain high service standards in ${praisedServices.join(', ') || 'customer hospitality'} and highlight these strengths in marketing.`;
    }
  }

  return {
    sentiment,
    sentimentScore,
    reviewFeedback,
    summary,
    positivePoints,
    negativePoints,
    complaints,
    praisedServices,
    keywords,
    topics,
    urgency,
    issueDetected,
    issueType,
    customerIntent,
    responseRequired,
    responseSuggestion,
    improvementRecommendation
  };
}

/**
 * Fallback feedback synthesizer guaranteeing review_feedback is NEVER empty
 */
function generateFallbackFeedback(reviewText, rating, sentiment, praised, complaintsList) {
  const text = reviewText.trim();
  if (!text) return 'Rating provided without written review text.';

  const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const firstClause = sentences[0] || text;

  if (complaintsList.length > 0 && praised.length > 0) {
    return `Customer expressed satisfaction with ${praised.slice(0, 2).join(' and ')}, but voiced dissatisfaction regarding ${complaintsList.slice(0, 2).join(' and ')}.`;
  }

  if (complaintsList.length > 0 || rating <= 2) {
    return `Customer reported dissatisfaction during their experience, specifically noting: "${firstClause.slice(0, 150)}".`;
  }

  if (rating >= 4) {
    return `Customer shared positive feedback highlighting their visit experience: "${firstClause.slice(0, 150)}".`;
  }

  return `Customer provided balanced feedback on their service experience: "${firstClause.slice(0, 150)}".`;
}

/**
 * Deterministic Semantic Intelligence Engine
 * Used when Gemini API key is unavailable, or during provider failure / offline fallback.
 * Strictly implements Section 5 requirements with 0 hallucination.
 */
export function analyzeWithSemanticEngine({ reviewText, rating, businessName, businessCategory }) {
  const text = (reviewText || '').trim();
  const lower = text.toLowerCase();

  // Keyword lexicons
  const praiseKeywords = [
    'friendly', 'courteous', 'helpful', 'prompt', 'quick', 'delicious', 'fresh',
    'clean', 'hygienic', 'exceptional', 'seamless', 'professional', 'hospitality',
    'polite', 'best', 'great', 'awesome', 'excellent', 'wonderful', 'top-notch',
    'satisfied', 'loved', 'recommended', 'perfect', 'cooperative'
  ];

  const complaintKeywords = [
    'delay', 'delayed', 'wait', 'waiting', 'slow', 'poor', 'bad', 'rude', 'dirty',
    'noise', 'noisy', 'expensive', 'overpriced', 'cold food', 'bottleneck', 'traffic',
    'parking', 'crowded', 'disappointing', 'worst', 'horrible', 'unresponsive',
    'cold', 'mistake', 'billing', 'allergy', 'unhygienic', 'unprofessional'
  ];

  const foundPraise = praiseKeywords.filter(k => lower.includes(k));
  const foundComplaints = complaintKeywords.filter(k => lower.includes(k));

  // Determine sentiment
  let sentiment = 'neutral';
  if (foundPraise.length > 0 && foundComplaints.length > 0) {
    sentiment = 'mixed';
  } else if (foundComplaints.length > 0 || rating <= 2) {
    sentiment = 'negative';
  } else if (foundPraise.length > 0 || rating >= 4) {
    sentiment = 'positive';
  }

  // Sentiment Score
  let sentimentScore = 0.50;
  if (sentiment === 'positive') sentimentScore = Math.min(0.98, Number((0.70 + (rating * 0.05) + (foundPraise.length * 0.02)).toFixed(2)));
  else if (sentiment === 'negative') sentimentScore = Math.max(0.10, Number((0.35 - (foundComplaints.length * 0.05)).toFixed(2)));
  else if (sentiment === 'mixed') sentimentScore = Number((0.50 + ((rating - 3) * 0.08)).toFixed(2));

  // Extract positive points & praised services
  const positivePoints = [];
  const praisedServices = [];
  if (lower.includes('staff') || lower.includes('manager') || lower.includes('service')) {
    if (foundPraise.some(k => ['friendly', 'courteous', 'helpful', 'polite'].includes(k))) {
      positivePoints.push('Friendly and helpful staff');
      praisedServices.push('Staff behaviour');
    }
  }
  if (lower.includes('food') || lower.includes('buffet') || lower.includes('taste')) {
    if (foundPraise.some(k => ['delicious', 'fresh', 'exceptional', 'hygienic'].includes(k))) {
      positivePoints.push('Fresh and quality food');
      praisedServices.push('Food Quality');
    }
  }
  if (lower.includes('ambiance') || lower.includes('music') || lower.includes('atmosphere')) {
    positivePoints.push('Pleasant ambiance & atmosphere');
    praisedServices.push('Ambiance');
  }
  if (lower.includes('valet') || lower.includes('parking')) {
    if (!lower.includes('bottleneck') && !lower.includes('delay')) {
      positivePoints.push('Seamless valet service');
      praisedServices.push('Valet Parking');
    }
  }

  // Extract complaints & negative points
  const negativePoints = [];
  const complaints = [];
  let issueDetected = false;
  let issueType = '';

  if (lower.includes('wait') || lower.includes('delay') || lower.includes('slow')) {
    const waitMatch = text.match(/(\d+\s*(?:min|minutes|mins|hours))/i);
    const waitDetail = waitMatch ? `${waitMatch[1]} wait time` : 'Long waiting time';
    negativePoints.push(waitDetail);
    complaints.push(waitDetail);
    issueDetected = true;
    issueType = 'waiting_time';
  }
  if (lower.includes('parking') && (lower.includes('bottleneck') || lower.includes('delay') || lower.includes('issue'))) {
    negativePoints.push('Parking congestion & delay');
    complaints.push('Parking congestion');
    issueDetected = true;
    if (!issueType) issueType = 'parking_access';
  }
  if (lower.includes('rude') || lower.includes('unprofessional') || lower.includes('attitude')) {
    negativePoints.push('Staff service issue');
    complaints.push('Staff attitude concern');
    issueDetected = true;
    if (!issueType) issueType = 'staff_behaviour';
  }
  if (lower.includes('cold') || lower.includes('taste') && (rating <= 3)) {
    negativePoints.push('Food preparation concern');
    complaints.push('Food quality concern');
    issueDetected = true;
    if (!issueType) issueType = 'food_quality';
  }
  if (lower.includes('allergy') || lower.includes('hygiene') || lower.includes('dirty')) {
    negativePoints.push('Health or hygiene concern');
    complaints.push('Hygiene / safety concern');
    issueDetected = true;
    issueType = 'safety_hygiene';
  }

  // If no explicit points found but text has words, synthesize from text
  if (positivePoints.length === 0 && rating >= 4 && text) {
    positivePoints.push('Satisfied customer experience');
    praisedServices.push('General Service');
  }
  if (negativePoints.length === 0 && rating <= 2 && text) {
    negativePoints.push('Unsatisfactory customer experience');
    complaints.push('Service dissatisfaction');
    issueDetected = true;
    issueType = 'service_dissatisfaction';
  }

  // Keywords & Topics extraction
  const keywords = Array.from(new Set([
    ...foundPraise,
    ...foundComplaints,
    ...(lower.includes('service') ? ['service'] : []),
    ...(lower.includes('staff') ? ['staff'] : []),
    ...(lower.includes('food') ? ['food'] : []),
    ...(lower.includes('ambiance') ? ['ambiance'] : []),
    ...(lower.includes('price') ? ['pricing'] : []),
    ...(lower.includes('valet') ? ['valet'] : []),
    ...(lower.includes('doctor') ? ['doctor'] : []),
    ...(lower.includes('treatment') ? ['treatment'] : [])
  ])).slice(0, 8);

  const topics = Array.from(new Set([
    ...(praisedServices),
    ...(issueType ? [issueType.replace('_', ' ')] : []),
    ...(keywords.slice(0, 3))
  ])).slice(0, 5);

  // Urgency
  let urgency = 'low';
  if (issueType === 'safety_hygiene' || rating === 1) urgency = 'critical';
  else if (complaints.length > 0 || rating === 2) urgency = 'high';
  else if (sentiment === 'mixed' || rating === 3) urgency = 'medium';

  // Customer Intent
  let customerIntent = '';
  if (issueDetected) {
    customerIntent = `Customer seeks immediate attention and operational correction regarding ${issueType.replace('_', ' ')}.`;
  } else if (sentiment === 'positive') {
    customerIntent = 'Customer intends to recommend the business and acknowledge positive service.';
  } else {
    customerIntent = 'Customer shared objective observations about their experience.';
  }

  // Review Feedback Summary - CRITICAL: NEVER EMPTY
  const reviewFeedback = generateFallbackFeedback(text, rating, sentiment, praisedServices, complaints);
  const summary = reviewFeedback.length > 100 ? reviewFeedback.substring(0, 97) + '...' : reviewFeedback;

  // AI Response Suggestion
  const responseSuggestion = generateFallbackResponse({
    businessName,
    rating,
    sentiment,
    positivePoints,
    complaints
  });

  // Improvement Recommendation
  let improvementRecommendation = '';
  if (issueType === 'waiting_time') {
    improvementRecommendation = 'Review peak-hour staffing and service workflow to reduce customer waiting times.';
  } else if (issueType === 'parking_access') {
    improvementRecommendation = 'Deploy dedicated valet attendants to streamline vehicle entry during peak arrival hours.';
  } else if (issueType === 'safety_hygiene') {
    improvementRecommendation = 'Conduct immediate staff briefing on dietary safety and hygiene protocols.';
  } else if (issueDetected) {
    improvementRecommendation = `Follow up with operations team to address ${issueType.replace('_', ' ')} concerns.`;
  } else {
    improvementRecommendation = `Continue reinforcing high standards in ${praisedServices.join(', ') || 'service delivery'} to maintain strong 5-star review velocity.`;
  }

  return {
    sentiment,
    sentimentScore,
    reviewFeedback,
    summary,
    positivePoints,
    negativePoints,
    complaints,
    praisedServices,
    keywords,
    topics,
    urgency,
    issueDetected,
    issueType,
    customerIntent,
    responseRequired: true,
    responseSuggestion,
    improvementRecommendation
  };
}

/**
 * Professional Google Review response generator complying with Section 14
 */
function generateFallbackResponse({ businessName = 'Our Business', rating = 5, sentiment = 'positive', positivePoints = [], complaints = [] }) {
  if (rating >= 4 && complaints.length === 0) {
    const praiseMention = positivePoints.length > 0 ? ` especially regarding our ${positivePoints[0].toLowerCase()}` : '';
    return `Thank you so much for your generous review! We are delighted that you had such a wonderful experience at ${businessName}${praiseMention}. Our entire team looks forward to serving you again soon!`;
  }

  if (sentiment === 'mixed' || (rating >= 3 && complaints.length > 0)) {
    const complaintMention = complaints.length > 0 ? ` your feedback regarding ${complaints[0].toLowerCase()}` : ' areas where we can improve';
    return `Thank you for sharing your thoughtful feedback. We are pleased you appreciated aspects of your visit, and we sincerely acknowledge${complaintMention}. We are actively refining this with our operations team and would love the chance to welcome you back for a seamless 5-star experience.`;
  }

  // Low rating / complaint
  const complaintFocus = complaints.length > 0 ? ` ${complaints.join(', ').toLowerCase()}` : ' your recent experience';
  return `Thank you for bringing this to our attention. We sincerely apologize for falling short of your expectations regarding${complaintFocus}. Delivering high-quality service is our highest priority, and we are investigating this matter with our management team. Please reach out to us directly so we can listen to your concerns and make things right.`;
}

/**
 * Main AI Analysis Execution Function
 * Tries Gemini API if key is present; gracefully falls back to deterministic Semantic Engine.
 * Implements exponential backoff retries.
 */
export async function analyzeReviewWithAI({
  reviewText,
  rating,
  businessName,
  businessCategory,
  industry,
  subCategory,
  services,
  customerIntent,
  brandVoice,
  prohibitedClaims,
  location,
  reviewerName
}) {
  // 1. Resolve active AI key & endpoint: Prefer dedicated xAI if available, else use active Groq Cloud
  const rawGrokKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const hasDedicatedGrok = rawGrokKey.length > 5 && !rawGrokKey.includes('your_grok_api_key_here');
  
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const hasGroq = groqKey.length > 5 && !groqKey.startsWith('gsk_mock');

  const activeKey = hasDedicatedGrok ? rawGrokKey : (hasGroq ? groqKey : null);
  const activeUrl = hasDedicatedGrok 
    ? (process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions')
    : 'https://api.groq.com/openai/v1/chat/completions';
  const activeModel = hasDedicatedGrok
    ? (process.env.GROK_MODEL || process.env.OPENAI_MODEL || 'grok-2-latest')
    : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');

  if (activeKey) {
    const userPrompt = buildUserPrompt({
      businessName,
      businessCategory,
      industry,
      subCategory,
      services,
      customerIntent,
      brandVoice,
      prohibitedClaims,
      location,
      rating,
      reviewText,
      reviewerName
    });

    try {
      const response = await fetch(activeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsedJson = JSON.parse(rawContent);
          return validateAndNormalizeAnalysis(parsedJson, { reviewText, rating, businessName });
        }
      } else {
        const errBody = await response.text();
        console.warn(`[AI_ANALYSIS] ${hasDedicatedGrok ? 'Grok' : 'Groq'} returned non-OK (${response.status}):`, errBody);
      }
    } catch (aiErr) {
      console.warn(`[AI_ANALYSIS] ${hasDedicatedGrok ? 'Grok' : 'Groq'} analysis notice:`, aiErr.message);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If Gemini API Key is available, invoke Gemini with Section 5 Prompt
  if (apiKey) {
    const userPrompt = buildUserPrompt({
      businessName,
      businessCategory,
      industry,
      subCategory,
      services,
      customerIntent,
      brandVoice,
      prohibitedClaims,
      location,
      rating,
      reviewText,
      reviewerName
    });
    const maxRetries = 3;
    const delays = [0, 5000, 15000]; // Section 15: 5s, 15s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`[AI_WORKER] Retrying AI analysis (Attempt ${attempt + 1}/${maxRetries}) after ${delays[attempt] / 1000}s backoff...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`AI_PROVIDER_ERROR (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error('AI_INVALID_RESPONSE: No candidate content returned from Gemini');
        }

        const parsedJson = JSON.parse(rawContent);
        const normalized = validateAndNormalizeAnalysis(parsedJson, { reviewText, rating, businessName });
        return normalized;
      } catch (err) {
        console.warn(`[AI_ANALYSIS] Attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt === maxRetries - 1) {
          console.warn('[AI_ANALYSIS] Falling back to Deterministic Semantic Intelligence Engine after retries.');
          break;
        }
      }
    }
  }

  // Deterministic Semantic Intelligence Engine (Guarantees valid output, 0 hallucination, never empty)
  const semanticOutput = analyzeWithSemanticEngine({ reviewText, rating, businessName, businessCategory });
  return validateAndNormalizeAnalysis(semanticOutput, { reviewText, rating, businessName });
}
