import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const listTasks = async (req, res, next) => {
  try {
    const { status, priority, source, assignedTo } = req.query;

    let sql = `
      SELECT t.*, u.full_name as assignee_name, u.avatar_url as assignee_avatar, b.name as business_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_user_id = u.id
      LEFT JOIN business_locations b ON t.business_id = b.id
      WHERE t.workspace_id = $1
    `;
    const params = [req.workspaceId];
    let idx = 2;

    if (status) {
      sql += ` AND t.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (priority) {
      sql += ` AND t.priority = $${idx}`;
      params.push(priority);
      idx++;
    }

    if (source) {
      sql += ` AND t.source = $${idx}`;
      params.push(source);
      idx++;
    }

    if (assignedTo) {
      sql += ` AND t.assigned_to_user_id = $${idx}`;
      params.push(assignedTo);
      idx++;
    }

    sql += ` ORDER BY 
      CASE t.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END ASC, t.due_date ASC NULLS LAST, t.created_at DESC`;

    const tasksRes = await query(sql, params);

    // Summary counts for Kanban header
    const summaryRes = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
         COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
         COUNT(CASE WHEN status = 'review' THEN 1 END) as review_count,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
       FROM tasks
       WHERE workspace_id = $1`,
      [req.workspaceId]
    );

    res.json({
      success: true,
      tasks: tasksRes.rows,
      summary: summaryRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, source = 'manual', priority = 'medium', assignedToUserId, dueDate } = req.body;
    const businessId = req.body.businessId || req.businessId;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const newTask = await query(
      `INSERT INTO tasks (
         workspace_id, business_id, title, description, source, priority, status,
         assigned_to_user_id, due_date
       ) VALUES ($1, $2, $3, $4, $5, $6, 'todo', $7, $8)
       RETURNING *`,
      [req.workspaceId, businessId, title, description, source, priority, assignedToUserId || req.user.id, dueDate]
    );

    await logAudit(req.workspaceId, req.user.id, 'TASK_CREATED', 'tasks', newTask.rows[0].id, { title, priority });

    res.status(201).json({ success: true, task: newTask.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedToUserId, priority } = req.body;

    const updated = await query(
      `UPDATE tasks
       SET status = COALESCE($1, status),
           assigned_to_user_id = COALESCE($2, assigned_to_user_id),
           priority = COALESCE($3, priority),
           updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5
       RETURNING *`,
      [status, assignedToUserId, priority, id, req.workspaceId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found or access denied' });
    }

    await logAudit(req.workspaceId, req.user.id, 'TASK_STATUS_UPDATED', 'tasks', id, { newStatus: status });

    res.json({ success: true, task: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM tasks WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    await logAudit(req.workspaceId, req.user.id, 'TASK_DELETED', 'tasks', id, {});

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};
