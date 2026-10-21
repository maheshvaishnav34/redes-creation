import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe2,
  Utensils,
  Hotel,
  Stethoscope,
  HeartPulse,
  GraduationCap,
  Building,
  ShoppingBag,
  Scale,
  Briefcase,
  Factory,
  Tag,
  Search
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEFAULT_INDUSTRIES = [
  {
    id: 'restaurant',
    name: 'Restaurant & Dining',
    subcategories: ['Fine Dining', 'Artisan Cafe & Bakery', 'Casual Family Dining', 'Bistro', 'Cloud Kitchen'],
    services: 'Chef Tasting Menu, Candlelight Dinners, Private Dining Rooms, Banquet Catering'
  },
  {
    id: 'hotel',
    name: 'Hotels & Hospitality',
    subcategories: ['Luxury Resort', 'Boutique Hotel', 'Business Suites', 'Heritage Stay'],
    services: 'Luxury Suites, Infinity Pool & Spa, Conference Banquets, Room Accommodations'
  },
  {
    id: 'dental',
    name: 'Dental Care & Clinic',
    subcategories: ['Dental Spa & Aesthetics', 'Orthodontic Clinic', 'Implantology Center', 'Pediatric Dental'],
    services: 'Teeth Whitening, Dental Implants, Root Canal Treatment, Smile Designing, Painless Dentistry'
  },
  {
    id: 'hospital',
    name: 'Hospitals & Medical Care',
    subcategories: ['Multi-speciality Hospital', 'Eye Hospital & Lasik', 'Orthopedic Care', 'Diagnostic Pathology'],
    services: 'Consultation Outpatient, Advanced Surgery, Diagnostic Imaging, Emergency 24x7'
  },
  {
    id: 'school',
    name: 'Schools & Education',
    subcategories: ['CBSE K-12 School', 'IT & Coding Academy', 'Competitive Exam Coaching', 'Preschool'],
    services: 'Board Exam Coaching, STEM Education, Full Stack Training, Career Counseling'
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Properties',
    subcategories: ['Luxury Residential', 'Commercial Leasing', 'Property Consulting', 'Plots & Townships'],
    services: '3BHK & 4BHK Luxury Apartments, Commercial Office Spaces, Site Visits, Legal Title Due Diligence'
  },
  {
    id: 'retail',
    name: 'Retail & Showrooms',
    subcategories: ['Fashion & Boutique', 'Jewelry Showroom', 'Electronics & Appliances', 'Supermarket'],
    services: 'In-store Shopping, Custom Fitting, Warranty Support, Home Delivery'
  },
  {
    id: 'legal',
    name: 'Legal & Law Firms',
    subcategories: ['Corporate & M&A Law', 'Property & Civil Litigation', 'Criminal Defense', 'IP & Trademark'],
    services: 'Corporate Advisory, Contract Drafting, Court Representation, Trademark Registration'
  },
  {
    id: 'services',
    name: 'Digital & Professional Services',
    subcategories: ['Digital Marketing & SEO', 'IT Consulting & Cloud', 'Chartered Accounting', 'Creative Studio'],
    services: 'Local SEO & GBP Growth, Custom Web Development, Tax Filing & Audit, Brand Strategy'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    subcategories: ['Packaging Materials', 'Textile & Garments', 'Engineering Components', 'Chemical Processing'],
    services: 'Bulk Order Manufacturing, Custom Fabrication, Quality Testing & QC, Export Logistics'
  }
];

