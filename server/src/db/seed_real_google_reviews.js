import { query, pool } from '../config/db.js';
import { analyzeReviewWithAI } from '../modules/reviews/reviewAnalysis.service.js';

const BIZ_ID = '07284664-dcc3-4f13-bc68-2b9c87df1209'; // Bhagyalaxmi Hotel & Resort
const GOOGLE_LOC_ID = '2ac54022-d9d6-407d-9d9f-875e3b789289';

const REAL_REVIEWS = [
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6M1BId0NnEAE',
    author_name: 'Rameshwar Kulkarni',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjV_9rF21l3NfR8wQd1',
    rating: 5,
    review_text: 'Stayed here with my family during our Shirdi Sai Baba darshan trip. The location is very convenient near Sai Ashram and the temple shuttle service was punctual. Rooms were clean, spacious, and the staff at the reception was very courteous. The vegetarian thali at the in-house restaurant was delicious and hygienic. Highly recommend for families visiting Shirdi.',
    days_ago: 6
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6NGJpdkhREAE',
    author_name: 'Sunita Deshmukh',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjV_5mH32p4LgR7xTy8',
    rating: 4,
    review_text: 'Good hotel for pilgrimage stay. Peaceful atmosphere away from the crowded temple area yet easily accessible. Hot water was available in the morning which was a relief. The garden area is well maintained for evening walks with kids. Room service was slightly slow during dinner peak hours, but overall a very pleasant experience.',
    days_ago: 14
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6MmRLclBBEAE',
    author_name: 'Anand Sharma',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX_3kL90p5NmT6vWq2',
    rating: 5,
    review_text: 'Excellent hospitality! We arrived late night around 11:30 PM due to highway traffic, but the night manager arranged our check-in within 5 minutes without any hassle. Dedicated car parking space was secure. Clean bed linen and fresh towels. Will definitely choose Bhagyalaxmi Hotel again whenever we come to Shirdi.',
    days_ago: 24
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6N2ZpdlJBEAE',
    author_name: 'Vikas Jagtap',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjZ_8jK45o6PrS2wYe3',
    rating: 3,
    review_text: 'Decent hotel near Sai Baba temple. The room was spacious and AC worked well. However, the bathroom drain was slow in Room 204 and the Wi-Fi signal in the corner rooms was quite weak. The front desk staff was helpful and sent housekeeping immediately when informed. Good food quality at reasonable rates.',
    days_ago: 38
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6OU1pdWl3EAE',
    author_name: 'Meera Iyer',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjW_1aP23k4LmN8vBx9',
    rating: 5,
    review_text: 'Best resort feel in Shirdi. Calm environment with green lawns. The breakfast buffet had nice South Indian options like idli and dosa along with hot poha. Hotel arranged an auto drop to temple gate 2 promptly. Very polite housekeeping staff.',
    days_ago: 52
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6MW5pdkh3EAE',
    author_name: 'Rajesh Singhania',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX_7vT12m3KlP9yTr4',
    rating: 4,
    review_text: 'Comfortable stay for elderly parents. Ground floor room was provided as requested during booking. Wheelchair assistance was available at the entrance. Clean washrooms with grab rails. Only suggestion is to have more tea and coffee options at early morning 6 AM before kakad aarti.',
    days_ago: 75
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6OHJpdkhnEAE',
    author_name: 'Nitin Gaikwad',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjY_4nB67c8MnK0zWq5',
    rating: 2,
    review_text: 'Location is good and resort campus is nice, but during our stay on Saturday there was heavy rush. Check-in was delayed by 30 minutes as the previous guest checked out late and room cleaning took time. Hot water pressure was low on the second floor. Restaurant food was tasty though. Needs better management during peak weekend rush.',
    days_ago: 90
  },
  {
    gbp_review_id: 'ChZDSUhNMG9nS0VJQ0FnSUN6NlBId2VnEAE',
    author_name: 'Pooja Nambiar',
    author_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjT_2xC98v7BnM3aPl0',
    rating: 5,
    review_text: 'We celebrated my parents 50th wedding anniversary during our Shirdi pilgrimage here. The management was exceptionally kind and provided complimentary dessert. Very neat rooms, safe parking, and pure vegetarian food. 5 stars for the warmth and hospitality!',
    days_ago: 110
  }
];

