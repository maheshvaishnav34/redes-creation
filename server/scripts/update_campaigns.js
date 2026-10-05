import { query } from '../src/config/db.js';

async function update() {
  await query(`UPDATE review_campaigns 
               SET business_name = 'Stack Code', 
                   website = 'https://redescreation.in',
                   services = $1
               WHERE name ILIKE '%stack code%'`,
    [JSON.stringify(["Website Designing and Development", "Custom Web Applications", "UI/UX Design", "Technical Support"])]
  );
  await query(`UPDATE review_campaigns 
               SET business_name = 'Redes Creation', 
                   website = 'https://redescreation.in',
                   services = $1
               WHERE name NOT ILIKE '%stack code%'`,
    [JSON.stringify(["Website Designing and Development", "Local SEO and Reviews", "Google Review Intelligence", "Digital Marketing"])]
  );
  console.log('Successfully updated review_campaigns!');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
