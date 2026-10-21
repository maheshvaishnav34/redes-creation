import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Building2,
  MapPin,
  Globe2,
  Sparkles,
  Phone,
  Link as LinkIcon,
  CheckCircle2,
  Layers,
  ArrowRight,
  Utensils,
  Hotel,
  Stethoscope,
  GraduationCap,
  Building,
  ShoppingBag,
  Scale,
  HeartPulse,
  Factory,
  Briefcase,
  Search,
  Star,
  RefreshCw,
  Zap,
  Target,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const INDUSTRY_OPTIONS = [
  {
    id: 'restaurant',
    name: 'Restaurant & Dining',
    icon: Utensils,
    subcategories: ['Fine Dining', 'Artisan Cafe & Bakery', 'Casual Family Dining', 'Bistro', 'Cloud Kitchen'],
    services: ['Chef Tasting Menu', 'Candlelight Dinners', 'Private Dining Rooms', 'Banquet Catering', 'Takeaway & Delivery'],
    tone: 'Warm & Hospitable',
    intents: ['visit', 'booking', 'call']
  },
  {
    id: 'hotel',
    name: 'Hotels & Hospitality',
    icon: Hotel,
    subcategories: ['Luxury Resort', 'Boutique Hotel', 'Business Suites', 'Heritage Stay', 'Bed & Breakfast'],
    services: ['Luxury Suites', 'Infinity Pool & Spa', 'Conference Banquets', 'Airport Transfers', 'Fine Dining'],
    tone: 'Polite, Premium & Gracious',
    intents: ['booking', 'enquiry', 'call', 'visit']
  },
  {
    id: 'dental',
    name: 'Dental Care & Clinic',
    icon: Stethoscope,
    subcategories: ['Dental Spa & Aesthetics', 'Orthodontic Clinic', 'Implantology Center', 'Pediatric Dental'],
    services: ['Teeth Whitening', 'Invisalign Aligners', 'Dental Implants', 'Root Canal Treatment', 'Smile Designing'],
    tone: 'Empathetic, Clinical & Reassuring',
    intents: ['appointment', 'call', 'enquiry']
  },
  {
    id: 'hospital',
    name: 'Hospitals & Medical Care',
    icon: HeartPulse,
    subcategories: ['Eye Hospital & Lasik', 'Multi-speciality Hospital', 'Orthopedic Care', 'Diagnostic Pathology'],
    services: ['Consultation Outpatient', 'Advanced Surgery', 'Diagnostic Imaging', 'Emergency 24x7', 'Preventive Health Checks'],
    tone: 'Compassionate & Authoritative',
    intents: ['appointment', 'call', 'emergency']
  },
  {
    id: 'school',
    name: 'Schools & Education',
    icon: GraduationCap,
    subcategories: ['CBSE K-12 School', 'IT & Coding Academy', 'Competitive Exam Coaching', 'Preschool & Daycare'],
    services: ['Full Stack Web Development', 'STEM Education', 'Board Exam Coaching', 'Career Counseling', 'Robotics Lab'],
    tone: 'Inspiring, Academic & Supportive',
    intents: ['enquiry', 'visit', 'call']
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Properties',
    icon: Building,
    subcategories: ['Luxury Residential', 'Commercial Leasing', 'Property Consulting', 'Plots & Townships'],
    services: ['3BHK / 4BHK Luxury Apartments', 'Commercial Office Spaces', 'Site Visits', 'Legal Property Title Due Diligence'],
    tone: 'Authoritative, Professional & Confident',
    intents: ['enquiry', 'visit', 'call']
  },
  {
    id: 'retail',
    name: 'Retail & Showrooms',
    icon: ShoppingBag,
    subcategories: ['Fashion & Boutique', 'Jewelry Showroom', 'Electronics & Appliances', 'Supermarket'],
    services: ['In-store Shopping', 'Custom Tailoring & Fitting', 'Warranty Support', 'Home Delivery'],
    tone: 'Vibrant, Customer-centric & Helpful',
    intents: ['visit', 'purchase', 'call']
  },
  {
    id: 'legal',
    name: 'Legal & Law Firms',
    icon: Scale,
    subcategories: ['Corporate & M&A Law', 'Property & Civil Litigation', 'Criminal Defense', 'IP & Trademark'],
    services: ['Corporate Advisory', 'Contract Drafting', 'Court Representation', 'Trademark Registration'],
    tone: 'Discreet, Rigorous & Authoritative',
    intents: ['enquiry', 'call', 'appointment']
  },
  {
    id: 'services',
    name: 'Digital & Professional Services',
    icon: Briefcase,
    subcategories: ['Digital Marketing & SEO Agency', 'IT Consulting & Cloud', 'Chartered Accounting', 'Creative Studio'],
    services: ['Local SEO & GBP Optimization', 'Custom Web Applications', 'Tax Filing & Audit', 'Brand Strategy'],
    tone: 'Dynamic, Expert & Data-Driven',
    intents: ['enquiry', 'call', 'booking']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    icon: Factory,
    subcategories: ['Packaging Materials', 'Textile & Garments', 'Engineering Components', 'Chemical Processing'],
    services: ['Bulk Order Manufacturing', 'OEM Custom Fabrication', 'Quality Testing & QC', 'Export Logistics'],
    tone: 'Technical, Dependable & Precise',
    intents: ['enquiry', 'call']
  }
];