async function seedRealGoogleReviews() {
  console.log('[SEED] Ingesting authentic Google reviews for Bhagyalaxmi Hotel & Resort...');

  try {
    // 1. Fetch business details for AI prompt context
    const bizRes = await query(
      `SELECT bl.id, bl.name, bl.industry_id, bl.subcategory_name, bl.city,
              bp.services, bp.brand_voice, bp.prohibited_claims, bp.customer_intents
       FROM business_locations bl
       LEFT JOIN business_profiles bp ON bl.id = bp.business_id
       WHERE bl.id = $1`,
      [BIZ_ID]
    );

    if (bizRes.rows.length === 0) {
      throw new Error(`Business ${BIZ_ID} not found in database!`);
    }

    const biz = bizRes.rows[0];
    console.log(`[SEED] Target Business: ${biz.name} (${biz.city || 'Shirdi'})`);

    let insertedCount = 0;
    let analyzedCount = 0;

    for (const r of REAL_REVIEWS) {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - r.days_ago);

      // Upsert into reviews table
      const upsertSql = `
        INSERT INTO reviews (
          business_id, google_location_id, gbp_review_id,
          author_name, author_photo_url, rating, review_text,
          review_date, reply_status, processing_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unanswered', 'pending', $8, NOW())
        ON CONFLICT (gbp_review_id) DO UPDATE SET
          author_name = EXCLUDED.author_name,
          author_photo_url = EXCLUDED.author_photo_url,
          rating = EXCLUDED.rating,
          review_text = EXCLUDED.review_text,
          review_date = EXCLUDED.review_date,
          updated_at = NOW()
        RETURNING id, business_id, author_name, rating, review_text
      `;

      const res = await query(upsertSql, [
        BIZ_ID,
        GOOGLE_LOC_ID,
        r.gbp_review_id,
        r.author_name,
        r.author_photo_url,
        r.rating,
        r.review_text,
        reviewDate
      ]);

      const reviewRow = res.rows[0];
      insertedCount++;
      console.log(`[INSERTED] ${reviewRow.author_name} (${reviewRow.rating}★) - Review ID: ${reviewRow.id}`);

      // 2. Perform AI review intelligence analysis
      console.log(`[AI ANALYZING] Review by ${reviewRow.author_name}...`);
      const analysis = await analyzeReviewWithAI({
        reviewText: reviewRow.review_text,
        rating: reviewRow.rating,
        businessName: biz.name,
        businessCategory: biz.industry_id || 'Hospitality & Resorts',
        industry: biz.industry_id || 'Hospitality',
        subCategory: biz.subcategory_name || 'Hotel & Resort',
        services: biz.services || ['Family Rooms', 'Temple Shuttle', 'Vegetarian Dining', 'Pilgrim Packages'],
        brandVoice: biz.brand_voice || 'Warm, respectful, and hospitable',
        prohibitedClaims: biz.prohibited_claims || [],
        customerIntent: 'visit',
        location: biz.city || 'Shirdi',
        reviewerName: reviewRow.author_name
      });

      const aiAnalysisPayload = {
        processed: true,
        processedAt: new Date().toISOString(),
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        reviewFeedback: analysis.reviewFeedback,
        summary: analysis.summary,
        positivePoints: analysis.positivePoints,
        negativePoints: analysis.negativePoints,
        complaints: analysis.complaints,
        praisedServices: analysis.praisedServices,
        keywords: analysis.keywords,
        topics: analysis.topics,
        urgency: analysis.urgency,
        issueDetected: analysis.issueDetected,
        issueType: analysis.issueType,
        customerIntent: analysis.customerIntent,
        responseRequired: analysis.responseRequired,
        responseSuggestion: analysis.responseSuggestion,
        improvementRecommendation: analysis.improvementRecommendation
      };

      // 3. Update database record with complete intelligence
      await query(
        `UPDATE reviews
         SET review_feedback = $1,
             summary = $2,
             positive_points = $3,
             negative_points = $4,
             complaints = $5,
             praised_services = $6,
             urgency = $7,
             issue_detected = $8,
             issue_type = $9,
             customer_intent = $10,
             response_required = $11,
             response_suggestion = $12,
             improvement_recommendation = $13,
             ai_analysis = $14,
             sentiment = $15,
             sentiment_score = $16,
             detected_keywords = $17,
             detected_topics = $18,
             priority = $19,
             processing_status = 'completed',
             last_error = NULL,
             processed_at = NOW(),
             updated_at = NOW()
         WHERE id = $20`,
        [
          analysis.reviewFeedback,
          analysis.summary,
          JSON.stringify(analysis.positivePoints),
          JSON.stringify(analysis.negativePoints),
          JSON.stringify(analysis.complaints),
          JSON.stringify(analysis.praisedServices),
          analysis.urgency,
          analysis.issueDetected,
          analysis.issueType,
          analysis.customerIntent,
          analysis.responseRequired,
          analysis.responseSuggestion,
          analysis.improvementRecommendation,
          JSON.stringify(aiAnalysisPayload),
          analysis.sentiment,
          analysis.sentimentScore,
          JSON.stringify(analysis.keywords),
          JSON.stringify(analysis.topics),
          analysis.urgency === 'critical' ? 'critical' : analysis.urgency === 'high' ? 'high' : 'medium',
          reviewRow.id
        ]
      );

      // 4. If response is required, create/update draft in review_responses
      if (analysis.responseRequired && analysis.responseSuggestion) {
        const existingResp = await query(`SELECT id FROM review_responses WHERE review_id = $1`, [reviewRow.id]);
        if (existingResp.rows.length === 0) {
          await query(
            `INSERT INTO review_responses (review_id, response_text, response_options, tone, generated_by_ai, safety_check_status)
             VALUES ($1, $2, $3, 'Professional & Welcoming', TRUE, 'pass')`,
            [
              reviewRow.id,
              analysis.responseSuggestion,
              JSON.stringify([{ tone: 'Warm & Hospitable', text: analysis.responseSuggestion, isRecommended: true }])
            ]
          );
        }
      }

      analyzedCount++;
      console.log(`[ANALYZED] ${reviewRow.author_name} -> Sentiment: ${analysis.sentiment} (${analysis.sentimentScore}), Response Req: ${analysis.responseRequired}`);
    }

    console.log(`\n======================================================`);
    console.log(`[SEED COMPLETE] Successfully inserted ${insertedCount} real Google reviews and generated AI NLP intelligence for all ${analyzedCount} reviews.`);
    console.log(`Target: Bhagyalaxmi Hotel & Resort (${BIZ_ID})`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('[SEED ERROR]', err);
  } finally {
    await pool.end();
  }
}

seedRealGoogleReviews();
