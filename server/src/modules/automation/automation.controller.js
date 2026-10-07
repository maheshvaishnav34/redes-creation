import { automationEngine } from './automation.engine.js';
import { query } from '../../config/db.js';

export const getJobsTelemetry = async (req, res, next) => {
  try {
    const status = automationEngine.getSystemStatus();
    
    // Also fetch last 10 execution records from job_runs
    const runsRes = await query(
      `SELECT * FROM job_runs ORDER BY started_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      automation: status,
      recentJobRuns: runsRes.rows
    });
  } catch (err) {
    next(err);
  }
};

export const getJobHistory = async (req, res, next) => {
  try {
    const { jobType, status, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT * FROM job_runs`;
    const params = [];
    const conditions = [];

    if (jobType) {
      params.push(jobType);
      conditions.push(`job_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY started_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const runsRes = await query(sql, params);
    const totalCount = await query(`SELECT COUNT(*) as count FROM job_runs`);

    res.json({
      success: true,
      total: parseInt(totalCount.rows[0].count, 10),
      jobRuns: runsRes.rows
    });
  } catch (err) {
    next(err);
  }
};

export const triggerJob = async (req, res, next) => {
  try {
    const { jobType } = req.params;
    const { businessId = req.businessId, force = true } = req.body;

    const result = await automationEngine.executeJob(jobType, {
      businessId,
      force,
      automated: false
    });

    res.json({
      success: true,
      jobType,
      result
    });
  } catch (err) {
    next(err);
  }
};

export const triggerAllJobs = async (req, res, next) => {
  try {
    const { businessId = req.businessId } = req.body;
    const registeredJobs = Array.from(automationEngine.jobsRegistry.keys());
    const results = {};

    for (const jobType of registeredJobs) {
      try {
        results[jobType] = await automationEngine.executeJob(jobType, {
          businessId,
          force: true,
          automated: false
        });
      } catch (e) {
        results[jobType] = { success: false, error: e.message };
      }
    }

    res.json({
      success: true,
      message: `Triggered all ${registeredJobs.length} background jobs.`,
      results
    });
  } catch (err) {
    next(err);
  }
};
