import { pool } from '../config/db.js';

async function migrateForecasts() {
  console.log('[MIGRATION] Running Google Trends Forecasting tables migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS trend_forecasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        geo VARCHAR(20) DEFAULT 'IN',
        timeframe VARCHAR(50) DEFAULT 'today 12-m',
        horizon_days INT DEFAULT 30,
        model_name VARCHAR(100) DEFAULT 'holt_linear',
        historical_points_used INT DEFAULT 0,
        forecast_points JSONB DEFAULT '[]',
        evaluation_metrics JSONB DEFAULT '{}',
        assumptions JSONB DEFAULT '[]',
        limitations JSONB DEFAULT '[]',
        ai_explanation TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trend_model_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name VARCHAR(100) NOT NULL,
        horizon_days INT NOT NULL,
        keyword VARCHAR(255) NOT NULL,
        geo VARCHAR(20) DEFAULT 'IN',
        mae NUMERIC(10, 4),
        rmse NUMERIC(10, 4),
        smape NUMERIC(10, 4),
        mase NUMERIC(10, 4),
        train_points INT,
        test_points INT,
        evaluated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_trend_forecasts_kw ON trend_forecasts(keyword, geo);
      CREATE INDEX IF NOT EXISTS idx_trend_forecasts_workspace ON trend_forecasts(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_trend_model_evals_model ON trend_model_evaluations(model_name, horizon_days);
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Trend forecasting tables & indexes created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Error migrating forecasting tables:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateForecasts().catch(err => {
  console.error(err);
  process.exit(1);
});
