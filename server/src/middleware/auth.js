import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_redes_creation_2026_enterprise');

    const userRes = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.workspace_id, u.avatar_url, w.name as workspace_name, w.plan
       FROM users u
       JOIN workspaces w ON u.workspace_id = w.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    req.user = userRes.rows[0];
    req.workspaceId = req.headers['x-workspace-id'] || req.user.workspace_id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }
};
