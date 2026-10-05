import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.workspace_id, u.avatar_url,
              w.name as workspace_name, w.slug as workspace_slug, w.plan
       FROM users u
       JOIN workspaces w ON u.workspace_id = w.id
       WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE`,
      [email.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspace_id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise',
      { expiresIn: '7d' }
    );

    // Fetch primary or first business for this workspace
    const bizRes = await query(
      `SELECT id, name, industry_id, is_primary, health_score FROM business_locations WHERE workspace_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [user.workspace_id]
    );

    await logAudit(user.workspace_id, user.id, 'USER_LOGIN', 'users', user.id, { email: user.email }, req.ip);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        workspaceId: user.workspace_id,
        workspaceName: user.workspace_name,
        workspaceSlug: user.workspace_slug,
        plan: user.plan
      },
      businesses: bizRes.rows,
      activeBusinessId: bizRes.rows[0]?.id || null
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { workspaceName, fullName, email, password, country, defaultLanguage, plan = 'starter' } = req.body;
    if (!workspaceName || !fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing required registration fields' });
    }

    // Check if email exists
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    const wsRes = await query(
      `INSERT INTO workspaces (name, slug, country, default_language, plan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, plan`,
      [workspaceName, slug, country || 'India', defaultLanguage || 'en', plan]
    );
    const workspace = wsRes.rows[0];

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await query(
      `INSERT INTO users (workspace_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, email, full_name, role`,
      [workspace.id, email.trim().toLowerCase(), passwordHash, fullName.trim()]
    );
    const user = userRes.rows[0];

    // Create initial subscription record
    await query(
      `INSERT INTO subscriptions (workspace_id, plan, status, billing_cycle)
       VALUES ($1, $2, 'active', 'monthly')`,
      [workspace.id, plan]
    );

    const token = jwt.sign(
      { userId: user.id, workspaceId: workspace.id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise',
      { expiresIn: '7d' }
    );

    await logAudit(workspace.id, user.id, 'WORKSPACE_CREATED', 'workspaces', workspace.id, { workspaceName }, req.ip);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        plan: workspace.plan
      },
      businesses: [],
      activeBusinessId: null
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const bizRes = await query(
      `SELECT id, name, industry_id, subcategory_id, is_primary, health_score, city
       FROM business_locations
       WHERE workspace_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [req.user.workspace_id]
    );

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role,
        avatarUrl: req.user.avatar_url,
        workspaceId: req.user.workspace_id,
        workspaceName: req.user.workspace_name,
        plan: req.user.plan
      },
      businesses: bizRes.rows,
      activeBusinessId: bizRes.rows[0]?.id || null
    });
  } catch (err) {
    next(err);
  }
};
