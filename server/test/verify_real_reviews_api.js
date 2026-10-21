import { query, pool } from '../src/config/db.js';

async function verifyReviews() {
  console.log('=== VERIFYING REAL REVIEWS & AI INTELLIGENCE IN DATABASE ===');
  const bizId = '07284664-dcc3-4f13-bc68-2b9c87df1209';

  try {
    const res = await query(`
      SELECT 
        r.id,
        r.gbp_review_id,
        r.author_name,
        r.rating,
        r.review_text,
        r.sentiment,
        r.sentiment_score,
        r.review_feedback,
        r.positive_points,
        r.negative_points,
        r.complaints,
        r.praised_services,
        r.urgency,
        r.issue_detected,
        r.response_required,
        r.response_suggestion,
        r.processing_status,
        bl.name as business_name
      FROM reviews r
      JOIN business_locations bl ON r.business_id = bl.id
      WHERE r.business_id = $1
      ORDER BY r.review_date DESC
    `, [bizId]);

    console.log(`Found ${res.rows.length} reviews for ${res.rows[0]?.business_name || 'Business'}:`);

    for (const r of res.rows) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Author: ${r.author_name} | Rating: ${r.rating}★ | Status: ${r.processing_status}`);
      console.log(`Sentiment: ${r.sentiment} (${r.sentiment_score}) | Urgency: ${r.urgency}`);
      console.log(`Feedback: ${r.review_feedback}`);
      console.log(`Praised: ${JSON.stringify(r.praised_services)}`);
      console.log(`Complaints: ${JSON.stringify(r.complaints)}`);
      console.log(`Response Req: ${r.response_required}`);
      if (r.response_suggestion) {
        console.log(`Suggested Response: "${r.response_suggestion.slice(0, 100)}..."`);
      }
    }

    console.log('\n==================================================');
    console.log('VERIFICATION SUMMARY:');
    console.log(`Total Real Reviews: ${res.rows.length}`);
    const completed = res.rows.filter(r => r.processing_status === 'completed');
    console.log(`Completed AI Intelligence: ${completed.length}/${res.rows.length}`);
    console.log('==================================================');

    if (res.rows.length === 8 && completed.length === 8) {
      console.log('SUCCESS: All 8 real Google reviews are loaded with complete AI NLP intelligence.');
    } else {
      console.error('MISMATCH in expected count.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await pool.end();
  }
}

verifyReviews();
