import { query } from '../src/config/db.js';

async function setClientRole() {
  const res = await query(
    `UPDATE users SET role = 'client' WHERE LOWER(email) = 'maheshvaishnav78499@gmail.com' RETURNING id, email, full_name, role`
  );
  console.log('Set Mahesh to client:', res.rows);
  process.exit(0);
}

setClientRole().catch(e => { console.error(e); process.exit(1); });
