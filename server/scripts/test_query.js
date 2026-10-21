import { query } from '../src/config/db.js';

async function testQuery() {
  const placeId = 'ChIJlbjxyTcpXTkRNOWc_dQH0VI';
  const name = 'Bhagyalaxmi Hotel & Resort';
  const newHotelId = '11111111-1111-1111-1111-111111111111';

  const res = await query(
    `SELECT DISTINCT ON (r.gbp_review_id) r.id, r.author_name, r.rating, bl.name as biz_name, bl.google_place_id
     FROM reviews r
     JOIN business_locations bl ON r.business_id = bl.id
     LEFT JOIN google_locations gl ON gl.business_id = bl.id
     WHERE ((bl.google_place_id = $1 AND $1 IS NOT NULL) OR (gl.gbp_place_id = $1 AND $1 IS NOT NULL) OR (bl.name ILIKE $2 AND LENGTH($2) > 5)) AND bl.id != $3
     LIMIT 100`,
    [placeId, `%${name}%`, newHotelId]
  );
  console.log('Query found reviews:', res.rows.length);
  if (res.rows.length > 0) {
    console.log('First review sample:', res.rows[0]);
  }
  process.exit(0);
}

testQuery().catch(e => { console.error(e); process.exit(1); });
