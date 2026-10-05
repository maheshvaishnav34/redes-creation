import { query } from '../../config/db.js';

export const listNotifications = async (req, res, next) => {
  try {
    const { isRead } = req.query;

    let sql = `
      SELECT n.*, b.name as business_name
      FROM notifications n
      LEFT JOIN business_locations b ON n.business_id = b.id
      WHERE n.workspace_id = $1
    `;
    const params = [req.workspaceId];

    if (isRead !== undefined) {
      sql += ` AND n.is_read = $2`;
      params.push(isRead === 'true');
    }

    sql += ` ORDER BY 
      CASE n.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END ASC, n.created_at DESC LIMIT 50`;

    const notifs = await query(sql, params);
    const unreadCount = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE workspace_id = $1 AND is_read = FALSE`,
      [req.workspaceId]
    );

    res.json({
      success: true,
      notifications: notifs.rows,
      unreadCount: parseInt(unreadCount.rows[0].count, 10)
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await query(`UPDATE notifications SET is_read = TRUE WHERE workspace_id = $1`, [req.workspaceId]);
    } else {
      await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    }

    res.json({ success: true, message: 'Notification(s) marked as read' });
  } catch (err) {
    next(err);
  }
};

export const dismissNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM notifications WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    next(err);
  }
};