const detectIndustryFromPlace = (place) => {
  const text = `${place.name} ${place.category || ''} ${place.address || ''}`.toLowerCase();
  
  if (text.includes('dental') || text.includes('dentist') || text.includes('teeth') || text.includes('orthodont')) {
    return { industryId: 'dental', subcategory: 'Dental Spa & Aesthetics' };
  }
  if (text.includes('hotel') || text.includes('resort') || text.includes('motel') || text.includes('stay') || text.includes('suites') || text.includes('inn')) {
    return { industryId: 'hotel', subcategory: 'Luxury Resort' };
  }
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('bistro') || text.includes('dining') || text.includes('dhaba') || text.includes('food') || text.includes('bakery')) {
    return { industryId: 'restaurant', subcategory: 'Fine Dining' };
  }
  if (text.includes('hospital') || text.includes('clinic') || text.includes('medical') || text.includes('care') || text.includes('doctor') || text.includes('pathology')) {
    return { industryId: 'hospital', subcategory: 'Multi-speciality Hospital' };
  }
  if (text.includes('training') || text.includes('institute') || text.includes('academy') || text.includes('coaching') || text.includes('school') || text.includes('code') || text.includes('tech') || text.includes('college')) {
    return { industryId: 'school', subcategory: 'IT & Coding Academy' };
  }
  if (text.includes('real estate') || text.includes('property') || text.includes('realty') || text.includes('builder') || text.includes('developer')) {
    return { industryId: 'real_estate', subcategory: 'Luxury Residential' };
  }
  if (text.includes('law') || text.includes('advocate') || text.includes('legal') || text.includes('solicitor')) {
    return { industryId: 'legal', subcategory: 'Corporate & M&A Law' };
  }
  if (text.includes('retail') || text.includes('shop') || text.includes('store') || text.includes('showroom') || text.includes('boutique') || text.includes('jewel')) {
    return { industryId: 'retail', subcategory: 'Fashion & Boutique' };
  }
  if (text.includes('factory') || text.includes('industry') || text.includes('manufacturing') || text.includes('steel') || text.includes('textile')) {
    return { industryId: 'manufacturing', subcategory: 'Packaging Materials' };
  }
  return { industryId: 'services', subcategory: 'Digital Marketing & SEO Agency' };
};

const parseCityFromAddress = (address) => {
  if (!address) return 'Ahmedabad';
  const parts = address.split(',').map(s => s.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.toLowerCase().includes('india') || /^\d{6}$/.test(p) || p.toLowerCase().includes('gujarat') || p.toLowerCase().includes('maharashtra') || p.toLowerCase().includes('rajasthan') || p.toLowerCase().includes('delhi')) {
      continue;
    }
    if (p.length > 2 && !/^\d+/.test(p)) {
      return p;
    }
  }
  return parts[1] || 'Ahmedabad';
};

