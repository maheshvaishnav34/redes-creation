import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

const PLANS_CONFIG = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 3499,
    priceAnnual: 34990,
    limits: { locations: 1, reviews: 300, aiGenerations: 150, keywords: 25, geoGrids: 10 },
    features: ['1 Location', 'Google Review Sync', 'AI Reply Drafting', '25 Keywords', 'Basic SEO Audit']
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 8999,
    priceAnnual: 89990,
    popular: true,
    limits: { locations: 5, reviews: 1500, aiGenerations: 600, keywords: 100, geoGrids: 50 },
    features: ['Up to 5 Locations', 'Auto-Reply Engine', 'Geo-Grid Heatmaps', 'Competitor Intelligence', '100 Keywords', 'Weekly Reports']
  },
  {
    id: 'agency',
    name: 'Agency',
    priceMonthly: 24999,
    priceAnnual: 249990,
    limits: { locations: 25, reviews: 5000, aiGenerations: 2000, keywords: 500, geoGrids: 200 },
    features: ['Up to 25 Locations', 'Multi-Client Management', 'Agency Portal', 'White-label Reports', 'AI Orchestrator', 'Unlimited Users']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 49999,
    priceAnnual: 499990,
    limits: { locations: 100, reviews: 20000, aiGenerations: 10000, keywords: 2500, geoGrids: 1000 },
    features: ['Dedicated Account Manager', 'Custom AI Prompt Packs', 'SSO / SAML', 'Custom Domain White-label', 'SLA 99.9%']
  }
];

export const getSubscription = async (req, res, next) => {
  try {
    // 1. Calculate Real-Time Usage from actual tables
    const [locCount, revCount, kwCount, aiCount, geoCount] = await Promise.all([
      query(`SELECT COUNT(*) FROM business_locations WHERE workspace_id = $1`, [req.workspaceId]),
      query(`SELECT COUNT(*) FROM reviews r JOIN business_locations b ON r.business_id = b.id WHERE b.workspace_id = $1`, [req.workspaceId]),
      query(`SELECT COUNT(*) FROM keywords k JOIN business_locations b ON k.business_id = b.id WHERE b.workspace_id = $1`, [req.workspaceId]),
      query(`SELECT COUNT(*) FROM ai_generations WHERE workspace_id = $1`, [req.workspaceId]),
      query(`SELECT COUNT(*) FROM geo_grids g JOIN business_locations b ON g.business_id = b.id WHERE b.workspace_id = $1`, [req.workspaceId])
    ]);

    const actualUsage = {
      locations: parseInt(locCount.rows[0].count, 10),
      reviews: parseInt(revCount.rows[0].count, 10),
      keywords: parseInt(kwCount.rows[0].count, 10),
      ai: parseInt(aiCount.rows[0].count, 10),
      geogrids: parseInt(geoCount.rows[0].count, 10)
    };

    // 2. Fetch or initialize subscription
    let subRes = await query(
      `SELECT s.*, w.name as workspace_name
       FROM subscriptions s
       JOIN workspaces w ON s.workspace_id = w.id
       WHERE s.workspace_id = $1`,
      [req.workspaceId]
    );

    if (subRes.rows.length === 0) {
      // Create initial subscription if none exists
      await query(
        `INSERT INTO subscriptions (
           workspace_id, plan, status, billing_cycle,
           locations_limit, reviews_limit, ai_generations_limit, keywords_limit, geo_grids_limit,
           current_locations, current_reviews, current_keywords, current_ai_generations
         ) VALUES ($1, 'agency', 'active', 'monthly', 25, 5000, 2000, 500, 200, $2, $3, $4, $5)`,
        [req.workspaceId, actualUsage.locations, actualUsage.reviews, actualUsage.keywords, actualUsage.ai]
      );
      subRes = await query(
        `SELECT s.*, w.name as workspace_name
         FROM subscriptions s
         JOIN workspaces w ON s.workspace_id = w.id
         WHERE s.workspace_id = $1`,
        [req.workspaceId]
      );
    } else {
      // Sync real-time counts
      await query(
        `UPDATE subscriptions
         SET current_locations = $1, current_reviews = $2, current_keywords = $3, current_ai_generations = $4
         WHERE workspace_id = $5`,
        [actualUsage.locations, actualUsage.reviews, actualUsage.keywords, actualUsage.ai, req.workspaceId]
      );
      subRes.rows[0].current_locations = actualUsage.locations;
      subRes.rows[0].current_reviews = actualUsage.reviews;
      subRes.rows[0].current_keywords = actualUsage.keywords;
      subRes.rows[0].current_ai_generations = actualUsage.ai;
    }

    // 3. Fetch Invoices and Payment Methods
    const [invRes, pmRes] = await Promise.all([
      query(`SELECT * FROM invoices WHERE workspace_id = $1 ORDER BY created_at DESC`, [req.workspaceId]),
      query(`SELECT * FROM payment_methods WHERE workspace_id = $1 ORDER BY is_default DESC, created_at DESC`, [req.workspaceId])
    ]);

    res.json({
      success: true,
      subscription: {
        ...subRes.rows[0],
        locations_used: actualUsage.locations,
        reviews_synced: actualUsage.reviews,
        keywords_used: actualUsage.keywords,
        ai_generations_used: actualUsage.ai,
        geo_grids_used: actualUsage.geogrids
      },
      plans: PLANS_CONFIG,
      invoices: invRes.rows,
      paymentMethods: pmRes.rows
    });
  } catch (err) {
    next(err);
  }
};

