import { query } from '../src/config/db.js';

async function check() {
  const b = await query('SELECT id, name, industry_id, website FROM business_locations LIMIT 5');
  console.log('Businesses:', b.rows);
  const p = await query('SELECT business_id, target_audience, services FROM business_profiles LIMIT 5');
  console.log('Profiles:', p.rows);
  process.exit(0);
}

check().catch(console.error);
