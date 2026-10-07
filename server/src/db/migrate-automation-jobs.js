import { query } from '../config/db.js';

async function migrateAutomationJobs() {
  console.log('[MIGRATION] Setting up `job_runs` & Automation Engine tables...');
  try {
    // 1. Create or ensure job_runs table
    await query(`
      CREATE TABLE IF NOT EXISTS job_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_type VARCHAR(100) NOT NULL,
        business_id UUID REFERENCES business_locations(id) ON DELETE SET NULL,
        idempotency_key VARCHAR(255) UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP WITH TIME ZONE,
        execution_time_ms INTEGER,
        items_processed INTEGER DEFAULT 0,
        details JSONB DEFAULT '{}'::jsonb,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_job_runs_job_type ON job_runs (job_type);
      CREATE INDEX IF NOT EXISTS idx_job_runs_business_id ON job_runs (business_id);
      CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs (status);
      CREATE INDEX IF NOT EXISTS idx_job_runs_idempotency ON job_runs (idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_job_runs_created_at ON job_runs (created_at DESC);
    `);

    // 2. Also ensure system_jobs compatibility alias / sync
    await query(`
      CREATE TABLE IF NOT EXISTS system_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        items_processed INTEGER DEFAULT 0,
        details JSONB DEFAULT '{}'::jsonb,
        error_message TEXT
      );
    `);

    console.log('✅ [MIGRATION] Successfully created `job_runs` table with enterprise indexes.');
  } catch (err) {
    console.error('❌ [MIGRATION] Automation jobs migration failed:', err);
    throw err;
  }
}

migrateAutomationJobs()
  .then(() => {
    console.log('[MIGRATION] Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
