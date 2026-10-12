import { pool } from '../config/db.js';

const industriesData = [
  {
    id: 'restaurant',
    name: 'Restaurant & Dining',
    icon: 'Utensils',
    description: 'Fine dining, casual eateries, cafes, cloud kitchens, and banquet restaurants.',
    default_topics: ['Food Quality', 'Service & Staff', 'Ambiance', 'Cleanliness', 'Waiting Time', 'Pricing & Value', 'Reservation', 'Seating'],
    default_tone: 'Warm & Hospitable',
    compliance_rules: ['Do not guarantee allergen-free without kitchen verification', 'Never disclose private dining party names'],
    customer_intents: ['visit', 'booking', 'call', 'enquiry'],
    ai_policy: {
      tone: 'Warm & Hospitable',
      vocabulary: ['culinary excellence', 'crafted flavors', 'gracious hospitality', 'memorable dining'],
      reply_rules: {
        five_star: 'Express heartfelt thanks, mention chef dedication and invite back for seasonal specials.',
        one_two_star: 'Express immediate empathy, investigate service delay/food temperature, offer direct manager callback.'
      },
      prohibited_claims: ['Never claim 100% allergen-free without kitchen signoff', 'Do not disclose private booking identities']
    },
    seo_rules: {
      primary_patterns: ['best {cuisine} restaurant in {city}', '{cuisine} dining near me', 'private banquet hall {locality}'],
      ranking_factors: ['Review velocity', 'Food photo uploads', 'Menu structured data', 'Local pack proximity'],
      kpi_targets: { review_velocity_monthly: 25, top_3_share: 75 }
    },
    subcategories: [
      { id: 'fine_dining', name: 'Fine Dining & Luxury Banquets', services: ['Chef Tasting Menu', 'Candlelight Dinners', 'Private Dining Rooms', 'Sommelier Selection', 'Banquet Catering'], keywords: ['best fine dining restaurant', 'luxury romantic dinner', 'exclusive private dining banquet'] },
      { id: 'cafe_bakery', name: 'Artisan Cafe & Bakery', services: ['Specialty Coffee', 'Sourdough Bakery', 'Breakfast & Brunch', 'Co-working Seating'], keywords: ['best specialty coffee shop', 'artisan bakery and cafe', 'work friendly cafe near me'] },
      { id: 'casual_dining', name: 'Casual Family Dining', services: ['Family Buffet', 'Sunday Brunch', 'Kids Menu', 'Live Music Nights'], keywords: ['family friendly restaurant', 'weekend lunch buffet', 'casual dining near me'] }
    ]
  },
  {
    id: 'hotel',
    name: 'Hotels & Hospitality',
    icon: 'Hotel',
    description: 'Luxury resorts, boutique hotels, business accommodations, and heritage stays.',
    default_topics: ['Room Cleanliness', 'Bed Comfort', 'Check-in Experience', 'Amenities & Pool', 'Breakfast Quality', 'Location & Views', 'Staff Friendliness'],
    default_tone: 'Polite, Premium & Gracious',
    compliance_rules: ['Protect guest room numbers and travel dates', 'Comply with hospitality guest privacy standards'],
    customer_intents: ['booking', 'enquiry', 'call', 'visit'],
    ai_policy: {
      tone: 'Polite, Premium & Gracious',
      vocabulary: ['bespoke hospitality', 'tranquil retreat', 'cherished stay', 'guest comfort'],
      reply_rules: {
        five_star: 'Acknowledge memorable stay highlights, welcome guest back for future travels.',
        one_two_star: 'Deep regret for comfort disruptions, offer GM contact to review stay details.'
      },
      prohibited_claims: ['Never disclose guest room numbers, companion names, or checkout dates']
    },
    seo_rules: {
      primary_patterns: ['luxury resort in {city}', 'boutique hotel near {locality}', 'business stay {city}'],
      ranking_factors: ['Google Hotel Center sync', 'Guest photo count', 'Amenity attribute completeness'],
      kpi_targets: { review_velocity_monthly: 20, top_3_share: 70 }
    },
    subcategories: [
      { id: 'luxury_resort', name: 'Luxury Heritage & Palace Resort', services: ['Palace Suite Accommodations', 'Infinity Pool', 'Luxury Spa & Wellness', 'Destination Weddings'], keywords: ['5 star luxury palace resort', 'heritage boutique hotel', 'destination wedding venue'] },
      { id: 'boutique_hotel', name: 'Boutique Business Hotel', services: ['Executive Suites', 'Conference Hall', 'Airport Transfer', 'High-speed Fiber WiFi'], keywords: ['business hotel near airport', 'boutique corporate stay', 'executive suites near me'] }
    ]
  },
  {
    id: 'hospital',
    name: 'Hospital & Specialty Care',
    icon: 'Cross',
    description: 'Eye hospitals, multispecialty hospitals, surgical centers, and emergency trauma clinics.',
    default_topics: ['Doctor Competence', 'Nursing Care', 'Diagnosis Accuracy', 'Emergency Response', 'Hygiene & Cleanliness', 'Billing Clarity', 'Waiting Time'],
    default_tone: 'Empathetic, Clinical & Reassuring',
    compliance_rules: ['Strict Patient Confidentiality: Never confirm patient diagnosis or treatments in public replies', 'Do not make guaranteed clinical outcome claims'],
    customer_intents: ['appointment', 'enquiry', 'call', 'visit'],
    ai_policy: {
      tone: 'Empathetic, Clinical & Reassuring',
      vocabulary: ['compassionate patient care', 'clinical excellence', 'patient wellbeing', 'dedicated medical team'],
      reply_rules: {
        five_star: 'Reassure patient on their recovery journey, thank them for trusting our clinical team.',
        one_two_star: 'Provide medical administration helpline number, invite private review without discussing health details.'
      },
      prohibited_claims: ['Strict HIPAA/Medical Secrecy: Never confirm patient name, diagnosis, medication or outcome']
    },
    seo_rules: {
      primary_patterns: ['best eye hospital in {city}', '24x7 emergency multispecialty hospital {locality}', 'top cataract surgeon near me'],
      ranking_factors: ['24/7 emergency attribute', 'Doctor credentials', 'Medical department schemas'],
      kpi_targets: { review_velocity_monthly: 30, top_3_share: 80 }
    },
    subcategories: [
      { id: 'eye_hospital', name: 'Eye Hospital & Lasik Center', services: ['Bladeless Lasik Surgery', 'Micro-Incision Cataract', 'Retina Specialist Care', 'Glaucoma Management'], keywords: ['best eye hospital', 'lasik laser eye surgery cost', 'top cataract surgeon near me'] },
      { id: 'multispecialty_hospital', name: 'Multispecialty Super Hospital', services: ['24x7 Emergency Trauma Care', 'Advanced Cardiology ICU', 'Orthopedic Joint Replacement', 'Laparoscopic Surgery'], keywords: ['best multispecialty hospital', '24 hour emergency hospital near me', 'icu specialist hospital'] },
      { id: 'maternity_clinic', name: 'Maternity & Child Hospital', services: ['Normal Delivery Care', 'Level-3 NICU', 'Pediatric Vaccination', 'Painless Labor'], keywords: ['best maternity hospital near me', 'pediatric child specialist', 'gynecologist and delivery clinic'] }
    ]
  },
  {
    id: 'school',
    name: 'Schools & Education',
    icon: 'GraduationCap',
    description: 'CBSE schools, international schools, preschools, and competitive coaching academies.',
    default_topics: ['Teaching Quality', 'Faculty Dedication', 'Campus Infrastructure', 'Sports & Extra-curricular', 'Safety & Security', 'Fee Transparency', 'Admin Support'],
    default_tone: 'Inspiring, Academic & Respectful',
    compliance_rules: ['Never discuss individual student names, marks, or disciplinary actions publicly', 'Maintain student privacy safeguards'],
    customer_intents: ['admission', 'enquiry', 'visit', 'call'],
    ai_policy: {
      tone: 'Inspiring, Academic & Respectful',
      vocabulary: ['holistic student growth', 'academic excellence', 'nurturing potential', 'future-ready learning'],
      reply_rules: {
        five_star: 'Celebrate student milestones and parent partnership in educational excellence.',
        one_two_star: 'Direct parent to principal or counselor office for collaborative in-person resolution.'
      },
      prohibited_claims: ['Never disclose student identity, grades, behavior records, or confidential family information']
    },
    seo_rules: {
      primary_patterns: ['best cbse school in {city}', 'top international school near {locality}', 'admissions open school {city}'],
      ranking_factors: ['Admission cycle seasonality', 'Campus tour videos', 'Parent trust signals'],
      kpi_targets: { review_velocity_monthly: 15, top_3_share: 80 }
    },
    subcategories: [
      { id: 'cbse_school', name: 'CBSE Senior Secondary School', services: ['Pre-K to 12th Admissions', 'Robotics & STEM Labs', 'Olympic Sports Complex', 'Smart Interactive Classrooms'], keywords: ['best cbse school in ahmedabad', 'top rated school near me', 'school admissions open'] },
      { id: 'international_school', name: 'International / IB World School', services: ['IB Diploma Programme', 'Cambridge Curriculum', 'Foreign Language Programs', 'Global Exchange Tours'], keywords: ['best international school', 'ib world school admissions', 'cambridge curriculum school near me'] },
      { id: 'coaching_academy', name: 'Competitive Coaching Academy', services: ['JEE Main & Advanced Coaching', 'NEET Medical Preparation', 'Foundation Olympiad Batches', 'Doubt Solving Sessions'], keywords: ['best iit jee coaching institute', 'top neet coaching center near me', 'foundation competitive classes'] }
    ]
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Properties',
    icon: 'Building',
    description: 'Property dealers, residential sales, commercial leasing, and real estate developer advisory.',
    default_topics: ['Agent Professionalism', 'Market Knowledge', 'Transaction Transparency', 'Site Visits', 'Documentation Support', 'RERA Compliance'],
    default_tone: 'Authoritative, Polished & Advisory',
    compliance_rules: ['Adhere strictly to RERA guidelines', 'Do not guarantee investment return figures or capital gains'],
    customer_intents: ['enquiry', 'visit', 'call', 'booking'],
    ai_policy: {
      tone: 'Authoritative, Polished & Advisory',
      vocabulary: ['prime real estate', 'strategic investment', 'architectural prestige', 'seamless property transfer'],
      reply_rules: {
        five_star: 'Congratulate buyer on homeownership or leasing milestone, reaffirm long-term support.',
        one_two_star: 'Provide senior property legal advisor contact to clarify documentation or possession timelines.'
      },
      prohibited_claims: ['Strict RERA prohibition: Never promise guaranteed annual returns or speculative price doubling']
    },
    seo_rules: {
      primary_patterns: ['best property dealer in {locality}', 'luxury 3bhk flats in {city}', 'commercial office space for rent {locality}'],
      ranking_factors: ['Neighborhood geo-grids', 'RERA registered badge', 'Project virtual walkthroughs'],
      kpi_targets: { review_velocity_monthly: 15, top_3_share: 70 }
    },
    subcategories: [
      { id: 'property_dealer', name: 'Property Dealer & Real Estate Advisory', services: ['Residential Resale Advisory', 'Commercial Office Leasing', 'RERA Title Verification', 'Gated Villa Plots'], keywords: ['top property dealer near me', 'real estate broker in bodakdev', 'commercial property consultant'] },
      { id: 'luxury_villas', name: 'Luxury High-Rise & Villa Developers', services: ['4BHK Penthouse Residences', 'Ultra-Luxury Gated Villas', 'Clubhouse Amenities', 'Zero Brokerage Direct Booking'], keywords: ['luxury penthouses for sale', 'gated community villas near me', 'premium real estate developer'] }
    ]
  },
  {
    id: 'retail',
    name: 'Retail & Specialty Store',
    icon: 'ShoppingBag',
    description: 'Designer boutiques, ethnic wear, electronics, home decor, and specialty shopping outlets.',
    default_topics: ['Product Quality', 'Store Atmosphere', 'Staff Assistance', 'Return & Exchange', 'Pricing', 'Discounts', 'Fitting & Alteration'],
    default_tone: 'Enthusiastic & Helpful',
    compliance_rules: ['Follow consumer protection rules', 'Do not promise out-of-stock inventory without system confirmation'],
    customer_intents: ['visit', 'purchase', 'enquiry', 'call'],
    ai_policy: {
      tone: 'Enthusiastic, Fashion-Forward & Helpful',
      vocabulary: ['handcrafted elegance', 'curated collections', 'perfect fit', 'delightful shopping experience'],
      reply_rules: {
        five_star: 'Compliment their style selection, invite them to seasonal preview trunk shows.',
        one_two_star: 'Immediate resolution for alterations or billing, invite to store for exchange.'
      },
      prohibited_claims: ['Do not quote expired festive discounts or promise unverified custom delivery dates']
    },
    seo_rules: {
      primary_patterns: ['designer bridal boutique in {city}', 'ethnic wear store near {locality}', 'best luxury shopping {city}'],
      ranking_factors: ['Google Product catalog integration', 'In-store photos', 'Local inventory ads'],
      kpi_targets: { review_velocity_monthly: 20, top_3_share: 75 }
    },
    subcategories: [
      { id: 'designer_fashion', name: 'Designer Ethnic & Bridal Studio', services: ['Bespoke Bridal Lehengas', 'Custom Tailoring & Master Fitting', 'Groom Sherwani Couture', 'Personal Styling Consultations'], keywords: ['designer ethnic wear store', 'luxury bridal boutique near me', 'custom tailoring designer studio'] },
      { id: 'electronics_retail', name: 'Consumer Electronics & Appliances', services: ['Home Appliance Demo', 'Extended Warranty Protection', 'Same-Day Local Delivery', 'Installation Support'], keywords: ['electronics store near me', 'home appliances dealer', 'best laptop mobile showroom'] }
    ]
  },
  {
    id: 'legal',
    name: 'Legal & Law Practice',
    icon: 'Scale',
    description: 'Corporate law firms, civil litigation advocates, criminal defense, and RERA property legal advisors.',
    default_topics: ['Advocate Competence', 'Legal Strategy', 'Integrity & Ethics', 'Case Communication', 'Transparent Retainer', 'Court Representation'],
    default_tone: 'Formal, Objective & Legally Guarded',
    compliance_rules: ['Bar Council Regulation: Never solicit clients, guarantee court case verdicts, or claim to be "best lawyer"'],
    customer_intents: ['consultation', 'enquiry', 'call', 'appointment'],
    ai_policy: {
      tone: 'Formal, Objective & Legally Guarded',
      vocabulary: ['diligent representation', 'statutory compliance', 'confidential counsel', 'ethical advocacy'],
      reply_rules: {
        five_star: 'Express professional gratitude for placing trust in our legal counsel.',
        one_two_star: 'Reiterate dedication to judicial process and invite private discussion regarding client concerns.'
      },
      prohibited_claims: ['Bar Council strictly prohibits guaranteeing case outcome or claiming judicial influence']
    },
    seo_rules: {
      primary_patterns: ['corporate law firm in {city}', 'rera property dispute lawyer {locality}', 'top civil advocate near me'],
      ranking_factors: ['Practice area structured schema', 'Legal expertise publications', 'Local bar credentials'],
      kpi_targets: { review_velocity_monthly: 10, top_3_share: 65 }
    },
    subcategories: [
      { id: 'corporate_law', name: 'Corporate & Commercial Law Firm', services: ['Corporate M&A Legal Due Diligence', 'Contract Drafting & Review', 'Intellectual Property & Trademarks', 'Employment Law Advisory'], keywords: ['corporate law firm in ahmedabad', 'commercial contract advocate', 'trademark copyright legal counsel'] },
      { id: 'property_legal', name: 'Property & Real Estate Legal Advisor', services: ['Property Title Clearance Certificate', 'RERA Consumer Complaint Litigation', 'Succession & Will Registration', 'Land Acquisition Due Diligence'], keywords: ['property legal advocate near me', 'rera court lawyer', 'land title verification advocate'] },
      { id: 'criminal_defense', name: 'Litigation & Defense Practice', services: ['Bail Applications & Trials', 'High Court Appeals', 'White Collar Defense', 'Civil Dispute Litigation'], keywords: ['high court advocate near me', 'civil litigation lawyer', 'criminal defense legal counsel'] }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Multispecialty Clinics',
    icon: 'HeartPulse',
    description: 'Diagnostic pathology laboratories, physiotherapy centers, wellness clinics, and daycare therapies.',
    default_topics: ['Doctor Competence', 'Nursing Care', 'Diagnosis Accuracy', 'Lab Turnaround', 'Cleanliness', 'Billing Clarity'],
    default_tone: 'Empathetic & Clinical',
    compliance_rules: ['Medical secrecy: strictly avoid discussing medical records, prescriptions, or diagnosis in reviews'],
    customer_intents: ['appointment', 'enquiry', 'call', 'visit'],
    ai_policy: {
      tone: 'Empathetic & Clinical',
      vocabulary: ['compassionate healing', 'patient-centric care', 'state-of-the-art diagnostics', 'wellness journey'],
      reply_rules: {
        five_star: 'Share encouragement for sustained wellness and thank patient for trusting our care.',
        one_two_star: 'Provide clinic administrator direct phone for confidential clinical support.'
      },
      prohibited_claims: ['Never confirm patient clinical condition, lab reports, or prescribe remedies in review replies']
    },
    seo_rules: {
      primary_patterns: ['best diagnostic laboratory in {city}', 'physiotherapy spine clinic {locality}', 'home blood sample test near me'],
      ranking_factors: ['NABL accreditation', 'Health service attributes', 'Verified patient trust'],
      kpi_targets: { review_velocity_monthly: 25, top_3_share: 75 }
    },
    subcategories: [
      { id: 'physiotherapy_wellness', name: 'Advanced Physiotherapy & Spine Care', services: ['Spine & Disc Rehabilitation', 'Sports Injury Kinesiology', 'Dry Needling Therapy', 'Post-Surgery Mobility Training'], keywords: ['best physiotherapy clinic near me', 'spine pain specialist', 'sports injury physical therapist'] },
      { id: 'diagnostic_center', name: 'Pathology & Diagnostic Laboratory', services: ['Full Body Health Checkup', 'Home Blood Sample Collection', 'Digital X-Ray & Ultrasound', 'Genetic Pathology Screening'], keywords: ['diagnostic lab near me', 'home blood test collection ahmedabad', 'pathology laboratory full body checkup'] }
    ]
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial B2B',
    icon: 'Factory',
    description: 'Precision CNC machining, industrial equipment, packaging materials, and heavy engineering B2B plants.',
    default_topics: ['Product Tolerance & Quality', 'Delivery Reliability', 'Engineering Support', 'ISO Compliance', 'Competitive Pricing', 'Custom Fabrication'],
    default_tone: 'Technical, Professional & B2B Solutions-Focused',
    compliance_rules: ['Never disclose confidential OEM client names or proprietary technical drawings'],
    customer_intents: ['enquiry', 'call', 'visit', 'purchase'],
    ai_policy: {
      tone: 'Technical, Professional & B2B Solutions-Focused',
      vocabulary: ['micron-level precision', 'rigorous quality assurance', 'dependable supply chain', 'certified engineering'],
      reply_rules: {
        five_star: 'Reiterate commitment to zero-defect precision and strategic partnership.',
        one_two_star: 'Route inquiry immediately to Quality Assurance Director with rapid CAPA inspection.'
      },
      prohibited_claims: ['Never disclose client engineering tolerances, confidential patents, or proprietary material formulas']
    },
    seo_rules: {
      primary_patterns: ['precision cnc machining manufacturer in {city}', 'industrial equipment supplier {locality}', 'heavy fabrication plant near me'],
      ranking_factors: ['B2B product catalog', 'ISO certifications', 'Export capability signals'],
      kpi_targets: { review_velocity_monthly: 10, top_3_share: 70 }
    },
    subcategories: [
      { id: 'precision_engineering', name: 'Precision CNC Machining & Tooling', services: ['5-Axis CNC Milling', 'Custom Aerospace & Auto Tooling', 'High-Tolerance Machined Parts', 'CMM Quality Inspection Reports'], keywords: ['precision cnc machining manufacturer', 'custom tooling supplier b2b', '5 axis machining components'] },
      { id: 'industrial_equipment', name: 'Industrial Equipment & Automation', services: ['Automated Conveyor Systems', 'Hydraulic Press Fabrication', 'Custom Industrial SPM Machines', 'Turnkey Factory Automation'], keywords: ['industrial equipment manufacturer', 'factory automation machine supplier', 'heavy industrial machinery near me'] },
      { id: 'packaging_solutions', name: 'B2B Packaging & Material Solutions', services: ['Biodegradable Corrugated Cartons', 'Pharmaceutical Blister Foils', 'Custom Printed Bulk Packaging', 'Export Sea-Worthy Crates'], keywords: ['corrugated box manufacturer', 'bulk b2b packaging supplier near me', 'custom industrial packaging cartons'] }
    ]
  },
  {
    id: 'dental',
    name: 'Dental & Oral Care',
    icon: 'Stethoscope',
    description: 'Cosmetic dentistry, dental implant centers, orthodontics, and pediatric dental clinics.',
    default_topics: ['Treatment Quality', 'Pain Management', 'Dentist Expertise', 'Hygiene & Sterilization', 'Staff Courtesy', 'Waiting Time', 'Pricing & Insurance'],
    default_tone: 'Professional, Compassionate & Reassuring',
    compliance_rules: ['HIPAA compliance: Never disclose patient dental conditions or medical records in public replies', 'Do not make guaranteed outcome promises for clinical procedures'],
    customer_intents: ['appointment', 'enquiry', 'call', 'visit'],
    ai_policy: {
      tone: 'Professional, Compassionate & Reassuring',
      vocabulary: ['gentle care', 'radiant smiles', 'painless precision', 'clinical excellence'],
      reply_rules: {
        five_star: 'Celebrate their confident new smile and remind them of regular preventative hygiene.',
        one_two_star: 'Provide chief dentist direct consultation line to address sensitivity or treatment discomfort.'
      },
      prohibited_claims: ['Never claim 100% painless guarantee or disclose patient diagnosis in public replies']
    },
    seo_rules: {
      primary_patterns: ['best dental implant clinic in {city}', 'invisalign clear aligners specialist {locality}', 'painless dentist near me'],
      ranking_factors: ['Patient before/after reviews', 'Implant center certifications', 'Dental emergency attributes'],
      kpi_targets: { review_velocity_monthly: 20, top_3_share: 80 }
    },
    subcategories: [
      { id: 'cosmetic_implants', name: 'Cosmetic Dentistry & Implants', services: ['Single & Full Mouth Dental Implants', 'Porcelain Veneers & Smile Makeover', 'Laser Teeth Whitening', 'Zirconia Crowns'], keywords: ['best dental implant clinic', 'cosmetic dentist near me', 'teeth whitening specialist'] },
      { id: 'orthodontics', name: 'Orthodontics & Clear Aligners', services: ['Invisalign Certified Aligners', 'Ceramic Invisible Braces', 'Teeth Straightening & Retainers', 'Pediatric Early Orthodontics'], keywords: ['invisalign certified orthodontist', 'clear braces cost', 'orthodontic clinic near me'] }
    ]
  }
];

async function seedIndustries() {
  console.log('[SEED-INDUSTRIES] Seeding 10 complete industries with Niche Intelligence layers...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const ind of industriesData) {
      await client.query(`
        INSERT INTO industries (id, name, icon, description, default_topics, default_tone, compliance_rules, customer_intents, seo_rules, ai_policy)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            icon = EXCLUDED.icon,
            description = EXCLUDED.description,
            default_topics = EXCLUDED.default_topics,
            default_tone = EXCLUDED.default_tone,
            compliance_rules = EXCLUDED.compliance_rules,
            customer_intents = EXCLUDED.customer_intents,
            seo_rules = EXCLUDED.seo_rules,
            ai_policy = EXCLUDED.ai_policy;
      `, [
        ind.id,
        ind.name,
        ind.icon,
        ind.description,
        JSON.stringify(ind.default_topics),
        ind.default_tone,
        JSON.stringify(ind.compliance_rules),
        JSON.stringify(ind.customer_intents),
        JSON.stringify(ind.seo_rules),
        JSON.stringify(ind.ai_policy)
      ]);

      for (const sub of ind.subcategories) {
        await client.query(`
          INSERT INTO industry_subcategories (id, industry_id, name, suggested_services, suggested_keywords)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET industry_id = EXCLUDED.industry_id,
              name = EXCLUDED.name,
              suggested_services = EXCLUDED.suggested_services,
              suggested_keywords = EXCLUDED.suggested_keywords;
        `, [
          sub.id,
          ind.id,
          sub.name,
          JSON.stringify(sub.services),
          JSON.stringify(sub.keywords)
        ]);
      }
    }

    await client.query('COMMIT');
    console.log('[SEED-INDUSTRIES] Successfully seeded all 10 industries & subcategories!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED-INDUSTRIES] Error seeding industries:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedIndustries().catch(console.error);
