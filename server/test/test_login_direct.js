import { query, pool } from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAudit } from '../src/middleware/auditLogger.js';

async function testLoginDirect() {
  const email = 'owner@redescreation.com';
  console.log(`Testing login for ${email}...`);

  const userRes = await query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.workspace_id, u.avatar_url,
            w.name as workspace_name, w.slug as workspace_slug, w.plan
     FROM users u
     JOIN workspaces w ON u.workspace_id = w.id
     WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE`,
    [email.trim()]
  );

  if (userRes.rows.length === 0) {
    console.log('User not found!');
    return;
  }

  const user = userRes.rows[0];
  console.log('User record found:', { id: user.id, email: user.email, role: user.role });

  const pass1 = await bcrypt.compare('Admin@123', user.password_hash);
  const pass2 = await bcrypt.compare('password123', user.password_hash);
  const pass3 = await bcrypt.compare('admin123', user.password_hash);
  const pass4 = await bcrypt.compare('owner123', user.password_hash);
  console.log('Passwords tested:');
  console.log('- Admin@123:', pass1);
  console.log('- password123:', pass2);
  console.log('- admin123:', pass3);
  console.log('- owner123:', pass4);

  // Test updating last_login_at
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);
  console.log('Updated last_login_at');

  // Test JWT
  const token = jwt.sign(
    { userId: user.id, workspaceId: user.workspace_id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise',
    { expiresIn: '7d' }
  );
  console.log('JWT generated successfully');

  // Test business query
  const bizRes = await query(
    `SELECT id, name, industry_id, is_primary, health_score FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC`,
    [user.workspace_id]
  );
  console.log(`Businesses found for workspace (${bizRes.rows.length}):`);
  console.table(bizRes.rows);

  // Test logAudit
  await logAudit(user.workspace_id, user.id, 'USER_LOGIN', 'users', user.id, { email: user.email }, '127.0.0.1');
  console.log('Audit log successfully created');

  await pool.end();
}

testLoginDirect()
  .then(() => console.log('Direct test completed successfully!'))
  .catch(err => {
    console.error('Direct test error:', err);
    process.exit(1);
  });
