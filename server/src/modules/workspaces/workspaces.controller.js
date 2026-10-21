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
    const isClient = req.user.role === 'client';
    const queryText = isClient
      ? `SELECT id, email, full_name, role, avatar_url, is_active, last_login_at, created_at
         FROM users
         WHERE workspace_id = $1 AND role = 'client'
         ORDER BY created_at ASC`
      : `SELECT id, email, full_name, role, avatar_url, is_active, last_login_at, created_at
         FROM users
         WHERE workspace_id = $1
         ORDER BY created_at ASC`;

    const membersRes = await query(queryText, [req.workspaceId]);

    res.json({ success: true, members: membersRes.rows });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const role = isClient ? 'client' : (req.body.role || 'staff');
    const { email, fullName, password = 'TemporaryPass123!' } = req.body;
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

    // Prevent changing own role
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot change your own role' });
    }

    const updated = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3 RETURNING id, email, role`,
      [role, id, req.workspaceId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_ROLE_UPDATED', 'users', id, { newRole: role });
    res.json({ success: true, member: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateMemberDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, role } = req.body;

    const check = await query(
      `SELECT id, role, email FROM users WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    const currentTarget = check.rows[0];

    // If caller is not owner/admin, they are only authorized to update their own profile details
    if (!['owner', 'admin'].includes(req.user.role)) {
      if (id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'You are only authorized to update your own profile details' });
      }
    }

    if (email && email.trim().toLowerCase() !== currentTarget.email.toLowerCase()) {
      const emailCheck = await query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [email.trim(), id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'This email is already in use by another account' });
      }
    }

    let newRole = currentTarget.role;
    if (role && ['owner', 'admin'].includes(req.user.role)) {
      if (!['owner', 'admin', 'manager', 'staff', 'client'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role specified' });
      }
      if (currentTarget.role === 'owner' && role !== 'owner' && req.user.role !== 'owner') {
        return res.status(403).json({ success: false, error: 'Only owners can reassign the owner role' });
      }
      newRole = role;
    }

    const updated = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           role = $3,
           updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5
       RETURNING id, email, full_name, role, is_active, last_login_at, created_at`,
      [fullName ? fullName.trim() : null, email ? email.trim().toLowerCase() : null, newRole, id, req.workspaceId]
    );

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_DETAILS_UPDATED', 'users', id, { fullName, email, role: newRole });
    res.json({ success: true, member: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const resetMemberPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // If caller is not owner/admin, they are only authorized to update their own password
    if (!['owner', 'admin'].includes(req.user.role)) {
      if (id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'You are only authorized to update your own account password' });
      }
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
    }

    const check = await query(
      `SELECT id, email, full_name, role FROM users WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3`,
      [passwordHash, id, req.workspaceId]
    );

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_PASSWORD_RESET', 'users', id, { email: check.rows[0].email });
    res.json({ success: true, message: `Password for ${check.rows[0].full_name} has been reset successfully.` });
  } catch (err) {
    next(err);
  }
};

export const deactivateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    }

    const updated = await query(
      `UPDATE users SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND workspace_id = $2
       RETURNING id, email, full_name`,
      [id, req.workspaceId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_DEACTIVATED', 'users', id, { email: updated.rows[0].email });
    res.json({ success: true, member: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const reactivateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await query(
      `UPDATE users SET is_active = TRUE, updated_at = NOW()
       WHERE id = $1 AND workspace_id = $2
       RETURNING id, email, full_name`,
      [id, req.workspaceId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    await logAudit(req.workspaceId, req.user.id, 'MEMBER_REACTIVATED', 'users', id, { email: updated.rows[0].email });
    res.json({ success: true, member: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    // Ensure user belongs to this workspace
    const check = await query(
      `SELECT id, email, full_name, role FROM users WHERE id = $1 AND workspace_id = $2`,
      [id, req.workspaceId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in this workspace' });
    }

    // Prevent deleting the owner
    if (check.rows[0].role === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot delete the workspace owner account' });
    }

    await query(`DELETE FROM users WHERE id = $1`, [id]);
    await logAudit(req.workspaceId, req.user.id, 'MEMBER_DELETED', 'users', id, { email: check.rows[0].email });
    res.json({ success: true, deletedId: id });
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
