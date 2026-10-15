import { pool } from '../config/db.js';

async function migrateTrends() {
  console.log('[MIGRATION] Running Google Trends tables migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS trend_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        query VARCHAR(255) NOT NULL,
        geo VARCHAR(20) DEFAULT 'IN',
        timeframe VARCHAR(50) DEFAULT 'today 12-m',
        property VARCHAR(50) DEFAULT '',
        category VARCHAR(50) DEFAULT 'all',
        timeline_data JSONB DEFAULT '[]',
        related_queries JSONB DEFAULT '{"top":[],"rising":[]}',
        related_topics JSONB DEFAULT '{"top":[],"rising":[]}',
        regional_data JSONB DEFAULT '[]',
        summary_metrics JSONB DEFAULT '{}',
        ai_insights JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trend_watchlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        geo VARCHAR(20) DEFAULT 'IN',
        property VARCHAR(50) DEFAULT '',
        current_score INT DEFAULT 0,
        previous_score INT DEFAULT 0,
        trend_status VARCHAR(50) DEFAULT 'monitoring',
        alert_on_spike BOOLEAN DEFAULT true,
        alert_on_breakout BOOLEAN DEFAULT true,
        spike_threshold INT DEFAULT 20,
        last_checked_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trend_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        watchlist_id UUID REFERENCES trend_watchlists(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        previous_value INT,
        new_value INT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trend_content_ideas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_format VARCHAR(50) DEFAULT 'blog',
        target_platform VARCHAR(50) DEFAULT 'website',
        search_intent VARCHAR(50) DEFAULT 'informational',
        outline JSONB DEFAULT '[]',
        suggested_publish_date DATE,
        status VARCHAR(50) DEFAULT 'idea',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_trend_searches_query ON trend_searches(query);
      CREATE INDEX IF NOT EXISTS idx_trend_searches_workspace ON trend_searches(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_trend_watchlists_workspace ON trend_watchlists(workspace_id);
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Trend tables and indexes created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Error creating trend tables:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateTrends().catch(err => {
  console.error(err);
  process.exit(1);
});
