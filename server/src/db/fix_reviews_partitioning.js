import { query, pool } from '../config/db.js';

async function fixPartitioning() {
  console.log('[PARTITION] Reassigning and cleaning reviews to ensure 100% genuine multi-account isolation...');

  const hotelBizId = '07284664-dcc3-4f13-bc68-2b9c87df1209'; // Bhagyalaxmi Hotel & Resort
  const stackcodeBizId = '4d88e96f-6231-4377-b29f-212fb6c69532'; // StackCode Training Institute

  // 1. Move any StackCode reviews that were assigned to the hotel over to StackCode Training Institute
  const moveRes = await query(`
    UPDATE reviews
    SET business_id = $1
    WHERE review_text ILIKE '%StackCode%' AND business_id != $1
  `, [stackcodeBizId]);
  console.log(`[PARTITION] Moved ${moveRes.rowCount} StackCode reviews to StackCode Training Institute (${stackcodeBizId}).`);

  // 2. Remove mock 'Priya Sharma' or any leftover mock reviews
  const delMock = await query(`
    DELETE FROM reviews
    WHERE author_name IN ('Priya Sharma', 'Amit Patel', 'Sneha Roy', 'Kavita Joshi', 'kkmk')
       OR gbp_review_id LIKE 'gbp_mock_%'
       OR gbp_review_id LIKE 'mock_%'
  `);
  console.log(`[PARTITION] Deleted ${delMock.rowCount} leftover mock reviews.`);

  // 3. Check counts for each business
  const countHotel = await query('SELECT count(*) FROM reviews WHERE business_id = $1', [hotelBizId]);
  const countStackcode = await query('SELECT count(*) FROM reviews WHERE business_id = $1', [stackcodeBizId]);
  const countApex = await query('SELECT count(*) FROM reviews WHERE business_id = $1', ['2ffa1b89-c995-44c8-bed2-d96a37137e47']);

  console.log(`[SUMMARY]`);
  console.log(`Bhagyalaxmi Hotel & Resort reviews: ${countHotel.rows[0].count}`);
  console.log(`StackCode Training Institute reviews: ${countStackcode.rows[0].count}`);
  console.log(`Apex Dental Spa reviews: ${countApex.rows[0].count}`);

  console.log('[PARTITION COMPLETE]');
  await pool.end();
}

fixPartitioning();
