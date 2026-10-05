import { query } from '../src/config/db.js';

async function main() {
  console.log('Creating billing tables: payment_methods and invoices...');
  
  await query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      brand VARCHAR(50),
      last4 VARCHAR(100),
      exp_month INTEGER,
      exp_year INTEGER,
      is_default BOOLEAN DEFAULT FALSE,
      billing_name VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      status VARCHAR(50) DEFAULT 'Paid',
      plan_id VARCHAR(50) NOT NULL,
      plan_name VARCHAR(100) NOT NULL,
      billing_cycle VARCHAR(50) DEFAULT 'monthly',
      billing_date DATE DEFAULT CURRENT_DATE,
      due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days')::date,
      payment_method VARCHAR(100) DEFAULT 'UPI / Card',
      pdf_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default payment methods and invoices for existing workspaces
  const wsRes = await query(`SELECT id, name, plan FROM workspaces`);
  for (const ws of wsRes.rows) {
    // Check if payment methods exist
    const pmCheck = await query(`SELECT id FROM payment_methods WHERE workspace_id = $1`, [ws.id]);
    if (pmCheck.rows.length === 0) {
      await query(`
        INSERT INTO payment_methods (workspace_id, type, brand, last4, exp_month, exp_year, is_default, billing_name)
        VALUES 
          ($1, 'upi', 'Google Pay UPI', 'redes@okhdfcbank', NULL, NULL, TRUE, $2),
          ($1, 'card', 'HDFC Visa Infinite Business', '4890', 12, 2028, FALSE, $2)
      `, [ws.id, ws.name]);
    }

    // Check if invoices exist
    const invCheck = await query(`SELECT id FROM invoices WHERE workspace_id = $1`, [ws.id]);
    if (invCheck.rows.length === 0) {
      await query(`
        INSERT INTO invoices (invoice_number, workspace_id, amount, status, plan_id, plan_name, billing_cycle, billing_date, payment_method)
        VALUES
          ('INV-2026-003', $1, 24999.00, 'Paid', 'agency', 'Agency Monthly', 'monthly', '2026-10-01', 'UPI (redes@okhdfcbank)'),
          ('INV-2026-002', $1, 24999.00, 'Paid', 'agency', 'Agency Monthly', 'monthly', '2026-09-01', 'Visa •••• 4890'),
          ('INV-2026-001', $1, 24999.00, 'Paid', 'agency', 'Agency Monthly', 'monthly', '2026-08-01', 'Visa •••• 4890')
      `, [ws.id]);
    }
  }

  console.log('Billing tables and initial records successfully seeded!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
