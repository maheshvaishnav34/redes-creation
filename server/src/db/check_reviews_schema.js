import { query, pool } from '../config/db.js';

async function check() {
  const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews'");
  console.log('Columns:', res.rows.map(r => r.column_name));
  await pool.end();
}

check();
