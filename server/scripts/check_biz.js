import { query } from '../src/config/db.js';

async function main() {
  const biz = await query(
    `SELECT id, workspace_id, name, city, address, google_place_id, google_review_url 
     FROM business_locations 
     WHERE name ILIKE '%bhagyalaxmi%'`
  );
  console.log('--- BUSINESS LOCATIONS ---');
  console.log(JSON.stringify(biz.rows, null, 2));

  if (biz.rows.length > 0) {
    const revs = await query(
      `SELECT count(*) as total, rating, avg(rating) as avg_rating 
       FROM reviews 
       WHERE business_id = $1 
       GROUP BY rating`,
      [biz.rows[0].id]
    );
    console.log('--- REVIEWS SUMMARY ---');
    console.log(JSON.stringify(revs.rows, null, 2));

    const sample = await query(
      `SELECT id, author_name, rating, review_text, review_date, reply_status 
       FROM reviews 
       WHERE business_id = $1 
       LIMIT 5`,
      [biz.rows[0].id]
    );
    console.log('--- SAMPLE REVIEWS ---');
    console.log(JSON.stringify(sample.rows, null, 2));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
