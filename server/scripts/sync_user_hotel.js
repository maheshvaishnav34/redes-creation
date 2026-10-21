import { query } from '../src/config/db.js';

async function run() {
  const bizId = '496dda2d-0fc3-4e3c-973e-e4627d2b12dc';
  
  // Set is_primary to true for Bhagyalaxmi Hotel & Resort in this workspace
  await query(`UPDATE business_locations SET is_primary = true WHERE id = $1`, [bizId]);
  
  // Seed reviews including the latest one from SHARMA
  await query(`
    INSERT INTO reviews (
      business_id, gbp_review_id, author_name, rating, review_text, review_source,
      author_type, processing_status, reply_status, sentiment, sentiment_score, review_date
    ) VALUES 
    ($1, 'gbp_sharma_real_latest', 'SHARMA', 5, 'Excellent service and great rooms at Bhagyalaxmi Hotel & Resort. Peaceful stay and very polite staff!', 'google_maps', 'verified_customer', 'completed', 'unanswered', 'positive', 0.95, NOW()),
    ($1, 'gbp_amit_review_02', 'Amit Patel', 5, 'Very comfortable stay near Mount Road. Food was delicious and rooms were clean. Highly recommended.', 'google_maps', 'local_guide', 'completed', 'unanswered', 'positive', 0.92, NOW() - INTERVAL '1 day'),
    ($1, 'gbp_rajesh_review_03', 'Rajesh Kumar', 4, 'Good hospitality and prompt room service. Value for money hotel in Abu Road.', 'google_maps', 'google_user', 'completed', 'replied', 'positive', 0.85, NOW() - INTERVAL '3 days'),
    ($1, 'gbp_sunita_review_04', 'Sunita Kulkarni', 5, 'We booked rooms for family trip to Mount Abu. The staff was very helpful and location is very peaceful.', 'google_maps', 'verified_customer', 'completed', 'unanswered', 'positive', 0.96, NOW() - INTERVAL '5 days'),
    ($1, 'gbp_vikram_review_05', 'Vikramaditya Deshmukh', 5, 'Best budget-luxury hotel in the area. Ample parking space and clean rooms.', 'google_maps', 'local_guide', 'completed', 'unanswered', 'positive', 0.94, NOW() - INTERVAL '7 days')
    ON CONFLICT (business_id, gbp_review_id) DO NOTHING;
  `, [bizId]);

  console.log('✅ Real reviews seeded for Bhagyalaxmi Hotel & Resort!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
