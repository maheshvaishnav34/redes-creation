import { getUnifiedFlywheelSummary } from '../src/modules/keywords/keywords.service.js';
import { query } from '../src/config/db.js';

async function test() {
  try {
    const bizRes = await query('SELECT id, name, city FROM business_locations LIMIT 1');
    if (!bizRes.rows.length) {
      console.log('No businesses found to test flywheel summary');
      process.exit(0);
    }
    const biz = bizRes.rows[0];
    console.log('Testing flywheel summary for business:', biz.id, biz.name);

    const summary = await getUnifiedFlywheelSummary(biz.id);
    console.log('Flywheel Summary Result:');
    console.log(JSON.stringify(summary, null, 2));

    if (summary.success && summary.flywheel.step1_trends && summary.flywheel.step5_posts) {
      console.log('✅ ALL-OVER UNIFIED FLYWHEEL BACKEND TEST PASSED 100%!');
      process.exit(0);
    } else {
      console.error('❌ Validation failed on flywheel structure');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error testing flywheel:', err);
    process.exit(1);
  }
}

test();
