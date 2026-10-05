import { query } from '../src/config/db.js';

async function updateStackCode() {
  await query(`
    UPDATE review_campaigns 
    SET business_name = 'StackCode Training Institute',
        services = '["Full Stack Web Development", "Python Programming", "MERN Stack Development", "Software Testing", "React and Node.js", "IT Career Placement"]'::jsonb
    WHERE name = 'stackcodetraining' OR id = '1c3e440b-cfd4-407e-90a9-a02a4cbfdb1f'
  `);
  console.log('✅ Updated stackcodetraining campaign with proper services and business name!');
  process.exit(0);
}

updateStackCode().catch(console.error);
