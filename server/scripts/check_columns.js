import { query } from '../src/config/db.js';

async function run() {
  const res1 = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'business_locations'`);
  console.log('business_locations columns:', res1.rows.map(r => r.column_name));
  const res2 = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'google_locations'`);
  console.log('google_locations columns:', res2.rows.map(r => r.column_name));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