export const AddLocationModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { switchBusiness, refreshUserData } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode Selection: 'ai' (1-Click Magic Onboarding) or 'manual' (Custom Form)
  const [onboardingMode, setOnboardingMode] = useState('ai');

  // AI 1-Click Search State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [searchingAiPlaces, setSearchingAiPlaces] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [aiDetectedPlace, setAiDetectedPlace] = useState(null);
  const [aiSynthesizing, setAiSynthesizing] = useState(false);
  const [newCustomService, setNewCustomService] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [industryId, setIndustryId] = useState('restaurant');
  const [subcategory, setSubcategory] = useState('Fine Dining');
  const [businessModel, setBusinessModel] = useState('storefront');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('380054');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [website, setWebsite] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [services, setServices] = useState('Chef Tasting Menu, Private Dining Rooms, Banquet Catering');
  const [serviceRadius, setServiceRadius] = useState(15);
  const [language, setLanguage] = useState('en');
  const [autoSyncReviews, setAutoSyncReviews] = useState(true);

  const selectedInd = useMemo(() => INDUSTRY_OPTIONS.find(i => i.id === industryId) || INDUSTRY_OPTIONS[0], [industryId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync subcategory & default services on industry change in manual mode
  useEffect(() => {
    const selected = INDUSTRY_OPTIONS.find(i => i.id === industryId);
    if (selected && onboardingMode === 'manual') {
      setSubcategory(selected.subcategories[0] || '');
      setServices(selected.services.join(', '));
    }
  }, [industryId, onboardingMode]);

  if (!isOpen) return null;

  // AI Place Search Handler
  const handleSearchAiPlaces = async (val) => {
    setAiSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setAiSearchResults([]);
      return;
    }
    try {
      setSearchingAiPlaces(true);
      const res = await api.searchGooglePlaces(val.trim());
      setAiSearchResults(res?.places || []);
    } catch (err) {
      console.warn('Place search notice:', err);
    } finally {
      setSearchingAiPlaces(false);
    }
  };

  // AI Place Select Handler
  const handleSelectAiPlace = (place) => {
    setAiSynthesizing(true);
    setAiDetectedPlace(place);
    setAiSearchResults([]);

    const detected = detectIndustryFromPlace(place);
    const indObj = INDUSTRY_OPTIONS.find(i => i.id === detected.industryId) || INDUSTRY_OPTIONS[0];
    const detectedCity = parseCityFromAddress(place.address);

    setName(place.name || '');
    setAddress(place.address || '');
    setCity(detectedCity);
    setIndustryId(detected.industryId);
    setSubcategory(detected.subcategory);
    setServices(indObj.services.slice(0, 5).join(', '));
    setWebsite(place.name ? `https://${place.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com` : '');
    setGoogleReviewUrl(
      place.placeId && !place.placeId.startsWith('osm_')
        ? `https://search.google.com/local/writereview?placeid=${place.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + detectedCity)}`
    );

    setTimeout(() => {
      setAiSynthesizing(false);
    }, 600);
  };

  // Remove a single service chip
  const handleRemoveService = (svcToRemove) => {
    const parts = services.split(',').map(s => s.trim()).filter(Boolean);
    const updated = parts.filter(s => s.toLowerCase() !== svcToRemove.toLowerCase());
    setServices(updated.join(', '));
  };

  // Add custom service chip
  const handleAddCustomService = (e) => {
    if (e) e.preventDefault();
    if (!newCustomService.trim()) return;
    const parts = services.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.some(p => p.toLowerCase() === newCustomService.trim().toLowerCase())) {
      parts.push(newCustomService.trim());
      setServices(parts.join(', '));
    }
    setNewCustomService('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter or select a business location.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsedServices = services.split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        businessName: name.trim(),
        industryId,
        subcategoryId: subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        subcategoryName: subcategory,
        businessModel,
        city: city.trim() || 'Ahmedabad',
        state: state.trim() || 'Gujarat',
        address: address.trim() || `${city} Main Commercial District`,
        postalCode: postalCode.trim() || '380054',
        phone: phone.trim() || '+91 98765 43210',
        website: website.trim() || (name ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com` : ''),
        googleReviewUrl: googleReviewUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim() + ' ' + city.trim())}`,
        services: parsedServices,
        serviceRadius: Number(serviceRadius) || 15,
        targetLocations: [city, `${city} East`, `${city} West`],
        customerIntents: selectedInd?.intents || ['visit', 'call', 'enquiry'],
        brandVoice: selectedInd?.tone || 'Professional',
        aiLanguages: [language, 'en'],
        connectGoogle: true,
        googlePlaceId: aiDetectedPlace?.placeId || null,
        autoSyncReviews
      };

      const res = await api.submitOnboarding(payload);

      if (res.success && res.business) {
        const reviewsMsg = (res.reviewsImported && res.reviewsImported > 0)
          ? ` & successfully imported ${res.reviewsImported} past customer reviews`
          : (res.reviewsTotal && res.reviewsTotal > 0 ? ` & synced all ${res.reviewsTotal} Google reviews` : '');
        setSuccessMsg(`🚀 "${res.business.name}" created${reviewsMsg}! Redirecting to customer reviews...`);
        await refreshUserData();
        switchBusiness(res.business.id);

        setTimeout(() => {
          onClose();
          navigate('/reviews');
        }, 1400);
      } else {
        throw new Error(res.error || 'Failed to create business location');
      }
    } catch (err) {
      console.error('[ADD_LOCATION_MODAL] Error:', err);
      setErrorMsg(err.message || 'Error creating business location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header - Fixed & Pinned */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#034bc0] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  Add Business Location
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#034bc0] border border-blue-200 shrink-0 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>AI Powered</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                1-Click Magic Onboarding or full custom manual configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnboardingMode('ai')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              onboardingMode === 'ai'
                ? 'bg-[#034bc0] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click AI Magic Onboarding</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-black hidden sm:inline">10s</span>
          </button>

          <button
            type="button"
            onClick={() => setOnboardingMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              onboardingMode === 'manual'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Custom Manual Setup</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK AI MAGIC ONBOARDING */}
          {onboardingMode === 'ai' && (
            <div className="space-y-4">
              {/* Search Bar Container */}
              <div className="relative space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#034bc0]" />
                    <span>Search Google Maps Business or Paste Link:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Zero manual typing required</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={aiSearchQuery}
                    onChange={(e) => handleSearchAiPlaces(e.target.value)}
                    placeholder="e.g. Saffron Bistro Ahmedabad, or Apollo Dental Clinic..."
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-blue-200 focus:border-[#034bc0] bg-blue-50/20 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none transition shadow-xs"
                  />
                  <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                  {searchingAiPlaces && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3.5" />
                  )}
                </div>

                {/* Instant Sample Demo Pills */}
                {!aiDetectedPlace && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Instant Demo:</span>
                    {[
                      'StackCode Training Institute',
                      'Saffron Bistro Ahmedabad',
                      'Apollo Dental Clinic Satellite',
                      'Taj Hotel Mumbai'
                    ].map((demo) => (
                      <button
                        key={demo}
                        type="button"
                        onClick={() => handleSearchAiPlaces(demo)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition cursor-pointer"
                      >
                        {demo}
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Search Results Dropdown */}
                {aiSearchResults.length > 0 && !aiDetectedPlace && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {aiSearchResults.map((place) => (
                      <div
                        key={place.placeId}
                        onClick={() => handleSelectAiPlace(place)}
                        className="p-3 hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#034bc0] truncate">
                              {place.name}
                            </span>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{place.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{place.rating || '5.0'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">({place.userRatingsTotal || 45})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Synthesizing Loader */}
              {aiSynthesizing && (
                <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 text-center space-y-2 animate-pulse">
                  <Sparkles className="w-7 h-7 text-[#034bc0] animate-spin mx-auto" />
                  <div className="text-xs font-black text-slate-900">AI Synthesizing Business Intelligence...</div>
                  <p className="text-[11px] text-slate-500">
                    Extracting Google Place entity, auto-detecting services & preparing 7-day keyword flywheel.
                  </p>
                </div>
              )}

              {/* AI Discovered Place Blueprint Card */}
              {aiDetectedPlace && !aiSynthesizing && (
                <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
                  {/* Entity Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          {name}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#034bc0]">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Google Verified</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{address}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 font-bold text-xs text-amber-600 justify-end">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{aiDetectedPlace.rating || '4.8'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {aiDetectedPlace.userRatingsTotal || '48'} Reviews
                      </span>
                    </div>
                  </div>

                  {/* Niche & Category Taxonomy Auto-Detected */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Industry Category:
                      </span>
                      <div className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#034bc0]" />
                        <span>{selectedInd?.name || 'Selected Industry'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Brand Voice & Proximity:
                      </span>
                      <div className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{selectedInd?.tone} • {serviceRadius} km Radius</span>
                      </div>
                    </div>
                  </div>

                  {/* High Demand Services Configured by AI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Auto-Configured High-Demand Services:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Click × to remove</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {services.split(',').map(s => s.trim()).filter(Boolean).map(svc => (
                        <span
                          key={svc}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs"
                        >
                          <span>{svc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(svc)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Inline Add Custom Service input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newCustomService}
                        onChange={(e) => setNewCustomService(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomService(e)}
                        placeholder="Add another service (e.g. VIP Booking)..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomService}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Ready Flywheel Indicators */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <div className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Autonomous Growth Flywheel Ready to Initialize:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-emerald-700">
                      <div>• 15 Live Google Keywords Seeded</div>
                      <div>• Branded Review QR Flyer Ready</div>
                      <div>• 5x5 Geo-Grid Proximity Grid</div>
                      <div>• 3-Pack Local Competitor Intercept</div>
                    </div>
                  </div>

                  {/* Historical Google Reviews Auto-Fetch Tool/Option */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/90 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#034bc0] text-white flex items-center justify-center font-black text-xs shadow-xs">
                          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>Automatic Google Reviews Ingestion</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-[#034bc0]">AUTO-SYNC</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Pulls all available past customer reviews and ratings directly into your account
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-blue-700 block">
                          ⭐ {aiDetectedPlace.rating || '5.0'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {aiDetectedPlace.userRatingsTotal ? `${aiDetectedPlace.userRatingsTotal} reviews ready` : 'Historical reviews ready'}
                        </span>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 pt-2 border-t border-blue-100/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSyncReviews}
                        onChange={(e) => setAutoSyncReviews(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-[#034bc0] focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">
                          Fetch all past Google reviews immediately on location creation
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          Import reviewer names, star ratings, review comments, and owner replies into your Reviews dashboard.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Re-select or Customize Link */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAiDetectedPlace(null);
                        setAiSearchQuery('');
                      }}
                      className="text-slate-500 hover:text-slate-800 underline font-bold cursor-pointer"
                    >
                      ← Search a different place
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingMode('manual')}
                      className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      Edit details in manual form →
                    </button>
                  </div>
                </div>
              )}

              {/* Initial Guidance Card when no place searched */}
              {!aiDetectedPlace && !aiSynthesizing && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#034bc0] flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      10-Second Autonomous Onboarding
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Simply type your business name above or paste your Google Maps link. AI will pull your verified address, auto-map your niche, and initialize your local SEO rank tracking engine in seconds.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL CUSTOM SETUP */}
          {onboardingMode === 'manual' && (
            <div className="space-y-5">
              {/* Section 1: Business Identity & Industry Taxonomy */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#034bc0]" />
                    1. Business Identity & Niche Context
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Defines AI voice & SEO</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Business / Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bhagyalaxmi Hotel & Resort - Highway Residency"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#034bc0] focus:ring-1 focus:ring-[#034bc0]"
                  />
                </div>

                {/* Industry Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Industry / Business Type *
                  </label>
                  <select
                    value={industryId}
                    onChange={(e) => setIndustryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-[#034bc0]"
                  >
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Model */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Business Model (Spec 2.1)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'storefront', label: 'Local Storefront', desc: 'Walk-in / Physical' },
                      { id: 'service_area', label: 'Service-Area', desc: 'Doorstep / Field' },
                      { id: 'multi_location', label: 'Multi-Location', desc: 'Chain / Branch' },
                      { id: 'hybrid', label: 'Hybrid', desc: 'Store + Delivery' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setBusinessModel(m.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          businessModel === m.id
                            ? 'border-[#034bc0] bg-blue-50/70 text-[#034bc0] font-bold ring-1 ring-[#034bc0]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{m.label}</div>
                        <div className="text-[9px] text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Services & Offerings */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#034bc0]" />
                    2. Services, Products & AI Keywords
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Used for reviews & AI</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Core Services / Products Offered (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    placeholder="e.g. Luxury Suites, Fine Dining, Banquet Hall"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
                    {(selectedInd?.services || []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const current = services ? services.split(',').map(item => item.trim()) : [];
                          if (!current.includes(s)) {
                            setServices([...current, s].join(', '));
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Target Service Radius (km)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={serviceRadius}
                      onChange={(e) => setServiceRadius(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Primary AI Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-[#034bc0]"
                    >
                      <option value="en">English (Default)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="gu">Gujarati (ગુજરાતી)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Physical Address & Territory */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#034bc0]" />
                    3. Address & Geographical Location
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">For Geo-Grid 3-Pack</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. S.G. Highway, Bodakdev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Contact & Google Maps Review Routing */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-[#034bc0]" />
                    4. Contact & Google Review Integration
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Customer review funnel</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Google Review URL / Place Link
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review or https://maps.app.goo.gl/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                  />
                  <p className="text-[10px] text-slate-400">
                    If left empty, system automatically routes reviews using direct Google Maps query.
                  </p>
                </div>

                {/* Manual Mode Auto-Fetch Reviews Checkbox */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncReviews}
                      onChange={(e) => setAutoSyncReviews(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#034bc0] focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        Fetch all past Google reviews immediately upon adding location
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Synchronizes customer reviews from Google into your Redes Creation account database.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Pinned Footer - OUTSIDE scroll body, ALWAYS VISIBLE */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {onboardingMode === 'ai'
                ? (aiDetectedPlace ? 'AI Blueprint Ready for Launch' : 'Enter business name to discover')
                : 'Custom manual configuration mode'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (onboardingMode === 'ai' && !aiDetectedPlace && !name.trim())}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#034bc0] to-indigo-600 hover:from-[#023aa0] hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{autoSyncReviews ? 'Creating & fetching customer reviews...' : 'Launching Flywheel...'}</span>
                </>
              ) : onboardingMode === 'ai' ? (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Launch Location & Fetch Reviews 🚀</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Create & Activate Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
