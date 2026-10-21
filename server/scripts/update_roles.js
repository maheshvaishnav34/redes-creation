import { query } from '../src/config/db.js';

async function updateRoles() {
  // Update Mahesh to owner
  const res1 = await query(
    `UPDATE users SET role = 'owner' WHERE LOWER(email) = 'maheshvaishnav78499@gmail.com' RETURNING id, email, full_name, role`
  );
  console.log('Updated Mahesh:', res1.rows);

  // Update other sole workspace creators if any
  const res2 = await query(
    `UPDATE users SET role = 'owner' WHERE LOWER(email) = 'sadkkdkdkdk@gmail.com' RETURNING id, email, full_name, role`
  );
  console.log('Updated other sole creators:', res2.rows);

  process.exit(0);
}

updateRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
