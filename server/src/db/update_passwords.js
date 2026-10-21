import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

async function updatePasswords() {
  console.log('[PASSWORDS] Updating user passwords in PostgreSQL...');

  const newHash = await bcrypt.hash('Admin@123', 10);

  const res = await query(
    `UPDATE users 
     SET password_hash = $1 
     RETURNING id, email, role, full_name`,
    [newHash]
  );

  console.log(`[PASSWORDS] Updated ${res.rows.length} users with password "Admin@123":`);
  console.table(res.rows);

  await pool.end();
}

updatePasswords()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Password update error:', err);
    process.exit(1);
  });
