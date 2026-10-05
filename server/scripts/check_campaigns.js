import { query } from '../src/config/db.js';

async function check() {
  const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'review_campaigns'");
  console.log('Columns:', cols.rows.map(r => r.column_name));
  const res = await query('SELECT * FROM review_campaigns');
  console.log('Campaigns in DB:', JSON.stringify(res.rows, null, 2));
  process.exit(0);
}

check().catch(console.error);
