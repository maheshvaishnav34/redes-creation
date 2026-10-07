import express from 'express';
import { 
  getJobsTelemetry, 
  getJobHistory, 
  triggerJob, 
  triggerAllJobs 
} from './automation.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All automation endpoints require authentication
router.use(authenticate);

// Telemetry & Diagnostic Status of all 14 background jobs
router.get('/status', getJobsTelemetry);
router.get('/jobs', getJobsTelemetry);

// Job runs execution log history with pagination
router.get('/history', getJobHistory);

// Trigger manual run of specific job on demand
router.post('/jobs/:jobType/run', triggerJob);

// Trigger all 14 jobs sequentially
router.post('/run-all', triggerAllJobs);

export default router;
