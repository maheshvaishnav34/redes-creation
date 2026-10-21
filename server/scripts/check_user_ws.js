import { query } from '../src/config/db.js';

async function check() {
  const wsId = '8e952305-0325-4456-a5fe-42dd84f3323b';
  const biz = await query('SELECT id, name, city, is_primary FROM business_locations WHERE workspace_id = $1', [wsId]);
  console.log('BIZ IN USER WS:', biz.rows);
  for (const b of biz.rows) {
    const r = await query('SELECT count(*) FROM reviews WHERE business_id = $1', [b.id]);
    console.log('REVIEWS FOR BIZ', b.id, b.name, ':', r.rows[0].count);
  }
  process.exit(0);
}

check().catch(console.error);
