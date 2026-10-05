import { pool } from '../src/config/db.js';

async function updateWebsites() {
  try {
    await pool.query(`
      UPDATE business_locations 
      SET website = 'https://redescreation.in', phone = '+91 79 4890 5500'
      WHERE name ILIKE '%Saffron%' OR name ILIKE '%Redes%';
    `);
    console.log('Successfully updated business_locations website to https://redescreation.in');
    const rows = await pool.query('SELECT id, name, website, phone FROM business_locations');
    console.log(rows.rows);
  } catch (err) {
    console.error('Error updating business website:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateWebsites();
