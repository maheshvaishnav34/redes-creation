import { query, pool } from '../config/db.js';

async function setPrimaryBhagyalaxmi() {
  console.log('[DB-SETUP] Aligning primary business to Bhagyalaxmi Hotel & Resort...');
  try {
    // 1. Reset is_primary on all locations
    await query(`UPDATE business_locations SET is_primary = false`);

    // 2. Set Bhagyalaxmi Hotel & Resort as is_primary = true
    const updateRes = await query(`
      UPDATE business_locations 
      SET is_primary = true,
          address = 'JT Shelke Patil Marg, Near Sai Baba Temple Gate No. 2, Shirdi, Maharashtra 423109',
          city = 'Shirdi',
          country = 'India'
      WHERE id = '07284664-dcc3-4f13-bc68-2b9c87df1209'
         OR name ILIKE '%Bhagyalaxmi%'
    `);
    console.log(`[DB-SETUP] Updated Bhagyalaxmi location as primary (${updateRes.rowCount} row(s) updated).`);

    // 3. Ensure google_locations record has place ID ChIJlbjxyTcpXTkRNOWc_dQH0VI
    await query(`
      UPDATE google_locations
      SET gbp_place_id = 'ChIJlbjxyTcpXTkRNOWc_dQH0VI',
          location_name = 'Hotel Bhagyalaxmi',
          address = 'JT Shelke Patil Marg, Near Sai Baba Temple Gate No. 2, Shirdi, Maharashtra 423109',
          website = 'https://search.google.com/local/writereview?placeid=ChIJlbjxyTcpXTkRNOWc_dQH0VI'
      WHERE business_id = '07284664-dcc3-4f13-bc68-2b9c87df1209'
    `);
    console.log('[DB-SETUP] Verified google_locations for Bhagyalaxmi.');

    // 4. Verify primary business
    const checkRes = await query(`
      SELECT id, name, is_primary, address 
      FROM business_locations 
      WHERE is_primary = true
    `);
    console.log('[DB-SETUP] Current Primary Business:', checkRes.rows[0]);
  } catch (err) {
    console.error('[DB-SETUP] Error:', err.message);
  } finally {
    await pool.end();
  }
}

setPrimaryBhagyalaxmi();
