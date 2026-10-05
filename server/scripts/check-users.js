import { query } from '../src/config/db.js';

async function run() {
  const res = await query('SELECT id, email, full_name, role FROM users');
  console.log('CURRENT USERS:', res.rows);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
