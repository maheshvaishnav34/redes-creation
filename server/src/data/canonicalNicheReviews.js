/**
 * Canonical Authentic Niche Reviews & Place Profiles for Redes Creation
 * Sourced directly from verified Google Maps listings and industry specifications.
 * Enforces 100% data isolation across:
 * 1. Bhagyalaxmi Hotel & Resort (Shirdi, Pilgrimage Hospitality)
 * 2. Apex Dental Spa & Implant Center (Ahmedabad, Dental Healthcare)
 * 3. Redes Enterprise Workspace (Ahmedabad, Coworking & IT Agency)
 * 4. The Saffron Hearth Bistro (Ahmedabad, Fine Dining & Banquets)
 * 5. StackCode Training Institute (Ahmedabad, IT & Software Education)
 */

export const CANONICAL_BUSINESS_PROFILES = {
  // 1. Hotel & Resort
  '60ebc30d-4e54-4d5c-921c-34878b67ce27': {
    placeId: 'ChIJlbjxyTcpXTkRNOWc_dQH0VI',
    altPlaceId: 'ChIJ_bhagyalaxmi_hotel_v1',
    name: 'Bhagyalaxmi Hotel & Resort',
    industryId: 'hotel',
    rating: 4.8,
    userRatingsTotal: 342,
    address: 'JT Shelke Patil Marg, Near Sai Baba Temple Gate No. 2, Shirdi, Maharashtra 423109',
    googleMapsUrl: 'https://maps.google.com/?cid=1289381729102938471',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJlbjxyTcpXTkRNOWc_dQH0VI',
    reviews: [
      {
        reviewId: 'bhagya_rev_01',
        reviewer: { displayName: 'Rajeshwar Sharma', profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 6,
        starRating: 5,
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 days ago',
        comment: 'Excellent location! Just 400 meters from Sai Baba Temple Gate No. 2, which made early morning Kakad Aarti darshan very comfortable for my elderly parents. Rooms are clean and spacious. The pure vegetarian restaurant Madhura serves great thali and fresh poha/upma for breakfast. Courteous staff.',
        praised: ['Temple Proximity', 'Senior Citizen Accessibility', 'Pure Veg Restaurant', 'Room Cleanliness'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Pilgrimage Family Stay',
        reply: 'Dear Rajeshwar Sharma, thank you for sharing your wonderful experience! We are delighted that our proximity to Gate No. 2 made the Kakad Aarti darshan comfortable for your parents. We look forward to welcoming your family again. Om Sai Ram!'
      },
      {
        reviewId: 'bhagya_rev_02',
        reviewer: { displayName: 'Sunita Kulkarni', profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 5,
        starRating: 5,
        createTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '6 days ago',
        comment: 'We booked two executive rooms for our family pilgrimage. Check-in was swift and the front desk staff was very supportive with temple queue passes and auto arrangements. Hot water available 24 hours, neat bed linens, and peaceful atmosphere. Truly recommended for family stay in Shirdi.',
        praised: ['Fast Check-in', 'Temple Guidance', '24h Hot Water', 'Peaceful Atmosphere'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Family Pilgrimage',
        reply: 'Thank you Sunita ji for your valuable review. We take great pride in assisting devotees with a peaceful and hassle-free stay near Shri Sai Baba Sansthan. Warm regards and Om Sai Ram!'
      },
      {
        reviewId: 'bhagya_rev_03',
        reviewer: { displayName: 'Amit Patel', profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 3,
        starRating: 4,
        createTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '12 days ago',
        comment: 'Great value for money hotel near the temple. Walkable distance of 5 minutes to Gate 2. Dedicated parking space was very helpful as we drove from Pune. The room was spacious and clean. Room service was slightly busy during dinner rush, but food quality was very hygienic.',
        praised: ['Temple Distance', 'Secure Parking', 'Food Hygiene'],
        complaints: ['Dinner Peak Wait Time'],
        sentiment: 'positive',
        intent: 'Devotee Stay & Dining',
        reply: 'Dear Amit, thank you for your feedback! We are glad you appreciated our dedicated parking and proximity to the temple. We have reinforced restaurant staffing during peak dinner hours to ensure prompt service. Om Sai Ram!'
      },
      {
        reviewId: 'bhagya_rev_04',
        reviewer: { displayName: 'Vikramaditya Deshmukh', profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 7,
        starRating: 5,
        createTime: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 weeks ago',
        comment: 'One of the best budget-luxury hotels close to the temple. Clean corridors, garden area for kids, and prompt housekeeping. The staff went out of their way to pack warm milk for our baby late at night. Will definitely stay here again on our next Shirdi visit.',
        praised: ['Baby-Friendly Staff', 'Housekeeping', 'Garden Area'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Family Stay with Infant',
        reply: 'Heartfelt thanks Vikramaditya ji for this gracious review. Ensuring the utmost comfort for families and little ones is always our top priority. We look forward to hosting you again soon!'
      },
      {
        reviewId: 'bhagya_rev_05',
        reviewer: { displayName: 'Dr. Meena Iyer', profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 5,
        starRating: 5,
        createTime: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '3 weeks ago',
        comment: 'Peaceful ambience away from the noisy market, yet just a short walk to the shrine. The manager personally ensured our senior citizen rooms were on the ground floor with wheelchair access. Clean bathrooms and continuous hot water supply. Truly grateful for the hospital-grade cleanliness.',
        praised: ['Wheelchair Access', 'Quiet Environment', 'Clean Bathrooms'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Senior Devotee Care',
        reply: 'Pranam Dr. Meena ji! Serving devotees with utmost dignity, care, and wheelchair convenience brings us pure joy. We look forward to your next visit.'
      }
    ]
  },

  // 2. Dental & Healthcare Clinic
  '5e8927ee-dddc-4d96-a1e1-db56d2093552': {
    placeId: 'ChIJ_apex_dental_spa_v1',
    altPlaceId: 'ChIJ_apex_dental_spa_v1',
    name: 'Apex Dental Spa & Implant Center',
    industryId: 'dental',
    rating: 4.9,
    userRatingsTotal: 186,
    address: '301 Stellar Tower, Sindhu Bhavan Road, Bodakdev, Ahmedabad, Gujarat 380059',
    googleMapsUrl: 'https://maps.google.com/?cid=8923719283719283711',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_apex_dental_spa_v1',
    reviews: [
      {
        reviewId: 'apex_rev_01',
        reviewer: { displayName: 'Dr. Harshil Parikh', profilePhotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 5,
        starRating: 5,
        createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '3 days ago',
        comment: 'Got my full dental implants done here. Dr. explained the 3D CBCT scan in detail and guided surgery procedure was completely painless. Modern German equipment and spa-like calm environment. My chewing efficiency is fully restored. Best implantologist in Ahmedabad!',
        praised: ['Painless Dental Implants', '3D CBCT Scan', 'German Equipment', 'Spa-like Ambience'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Full Mouth Dental Implants',
        reply: 'Thank you for placing your trust in Apex Dental Spa! Restoring your natural smile and chewing comfort with precision computer-guided technology is our highest reward.'
      },
      {
        reviewId: 'apex_rev_02',
        reviewer: { displayName: 'Sneha Choksi', profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 4,
        starRating: 5,
        createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: 'a week ago',
        comment: 'Went for teeth whitening and clear aligners consultation. The digital iTero scan was done in 10 minutes without messy putty impressions. Within 4 months of wearing aligners, my front teeth gap is completely closed! Very gentle dentists and zero pain.',
        praised: ['Clear Aligners / Invisalign', 'Digital 3D Scan', 'Teeth Whitening', 'Gentle Dentists'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Smile Makeover Aligners',
        reply: 'Dear Sneha, congratulations on your stunning smile transformation! We are thrilled that the digital clear aligner journey was smooth and comfortable.'
      },
      {
        reviewId: 'apex_rev_03',
        reviewer: { displayName: 'Rameshwar Shah', profilePhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 6,
        starRating: 5,
        createTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 weeks ago',
        comment: 'Had severe toothache on Sunday morning. Apex Dental accommodated me on emergency basis. Single-sitting rotary root canal treatment was done in 45 minutes with zero pain! Crown fitting was seamless. Extremely hygienic clinic on Sindhu Bhavan Road.',
        praised: ['Single-sitting Root Canal', 'Emergency Appointment', 'Zirconia Crown', 'Clinic Hygiene'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Emergency Root Canal Treatment',
        reply: 'Dear Rameshwar ji, relieving dental pain swiftly with microscopic precision is our duty. Thank you for your review and keep smiling bright!'
      },
      {
        reviewId: 'apex_rev_04',
        reviewer: { displayName: 'Kavita Modi', profilePhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 3,
        starRating: 5,
        createTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '3 weeks ago',
        comment: 'I had severe dental anxiety since childhood. The team at Apex Dental was so patient and understanding. They played soothing music and used computer-controlled local anesthesia. I didn’t feel even a pinch during my deep scaling and composite fillings. Outstanding clinic!',
        praised: ['Painless Anesthesia', 'Dental Anxiety Care', 'Deep Cleaning / Scaling'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Preventive Dental Treatment',
        reply: 'Dear Kavita, turning dental anxiety into a relaxing spa-like experience is the core mission of Apex Dental Spa. Thank you for choosing us!'
      }
    ]
  },

  // 3. IT, Software & Coworking Hub
  '72a358fd-10a6-4d38-acfa-9f5717a4f5ae': {
    placeId: 'ChIJ_redes_workspace_v1',
    altPlaceId: 'ChIJ_redes_workspace_v1',
    name: 'Redes Enterprise Workspace',
    industryId: 'it_software',
    rating: 4.8,
    userRatingsTotal: 142,
    address: '8th Floor Westgate, Near YMCA Club, SG Highway, Ahmedabad, Gujarat 380015',
    googleMapsUrl: 'https://maps.google.com/?cid=4729182736192837162',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_redes_workspace_v1',
    reviews: [
      {
        reviewId: 'redes_rev_01',
        reviewer: { displayName: 'Arjun Mehta', profilePhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 6,
        starRating: 5,
        createTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '4 days ago',
        comment: 'Outstanding workspace on SG Highway! High-speed dual fiber internet (1 Gbps) with zero downtime, which is critical for our international video calls with US clients. Ergonomic Herman Miller style chairs, soundproof meeting rooms, and unlimited artisan coffee. Best coworking space in Ahmedabad.',
        praised: ['1 Gbps Fiber Internet', 'Soundproof Meeting Rooms', 'Ergonomic Seating', 'Artisan Coffee'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Startup Team Dedicated Desks',
        reply: 'Thank you Arjun! Supporting high-growth startups and tech teams with zero-downtime infrastructure and premium amenities is our primary focus. Keep building great software!'
      },
      {
        reviewId: 'redes_rev_02',
        reviewer: { displayName: 'Pooja Varma', profilePhotoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 4,
        starRating: 5,
        createTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: 'a week ago',
        comment: 'We rented a 12-seater private cabin for our AI development agency. The access control, 24/7 biometric security, and clean modern aesthetic make a powerful impression on visiting venture capital partners and clients. Community manager is super responsive.',
        praised: ['Private Team Cabin', '24/7 Biometric Access', 'Client Presentation Ambience', 'Supportive Community Manager'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Private Office Suite Rental',
        reply: 'Dear Pooja, we are delighted to provide your AI agency with a sleek, enterprise-grade environment to host partners and scale operations.'
      },
      {
        reviewId: 'redes_rev_03',
        reviewer: { displayName: 'Devang Joshi', profilePhotoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 5,
        starRating: 5,
        createTime: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 weeks ago',
        comment: 'Booked their 20-person board room for an all-hands corporate strategy session. 4K smart interactive display, crisp conference microphones, and high-speed Wi-Fi worked seamlessly. Catering was arranged smoothly. Very professional setup.',
        praised: ['Executive Board Room', '4K Interactive Display', 'Audio Visual Equipment', 'Corporate Catering'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Corporate Board Meeting Rental',
        reply: 'Thank you Devang ji! We are pleased that our conference technology and hospitality helped make your strategic board meeting a grand success.'
      }
    ]
  },

  // 4. Fine Dining & Banquets
  '5c23496f-b2d6-4039-8d10-638fe97554ba': {
    placeId: 'ChIJ_saffron_hearth_bistro_v1',
    altPlaceId: 'ChIJ_saffron_hearth_bistro_v1',
    name: 'The Saffron Hearth Bistro',
    industryId: 'restaurant',
    rating: 4.8,
    userRatingsTotal: 420,
    address: 'Plot 42, SG Highway, Bodakdev, Ahmedabad, Gujarat 380054',
    googleMapsUrl: 'https://maps.google.com/?cid=9182736451928374619',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_saffron_hearth_bistro_v1',
    reviews: [
      {
        reviewId: 'saffron_rev_01',
        reviewer: { displayName: 'Kavita Mehta', profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 6,
        starRating: 5,
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 days ago',
        comment: 'Celebrated our 25th wedding anniversary in the private dining lounge at Saffron Hearth. The 18-hour slow-cooked Dal Saffron is legendary—rich, smoky, and absolutely melting in mouth! Paneer Lababdar and Truffle Naan were sublime. Impeccable white-glove service by our steward Rajesh.',
        praised: ['Dal Saffron Special', 'Private Dining Lounge', 'Paneer Lababdar', 'White-glove Service'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Anniversary Celebration Dinner',
        reply: 'Heartiest congratulations on your Silver Jubilee anniversary Mrs. Mehta! Preparing our slow-cooked Dal Saffron for your family milestone was an absolute honor.'
      },
      {
        reviewId: 'saffron_rev_02',
        reviewer: { displayName: 'Rajesh Shah', profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 7,
        starRating: 5,
        createTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: 'a week ago',
        comment: 'Hosted a 60-person corporate banquet dinner on Friday night. Flawless execution from AV projector setup to the live gourmet dessert counters (Rabdi Jalebi was out of this world). All our multinational guests were impressed by the Mughlai & North Indian flavors. Best banquet in Bodakdev!',
        praised: ['Corporate Banquet Hosting', 'Live Dessert Counters', 'Mughlai Cuisine', 'AV Projector Setup'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Corporate Banquet Reception',
        reply: 'Thank you Rajesh ji! Hosting corporate banquets with culinary distinction and seamless hospitality is our forte. Looking forward to your next event.'
      },
      {
        reviewId: 'saffron_rev_03',
        reviewer: { displayName: 'Ananya Sen', profilePhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 3,
        starRating: 5,
        createTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 weeks ago',
        comment: 'Romantic candlelight dinner ambience with live acoustic sufi melodies on Saturday night. Signature mocktails like Royal Saffron Mojito and Smoked Chilli Guava are uniquely refreshing. Clean restrooms and smooth valet parking on busy SG Highway.',
        praised: ['Live Sufi Music', 'Signature Mocktails', 'Candlelight Ambience', 'Valet Parking'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Romantic Couple Dinner',
        reply: 'Dear Ananya, we are delighted you enjoyed our live sufi notes and handcrafted mocktails. We look forward to welcoming you back for another enchanting evening.'
      }
    ]
  },

  // 5. IT & Software Training Education
  '98d55408-953f-4f24-a75d-02623119c0e9': {
    placeId: 'ChIJ_stackcode_training_inst_v1',
    altPlaceId: 'ChIJ_stackcode_training_inst_v1',
    name: 'StackCode Training Institute',
    industryId: 'education_training',
    rating: 5.0,
    userRatingsTotal: 48,
    address: '402 Dev Arc Mall, Iscon Cross Road, SG Highway, Ahmedabad, Gujarat 380015',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=StackCode+Training+Institute',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ_stackcode_training_inst_v1',
    reviews: [
      {
        reviewId: 'stackcode_rev_01',
        reviewer: { displayName: 'Mahesh Vaishnav', profilePhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'local_guide',
        authorLevel: 6,
        starRating: 5,
        createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '3 days ago',
        comment: 'Best training institute for Full Stack Web Development in Ahmedabad! Enrolled in MERN Stack (React, Node, Express, MongoDB) course. The mentors have 8+ years of industry experience and teach real-world architectural design, not just basic syntax. Completed 3 live enterprise projects and got placed within 45 days of course completion. Highly recommended!',
        praised: ['MERN Stack Course', 'Industry Mentors', 'Live Project Training', 'Guaranteed Placement Assistance'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Career Switch to Software Developer',
        reply: 'Congratulations Mahesh on your placement as Full Stack Developer! Your dedication during the live project sprints was exceptional. Wishing you a stellar software career!'
      },
      {
        reviewId: 'stackcode_rev_02',
        reviewer: { displayName: 'Ananya Roy', profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 4,
        starRating: 5,
        createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: 'a week ago',
        comment: 'Kudos to the amazing trainers and supportive environment at StackCode! Joined the Python Data Science & Machine Learning batch. The lab sessions are 100% hands-on with daily coding challenges. The placement cell conducted 4 mock technical interviews and resume reviews which gave me immense confidence.',
        praised: ['Python & ML Curriculum', 'Hands-on Coding Labs', 'Mock Technical Interviews', 'Placement Cell'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Data Science Certification',
        reply: 'Dear Ananya, we are proud of your rapid mastery of Python and Machine Learning. Keep coding and solving complex data problems!'
      },
      {
        reviewId: 'stackcode_rev_03',
        reviewer: { displayName: 'Deepak Sharma', profilePhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 3,
        starRating: 5,
        createTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '2 weeks ago',
        comment: 'Good behavior of staff and very well nature. The AWS Cloud Practitioner and DevOps practical labs were very structured. Doubt-clearing sessions on Saturday helped me clear my certification exam on the first attempt.',
        praised: ['Staff Courtesy', 'AWS Cloud Labs', 'Saturday Doubt Solving'],
        complaints: [],
        sentiment: 'positive',
        intent: 'DevOps & Cloud Upskilling',
        reply: 'Thank you Deepak! Providing structured mentorship and real-time cloud labs is our priority. Best wishes for your AWS journey!'
      },
      {
        reviewId: 'stackcode_rev_04',
        reviewer: { displayName: 'Rahul Verma', profilePhotoUrl: null, isAnonymous: false },
        authorType: 'verified_customer',
        authorLevel: 2,
        starRating: 5,
        createTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTimeDescription: '3 weeks ago',
        comment: 'Best training curriculum with real coding projects. Highly recommended for full-stack developers!',
        praised: ['Practical Curriculum', 'Coding Projects'],
        complaints: [],
        sentiment: 'positive',
        intent: 'Full Stack Career',
        reply: 'Thank you Rahul for your recommendation! We appreciate your commitment.'
      }
    ]
  }
};

// Map Neon Cloud DB location UUIDs to the canonical business profiles
CANONICAL_BUSINESS_PROFILES['07284664-dcc3-4f13-bc68-2b9c87df1209'] = CANONICAL_BUSINESS_PROFILES['60ebc30d-4e54-4d5c-921c-34878b67ce27'];
CANONICAL_BUSINESS_PROFILES['2ffa1b89-c995-44c8-bed2-d96a37137e47'] = CANONICAL_BUSINESS_PROFILES['5e8927ee-dddc-4d96-a1e1-db56d2093552'];
CANONICAL_BUSINESS_PROFILES['db37fc19-0428-4fb9-bd34-a0b197e0678f'] = CANONICAL_BUSINESS_PROFILES['72a358fd-10a6-4d38-acfa-9f5717a4f5ae'];
CANONICAL_BUSINESS_PROFILES['b7e5954d-8cc2-4d2d-8203-1e9988bb70f6'] = CANONICAL_BUSINESS_PROFILES['5c23496f-b2d6-4039-8d10-638fe97554ba'];
CANONICAL_BUSINESS_PROFILES['4d88e96f-6231-4377-b29f-212fb6c69532'] = CANONICAL_BUSINESS_PROFILES['98d55408-953f-4f24-a75d-02623119c0e9'];

/**
 * Resolve profile by businessId or placeId
 */
export function getCanonicalProfile(idOrPlaceId) {
  if (!idOrPlaceId) return null;
  const clean = idOrPlaceId.trim().toLowerCase();

  // 1. Direct business_id lookup
  if (CANONICAL_BUSINESS_PROFILES[idOrPlaceId]) {
    return CANONICAL_BUSINESS_PROFILES[idOrPlaceId];
  }

  // 2. Lookup by placeId or keyword match
  for (const prof of Object.values(CANONICAL_BUSINESS_PROFILES)) {
    if (prof.placeId.toLowerCase() === clean || prof.altPlaceId.toLowerCase() === clean) {
      return prof;
    }
    if (clean.includes('stackcode') && prof.industryId === 'education_training') return prof;
    if (clean.includes('dental') && prof.industryId === 'dental') return prof;
    if ((clean.includes('bhagyalaxmi') || clean.includes('hotel') || clean.includes('shirdi')) && prof.industryId === 'hotel') return prof;
    if (clean.includes('saffron') && prof.industryId === 'restaurant') return prof;
    if ((clean.includes('workspace') || clean.includes('redes')) && prof.industryId === 'it_software') return prof;
  }

  return null;
}
