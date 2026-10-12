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
  Tag
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

export const AddLocationModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { switchBusiness, refreshUserData } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Sync subcategory & default services on industry change
  useEffect(() => {
    const selected = INDUSTRY_OPTIONS.find(i => i.id === industryId);
    if (selected) {
      setSubcategory(selected.subcategories[0] || '');
      setServices(selected.services.join(', '));
    }
  }, [industryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a location or business name.');
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
        city: city.trim(),
        state: state.trim(),
        address: address.trim() || `${city} Main Commercial District`,
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        website: website.trim() || (name ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com` : ''),
        googleReviewUrl: googleReviewUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim() + ' ' + city.trim())}`,
        services: parsedServices,
        serviceRadius: Number(serviceRadius) || 15,
        targetLocations: [city, `${city} East`, `${city} West`],
        customerIntents: selectedInd?.intents || ['visit', 'call', 'enquiry'],
        brandVoice: selectedInd?.tone || 'Professional',
        aiLanguages: [language, 'en'],
        connectGoogle: true
      };

      const res = await api.submitOnboarding(payload);

      if (res.success && res.business) {
        setSuccessMsg(`"${res.business.name}" created successfully!`);
        await refreshUserData();
        switchBusiness(res.business.id);

        setTimeout(() => {
          onClose();
          // Reset form
          setName('');
        }, 1200);
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
            <div className="w-10 h-10 rounded-2xl bg-[#034bc0] text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  Add Business Location
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#034bc0] border border-blue-200 shrink-0">
                  Spec 2.1
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                Register a new business outlet, clinic, hotel or branch with niche AI context.
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

        {/* Scrollable Form Body */}
        <form
          id="add-location-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain"
        >
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Sub-Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Sub-category
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium bg-white focus:outline-none focus:border-[#034bc0]"
                >
                  {(selectedInd?.subcategories || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
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
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#034bc0]" />
                2. Primary Services & Offerings
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Used for AI review topics & writing</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Services Offered (Comma-separated)
              </label>
              <textarea
                rows={2}
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. Fine Dining, Banquet Catering, Private Rooms, Valet Parking"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
              />
            </div>
          </div>

          {/* Section 3: Location & Contact Details */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#034bc0]" />
                3. Address & Geo-Location
              </span>
              <span className="text-[10px] text-slate-400 font-medium">For Geo-Grid heatmaps</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 block">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near SG Highway, Bodakdev"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ahmedabad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Gujarat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Pincode</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="380054"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-800 block">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Google Review & Online Presence */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#034bc0]" />
                4. Google Business Profile & Review Link
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-populates review campaigns</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Google Review URL (Direct popup link)
              </label>
              <input
                type="text"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/CTTlnP3UB9FSEBE/review"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#034bc0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://mybusiness.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Service Radius (km)</label>
                <input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#034bc0]"
                />
              </div>
            </div>
          </div>

          {/* Onboarding Deep Link Option */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">
                Need full multi-step setup?
              </span>
              <span className="text-[11px] text-slate-500 truncate block">
                Configure brand personas, Google OAuth, and custom audits.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/onboarding');
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#034bc0] border border-blue-200 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
            >
              <span>12-Step Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Sticky Pinned Footer - OUTSIDE scroll body, ALWAYS VISIBLE */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All 4 sections ready for activation</span>
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
              type="submit"
              form="add-location-form"
              disabled={loading}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Location...</span>
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
