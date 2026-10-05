import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Globe2,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Zap,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const OnboardingPage = () => {
  const { user, refreshUserData, switchBusiness } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedData, setCompletedData] = useState(null);

  // Form State across 12 steps
  const [formData, setFormData] = useState({
    // Step 1: Workspace
    workspaceName: user?.workspaceName || 'My Business Workspace',
    country: 'India',
    timezone: 'Asia/Kolkata',
    defaultLanguage: 'en',

    // Step 2: Business Info
    businessName: '',
    website: '',
    phone: '',
    address: '',
    city: 'Ahmedabad',
    postalCode: '380054',

    // Step 3 & 4: Industry & Subcategory
    industryId: 'restaurant',
    subcategoryId: 'fine_dining',

    // Step 5: Business Model
    businessModel: 'storefront', // storefront, service_area, multi_location, chain, hybrid

    // Step 6: Services
    services: ['Primary Consultation', 'Premium Service Offering', 'Custom Service Package'],

    // Step 7: Target Locations
    targetLocations: ['Western Suburbs', 'Central Business District', 'North Zone'],

    // Step 8: Customer Personas
    customerPersonas: ['Discerning Quality Seekers', 'Affluent Local Families', 'Corporate Clients'],

    // Step 9: Brand Voice
    brandVoice: 'Warm & Hospitable',

    // Step 10: AI Language
    aiLanguages: ['en', 'hi'],

    // Step 11: Google Connection
    connectGoogle: true
  });

  const [newServiceInput, setNewServiceInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const res = await api.getIndustries();
        setIndustries(res.industries || []);
      } catch (err) {
        console.error('[ONBOARDING] Error loading industries:', err);
      }
    };
    loadIndustries();
  }, []);

  const handleNext = () => {
    if (currentStep < 12) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmitOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitOnboarding = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const finalBizName = (formData.businessName && formData.businessName.trim())
        ? formData.businessName.trim()
        : (user?.workspaceName || 'My Business Location');

      const payload = {
        ...formData,
        businessName: finalBizName
      };

      const res = await api.submitOnboarding(payload);
      setCompletedData(res);

      if (res.business?.id) {
        localStorage.setItem('redes_business_id', res.business.id);
        if (switchBusiness) {
          switchBusiness(res.business.id);
        }
      }

      if (refreshUserData) {
        await refreshUserData();
      }

      // Auto-redirect to dashboard after 2.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      console.error('[ONBOARDING] Submission failed:', err);
      setErrorMsg(err.message || 'Failed to activate business intelligence profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Item Helpers
  const addService = () => {
    if (newServiceInput.trim()) {
      setFormData(prev => ({ ...prev, services: [...prev.services, newServiceInput.trim()] }));
      setNewServiceInput('');
    }
  };

  const removeService = (idx) => {
    setFormData(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== idx) }));
  };

  const addLocation = () => {
    if (newLocationInput.trim()) {
      setFormData(prev => ({ ...prev, targetLocations: [...prev.targetLocations, newLocationInput.trim()] }));
      setNewLocationInput('');
    }
  };

  const removeLocation = (idx) => {
    setFormData(prev => ({ ...prev, targetLocations: prev.targetLocations.filter((_, i) => i !== idx) }));
  };

  const currentIndustryObj = industries.find(i => i.id === formData.industryId);
  const currentSubcategories = currentIndustryObj?.subcategories || [];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-3xl mx-auto py-8">
      {/* Progress Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Step {currentStep} of 12
          </span>
          <span className="text-slate-300">
            Completion Score: <strong className="text-emerald-400">{Math.round((currentStep / 12) * 100)}%</strong>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 12) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 space-y-6">
        {/* STEP 1: WORKSPACE */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Create Workspace & Regional Settings</h2>
              <p className="text-xs text-slate-400 mt-1">Configure your agency or business operational workspace.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Workspace Name</label>
                <input
                  type="text"
                  value={formData.workspaceName}
                  onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Default Language</label>
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS INFORMATION */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Business Location & Contact Information</h2>
              <p className="text-xs text-slate-400 mt-1">Exact name, physical address, and contact details for Google NAP mapping.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Official Business Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Saffron Fine Dine & Banquets"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 79 4890 5500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Website</label>
                  <input
                    type="url"
                    placeholder="https://mybusiness.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Physical Storefront / Office Address</label>
                <input
                  type="text"
                  placeholder="Plot 42, SG Highway, Bodakdev"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS TYPE / INDUSTRY */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Select Industry Taxonomy</h2>
              <p className="text-xs text-slate-400 mt-1">
                Crucial: Changing the industry alters the AI tone, compliance rules, review topics, and SEO recommendations.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, industryId: ind.id })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    formData.industryId === ind.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs block">{ind.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ind.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: SUB-CATEGORY */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Select Industry Sub-Category</h2>
              <p className="text-xs text-slate-400 mt-1">
                Refine the specific operational focus for {currentIndustryObj?.name || 'this industry'}.
              </p>
            </div>

            <div className="space-y-2.5">
              {currentSubcategories.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800 text-xs text-slate-300">
                  Standard subcategory applied for this sector.
                </div>
              ) : (
                currentSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, subcategoryId: sub.id })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      formData.subcategoryId === sub.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold text-sm block">{sub.name}</span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Suggested Services: {(sub.suggested_services || []).join(', ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 5: BUSINESS MODEL */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Select Business Model</h2>
              <p className="text-xs text-slate-400 mt-1">Determines whether rankings are pinned to a storefront or service radius.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'storefront', label: 'Local Storefront', desc: 'Customers visit your physical location (e.g. restaurant, clinic, store)' },
                { id: 'service_area', label: 'Service-Area Business (SAB)', desc: 'You travel to deliver services to customers at their locations' },
                { id: 'multi_location', label: 'Multi-Location Brand', desc: 'Multiple branches across cities or neighborhoods' },
                { id: 'hybrid', label: 'Hybrid Model', desc: 'Both on-premise storefront visits and local service delivery' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, businessModel: m.id })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.businessModel === m.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs block">{m.label}</span>
                  <span className="text-[11px] text-slate-400 mt-1 block">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: SERVICES / PRODUCTS */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Itemized Services & Products</h2>
              <p className="text-xs text-slate-400 mt-1">Add your high-intent services to train the AI reply and keyword engines.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Private Banquet Hall Catering"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Add Service
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.services.map((svc, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                >
                  <span>{svc}</span>
                  <button type="button" onClick={() => removeService(i)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: TARGET LOCATIONS & SERVICE AREAS */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Target Localities & Service Areas</h2>
              <p className="text-xs text-slate-400 mt-1">Specify key neighborhoods, localities, or nearby service clusters.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Bodakdev, SG Highway"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addLocation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Add Area
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.targetLocations.map((loc, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{loc}</span>
                  <button type="button" onClick={() => removeLocation(i)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: CUSTOMER PERSONAS */}
        {currentStep === 8 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Customer Personas & Audience Types</h2>
              <p className="text-xs text-slate-400 mt-1">Who are your primary diners, clients, or patients?</p>
            </div>

            <div className="space-y-2">
              {['Affluent Families & Celebrations', 'Corporate Business Executives', 'Young Couples & Social Dining', 'High-Net-Worth Individuals'].map((persona) => (
                <div key={persona} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">{persona}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: BRAND VOICE */}
        {currentStep === 9 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Brand Voice & Persona</h2>
              <p className="text-xs text-slate-400 mt-1">How should the AI reputation specialist sound in review replies?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { tone: 'Warm & Hospitable', desc: 'Inviting, gracious, milestone-oriented' },
                { tone: 'Professional & Authoritative', desc: 'Clinical, polished, expert tone' },
                { tone: 'Premium & Luxury', desc: 'Sophisticated, elegant, discrete' },
                { tone: 'Concise & Efficient', desc: 'Brief, clear, direct resolution' }
              ].map((t) => (
                <button
                  key={t.tone}
                  type="button"
                  onClick={() => setFormData({ ...formData, brandVoice: t.tone })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.brandVoice === t.tone
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs block">{t.tone}</span>
                  <span className="text-[11px] text-slate-400 mt-1 block">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: AI LANGUAGE */}
        {currentStep === 10 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Supported AI Languages</h2>
              <p className="text-xs text-slate-400 mt-1">Support English, Hindi, and natural Hinglish for review replies.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'en', label: 'English (US / Global)', desc: 'Standard business communication' },
                { id: 'hi', label: 'Hindi (हिंदी)', desc: 'Pure vernacular replies' },
                { id: 'hinglish', label: 'Hinglish (Colloquial)', desc: 'Friendly conversational Hindi in Latin script' }
              ].map((lang) => (
                <div key={lang.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <div>
                    <span className="text-xs font-bold text-white block">{lang.label}</span>
                    <span className="text-[11px] text-slate-400 block">{lang.desc}</span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 11: GOOGLE BUSINESS PROFILE CONNECTION */}
        {currentStep === 11 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-white">Google Business Profile Connection</h2>
              <p className="text-xs text-slate-400 mt-1">Connect your verified Google account to enable review sync and rank tracking.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-800 to-indigo-950/60 border border-indigo-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-md">
                <Globe2 className="w-7 h-7 text-indigo-600" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Google OAuth 2.0 Integration</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Connect your business account to sync real reviews, location categories, and local 3-Pack performance data.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulated Secure OAuth Credentials Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: GENERATE BI PROFILE & COMPLETION SCORE */}
        {currentStep === 12 && (
          <div className="space-y-6 animate-in fade-in text-center">
            {completedData ? (
              <div className="space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-emerald">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white">Business Intelligence Profile Activated!</h2>
                <div className="inline-block px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700">
                  <span className="text-xs text-slate-400">Onboarding Completion Score: </span>
                  <span className="text-lg font-black text-emerald-400">100 / 100</span>
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your central intelligence profile is now fully primed. Keyword discovery, review sync, and rank tracking have been initialized for {completedData.business?.name}.
                </p>

                <div className="pt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-brand flex items-center gap-2 mx-auto"
                  >
                    <span>Launch Executive Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto shadow-glow-brand text-white">
                  <Zap className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Ready to Compile Business Intelligence Profile</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to synthesize your custom prompt pack, target keywords, review reply rules, and local SEO telemetry.
                </p>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold max-w-md mx-auto text-left flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div>{errorMsg}</div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-indigo-400 hover:underline mt-1 block font-bold cursor-pointer"
                      >
                        Check Business Details (Step 2) →
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitOnboarding}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-brand flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Synthesizing Profile...' : 'Activate Business Intelligence'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Footer */}
        {currentStep < 12 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-brand flex items-center gap-1.5"
            >
              <span>{currentStep === 11 ? 'Finalize Profile' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
