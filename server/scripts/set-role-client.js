import { query } from '../src/config/db.js';

async function updateRoles() {
  console.log('Updating all users to role = client...');
  const res = await query(`UPDATE users SET role = 'client' RETURNING id, email, full_name, role`);
  console.log('Updated users:', res.rows);

  // Also update table default
  await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'`);
  console.log('Set users.role column default to client');
  process.exit(0);
}

updateRoles().catch(err => {
  console.error('Error updating roles:', err);
  process.exit(1);
});
