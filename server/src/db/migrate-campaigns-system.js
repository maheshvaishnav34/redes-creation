import { pool } from '../config/db.js';

async function migrate() {
  console.log('[MIGRATION] Setting up Review Campaigns & QR ecosystem tables...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. review_qr_codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS review_qr_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES review_campaigns(id) ON DELETE SET NULL,
        business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        qr_data TEXT NOT NULL,
        design_preset VARCHAR(50) DEFAULT 'branded',
        fg_color VARCHAR(30) DEFAULT '#034bc0',
        bg_color VARCHAR(30) DEFAULT '#ffffff',
        label TEXT DEFAULT 'Scan to Share Your Experience',
        scans_count INT DEFAULT 0,
        unique_scans_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_rqc_business ON review_qr_codes(business_id);
      CREATE INDEX IF NOT EXISTS idx_rqc_campaign ON review_qr_codes(campaign_id);
    `);

    // 2. campaign_customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        service VARCHAR(255) DEFAULT 'General Service',
        visit_date DATE DEFAULT CURRENT_DATE,
        language VARCHAR(20) DEFAULT 'en',
        status VARCHAR(50) DEFAULT 'active',
        last_contact_at TIMESTAMPTZ DEFAULT NOW(),
        review_activity VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cc_business ON campaign_customers(business_id);
    `);

    // 3. campaign_events
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES review_campaigns(id) ON DELETE CASCADE,
        business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ce_campaign ON campaign_events(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_ce_event ON campaign_events(event_type);
    `);

    // Seed default customers if empty
    const custCount = await client.query(`SELECT COUNT(*) FROM campaign_customers`);
    if (Number(custCount.rows[0].count) === 0) {
      const bizRes = await client.query(`SELECT id FROM business_locations LIMIT 1`);
      const bizId = bizRes.rows[0]?.id;
      if (bizId) {
        await client.query(`
          INSERT INTO campaign_customers (business_id, name, email, phone, service, status, review_activity, notes) VALUES
          ($1, 'Aarav Patel', 'aarav.patel@gmail.com', '+91 98250 12345', 'Full Stack Web Development', 'reviewed', 'reviewed', 'Completed Course with distinction'),
          ($1, 'Pooja Mehta', 'pooja.mehta@yahoo.com', '+91 98980 67890', 'Python Programming', 'reviewed', 'reviewed', 'Excellent learner, placed in TCS'),
          ($1, 'Rohan Sharma', 'rohan.sharma@outlook.com', '+91 97123 45678', 'MERN Stack Development', 'contacted', 'pending', 'Interested in Placement guarantee'),
          ($1, 'Neha Varma', 'neha.v@gmail.com', '+91 94260 98765', 'React & Node.js Training', 'active', 'pending', 'Batch 2026 morning session'),
          ($1, 'Vikram Singh', 'vikram.singh@gmail.com', '+91 99090 11223', 'Software Testing & QA', 'reviewed', 'reviewed', 'Left 5-star review'),
          ($1, 'Kavita Joshi', 'kavita.j@gmail.com', '+91 98244 55667', 'UI/UX Design', 'active', 'pending', 'Portfolio review pending')
        `, [bizId]);
        console.log('[MIGRATION] Seeded initial campaign customers.');
      }
    }

    // Seed default QR codes if empty
    const qrCount = await client.query(`SELECT COUNT(*) FROM review_qr_codes`);
    if (Number(qrCount.rows[0].count) === 0) {
      const camps = await client.query(`SELECT id, business_id, name, review_link, qr_code_data FROM review_campaigns LIMIT 5`);
      for (const camp of camps.rows) {
        if (camp.qr_code_data) {
          await client.query(`
            INSERT INTO review_qr_codes (campaign_id, business_id, name, qr_data, design_preset, fg_color, bg_color, label, scans_count)
            VALUES ($1, $2, $3, $4, 'branded', '#034bc0', '#ffffff', 'Scan to Share Your Experience', 184)
          `, [camp.id, camp.business_id, `${camp.name} Countertop QR`, camp.qr_code_data]);
        }
      }
      console.log('[MIGRATION] Seeded initial review_qr_codes.');
    }

    await client.query('COMMIT');
    console.log('[MIGRATION] Campaign tables successfully created and seeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Error:', err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate().catch(console.error);
