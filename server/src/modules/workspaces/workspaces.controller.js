import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getCurrentWorkspace = async (req, res, next) => {
  try {
    const wsRes = await query(
      `SELECT w.*, s.plan, s.status as subscription_status, s.locations_limit, s.reviews_limit,
              s.ai_generations_limit, s.keywords_limit, s.geo_grids_limit,
              s.current_locations, s.current_reviews, s.current_ai_generations, s.current_keywords
       FROM workspaces w
       LEFT JOIN subscriptions s ON w.id = s.workspace_id
       WHERE w.id = $1`,
      [req.workspaceId]
    );

    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    res.json({ success: true, workspace: wsRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, country, timezone, defaultLanguage } = req.body;
    const wsRes = await query(
      `UPDATE workspaces
       SET name = COALESCE($1, name),
           country = COALESCE($2, country),
           timezone = COALESCE($3, timezone),
           default_language = COALESCE($4, default_language),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, country, timezone, defaultLanguage, req.workspaceId]
    );

    await logAudit(req.workspaceId, req.user.id, 'WORKSPACE_UPDATED', 'workspaces', req.workspaceId, { name });
    res.json({ success: true, workspace: wsRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const membersRes = await query(
      `SELECT id, email, full_name, role, avatar_url, is_active, last_login_at, created_at
       FROM users
       WHERE workspace_id = $1
       ORDER BY created_at ASC`,
      [req.workspaceId]
    );

    res.json({ success: true, members: membersRes.rows });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email, fullName, role = 'staff', password = 'TemporaryPass123!' } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ success: false, error: 'Email and full name are required' });
    }

    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newMember = await query(
      `INSERT INTO users (workspace_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, created_at`,
      [req.workspaceId, email.trim().toLowerCase(), passwordHash, fullName.trim(), role]
    );

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_INVITED', 'users', newMember.rows[0].id, { email, role });
    res.status(201).json({ success: true, member: newMember.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['owner', 'admin', 'manager', 'staff', 'client'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified' });
    }

    const updated = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3 RETURNING id, email, role`,
      [role, id, req.workspaceId]
    );

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_ROLE_UPDATED', 'users', id, { newRole: role });
    res.json({ success: true, member: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const clientsRes = await query(
      `SELECT c.*, COUNT(b.id) as business_count
       FROM clients c
       LEFT JOIN business_locations b ON c.id = b.client_id
       WHERE c.workspace_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.workspaceId]
    );

    res.json({ success: true, clients: clientsRes.rows });
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, company } = req.body;
    const newClient = await query(
      `INSERT INTO clients (workspace_id, name, email, phone, company)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.workspaceId, name, email, phone, company]
    );

    await logAudit(req.workspaceId, req.user.id, 'CLIENT_CREATED', 'clients', newClient.rows[0].id, { name });
    res.status(201).json({ success: true, client: newClient.rows[0] });
  } catch (err) {
    next(err);
  }
};
