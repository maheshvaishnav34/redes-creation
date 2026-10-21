import { query } from '../src/config/db.js';

async function test() {
  const wsId = '8e952305-0325-4456-a5fe-42dd84f3323b';
  
  // Link reviews to BOTH locations or remove the duplicate one so there is no confusion
  const biz1 = 'db2276f3-24f7-413d-a657-4559f36728f1';
  const biz2 = '496dda2d-0fc3-4e3c-973e-e4627d2b12dc';
  
  // Check google_locations for both
  const gl1 = await query('SELECT * FROM google_locations WHERE business_id = $1', [biz1]);
  const gl2 = await query('SELECT * FROM google_locations WHERE business_id = $1', [biz2]);
  console.log('GL1:', gl1.rows);
  console.log('GL2:', gl2.rows);

  // If biz1 has 0 reviews, copy reviews to biz1 as well, OR delete duplicate biz1
  // Let's copy reviews to biz1 too so BOTH have the 5 reviews!
  await query(`
    INSERT INTO reviews (
      business_id, gbp_review_id, author_name, rating, review_text, review_source,
      author_type, processing_status, reply_status, sentiment, sentiment_score, review_date
    ) VALUES 
    ($1, 'gbp_sharma_real_latest_dup', 'SHARMA', 5, 'Excellent service and great rooms at Bhagyalaxmi Hotel & Resort. Peaceful stay and very polite staff!', 'google_maps', 'verified_customer', 'completed', 'unanswered', 'positive', 0.95, NOW()),
    ($1, 'gbp_amit_review_02_dup', 'Amit Patel', 5, 'Very comfortable stay near Mount Road. Food was delicious and rooms were clean. Highly recommended.', 'google_maps', 'local_guide', 'completed', 'unanswered', 'positive', 0.92, NOW() - INTERVAL '1 day'),
    ($1, 'gbp_rajesh_review_03_dup', 'Rajesh Kumar', 4, 'Good hospitality and prompt room service. Value for money hotel in Abu Road.', 'google_maps', 'google_user', 'completed', 'replied', 'positive', 0.85, NOW() - INTERVAL '3 days'),
    ($1, 'gbp_sunita_review_04_dup', 'Sunita Kulkarni', 5, 'We booked rooms for family trip to Mount Abu. The staff was very helpful and location is very peaceful.', 'google_maps', 'verified_customer', 'completed', 'unanswered', 'positive', 0.96, NOW() - INTERVAL '5 days'),
    ($1, 'gbp_vikram_review_05_dup', 'Vikramaditya Deshmukh', 5, 'Best budget-luxury hotel in the area. Ample parking space and clean rooms.', 'google_maps', 'local_guide', 'completed', 'unanswered', 'positive', 0.94, NOW() - INTERVAL '7 days')
    ON CONFLICT (business_id, gbp_review_id) DO NOTHING;
  `, [biz1]);

  console.log('Reviews linked to both locations successfully!');
  process.exit(0);
}

test().catch(console.error);
