import { pool } from '../src/config/db.js';

async function run() {
  const industries = [
    {
      id: 'school',
      name: 'Education & Schools',
      icon: 'GraduationCap',
      description: 'CBSE schools, higher secondary institutes, competitive exam coaching, and pre-schools.',
      default_topics: JSON.stringify(['Teaching Quality', 'Faculty & Staff', 'Sports Facilities', 'Campus Safety', 'Admission Process', 'Extracurriculars', 'Infrastructure', 'Fee Transparency']),
      default_tone: 'Academic, Encouraging & Dignified',
      compliance_rules: JSON.stringify(['FERPA/POCSO compliance: Never disclose student names, grades, or disciplinary actions in public replies', 'Do not make guaranteed university placement claims']),
      subcategories: [
        { id: 'cbse_school', name: 'CBSE / ICSE Senior School', services: ['K-12 Education', 'STEM Labs', 'Sports Academies', 'Transport Service'], keywords: ['best cbse school near me', 'top senior secondary school', 'admissions open cbse'] },
        { id: 'coaching_institute', name: 'Coaching & Test Prep Academy', services: ['JEE Prep', 'NEET Coaching', 'Foundation Classes', 'Mock Tests'], keywords: ['best coaching institute', 'neet coaching near me', 'jee preparation center'] },
        { id: 'preschool', name: 'Early Childhood & Pre-School', services: ['Playgroup', 'Montessori Nursery', 'Daycare Services', 'Activity Center'], keywords: ['best preschool near me', 'montessori play school', 'safe daycare center'] }
      ]
    },
    {
      id: 'legal',
      name: 'Legal & Law Practices',
      icon: 'Scale',
      description: 'Corporate law firms, civil litigation advocates, criminal defense, and intellectual property attorneys.',
      default_topics: JSON.stringify(['Legal Expertise', 'Case Communication', 'Transparent Billing', 'Court Representation', 'Prompt Response', 'Professionalism']),
      default_tone: 'Authoritative, Objective & Discreet',
      compliance_rules: JSON.stringify(['Bar Council compliance: Never disclose confidential client matters or case details in public replies', 'Strictly avoid guaranteeing specific legal outcomes or court judgments']),
      subcategories: [
        { id: 'corporate_law', name: 'Corporate & Commercial Law', services: ['Contract Drafting', 'M&A Advisory', 'Taxation Litigation', 'Company Incorporation'], keywords: ['corporate lawyer near me', 'business legal advisor', 'contract drafting advocate'] },
        { id: 'civil_property', name: 'Civil & Property Litigation', services: ['Property Dispute', 'RERA Litigation', 'Title Verification', 'Succession Certificate'], keywords: ['property advocate near me', 'rera lawyer', 'civil dispute attorney'] }
      ]
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing & Industrial B2B',
      icon: 'Factory',
      description: 'Precision engineering, sheet metal fabrication, industrial packaging, and plastic molding units.',
      default_topics: JSON.stringify(['Material Quality', 'On-time Delivery', 'Technical Precision', 'MOQ & Pricing', 'Packaging', 'B2B Support']),
      default_tone: 'Industrial, Accurate & Reliable',
      compliance_rules: JSON.stringify(['Do not disclose proprietary client blueprints or NDA-protected specs']),
      subcategories: [
        { id: 'precision_engineering', name: 'Precision Engineering & CNC', services: ['CNC Turning', 'VMC Milling', 'Custom Fabrication', 'Quality Testing'], keywords: ['cnc machining job work', 'precision components manufacturer', 'sheet metal fabrication near me'] },
        { id: 'industrial_packaging', name: 'Industrial Packaging Solutions', services: ['Corrugated Boxes', 'Heavy Duty Pallets', 'Custom Foam Inserts', 'Biodegradable Packing'], keywords: ['industrial packaging manufacturer', 'corrugated box suppliers', 'bulk packing material'] }
      ]
    },
    {
      id: 'salon_spa',
      name: 'Salon, Spa & Wellness',
      icon: 'Sparkles',
      description: 'Unisex luxury salons, bridal makeover studios, ayurvedic massage spas, and aesthetic skin clinics.',
      default_topics: JSON.stringify(['Stylist Skill', 'Hygiene & Cleanliness', 'Product Quality', 'Ambiance & Music', 'Staff Courtesy', 'Waiting Time', 'Pricing & Packages']),
      default_tone: 'Pampering, Warm & Aesthetic',
      compliance_rules: JSON.stringify(['Do not promise unrealistic clinical skin lightening or medical hair cure']),
      subcategories: [
        { id: 'luxury_salon', name: 'Luxury Unisex Hair & Beauty', services: ['Hair Styling & Color', 'Keratin & Botox', 'Hydra Facial', 'Beard Grooming'], keywords: ['best hair salon near me', 'luxury unisex salon', 'bridal makeup specialist'] },
        { id: 'wellness_spa', name: 'Ayurvedic & Wellness Spa', services: ['Deep Tissue Massage', 'Aromatherapy', 'Body Scrubs', 'Steam & Sauna'], keywords: ['best wellness spa near me', 'ayurvedic body massage', 'couple spa packages'] }
      ]
    },
    {
      id: 'automotive',
      name: 'Automotive Care & Dealership',
      icon: 'Car',
      description: 'Multi-brand car service stations, detailing & ceramic coating centers, and certified pre-owned dealerships.',
      default_topics: JSON.stringify(['Mechanical Expertise', 'Genuine Spares', 'Turnaround Time', 'Fair Pricing', 'Washing & Detailing', 'Billing Transparency']),
      default_tone: 'Trustworthy, Technical & Direct',
      compliance_rules: JSON.stringify(['Always verify vehicle job card before confirming warranties on spares']),
      subcategories: [
        { id: 'car_service', name: 'Multi-Brand Car Service & Repair', services: ['Periodic Maintenance', 'Brake & Clutch Repair', 'AC Servicing', 'Wheel Alignment'], keywords: ['car service center near me', 'best multi brand car workshop', 'car ac repair'] },
        { id: 'detailing_studio', name: 'Auto Detailing & Ceramic Studio', services: ['Ceramic Coating', 'PPF Paint Protection Film', 'Interior Dry Cleaning', 'Paint Restoration'], keywords: ['car ceramic coating near me', 'best ppf installer', 'car detailing studio'] }
      ]
    }
  ];

  for (const ind of industries) {
    await pool.query(
      `INSERT INTO industries (id, name, icon, description, default_topics, default_tone, compliance_rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE 
       SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description,
           default_topics = EXCLUDED.default_topics, default_tone = EXCLUDED.default_tone, compliance_rules = EXCLUDED.compliance_rules`,
      [ind.id, ind.name, ind.icon, ind.description, ind.default_topics, ind.default_tone, ind.compliance_rules]
    );

    for (const sub of ind.subcategories) {
      await pool.query(
        `INSERT INTO industry_subcategories (id, industry_id, name, suggested_services, suggested_keywords)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, suggested_services = EXCLUDED.suggested_services, suggested_keywords = EXCLUDED.suggested_keywords`,
        [sub.id, ind.id, sub.name, JSON.stringify(sub.services), JSON.stringify(sub.keywords)]
      );
    }
  }

  const count = await pool.query('SELECT count(*) FROM industries');
  console.log('Total industries in DB:', count.rows[0].count);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