export const OnboardingPage = () => {
  const { user, refreshUserData, switchBusiness } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [industries, setIndustries] = useState(DEFAULT_INDUSTRIES);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    industryId: 'restaurant',
    subcategoryId: 'Fine Dining',
    businessModel: 'storefront',
    address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380054',
    phone: '+91 98765 43210',
    website: '',
    googleReviewUrl: '',
    services: 'Chef Tasting Menu, Candlelight Dinners, Private Dining Rooms, Banquet Catering',
    serviceRadius: 15,
    targetKeywords: [],
    competitorNames: [],
    googlePlaceId: null,
    autoSyncReviews: true
  });

  // AI 1-Click Magic Onboarding States
  const [aiInput, setAiInput] = useState('');
  const [aiEnriching, setAiEnriching] = useState(false);
  const [aiEnrichedData, setAiEnrichedData] = useState(null);

  const handleAiEnrich = async (e) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) {
      setErrorMsg('Please enter a business name, city, or paste a Google Maps link.');
      return;
    }

    setAiEnriching(true);
    setErrorMsg('');

    try {
      const res = await api.aiEnrichBusiness({ query: aiInput.trim() });
      if (res.success && res.data) {
        const d = res.data;
        setAiEnrichedData(d);
        setFormData(prev => ({
          ...prev,
          businessName: d.name,
          industryId: d.industryId,
          subcategoryId: d.subcategoryName,
          address: d.address,
          city: d.city,
          state: d.state,
          postalCode: d.postalCode,
          phone: d.phone,
          website: d.website,
          googleReviewUrl: d.googleReviewUrl,
          services: Array.isArray(d.services) ? d.services.join(', ') : d.services,
          brandVoice: d.brandVoice || 'Warm & Professional',
          targetKeywords: d.targetKeywords || [],
          competitorNames: d.competitorNames || [],
          googlePlaceId: d.googlePlaceId || d.placeId || null,
          autoSyncReviews: true
        }));
      } else {
        throw new Error(res.error || 'Failed to auto-detect business details');
      }
    } catch (err) {
      setErrorMsg(err.message || 'AI auto-detection failed. Please fill details manually.');
    } finally {
      setAiEnriching(false);
    }
  };


  // Load industries if API provides them
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const res = await api.getIndustries();
        if (res?.industries && res.industries.length > 0) {
          const mapped = res.industries.map(ind => ({
            id: ind.id,
            name: ind.name,
            subcategories: Array.isArray(ind.subcategories)
              ? ind.subcategories.map(s => (typeof s === 'string' ? s : s.name || s.id))
              : ['Standard Offering'],
            services: ind.services ? ind.services.join(', ') : 'Professional Services'
          }));
          setIndustries(mapped);
        }
      } catch {
        // Fallback to DEFAULT_INDUSTRIES
      }
    };
    loadIndustries();
  }, []);

  // Sync subcategory & default services when industry changes
  const handleIndustryChange = (id) => {
    const matched = industries.find(i => i.id === id) || DEFAULT_INDUSTRIES.find(i => i.id === id);
    setFormData(prev => ({
      ...prev,
      industryId: id,
      subcategoryId: matched?.subcategories?.[0] || 'General',
      services: matched?.services || prev.services
    }));
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (currentStep === 1) {
      if (!formData.businessName.trim()) {
        setErrorMsg('Please enter a business or branch name.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!formData.city.trim()) {
        setErrorMsg('Please enter the city for this location.');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.businessName.trim()) {
      setCurrentStep(1);
      setErrorMsg('Please enter a business name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const parsedServices = typeof formData.services === 'string'
        ? formData.services.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(formData.services) ? formData.services : []);

      const payload = {
        businessName: formData.businessName.trim(),
        industryId: formData.industryId,
        subcategoryId: formData.subcategoryId.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        subcategoryName: formData.subcategoryId,
        businessModel: formData.businessModel,
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country,
        address: formData.address.trim() || `${formData.city} Commercial Area`,
        postalCode: formData.postalCode.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim() || `https://${formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        googleReviewUrl: formData.googleReviewUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.businessName.trim() + ' ' + formData.city.trim())}`,
        services: parsedServices,
        serviceRadius: Number(formData.serviceRadius) || 15,
        targetLocations: [formData.city, `${formData.city} Central`, `${formData.city} West`],
        customerIntents: ['visit', 'booking', 'call'],
        brandVoice: formData.brandVoice || 'Warm & Professional',
        aiLanguages: ['en', 'hi'],
        targetKeywords: formData.targetKeywords || [],
        competitorNames: formData.competitorNames || [],
        googlePlaceId: formData.googlePlaceId || aiEnrichedData?.googlePlaceId || aiEnrichedData?.placeId || null,
        autoSyncReviews: formData.autoSyncReviews !== false
      };

      const res = await api.submitOnboarding(payload);

      if (res.success && res.business) {
        setSuccessData(res.business);
        if (switchBusiness) {
          switchBusiness(res.business.id);
        }
        if (refreshUserData) {
          await refreshUserData();
        }
        setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      } else {
        throw new Error(res.error || 'Failed to create business location');
      }
    } catch (err) {
      console.error('[ONBOARDING] Submission error:', err);
      setErrorMsg(err.message || 'Error activating business. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedInd = industries.find(i => i.id === formData.industryId) || DEFAULT_INDUSTRIES[0];

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Location Created Successfully!
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>{successData.name}</strong> has been registered. AI review campaigns and intelligence tracking are now active.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-[#034bc0]">
            <div className="w-4 h-4 rounded-full border-2 border-[#034bc0] border-t-transparent animate-spin"></div>
            <span>Opening Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 py-8 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* Top Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-bold text-slate-400">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#034bc0] text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Add Business Location
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up your business profile, primary services, and Google connection.
                </p>
              </div>
            </div>

            {/* Simple Step Pills */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { step: 1, title: '1. Business Info' },
                { step: 2, title: '2. Location & Address' },
                { step: 3, title: '3. Services & Google' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < currentStep || formData.businessName.trim()) {
                      setCurrentStep(s.step);
                    }
                  }}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition cursor-pointer border ${
                    currentStep === s.step
                      ? 'bg-blue-50 text-[#034bc0] border-blue-200 shadow-2xs'
                      : currentStep > s.step
                      ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="truncate block">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: BUSINESS IDENTITY */}
            {currentStep === 1 && (
              <div className="space-y-4.5 animate-in fade-in duration-150">
                {/* AI 1-Click Magic Onboarding Assistant */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white border-2 border-blue-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#034bc0] text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                          <span>1-Click AI Magic Location Setup</span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-blue-600 text-white">AI Powered</span>
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Type business name & city, or paste a Google Maps link. AI auto-detects niche, services, keywords & competitors!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAiEnrich(e);
                          }
                        }}
                        placeholder="e.g. Apollo Dental Clinic, Ahmedabad or paste Google Maps link..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-blue-200 text-xs sm:text-sm text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#034bc0] shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={aiEnriching}
                      onClick={handleAiEnrich}
                      className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {aiEnriching ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>AI Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Auto-Detect & Fill</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Enriched Blueprint Preview Card */}
                  {aiEnrichedData && (
                    <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-xs space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[11px] font-black uppercase text-[#034bc0]">
                            AI Synthesized Intelligence ({aiEnrichedData.confidenceScore}% Confidence)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {aiEnrichedData.industryId?.toUpperCase()} • {aiEnrichedData.city}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Detected Category</span>
                          <p className="font-bold text-slate-900 truncate">{aiEnrichedData.industryName || aiEnrichedData.subcategoryName || aiEnrichedData.industryId}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Official Address</span>
                          <p className="font-semibold text-slate-700 truncate">{aiEnrichedData.address}</p>
                        </div>
                      </div>

                      {/* Keywords Preview */}
                      {aiEnrichedData.targetKeywords && aiEnrichedData.targetKeywords.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">
                            Auto-Generated Search Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiEnrichedData.targetKeywords.slice(0, 6).map((kw, i) => (
                              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#034bc0] border border-blue-100">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitors Preview */}
                      {aiEnrichedData.competitorNames && aiEnrichedData.competitorNames.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">
                            Local Competitors Benchmark:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiEnrichedData.competitorNames.map((c, i) => (
                              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                🎯 {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instant 1-Click Launch Button */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Ready to deploy with full intelligence?</span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleSubmit}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Launch Autonomous Flywheel 🚀</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">or review & customize below</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Business / Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Bhagyalaxmi Hotel & Resort"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#034bc0] focus:ring-1 focus:ring-[#034bc0]"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Industry / Category *
                  </label>
                  <select
                    value={formData.industryId}
                    onChange={(e) => handleIndustryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-[#034bc0]"
                  >
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Model Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Business Operational Model
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'storefront', label: 'Storefront', desc: 'Walk-in' },
                      { id: 'service_area', label: 'Service-Area', desc: 'Doorstep' },
                      { id: 'multi_location', label: 'Multi-Branch', desc: 'Chain' },
                      { id: 'hybrid', label: 'Hybrid', desc: 'Store + Field' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessModel: m.id })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          formData.businessModel === m.id
                            ? 'border-[#034bc0] bg-blue-50/70 text-[#034bc0] font-bold ring-1 ring-[#034bc0]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">Website URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://mybusiness.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS & LOCATION */}
            {currentStep === 2 && (
              <div className="space-y-4.5 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Near Taleti, Mount Road"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ahmedabad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Gujarat"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">Pincode</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="380054"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#034bc0] shrink-0" />
                  <p className="text-xs text-blue-900">
                    Your location information is used for local SEO ranking, Google Maps discovery, and review requests.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: SERVICES & GOOGLE REVIEW URL */}
            {currentStep === 3 && (
              <div className="space-y-4.5 animate-in fade-in duration-150">
                {/* Services */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Services Offered (Comma-separated)
                    </label>
                    <span className="text-[10px] text-slate-400">Used by AI review writers</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                    placeholder="e.g. Fine Dining, Banquet Catering, Private Rooms, Valet Parking"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                  />
                </div>

                {/* Google Review URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Google Review URL (Direct popup link)
                    </label>
                    <span className="text-[10px] text-slate-400">Directly routes 5★ reviews</span>
                  </div>
                  <input
                    type="text"
                    value={formData.googleReviewUrl}
                    onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/CTTlnP3UB9FSEBE/review"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#034bc0]"
                  />
                  <p className="text-[11px] text-slate-400">
                    If empty, our system automatically resolves your Google place review link using your business name & city.
                  </p>
                </div>

                {/* Service Radius */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Service Radius: {formData.serviceRadius} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={formData.serviceRadius}
                    onChange={(e) => setFormData({ ...formData, serviceRadius: e.target.value })}
                    className="w-full accent-[#034bc0] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Activating Location...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create & Activate Location</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