export const upgradePlan = async (req, res, next) => {
  try {
    const { plan, billingCycle = 'monthly', paymentMethod, paymentMethodId, upiId, cardDetails } = req.body;

    const planObj = PLANS_CONFIG.find(p => p.id === plan) || PLANS_CONFIG[1];
    const amount = billingCycle === 'annual' ? planObj.priceAnnual : planObj.priceMonthly;

    const planLimits = {
      starter: { locations: 1, reviews: 300, ai: 150, keywords: 25, geogrids: 10 },
      professional: { locations: 5, reviews: 1500, ai: 600, keywords: 100, geogrids: 50 },
      agency: { locations: 25, reviews: 5000, ai: 2000, keywords: 500, geogrids: 200 },
      enterprise: { locations: 100, reviews: 20000, ai: 10000, keywords: 2500, geogrids: 1000 }
    };

    const targetLimits = planLimits[plan] || planLimits.professional;

    // 1. Update subscription in DB
    const updated = await query(
      `UPDATE subscriptions
       SET plan = $1, billing_cycle = $2, status = 'active',
           locations_limit = $3, reviews_limit = $4, ai_generations_limit = $5,
           keywords_limit = $6, geo_grids_limit = $7, updated_at = NOW()
       WHERE workspace_id = $8
       RETURNING *`,
      [plan, billingCycle, targetLimits.locations, targetLimits.reviews, targetLimits.ai, targetLimits.keywords, targetLimits.geogrids, req.workspaceId]
    );

    // 2. Update workspace plan
    await query(`UPDATE workspaces SET plan = $1 WHERE id = $2`, [plan, req.workspaceId]);

    // 3. Save or update payment method if provided
    let paymentMethodLabel = 'Primary Payment Method';
    if (upiId && upiId.trim()) {
      paymentMethodLabel = `UPI (${upiId.trim()})`;
      await query(
        `INSERT INTO payment_methods (workspace_id, type, brand, last4, is_default, billing_name)
         VALUES ($1, 'upi', 'UPI / VPA', $2, TRUE, $3)`,
        [req.workspaceId, upiId.trim(), req.user.full_name || req.user.email]
      );
    } else if (cardDetails && cardDetails.cardNumber) {
      const cleanNum = cardDetails.cardNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4) || '4242';
      paymentMethodLabel = `${cardDetails.brand || 'Card'} •••• ${last4}`;
      await query(
        `INSERT INTO payment_methods (workspace_id, type, brand, last4, exp_month, exp_year, is_default, billing_name)
         VALUES ($1, 'card', $2, $3, $4, $5, TRUE, $6)`,
        [
          req.workspaceId, 
          cardDetails.brand || 'Visa / Mastercard', 
          last4, 
          cardDetails.expMonth || 12, 
          cardDetails.expYear || 2028, 
          cardDetails.cardholderName || req.user.full_name
        ]
      );
    } else if (paymentMethod) {
      paymentMethodLabel = paymentMethod;
    }

    // 4. Generate Paid Invoice
    const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const invRes = await query(
      `INSERT INTO invoices (
         invoice_number, workspace_id, amount, currency, status,
         plan_id, plan_name, billing_cycle, billing_date, payment_method
       ) VALUES ($1, $2, $3, 'INR', 'Paid', $4, $5, $6, CURRENT_DATE, $7)
       RETURNING *`,
      [
        invoiceNum,
        req.workspaceId,
        amount,
        plan,
        `${planObj.name} ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
        billingCycle,
        paymentMethodLabel
      ]
    );

    await logAudit(req.workspaceId, req.user.id, 'SUBSCRIPTION_PLAN_UPGRADED', 'subscriptions', req.workspaceId, { 
      newPlan: plan, 
      billingCycle, 
      amount, 
      invoiceNumber: invoiceNum 
    });

    res.json({
      success: true,
      message: `Congratulations! Workspace successfully activated on the ${planObj.name.toUpperCase()} plan.`,
      subscription: updated.rows[0],
      invoice: invRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const listInvoices = async (req, res, next) => {
  try {
    const invRes = await query(
      `SELECT * FROM invoices WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [req.workspaceId]
    );
    res.json({ success: true, invoices: invRes.rows });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceHtml = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invRes = await query(
      `SELECT i.*, w.name as workspace_name, w.country
       FROM invoices i
       JOIN workspaces w ON i.workspace_id = w.id
       WHERE i.id::text = $1 OR i.invoice_number = $1`,
      [id]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).send('Invoice not found');
    }

    const inv = invRes.rows[0];
    const subtotal = Math.round(Number(inv.amount) / 1.18);
    const gstAmount = Number(inv.amount) - subtotal;
    const cgst = (gstAmount / 2).toFixed(2);
    const sgst = (gstAmount / 2).toFixed(2);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${inv.invoice_number} | Redes Creation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #f8fafc; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #034bc0; padding-bottom: 24px; margin-bottom: 30px; }
    .brand-title { font-size: 24px; font-weight: 900; color: #034bc0; margin: 0; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .inv-title { text-align: right; }
    .inv-badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; border: 1px solid #a7f3d0; text-transform: uppercase; margin-bottom: 6px; }
    .inv-num { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; font-family: monospace; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; font-size: 13px; }
    .section-title { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
    th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; }
    td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 300px; margin-left: auto; margin-bottom: 30px; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #64748b; }
    .totals-total { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #0f172a; font-size: 16px; font-weight: 900; color: #0f172a; }
    .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 11px; color: #94a3b8; }
    @media print { body { background: #fff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">Redes Creation</h1>
        <div class="brand-sub">Google Review + Local SEO Intelligence Platform</div>
        <div class="brand-sub">Redes Enterprise Solutions Pvt Ltd • GSTIN: 24ABCDE1234F1Z5</div>
      </div>
      <div class="inv-title">
        <span class="inv-badge">${inv.status}</span>
        <h2 class="inv-num">${inv.invoice_number}</h2>
        <div class="brand-sub">Date: ${new Date(inv.billing_date || inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="section-title">Billed To</div>
        <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${inv.workspace_name}</div>
        <div style="color: #64748b; margin-top: 4px;">Account Status: Active Enterprise Tenant</div>
        <div style="color: #64748b;">Country: ${inv.country || 'India'}</div>
      </div>
      <div style="text-align: right;">
        <div class="section-title">Payment Information</div>
        <div style="font-weight: 700; color: #0f172a;">Method: ${inv.payment_method || 'UPI / Card Online'}</div>
        <div style="color: #64748b; margin-top: 4px;">Currency: INR (₹ Indian Rupees)</div>
        <div style="color: #059669; font-weight: 700;">Status: Paid & Reconciled</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Billing Cycle</th>
          <th>Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${inv.plan_name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Multi-niche Local SEO, Review Redirection, AI Auto-Reply & Geo-Grid Radar</div>
          </td>
          <td style="text-transform: capitalize;">${inv.billing_cycle || 'monthly'}</td>
          <td>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: 700;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row">
        <span>CGST (9%)</span>
        <span>₹${cgst}</span>
      </div>
      <div class="totals-row">
        <span>SGST (9%)</span>
        <span>₹${sgst}</span>
      </div>
      <div class="totals-total">
        <span>Total Paid</span>
        <span>₹${Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated tax invoice. No signature required.</p>
      <p>Redes Creation • Support: support@redescreation.in • https://redescreation.in</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

export const listPaymentMethods = async (req, res, next) => {
  try {
    const pmRes = await query(
      `SELECT * FROM payment_methods WHERE workspace_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.workspaceId]
    );
    res.json({ success: true, paymentMethods: pmRes.rows });
  } catch (err) {
    next(err);
  }
};

export const addPaymentMethod = async (req, res, next) => {
  try {
    const { type, brand, last4, expMonth, expYear, billingName, isDefault = false } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Payment method type is required' });
    }

    if (isDefault) {
      await query(`UPDATE payment_methods SET is_default = FALSE WHERE workspace_id = $1`, [req.workspaceId]);
    }

    const insRes = await query(
      `INSERT INTO payment_methods (
         workspace_id, type, brand, last4, exp_month, exp_year, is_default, billing_name
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.workspaceId,
        type,
        brand || (type === 'upi' ? 'UPI' : 'Card'),
        last4 || '4242',
        expMonth || null,
        expYear || null,
        Boolean(isDefault),
        billingName || req.user.full_name || 'Account Holder'
      ]
    );

    res.status(201).json({ success: true, paymentMethod: insRes.rows[0], message: 'Payment method added successfully' });
  } catch (err) {
    next(err);
  }
};

export const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM payment_methods WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    res.json({ success: true, message: 'Payment method deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`UPDATE payment_methods SET is_default = FALSE WHERE workspace_id = $1`, [req.workspaceId]);
    await query(`UPDATE payment_methods SET is_default = TRUE WHERE id = $1 AND workspace_id = $2`, [id, req.workspaceId]);
    res.json({ success: true, message: 'Default payment method updated' });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
// SUPER-ADMIN BILLING & SUBSCRIPTIONS ALL-ACCESS CONTROL
// -------------------------------------------------------------

export const getAdminBillingOverview = async (req, res, next) => {
  try {
    const [subsRes, invTotals, plansBreakdown] = await Promise.all([
      query(`
        SELECT s.*, w.name as workspace_name, w.slug as workspace_slug, w.created_at as workspace_joined,
               (SELECT email FROM users u WHERE u.workspace_id = w.id ORDER BY u.created_at ASC LIMIT 1) as owner_email
        FROM subscriptions s
        JOIN workspaces w ON s.workspace_id = w.id
        ORDER BY s.updated_at DESC
      `),
      query(`
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as paid_revenue
        FROM invoices
      `),
      query(`
        SELECT plan, COUNT(*) as count
        FROM subscriptions
        GROUP BY plan
      `)
    ]);

    // Calculate MRR
    let mrr = 0;
    subsRes.rows.forEach(sub => {
      const planConfig = PLANS_CONFIG.find(p => p.id === sub.plan) || PLANS_CONFIG[1];
      mrr += sub.billing_cycle === 'annual' ? Math.round(planObj?.priceAnnual / 12 || 8999) : (planConfig.priceMonthly || 8999);
    });

    res.json({
      success: true,
      mrr,
      totalRevenue: Number(invTotals.rows[0].paid_revenue),
      totalInvoices: Number(invTotals.rows[0].total_invoices),
      plansBreakdown: plansBreakdown.rows,
      subscriptions: subsRes.rows,
      availablePlans: PLANS_CONFIG
    });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateSubscription = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { plan, status, billingCycle, locationsLimit, reviewsLimit, aiLimit, keywordsLimit, geoGridsLimit } = req.body;

    const planLimits = {
      starter: { locations: 1, reviews: 300, ai: 150, keywords: 25, geogrids: 10 },
      professional: { locations: 5, reviews: 1500, ai: 600, keywords: 100, geogrids: 50 },
      agency: { locations: 25, reviews: 5000, ai: 2000, keywords: 500, geogrids: 200 },
      enterprise: { locations: 100, reviews: 20000, ai: 10000, keywords: 2500, geogrids: 1000 }
    };
    const defaultLimits = planLimits[plan] || planLimits.professional;

    const updateRes = await query(
      `UPDATE subscriptions
       SET plan = COALESCE($1, plan),
           status = COALESCE($2, status),
           billing_cycle = COALESCE($3, billing_cycle),
           locations_limit = COALESCE($4, locations_limit, $5),
           reviews_limit = COALESCE($6, reviews_limit, $7),
           ai_generations_limit = COALESCE($8, ai_generations_limit, $9),
           keywords_limit = COALESCE($10, keywords_limit, $11),
           geo_grids_limit = COALESCE($12, geo_grids_limit, $13),
           updated_at = NOW()
       WHERE workspace_id = $14
       RETURNING *`,
      [
        plan, status, billingCycle,
        locationsLimit, defaultLimits.locations,
        reviewsLimit, defaultLimits.reviews,
        aiLimit, defaultLimits.ai,
        keywordsLimit, defaultLimits.keywords,
        geoGridsLimit, defaultLimits.geogrids,
        workspaceId
      ]
    );

    if (plan) {
      await query(`UPDATE workspaces SET plan = $1 WHERE id = $2`, [plan, workspaceId]);
    }

    await logAudit(workspaceId, req.user.id, 'ADMIN_SUBSCRIPTION_OVERRIDE', 'subscriptions', workspaceId, { plan, status });

    res.json({
      success: true,
      message: 'Workspace subscription successfully updated by Super-Admin',
      subscription: updateRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const adminCreateInvoice = async (req, res, next) => {
  try {
    const { workspaceId, amount, planName, description, paymentMethod = 'Manual Admin Adjustment', status = 'Paid' } = req.body;

    if (!workspaceId || !amount) {
      return res.status(400).json({ success: false, error: 'Workspace ID and amount are required' });
    }

    const invoiceNum = `INV-ADM-${Math.floor(1000 + Math.random() * 9000)}`;
    const invRes = await query(
      `INSERT INTO invoices (
         invoice_number, workspace_id, amount, currency, status,
         plan_id, plan_name, billing_cycle, billing_date, payment_method
       ) VALUES ($1, $2, $3, 'INR', $4, 'custom', $5, 'custom', CURRENT_DATE, $6)
       RETURNING *`,
      [invoiceNum, workspaceId, amount, status, planName || description || 'Custom SaaS Contract', paymentMethod]
    );

    res.status(201).json({ success: true, invoice: invRes.rows[0], message: 'Invoice generated successfully' });
  } catch (err) {
    next(err);
  }
};
