import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { pool } from '../config/db.js';

async function seed() {
  console.log('[SEED] Starting comprehensive database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. CLEAR EXISTING DATA
    await client.query(`
      TRUNCATE TABLE 
        system_jobs, audit_logs, ai_generations, ai_prompt_versions,
        subscriptions, reports, notifications, tasks, recommendations,
        seo_checks, seo_audits, competitors, geo_grid_points, geo_grids,
        keyword_rank_snapshots, keywords, keyword_groups, review_feedback,
        review_campaigns, review_responses, reviews, google_locations,
        google_connections, business_profiles, business_locations,
        industry_subcategories, industries, clients, users, workspaces
      CASCADE;
    `);

    // 2. INDUSTRIES & SUBCATEGORIES
    const industriesData = [
      {
        id: 'restaurant',
        name: 'Restaurant & Dining',
        icon: 'Utensils',
        description: 'Fine dining, casual eateries, cafes, cloud kitchens and banquet restaurants.',
        default_topics: JSON.stringify(['Food Quality', 'Service & Staff', 'Ambiance', 'Cleanliness', 'Waiting Time', 'Pricing & Value', 'Reservation', 'Seating']),
        default_tone: 'Warm & Hospitable',
        compliance_rules: JSON.stringify(['Do not guarantee allergen-free without kitchen verification', 'Never disclose private dining party names']),
        subcategories: [
          { id: 'fine_dining', name: 'Fine Dining & Luxury', services: ['Chef Tasting Menu', 'Candlelight Dinners', 'Private Dining Rooms', 'Sommelier Selection'], keywords: ['best fine dining restaurant', 'luxury romantic dinner', 'exclusive private dining banquet'] },
          { id: 'casual_dining', name: 'Casual Family Dining', services: ['Family Buffet', 'Sunday Brunch', 'Kids Menu', 'Live Music Nights'], keywords: ['family friendly restaurant', 'weekend lunch buffet', 'casual dining near me'] },
          { id: 'cafe_bakery', name: 'Artisan Cafe & Bakery', services: ['Specialty Coffee', 'Sourdough Bakery', 'Breakfast & Brunch', 'Co-working Seating'], keywords: ['best specialty coffee shop', 'artisan bakery and cafe', 'work friendly cafe near me'] }
        ]
      },
      {
        id: 'dental',
        name: 'Dental & Oral Care',
        icon: 'Stethoscope',
        description: 'Cosmetic dentistry, dental implant centers, orthodontics and pediatric dental clinics.',
        default_topics: JSON.stringify(['Treatment Quality', 'Pain Management', 'Dentist Expertise', 'Hygiene & Sterilization', 'Staff Courtesy', 'Waiting Time', 'Pricing & Insurance']),
        default_tone: 'Professional & Compassionate',
        compliance_rules: JSON.stringify(['HIPAA compliance: Never disclose patient medical diagnosis or history in public replies', 'Do not make guaranteed outcome promises for clinical procedures']),
        subcategories: [
          { id: 'cosmetic_implants', name: 'Cosmetic Dentistry & Implants', services: ['Dental Implants', 'Porcelain Veneers', 'Laser Teeth Whitening', 'Full Mouth Rehabilitation'], keywords: ['best dental implant clinic', 'cosmetic dentist near me', 'teeth whitening specialist'] },
          { id: 'orthodontics', name: 'Orthodontics & Clear Aligners', services: ['Invisalign Clear Aligners', 'Ceramic Braces', 'Teeth Straightening', 'Retainers'], keywords: ['invisalign certified orthodontist', 'clear braces cost', 'orthodontic clinic near me'] }
        ]
      },
      {
        id: 'hotel',
        name: 'Hotels & Hospitality',
        icon: 'Hotel',
        description: 'Luxury resorts, boutique hotels, business accommodations and heritage stays.',
        default_topics: JSON.stringify(['Room Cleanliness', 'Bed Comfort', 'Check-in Experience', 'Amenities & Pool', 'Breakfast Quality', 'Location & Views', 'Staff Friendliness']),
        default_tone: 'Polite, Premium & Gracious',
        compliance_rules: JSON.stringify(['Protect guest room numbers and travel dates', 'Comply with hospitality guest privacy standards']),
        subcategories: [
          { id: 'luxury_resort', name: 'Luxury Heritage Resort', services: ['Palace Suite Accommodations', 'Infinity Pool', 'Luxury Spa & Wellness', 'Destination Weddings'], keywords: ['5 star luxury palace resort', 'heritage boutique hotel', 'destination wedding venue'] }
        ]
      },
      {
        id: 'real_estate',
        name: 'Real Estate & Properties',
        icon: 'Building',
        description: 'Residential sales, luxury penthouses, commercial leasing and property advisory.',
        default_topics: JSON.stringify(['Agent Professionalism', 'Market Knowledge', 'Transaction Transparency', 'Site Visits', 'Documentation Support']),
        default_tone: 'Authoritative, Polished & Advisory',
        compliance_rules: JSON.stringify(['Adhere to RERA guidelines', 'Do not guarantee investment return figures']),
        subcategories: [
          { id: 'residential_luxury', name: 'Luxury Residential Properties', services: ['Luxury Penthouse Advisory', 'Gated Community Villas', 'Investment Consultation'], keywords: ['luxury apartments for sale', 'gated community villas', 'top real estate agency near me'] }
        ]
      },
      {
        id: 'healthcare',
        name: 'Healthcare & Multispecialty',
        icon: 'HeartPulse',
        description: 'Hospitals, diagnostic clinics, wellness centers and therapy clinics.',
        default_topics: JSON.stringify(['Doctor Competence', 'Nursing Care', 'Diagnosis Accuracy', 'Lab Turnaround', 'Cleanliness', 'Billing Clarity']),
        default_tone: 'Empathetic & Clinical',
        compliance_rules: JSON.stringify(['Medical secrecy: strictly avoid discussing medical records or prescriptions in reviews']),
        subcategories: [
          { id: 'multispecialty_clinic', name: 'Multispecialty Healthcare Center', services: ['Health Checkup Packages', 'Cardiology Consultations', 'Daycare Surgeries'], keywords: ['best multispecialty clinic', 'experienced doctors near me', 'advanced diagnostics'] }
        ]
      },
      {
        id: 'retail',
        name: 'Retail & Specialty Store',
        icon: 'ShoppingBag',
        description: 'Boutiques, designer wear, electronics, home decor and retail chains.',
        default_topics: JSON.stringify(['Product Quality', 'Store Atmosphere', 'Staff Assistance', 'Return & Exchange', 'Pricing', 'Discounts']),
        default_tone: 'Enthusiastic & Helpful',
        compliance_rules: JSON.stringify(['Follow consumer protection guidelines']),
        subcategories: [
          { id: 'designer_fashion', name: 'Designer Wear & Luxury Boutique', services: ['Custom Tailoring', 'Bridal Couture', 'Personal Styling Consultations'], keywords: ['designer ethnic wear store', 'luxury bridal boutique', 'bespoke clothing studio'] }
        ]
      }
    ];

    for (const ind of industriesData) {
      await client.query(`
        INSERT INTO industries (id, name, icon, description, default_topics, default_tone, compliance_rules)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [ind.id, ind.name, ind.icon, ind.description, ind.default_topics, ind.default_tone, ind.compliance_rules]);

      for (const sub of ind.subcategories) {
        await client.query(`
          INSERT INTO industry_subcategories (id, industry_id, name, suggested_services, suggested_keywords)
          VALUES ($1, $2, $3, $4, $5)
        `, [sub.id, ind.id, sub.name, JSON.stringify(sub.services), JSON.stringify(sub.keywords)]);
      }
    }

    // 3. WORKSPACE & USERS
    const wsRes = await client.query(`
      INSERT INTO workspaces (name, slug, country, timezone, default_language, plan)
      VALUES ('Redes Enterprise Workspace', 'redes-enterprise', 'India', 'Asia/Kolkata', 'en', 'agency')
      RETURNING id;
    `);
    const workspaceId = wsRes.rows[0].id;

    const passwordHash = await bcrypt.hash('Password123!', 10);
    const usersData = [
      { email: 'owner@redescreation.com', name: 'Devendra Patel', role: 'owner' },
      { email: 'admin@redescreation.com', name: 'Aarav Sharma', role: 'admin' },
      { email: 'manager@redescreation.com', name: 'Priya Iyer', role: 'manager' },
      { email: 'staff@redescreation.com', name: 'Rohan Verma', role: 'staff' },
      { email: 'client@saffronbistro.com', name: 'Vikramaditya Singhania', role: 'client' },
    ];

    const userMap = {};
    for (const u of usersData) {
      const uRes = await client.query(`
        INSERT INTO users (workspace_id, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `, [workspaceId, u.email, passwordHash, u.name, u.role]);
      userMap[u.role] = uRes.rows[0].id;
    }

    // 4. CLIENT
    const clientRes = await client.query(`
      INSERT INTO clients (workspace_id, name, email, phone, company, status)
      VALUES ($1, 'Singhania Hospitality Group', 'client@saffronbistro.com', '+91 98250 12345', 'Singhania Group', 'active')
      RETURNING id;
    `, [workspaceId]);
    const clientId = clientRes.rows[0].id;

    // 5. BUSINESS LOCATIONS
    // Business 1: Saffron Fine Dine & Banquets (Restaurant)
    const b1Res = await client.query(`
      INSERT INTO business_locations (
        workspace_id, client_id, name, industry_id, subcategory_id, business_model,
        address, city, country, postal_code, latitude, longitude, phone, website,
        service_areas, is_primary, health_score
      ) VALUES (
        $1, $2, 'Saffron Fine Dine & Banquets', 'restaurant', 'fine_dining', 'storefront',
        'Plot 42, SG Highway, Bodakdev', 'Ahmedabad', 'India', '380054', 23.0373, 72.5120,
        '+91 79 4890 5500', 'https://saffrondine.example.com',
        '["Bodakdev", "Thaltej", "Vastrapur", "Prahlad Nagar", "Satellite", "Sindhu Bhavan"]'::jsonb,
        TRUE, 94.50
      ) RETURNING id;
    `, [workspaceId, clientId]);
    const b1Id = b1Res.rows[0].id;

    // Business 2: Apex Dental Spa & Implant Center (Dental Clinic)
    const b2Res = await client.query(`
      INSERT INTO business_locations (
        workspace_id, client_id, name, industry_id, subcategory_id, business_model,
        address, city, country, postal_code, latitude, longitude, phone, website,
        service_areas, is_primary, health_score
      ) VALUES (
        $1, $2, 'Apex Dental Spa & Implant Center', 'dental', 'cosmetic_implants', 'storefront',
        '301 Stellar Tower, Sindhu Bhavan Road', 'Ahmedabad', 'India', '380059', 23.0441, 72.5028,
        '+91 79 4910 8822', 'https://apexdental.example.com',
        '["Sindhu Bhavan", "Bodakdev", "Bopal", "Ambli", "South Bopal"]'::jsonb,
        FALSE, 88.00
      ) RETURNING id;
    `, [workspaceId, clientId]);
    const b2Id = b2Res.rows[0].id;

    // 6. BUSINESS INTELLIGENCE PROFILES
    // Saffron Profile
    await client.query(`
      INSERT INTO business_profiles (
        business_id, identity, description, services, products, customer_personas,
        brand_voice, languages, approved_claims, restricted_claims, target_keywords,
        excluded_keywords, reply_rules, escalation_rules, compliance_rules, knowledge_base,
        onboarding_completed, onboarding_score
      ) VALUES (
        $1,
        'Premier North Indian & Mughlai Fine Dining Restaurant in Western Ahmedabad',
        'Saffron Fine Dine offers curated royal recipes, hand-ground spices, live sufi nights, private banquet halls for 50-300 guests, and family dining.',
        '["A La Carte Fine Dining", "Private Banquet Halls", "Corporate Luncheons", "Chef Tasting Tables", "Valet Parking"]'::jsonb,
        '["Dal Saffron Special", "Raan-e-Awadh", "Saffron Signature Mocktails", "Sunday Royal Brunch"]'::jsonb,
        '["Affluent Families celebrating milestones", "Corporate executives hosting business dinners", "Young couples seeking romantic fine dining"]'::jsonb,
        'Warm & Hospitable',
        '["en", "hi", "hinglish"]'::jsonb,
        '["Award-winning Dal Saffron cooked for 18 hours", "100% pure vegetarian separate kitchen options available", "Valet parking with 120 car capacity"]'::jsonb,
        '["Do not claim Michelin stars", "Do not claim halal unless specified on banquet menus"]'::jsonb,
        '["best fine dining restaurant ahmedabad", "top family restaurant bodakdev", "luxury banquet hall sg highway", "candlelight dinner ahmedabad"]'::jsonb,
        '["cheap food", "fast food combo", "dhaba near me"]'::jsonb,
        '{"auto_reply_5_star": true, "auto_reply_4_star": true, "draft_3_star": true, "manual_approval_1_2_star": true}'::jsonb,
        '{"notify_manager_on_1_star": true, "require_approval_sensitive": true, "escalate_food_quality_complaints": true}'::jsonb,
        '["Follow FSSAI hospitality hygiene guidelines", "Never mention guests private booking details publicly"]'::jsonb,
        '[{"title": "Parking & Valet", "content": "Free complimentary valet parking available at gate 2 for all diners."}, {"title": "Hours", "content": "Lunch: 12:00 PM - 3:30 PM | Dinner: 7:00 PM - 11:30 PM seven days a week."}]'::jsonb,
        TRUE, 100
      )
    `, [b1Id]);

    // Apex Dental Profile
    await client.query(`
      INSERT INTO business_profiles (
        business_id, identity, description, services, products, customer_personas,
        brand_voice, languages, approved_claims, restricted_claims, target_keywords,
        excluded_keywords, reply_rules, escalation_rules, compliance_rules, knowledge_base,
        onboarding_completed, onboarding_score
      ) VALUES (
        $1,
        'Advanced Implantology and Painless Aesthetic Dental Studio in Ahmedabad',
        'Apex Dental Spa blends modern German dental equipment with spa-like patient comfort, specializing in Computer-Guided Implants and Invisalign.',
        '["Dental Implants", "Invisalign Aligners", "Laser Teeth Whitening", "Root Canal Therapy", "Digital Smile Design"]'::jsonb,
        '["Titanium Straumann Implants", "Custom Porcelain Veneers"]'::jsonb,
        '["Adults needing tooth replacement", "Young professionals seeking clear aligner smile makeover", "Patients with dental anxiety"]'::jsonb,
        'Professional & Compassionate',
        '["en", "hi"]'::jsonb,
        '["Certified Straumann Dental Implant Center", "Over 12,000 successful smile restorations", "Painless laser anesthesia system"]'::jsonb,
        '["Do not guarantee 100% lifetime dental success on patient biological bone", "Do not post clinical pricing in public review replies"]'::jsonb,
        '["best dental implant doctor ahmedabad", "invisalign aligners sindhu bhavan", "painless root canal clinic bodakdev"]'::jsonb,
        '["cheap tooth extraction", "free dentist camp"]'::jsonb,
        '{"auto_reply_5_star": false, "auto_reply_4_star": false, "draft_3_star": true, "manual_approval_1_2_star": true}'::jsonb,
        '{"notify_manager_on_1_star": true, "require_approval_sensitive": true, "strict_medical_review_gate": true}'::jsonb,
        '["Strict HIPAA and Indian Medical Ethics compliance: NEVER confirm or deny clinical patient treatments in reviews"]'::jsonb,
        '[{"title": "Consultation", "content": "CBCT 3D Scan and initial doctor consultation is available by prior appointment."}]'::jsonb,
        TRUE, 95
      )
    `, [b2Id]);

    // 7. GOOGLE CONNECTIONS & LOCATIONS
    const gConnRes = await client.query(`
      INSERT INTO google_connections (
        workspace_id, account_email, account_name, access_token, refresh_token,
        token_expiry, status, sync_frequency, last_sync_at
      ) VALUES (
        $1, 'accounts.google@saffrondine.com', 'Saffron Hospitality GBP Admin',
        'ya29.a0AfH6SMD_mock_access_token_secure_gsuite', '1//0gM_mock_refresh_token_vault_redes',
        NOW() + INTERVAL '30 days', 'connected', 'daily', NOW() - INTERVAL '15 minutes'
      ) RETURNING id;
    `, [workspaceId]);
    const gConnId = gConnRes.rows[0].id;

    const gLocRes = await client.query(`
      INSERT INTO google_locations (
        google_connection_id, business_id, gbp_location_id, gbp_place_id,
        location_name, address, primary_category, secondary_categories,
        phone, website, is_verified, sync_status, last_synced_at
      ) VALUES (
        $1, $2, 'locations/11827491028374910283', NULL,
        'Saffron Fine Dine & Banquets - SG Highway', 'Plot 42, SG Highway, Bodakdev, Ahmedabad',
        'North Indian Restaurant',
        '["Fine Dining Restaurant", "Banquet Hall", "Family Restaurant", "Buffet Restaurant"]'::jsonb,
        '+91 79 4890 5500', 'https://saffrondine.example.com',
        TRUE, 'synced', NOW() - INTERVAL '15 minutes'
      ) RETURNING id;
    `, [gConnId, b1Id]);
    const gLocId = gLocRes.rows[0].id;

    // 8. REVIEWS & AI REPLIES FOR SAFFRON FINE DINE
    const sampleReviews = [
      {
        author: 'Kavita Mehta',
        rating: 5,
        text: 'Celebrated our 25th wedding anniversary in the private dining lounge at Saffron. The Dal Saffron and Paneer Tikka were exceptional, and the sufi music added such a wonderful royal charm. Valet service was seamless. Truly the finest restaurant in Ahmedabad!',
        sentiment: 'positive',
        score: 0.96,
        topics: ['Food Quality', 'Service & Staff', 'Ambiance', 'Parking & Valet'],
        keywords: ['Dal Saffron', 'private dining', 'finest restaurant in Ahmedabad'],
        priority: 'low',
        reply_status: 'auto_replied',
        is_sensitive: false,
        days_ago: 1,
        reply: {
          text: 'Dear Kavita, happy 25th anniversary to you both from all of us at Saffron! We are delighted that you enjoyed the Dal Saffron and the ambient sufi music in our private dining lounge. It was a true pleasure hosting your milestone celebration, and we look forward to welcoming you back soon!',
          tone: 'Warm & Hospitable',
          generated_by_ai: true,
          options: [
            'Warm: "Dear Kavita, congratulations on 25 glorious years! We are deeply honored you chose Saffron for your milestone celebration..."',
            'Professional: "Thank you Kavita Mehta for your gracious review. We take pride in delivering memorable dining experiences..."'
          ]
        }
      },
      {
        author: 'Rajesh Shah',
        rating: 5,
        text: 'Host all our corporate team dinners here. The buffet spread is always fresh and hygienic, and manager Mr. Sharma ensured our 40 guests were attended to with zero delays. Highly recommended for business banquets.',
        sentiment: 'positive',
        score: 0.92,
        topics: ['Service & Staff', 'Food Quality', 'Facilities', 'Cleanliness'],
        keywords: ['corporate dinner', 'banquet', 'fresh and hygienic'],
        priority: 'low',
        reply_status: 'replied',
        is_sensitive: false,
        days_ago: 3,
        reply: {
          text: 'Dear Rajesh, thank you for trusting Saffron with your corporate team gatherings. We are thrilled that Mr. Sharma and the banquet team delivered a flawless experience for your 40 guests. Looking forward to your next corporate event!',
          tone: 'Professional',
          generated_by_ai: true,
          options: []
        }
      },
      {
        author: 'Ananya Desai',
        rating: 4,
        text: 'Food and ambiance were top-notch as expected. However, getting into the parking area around 8:30 PM on Saturday took almost 15 minutes due to the SG highway bottleneck. Once inside, the staff was extremely courteous.',
        sentiment: 'positive',
        score: 0.74,
        topics: ['Food Quality', 'Ambiance', 'Parking & Valet', 'Waiting Time'],
        keywords: ['ambiance', 'parking', 'courteous staff'],
        priority: 'medium',
        reply_status: 'replied',
        is_sensitive: false,
        days_ago: 5,
        reply: {
          text: 'Hello Ananya, thank you for your kind words regarding our food and hospitality. We apologize for the Saturday evening parking queue caused by highway traffic. We have added two additional valet assistants to speed up drop-offs during peak weekend hours. See you again soon!',
          tone: 'Warm & Hospitable',
          generated_by_ai: true,
          options: []
        }
      },
      {
        author: 'Nikhil Trivedi',
        rating: 3,
        text: 'Good food, but waiting time for our table was 35 minutes despite having a confirmed 8:00 PM reservation. The starters were delicious, but the delay was frustrating with elderly parents with us.',
        sentiment: 'neutral',
        score: 0.45,
        topics: ['Waiting Time', 'Reservation', 'Food Quality'],
        keywords: ['table reservation', 'waiting time', 'starters delicious'],
        priority: 'high',
        reply_status: 'pending_approval',
        is_sensitive: false,
        days_ago: 2,
        reply: {
          text: 'Dear Nikhil, thank you for sharing your candid feedback. We sincerely apologize for the 35-minute wait your family experienced despite your reservation. While we are glad you enjoyed the starters, delays especially with elders are not up to our standard. Our guest relations manager would love to connect with you directly to make this right on your next visit.',
          tone: 'Empathetic & Polished',
          generated_by_ai: true,
          options: [
            'Empathetic (Recommended): "Dear Nikhil, thank you for sharing your candid feedback. We sincerely apologize for the 35-minute wait..."',
            'Concise: "Dear Nikhil, we apologize for the wait time during peak hours. We are streamlining our table turnaround times to prevent reservations from waiting..."'
          ]
        }
      },
      {
        author: 'Manish Parekh',
        rating: 2,
        text: 'Very crowded on Sunday night. Main course arrived 45 minutes after starters, and the biryani was barely warm when it reached our table. For the premium prices charged, this service speed is disappointing.',
        sentiment: 'negative',
        score: 0.22,
        topics: ['Waiting Time', 'Food Quality', 'Pricing & Value', 'Service & Staff'],
        keywords: ['main course delay', 'cold biryani', 'premium prices'],
        priority: 'critical',
        reply_status: 'pending_approval',
        is_sensitive: false,
        recurring_complaint: 'Peak weekend main course delay',
        days_ago: 1,
        reply: {
          text: 'Dear Manish, we are deeply concerned to read about your experience this Sunday. Serving lukewarm food after an unacceptable 45-minute delay falls far below our hospitality benchmarks. We have escalated this to our executive chef and floor supervisor. Please email manager@saffrondine.example.com or call 079-4890-5500 so we can personally invite you back and restore your confidence in Saffron.',
          tone: 'Empathetic & Corrective',
          generated_by_ai: true,
          options: [
            'Corrective Action Draft (Requires Manager Approval): "Dear Manish, we are deeply concerned to read about your experience this Sunday..."'
          ]
        }
      },
      {
        author: 'Dr. Sunita Rao',
        rating: 1,
        text: 'Extremely alarmed: We specifically notified our waiter that my nephew has a severe peanut allergy. A dish garnished with crushed peanuts was still served to our table! Thankfully we noticed before he ate it, but this kind of carelessness is hazardous.',
        sentiment: 'negative',
        score: 0.05,
        topics: ['Food Quality', 'Service & Staff', 'Safety & Compliance'],
        keywords: ['severe allergy', 'peanut allergy', 'carelessness'],
        priority: 'critical',
        reply_status: 'pending_approval',
        is_sensitive: true,
        recurring_complaint: 'Allergen cross-checking in kitchen',
        days_ago: 0,
        reply: {
          text: 'Dear Dr. Sunita, we take this matter with the utmost seriousness and urgency. The safety of our guests, especially regarding allergen requests, is our highest priority. We are grateful you caught this, and we have immediately launched a kitchen audit and retrained the banquet floor team on strict allergen isolation protocols. Our general manager will be contacting you directly today.',
          tone: 'Solemn, Urgent & Safety-Focused',
          generated_by_ai: true,
          options: [
            'High-Risk Safety Template: "Dear Dr. Sunita, we take this matter with the utmost seriousness and urgency. The safety of our guests..."'
          ]
        }
      }
    ];

    for (let i = 0; i < sampleReviews.length; i++) {
      const r = sampleReviews[i];
      const revRes = await client.query(`
        INSERT INTO reviews (
          business_id, google_location_id, gbp_review_id, author_name,
          rating, review_text, review_date, sentiment, sentiment_score,
          detected_topics, detected_keywords, priority, reply_status,
          is_sensitive, recurring_complaint
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${r.days_ago} days',
          $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id;
      `, [
        b1Id, gLocId, `gbp_rev_${Date.now()}_${i}`, r.author,
        r.rating, r.text, r.sentiment, r.score,
        JSON.stringify(r.topics), JSON.stringify(r.keywords),
        r.priority, r.reply_status, r.is_sensitive, r.recurring_complaint || null
      ]);

      const revId = revRes.rows[0].id;

      if (r.reply) {
        await client.query(`
          INSERT INTO review_responses (
            review_id, response_text, response_options, tone, generated_by_ai,
            published_at, safety_check_status, safety_check_details, audit_log
          ) VALUES (
            $1, $2, $3, $4, $5,
            ${r.reply_status === 'replied' || r.reply_status === 'auto_replied' ? 'NOW()' : 'NULL'},
            'pass',
            '{"fact_check": "passed", "tone_check": "passed", "repetition_check": "passed", "sensitive_data_check": "passed", "unsupported_claims_check": "passed"}'::jsonb,
            '[{"action": "ai_generated", "model": "gemini-1.5-pro", "timestamp": "2026-10-04T12:00:00Z"}]'::jsonb
          )
        `, [
          revId, r.reply.text, JSON.stringify(r.reply.options), r.reply.tone, r.reply.generated_by_ai
        ]);
      }
    }

    // 9. REVIEW CAMPAIGNS
    const qrDataUrl = await QRCode.toDataURL('https://saffrondine.example.com/feedback/post-dine-table-qr');
    await client.query(`
      INSERT INTO review_campaigns (
        business_id, name, channel, message_template, target_audience,
        review_link, qr_code_data, status, sent_count, delivered_count,
        clicked_count, feedback_started_count, destination_clicked_count, attributed_reviews_count
      ) VALUES (
        $1, 'Post-Dine Table QR Campaign', 'qr',
        'Thank you for dining at Saffron! We value your genuine feedback. Scan this code to share your honest thoughts with our team.',
        'In-restaurant table diners',
        'https://saffrondine.example.com/feedback/post-dine-table-qr',
        $2, 'active', 520, 520, 340, 290, 184, 142
      )
    `, [b1Id, qrDataUrl]);

    await client.query(`
      INSERT INTO review_campaigns (
        business_id, name, channel, message_template, target_audience,
        review_link, status, sent_count, delivered_count,
        clicked_count, feedback_started_count, destination_clicked_count, attributed_reviews_count
      ) VALUES (
        $1, 'VIP Banquet Follow-up SMS/Email', 'sms',
        'Dear guest, thank you for celebrating your banquet at Saffron. Your experience matters deeply to us. Please share your feedback: {link}',
        'Banquet event hosts',
        'https://saffrondine.example.com/feedback/banquet-vip',
        'active', 125, 122, 94, 82, 65, 48
      )
    `, [b1Id]);

    // 10. KEYWORD GROUPS & KEYWORDS
    const kg1 = (await client.query(`
      INSERT INTO keyword_groups (business_id, name, slug, color, description)
      VALUES ($1, 'Core & Brand Terms', 'core-brand', '#4f46e5', 'High-intent brand and flagship keywords')
      RETURNING id;
    `, [b1Id])).rows[0].id;

    const kg2 = (await client.query(`
      INSERT INTO keyword_groups (business_id, name, slug, color, description)
      VALUES ($1, 'Local & Near Me', 'local-near-me', '#059669', 'Geo-targeted hyper-local queries in Ahmedabad')
      RETURNING id;
    `, [b1Id])).rows[0].id;

    const kg3 = (await client.query(`
      INSERT INTO keyword_groups (business_id, name, slug, color, description)
      VALUES ($1, 'Banquet & Events', 'banquet-events', '#d97706', 'High-value corporate and family event bookings')
      RETURNING id;
    `, [b1Id])).rows[0].id;

    const keywordsSeed = [
      { group: kg1, kw: 'saffron fine dine ahmedabad', intent: 'brand', rel: 100, diff: 12, vol: 3600, rank: 1, prev: 1, best: 1, primary: true, opp: 95, reason: 'Defend #1 brand search dominance' },
      { group: kg1, kw: 'best fine dining restaurant ahmedabad', intent: 'commercial', rel: 98, diff: 48, vol: 4800, rank: 2, prev: 4, best: 2, primary: true, opp: 92, reason: 'Strong momentum, moving up 2 spots this week' },
      { group: kg2, kw: 'restaurants near sg highway bodakdev', intent: 'local', rel: 94, diff: 38, vol: 2900, rank: 3, prev: 3, best: 2, primary: true, opp: 88, reason: 'High intent footfall query for western Ahmedabad' },
      { group: kg2, kw: 'romantic candlelight dinner ahmedabad', intent: 'commercial', rel: 92, diff: 42, vol: 2400, rank: 4, prev: 6, best: 3, primary: false, opp: 86, reason: 'High weekend conversion potential' },
      { group: kg3, kw: 'luxury banquet hall bodakdev ahmedabad', intent: 'service', rel: 96, diff: 34, vol: 1800, rank: 2, prev: 3, best: 1, primary: true, opp: 90, reason: 'Drives high-ticket bookings (₹1.5L - ₹5L event size)' },
      { group: kg3, kw: 'corporate lunch buffet sg highway', intent: 'commercial', rel: 90, diff: 28, vol: 1400, rank: 5, prev: 8, best: 4, primary: false, opp: 84, reason: 'Weekday revenue booster' },
      { group: kg2, kw: 'best dal makhani in ahmedabad', intent: 'near_me', rel: 88, diff: 22, vol: 1900, rank: 1, prev: 2, best: 1, primary: false, opp: 94, reason: 'Review praised signature dish driver' },
      { group: kg1, kw: 'pure veg luxury restaurant bodakdev', intent: 'local', rel: 86, diff: 30, vol: 2100, rank: 3, prev: 5, best: 2, primary: false, opp: 82, reason: 'Matches high Jain/Veg demographic in Bodakdev' }
    ];

    for (const k of keywordsSeed) {
      const kwRes = await client.query(`
        INSERT INTO keywords (
          business_id, group_id, keyword, intent, relevance, difficulty,
          search_volume, current_rank, previous_rank, best_rank, is_primary,
          status, opportunity_score, opportunity_reason, last_tracked_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', $12, $13, NOW()
        ) RETURNING id;
      `, [
        b1Id, k.group, k.kw, k.intent, k.rel, k.diff,
        k.vol, k.rank, k.prev, k.best, k.primary, k.opp, k.reason
      ]);

      const kwId = kwRes.rows[0].id;

      // Seed 7-day snapshot history
      for (let day = 7; day >= 0; day--) {
        const jitter = Math.min(10, Math.max(1, k.rank + Math.floor((Math.random() - 0.5) * 2)));
        await client.query(`
          INSERT INTO keyword_rank_snapshots (keyword_id, rank, visibility_score, recorded_at)
          VALUES ($1, $2, $3, NOW() - INTERVAL '${day} days')
        `, [kwId, jitter, Math.max(20, 100 - (jitter * 8))]);
      }
    }

    // 11. GEO-GRID RANK TRACKING (5x5 Grid around Ahmedabad Bodakdev)
    const geoGridRes = await client.query(`
      INSERT INTO geo_grids (
        business_id, keyword, grid_size, radius_km, center_lat, center_lng,
        visibility_percentage, average_rank, scan_date
      ) VALUES (
        $1, 'best fine dining restaurant ahmedabad', 5, 5.0, 23.0373, 72.5120,
        78.4, 2.8, NOW()
      ) RETURNING id;
    `, [b1Id]);
    const geoGridId = geoGridRes.rows[0].id;

    // 5x5 Points
    const gridMatrix = [
      [3, 2, 2, 4, 6],
      [2, 1, 1, 2, 4],
      [1, 1, 1, 2, 3],
      [3, 2, 2, 3, 5],
      [5, 4, 3, 5, 7]
    ];

    const competitorsList = [
      { name: 'Mirch Masala Dine', rank: 2 },
      { name: 'Royal Treat Bistro', rank: 3 },
      { name: 'The Grand Bhagwati', rank: 4 }
    ];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const ptLat = 23.0373 + (r - 2) * 0.015;
        const ptLng = 72.5120 + (c - 2) * 0.015;
        const rankVal = gridMatrix[r][c];

        await client.query(`
          INSERT INTO geo_grid_points (geo_grid_id, row_idx, col_idx, lat, lng, rank, top_competitors, is_ranking)
          VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        `, [geoGridId, r, c, ptLat, ptLng, rankVal, JSON.stringify(competitorsList)]);
      }
    }

    // 12. COMPETITORS
    const competitorsSeed = [
      {
        name: 'Royal Treat Gourmet Dine',
        website: 'https://royaltreat.example.com',
        rating: 4.4,
        reviews: 1420,
        velocity: 18.5,
        categories: ['North Indian Restaurant', 'Fine Dining', 'Banquets'],
        visibility: 71.5,
        themes: [
          { theme: 'Food Quality', sentiment: 88 },
          { theme: 'Service Speed', sentiment: 62 },
          { theme: 'Parking', sentiment: 45 }
        ],
        keyword_overlap: ['fine dining ahmedabad', 'family dinner sg highway'],
        keyword_gaps: ['sufi night dining', 'private dining lounge']
      },
      {
        name: 'The Grand Bhagwati Gourmet',
        website: 'https://tgb.example.com',
        rating: 4.2,
        reviews: 2890,
        velocity: 24.0,
        categories: ['Banquet Hall', 'Vegetarian Restaurant', 'Luxury Dining'],
        visibility: 82.0,
        themes: [
          { theme: 'Banquet Space', sentiment: 92 },
          { theme: 'Pricing', sentiment: 54 },
          { theme: 'Wait Times', sentiment: 48 }
        ],
        keyword_overlap: ['banquet hall bodakdev', 'buffet lunch sg highway'],
        keyword_gaps: ['candlelight dinner bodakdev', 'dal makhani specialist']
      },
      {
        name: 'Under The Neem Tree',
        website: 'https://neemtree.example.com',
        rating: 4.5,
        reviews: 980,
        velocity: 14.0,
        categories: ['Open Air Restaurant', 'Continental', 'Fine Dining'],
        visibility: 64.0,
        themes: [
          { theme: 'Ambiance', sentiment: 96 },
          { theme: 'North Indian Options', sentiment: 50 },
          { theme: 'Acoustics', sentiment: 65 }
        ],
        keyword_overlap: ['romantic dinner ahmedabad'],
        keyword_gaps: ['traditional banquet halls', 'executive corporate lunch']
      }
    ];

    for (const comp of competitorsSeed) {
      await client.query(`
        INSERT INTO competitors (
          business_id, name, website, rating, review_count, review_velocity,
          categories, visibility_score, review_themes, keyword_overlap, keyword_gaps
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        b1Id, comp.name, comp.website, comp.rating, comp.reviews, comp.velocity,
        JSON.stringify(comp.categories), comp.visibility, JSON.stringify(comp.themes),
        JSON.stringify(comp.keyword_overlap), JSON.stringify(comp.keyword_gaps)
      ]);
    }

    // 13. LOCAL SEO AUDIT & CHECKS
    const auditRes = await client.query(`
      INSERT INTO seo_audits (
        business_id, overall_score, gbp_score, local_signals_score, content_score, review_score
      ) VALUES ($1, 86, 92, 78, 85, 89)
      RETURNING id;
    `, [b1Id]);
    const auditId = auditRes.rows[0].id;

    const seoChecksData = [
      {
        cat: 'gbp',
        name: 'Google Business Profile Completeness',
        status: 'passed',
        severity: 'low',
        evidence: 'Primary and 4 secondary categories configured, 100% verified, address and GPS pin synchronized.',
        why: 'Complete profiles have a 70% higher chance of ranking in the Google Local 3-Pack.',
        rec: 'Maintain weekly photo uploads to preserve high engagement signals.'
      },
      {
        cat: 'services',
        name: 'GBP Menu and Services Optimization',
        status: 'warning',
        severity: 'high',
        evidence: 'Signature dishes like Dal Saffron and Private Banquet rooms are mentioned in description but missing as explicit GBP Service Items with prices.',
        why: 'Explicit GBP services trigger high-intent search query matching when users search for specific dishes and banquet facilities.',
        rec: 'Add structured Service items: "Private Banquet Hall (50-300 pax)" and "Dal Saffron Gourmet Dining" with itemized descriptions.'
      },
      {
        cat: 'posts',
        name: 'Google Business Posts Freshness',
        status: 'warning',
        severity: 'medium',
        evidence: 'Last Google Post was published 16 days ago. Google favors profiles with active weekly posts.',
        why: 'Google Posts show directly in mobile SERPs and expire or lose visibility after 7-14 days.',
        rec: 'Publish an Offer/Update post promoting the upcoming Sufi Night & Weekend Chef Tasting Menu.'
      },
      {
        cat: 'reviews',
        name: 'Review Response Rate & Speed',
        status: 'passed',
        severity: 'low',
        evidence: 'Response rate is 94.2% with an average reply time of 2.4 hours (well above the 80% industry benchmark).',
        why: 'Quick, thoughtful review responses enhance customer trust and signal an active business to Google algorithms.',
        rec: 'Maintain automated workflows for 4-star and 5-star reviews while routing complaints to managers.'
      },
      {
        cat: 'nap',
        name: 'NAP (Name, Address, Phone) Consistency',
        status: 'passed',
        severity: 'low',
        evidence: 'Phone (+91 79 4890 5500) and Bodakdev address match across GBP, website, and local directories.',
        why: 'Consistent NAP signals prevent duplicate profile conflicts and establish local search authority.',
        rec: 'Run quarterly automated scans to safeguard directory consistency.'
      }
    ];

    for (const chk of seoChecksData) {
      await client.query(`
        INSERT INTO seo_checks (
          seo_audit_id, category, check_name, status, severity, evidence, why_it_matters, recommendation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [auditId, chk.cat, chk.name, chk.status, chk.severity, chk.evidence, chk.why, chk.rec]);
    }

    // 14. RECOMMENDATIONS & OPPORTUNITIES
    const recsSeed = [
      {
        source: 'seo_audit',
        title: 'Add Structured Services for Banquet & Dining Packages',
        desc: 'Add dedicated GBP services for "Private Dining Lounge" and "Corporate Banquet Buffets".',
        evidence: 'Competitors ranking #1 have 14 explicit services listed vs Saffron currently having 5.',
        why: 'Google uses services catalog text for semantic matching in conversational local search.',
        impact: '+12% increase in discovery searches for banquet events',
        conf: 94,
        prio: 'high',
        action: 'Open Services tab in GBP Optimization and click "Sync Structured Services".'
      },
      {
        source: 'reviews',
        title: 'Mitigate Saturday Evening Valet Congestion Mentions',
        desc: 'Customer reviews contain 3 recurring mentions of highway parking delays on weekend evenings.',
        evidence: 'Sentiment for parking drops to 62% on Saturdays vs 94% on weekdays.',
        why: 'Recurring negative keywords in reviews diminish conversion rates for first-time diners.',
        impact: 'Protect 4.8+ rating and boost weekend customer sentiment',
        conf: 91,
        prio: 'high',
        action: 'Deploy secondary valet kiosk at Gate 2 and add parking directions in reservation confirmations.'
      },
      {
        source: 'keywords',
        title: 'Capitalize on #1 Rank for "best dal makhani in ahmedabad"',
        desc: 'Ranked #1 with surging monthly search volume (+32% MoM).',
        evidence: 'Keyword has 1,900 monthly searches with zero competitor pay-per-click defense.',
        why: 'Iconic signature dish searches frequently convert into high-value dining parties.',
        impact: 'Drive 80-120 incremental table bookings per month',
        conf: 96,
        prio: 'medium',
        action: 'Feature "Award-Winning Dal Saffron" prominently on Google Post and Website Hero section.'
      }
    ];

    for (const r of recsSeed) {
      await client.query(`
        INSERT INTO recommendations (
          business_id, source, title, description, evidence, why_it_matters,
          expected_impact, confidence_score, priority, suggested_action, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending'
        )
      `, [b1Id, r.source, r.title, r.desc, r.evidence, r.why, r.impact, r.conf, r.prio, r.action]);
    }

    // 15. TASKS
    const tasksSeed = [
      {
        title: 'Investigate and resolve peanut allergy incident with Dr. Sunita',
        desc: 'Review #006 flagged critical allergy risk. General manager must contact guest, inspect kitchen preparation logs, and confirm protocol update.',
        source: 'reviews',
        prio: 'critical',
        status: 'in_progress',
        assignee: userMap['manager'],
        due: '2026-10-05'
      },
      {
        title: 'Publish Weekly Google Post: Sufi Night & Chef Tasting Specials',
        desc: 'Create and publish an event post with high-res food photography and direct booking CTA.',
        source: 'seo_audit',
        prio: 'medium',
        status: 'todo',
        assignee: userMap['staff'],
        due: '2026-10-06'
      },
      {
        title: 'Review and approve 2 pending AI replies for mixed 3-star and 2-star reviews',
        desc: 'Examine drafted responses in AI Approval Queue for Nikhil Trivedi and Manish Parekh.',
        source: 'reviews',
        prio: 'high',
        status: 'todo',
        assignee: userMap['manager'],
        due: '2026-10-05'
      },
      {
        title: 'Audit secondary categories on GBP for Banquet event coverage',
        desc: 'Ensure Banquet Hall and Family Restaurant categories are fully utilized in Google Profile.',
        source: 'seo_audit',
        prio: 'medium',
        status: 'completed',
        assignee: userMap['admin'],
        due: '2026-10-03'
      }
    ];

    for (const t of tasksSeed) {
      await client.query(`
        INSERT INTO tasks (
          workspace_id, business_id, title, description, source, priority, status,
          assigned_to_user_id, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [workspaceId, b1Id, t.title, t.desc, t.source, t.prio, t.status, t.assignee, t.due]);
    }

    // 16. NOTIFICATIONS & ALERTS
    const notifsSeed = [
      {
        type: '1_star_review',
        title: 'CRITICAL: 1-Star Review Received with Allergy Concern',
        msg: 'Dr. Sunita Rao posted a 1-star review mentioning a peanut allergy issue. Immediate escalation required.',
        prio: 'critical'
      },
      {
        type: 'unanswered_review',
        title: 'Approval Required: 2 AI Reply Drafts Waiting',
        msg: 'Replies for Manish Parekh (2-star) and Nikhil Trivedi (3-star) are awaiting human manager review.',
        prio: 'high'
      },
      {
        type: 'ranking_drop',
        title: 'Keyword Milestone: "best fine dining restaurant" Reached #2',
        msg: 'Target keyword moved up +2 positions to Rank #2 in Ahmedabad local search.',
        prio: 'medium'
      }
    ];

    for (const n of notifsSeed) {
      await client.query(`
        INSERT INTO notifications (
          workspace_id, business_id, user_id, event_type, title, message, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      `, [workspaceId, b1Id, userMap['owner'], n.type, n.title, n.msg, n.prio]);
    }

    // 17. SUBSCRIPTION & USAGE
    await client.query(`
      INSERT INTO subscriptions (
        workspace_id, plan, status, billing_cycle, locations_limit, reviews_limit,
        ai_generations_limit, keywords_limit, geo_grids_limit, current_locations,
        current_reviews, current_ai_generations, current_keywords
      ) VALUES (
        $1, 'agency', 'active', 'monthly', 25, 5000, 2000, 500, 200, 2, 428, 184, 46
      )
    `, [workspaceId]);

    // 18. AI PROMPT VERSIONS
    await client.query(`
      INSERT INTO ai_prompt_versions (module, version, system_prompt, user_prompt_template, safety_instructions)
      VALUES (
        'review_reply', 'v2.1-production',
        'You are the AI Reputation Specialist for {{business_name}} in the {{industry}} industry. Adopt the brand voice: {{brand_voice}}.',
        'Review by {{author_name}} (Rating: {{rating}}/5 Stars): "{{review_text}}". Facts: {{approved_facts}}. Rules: {{reply_rules}}.',
        '1. Never fabricate customer interactions. 2. If medical/legal/safety issues are cited, do not make promises without manager authorization. 3. Avoid keyword stuffing.'
      )
    `);

    // 19. AUDIT LOGS
    await client.query(`
      INSERT INTO audit_logs (workspace_id, user_id, action, entity_type, entity_id, details)
      VALUES 
        ($1, $2, 'GOOGLE_SYNC_COMPLETED', 'google_locations', $3, '{"synced_reviews": 6, "synced_metrics": true}'::jsonb),
        ($1, $2, 'AUTO_REPLY_PUBLISHED', 'reviews', 'rev_1', '{"rule": "auto_reply_5_star", "recipient": "Kavita Mehta"}'::jsonb),
        ($1, $2, 'GEO_GRID_SCAN_EXECUTED', 'geo_grids', $4, '{"points_scanned": 25, "visibility": 78.4}'::jsonb);
    `, [workspaceId, userMap['owner'], gLocId, geoGridId]);

    await client.query('COMMIT');
    console.log('[SEED] Comprehensive seed finished successfully! Database is primed for production demo.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] Error during seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
