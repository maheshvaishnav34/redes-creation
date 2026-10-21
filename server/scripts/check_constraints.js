import { query } from '../src/config/db.js';

async function run() {
  const res = await query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    WHERE conrelid = 'reviews'::regclass
  `);
  console.log('Reviews table constraints:', res.rows);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
