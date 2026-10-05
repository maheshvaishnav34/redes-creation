import { pool } from '../src/config/db.js';
import QRCode from 'qrcode';

async function fixLinksAndQR() {
  try {
    const postDineUrl = 'http://localhost:5173/feedback/post-dine-table-qr';
    const banquetUrl = 'http://localhost:5173/feedback/banquet-vip';

    const qrPostDine = await QRCode.toDataURL(postDineUrl, { width: 400, margin: 2 });
    const qrBanquet = await QRCode.toDataURL(banquetUrl, { width: 400, margin: 2 });

    await pool.query(`
      UPDATE review_campaigns
      SET review_link = $1, qr_code_data = $2
      WHERE name ILIKE '%Post-Dine%' OR review_link ILIKE '%post-dine%'
    `, [postDineUrl, qrPostDine]);

    await pool.query(`
      UPDATE review_campaigns
      SET review_link = $1, qr_code_data = $2
      WHERE name ILIKE '%Banquet%' OR review_link ILIKE '%banquet%'
    `, [banquetUrl, qrBanquet]);

    console.log('Successfully updated review_campaigns links & QR code data in PostgreSQL!');
    const rows = await pool.query('SELECT id, name, review_link, length(qr_code_data) as qr_len FROM review_campaigns');
    console.log(rows.rows);
  } catch (err) {
    console.error('Error updating campaign links & QR:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixLinksAndQR();
