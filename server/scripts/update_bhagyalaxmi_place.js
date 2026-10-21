import { query } from '../src/config/db.js';

async function run() {
  await query(
    `UPDATE business_locations 
     SET google_place_id = $1, google_review_url = $2, updated_at = NOW() 
     WHERE id = $3`,
    ['ChIJlbjxyTcpXTkRNOWc_dQH0VI', 'https://www.google.com/maps?cid=5967661555307373876', '496dda2d-0fc3-4e3c-973e-e4627d2b12dc']
  );
  console.log('✅ Updated primary business location with place_id and review_url');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
