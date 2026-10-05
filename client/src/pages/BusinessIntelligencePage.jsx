import React, { useState, useEffect } from 'react';
import { 
  Building2, Brain, Sparkles, Shield, AlertTriangle, CheckCircle2, 
  Plus, Trash2, Save, FileText, Globe, Volume2, Target, HelpCircle,
  BookOpen, Users, Cpu, ArrowRight, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BusinessIntelligencePage() {
  const { activeBusiness, user } = useAuth();
  const isClient = user?.role === 'client';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [activeTab, setActiveTab] = useState('core'); // core, brand, keywords, rules, knowledge

  // Editable Form State
  const [formData, setFormData] = useState({
    identity: '',
    description: '',
    brand_voice: 'Premium',
    services: [],
    products: [],
    customer_personas: [],
    languages: ['English', 'Hindi'],
    approved_claims: [],
    restricted_claims: [],
    target_keywords: [],
    excluded_keywords: [],
    reply_rules: {
      auto_5_star: true,
      auto_4_star: true,
      require_approval_below_3: true,
      block_sensitive_claims: true
    },
    escalation_rules: {
      urgent_keywords: ['lawsuit', 'food poisoning', 'hygiene', 'police', 'refund', 'scam'],
      escalation_email: 'owner@redescreation.com'
    },
    compliance_rules: [],
    knowledge_base: []
  });

  // Temp inputs for adding tags/items
  const [newService, setNewService] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [newClaim, setNewClaim] = useState('');
  const [newRestricted, setNewRestricted] = useState('');
  const [newTargetKeyword, setNewTargetKeyword] = useState('');
  const [newExcludedKeyword, setNewExcludedKeyword] = useState('');
  const [newKbDoc, setNewKbDoc] = useState({ title: '', category: 'FAQ', content: '' });
  const [showKbModal, setShowKbModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [activeBusiness]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getBusinessProfile(activeBusiness?.id);
      if (res.success) {
        setBusinessData(res.business);
        if (res.profile) {
          setFormData({
            identity: res.profile.identity || res.business.name || '',
            description: res.profile.description || '',
            brand_voice: res.profile.brand_voice || 'Premium',
            services: Array.isArray(res.profile.services) ? res.profile.services : [],
            products: Array.isArray(res.profile.products) ? res.profile.products : [],
            customer_personas: Array.isArray(res.profile.customer_personas) ? res.profile.customer_personas : [],
            languages: Array.isArray(res.profile.languages) ? res.profile.languages : ['English'],
            approved_claims: Array.isArray(res.profile.approved_claims) ? res.profile.approved_claims : [],
            restricted_claims: Array.isArray(res.profile.restricted_claims) ? res.profile.restricted_claims : [],
            target_keywords: Array.isArray(res.profile.target_keywords) ? res.profile.target_keywords : [],
            excluded_keywords: Array.isArray(res.profile.excluded_keywords) ? res.profile.excluded_keywords : [],
            reply_rules: res.profile.reply_rules || { auto_5_star: true, auto_4_star: true, require_approval_below_3: true },
            escalation_rules: res.profile.escalation_rules || { urgent_keywords: ['lawsuit', 'poisoning'], escalation_email: '' },
            compliance_rules: Array.isArray(res.profile.compliance_rules) ? res.profile.compliance_rules : [],
            knowledge_base: Array.isArray(res.profile.knowledge_base) ? res.profile.knowledge_base : []
          });
        }
      }
    } catch (err) {
      console.error('Failed to load BI profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await api.updateBusinessProfile(activeBusiness?.id, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Error updating Business Intelligence Profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (field, value, setter) => {
    if (!value.trim()) return;
    if (!formData[field].includes(value.trim())) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    }
    setter('');
  };

  const removeTag = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddKb = () => {
    if (!newKbDoc.title || !newKbDoc.content) return;
    setFormData(prev => ({
      ...prev,
      knowledge_base: [...prev.knowledge_base, { ...newKbDoc, date_added: new Date().toISOString() }]
    }));
    setNewKbDoc({ title: '', category: 'FAQ', content: '' });
    setShowKbModal(false);
  };

  const removeKb = (index) => {
    setFormData(prev => ({
      ...prev,
      knowledge_base: prev.knowledge_base.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading Business Intelligence Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Intelligence Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <Brain className="w-3.5 h-3.5 text-indigo-300" />
                CENTRAL BI PROFILE 2.0
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Industry: {businessData?.industry_name || 'Multi-Industry'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {businessData?.name || 'Business Intelligence Engine'}
            </h1>
            <p className="text-indigo-200/80 text-sm mt-1 max-w-2xl leading-relaxed">
              Every AI module (Review Replies, SEO Content, Keyword Discovery, Local Recommendations) dynamically reads this profile to guarantee factual accuracy and niche brand voice.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch lg:self-auto justify-end">
            <button
              onClick={fetchProfile}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            {isClient ? (
              <div className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Managed by Agency Administrator</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Syncing Profile...' : 'Save Intelligence Profile'}</span>
              </button>
            )}
          </div>
        </div>

        {isClient && (
          <div className="mt-4 p-3.5 bg-blue-500/20 border border-blue-400/40 rounded-xl text-blue-200 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-300 shrink-0" />
              <span><strong>Client View Mode (business.view ✅):</strong> Core business context, services, and AI policy rules are maintained by your agency administrator. You have full transparency to view all active parameters below.</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-[#034bc0] shrink-0">Read-Only</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Business Intelligence Profile updated successfully! All active AI models and prompt pipelines have been re-indexed.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'core', label: 'Identity & Services', icon: Building2 },
          { id: 'brand', label: 'Brand Voice & Audience', icon: Volume2 },
          { id: 'keywords', label: 'Target & Excluded Keywords', icon: Target },
          { id: 'rules', label: 'Reply & Safety Rules', icon: Shield },
          { id: 'knowledge', label: 'Knowledge Base & FAQs', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Core Identity & Services */}
      {activeTab === 'core' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Business Identity & Core Narrative
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Official Brand Name</label>
                  <input
                    type="text"
                    value={formData.identity}
                    onChange={e => setFormData({ ...formData, identity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Saffron Fine Dine & Banquets"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Executive Business Description (AI Grounding)</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Provide a comprehensive summary of what your business does, your heritage, awards, unique value propositions, and core specialties..."
                  />
                  <p className="text-xs text-slate-400 mt-1">This context is injected into every AI generation prompt to anchor factual accuracy.</p>
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Core Services</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Used by AI to match customer praise or complaints to specific offerings.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {formData.services.length} Registered
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newService}
                  onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('services', newService, setNewService))}
                  placeholder="e.g. Candlelight Dinner, Catering, Wedding Banquet..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag('services', newService, setNewService)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {formData.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeTag('services', idx)}
                      className="text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Side Info Card */}
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-indigo-500" /> Dynamic Niche Adapter
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Redes Creation replaces generic AI prompting with a continuous industry ontology. Current industry classification:
              </p>
              <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                <div className="text-xs font-semibold text-slate-400">Target Industry</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{businessData?.industry_name || 'Hospitality / Dining'}</div>
                <div className="text-xs text-slate-500 mt-1">{businessData?.city}, {businessData?.country}</div>
              </div>
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Industry taxonomy auto-injected</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Topic detection mapped to niche</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero customer fact hallucinations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Brand Voice & Audience */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" /> Brand Voice & Tonality
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Select the baseline personality that the AI Orchestrator enforces when drafting replies and posts.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Premium', 'Professional', 'Warm', 'Friendly', 'Concise', 'Custom'].map(tone => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setFormData({ ...formData, brand_voice: tone })}
                    className={`p-3.5 rounded-xl border text-center font-semibold text-sm transition ${
                      formData.brand_voice === tone
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Supported Reply Languages</label>
              <div className="flex flex-wrap gap-2">
                {['English', 'Hindi', 'Hinglish', 'Gujarati', 'Spanish', 'French'].map(lang => {
                  const isSelected = formData.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
                        } else {
                          setFormData({ ...formData, languages: [...formData.languages, lang] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Target Customer Personas
              </h3>
              <p className="text-xs text-slate-500 mb-3">Define the archetypes your business serves for hyper-personalized messaging.</p>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPersona}
                  onChange={e => setNewPersona(e.target.value)}
                  placeholder="e.g. Couples celebrating anniversaries, Corporate executives..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag('customer_personas', newPersona, setNewPersona)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.customer_personas.map((persona, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800"
                  >
                    {persona}
                    <button type="button" onClick={() => removeTag('customer_personas', idx)} className="text-indigo-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Target & Excluded Keywords */}
      {activeTab === 'keywords' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Keywords */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Target Local Keywords
            </h3>
            <p className="text-xs text-slate-500 mb-3">Keywords you want naturally emphasized in Google Posts and SEO audit recommendations.</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTargetKeyword}
                onChange={e => setNewTargetKeyword(e.target.value)}
                placeholder="e.g. fine dining ahmedabad, rooftop restaurant..."
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag('target_keywords', newTargetKeyword, setNewTargetKeyword)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.target_keywords.map((kw, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {kw}
                  <button type="button" onClick={() => removeTag('target_keywords', idx)} className="text-emerald-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Excluded Keywords */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Excluded & Negative Keywords
            </h3>
            <p className="text-xs text-slate-500 mb-3">Strictly banned phrases. The AI will never incorporate these terms into replies or content.</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newExcludedKeyword}
                onChange={e => setNewExcludedKeyword(e.target.value)}
                placeholder="e.g. cheap, free, 24/7 (if untrue)..."
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag('excluded_keywords', newExcludedKeyword, setNewExcludedKeyword)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition"
              >
                Block
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.excluded_keywords.map((kw, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800">
                  {kw}
                  <button type="button" onClick={() => removeTag('excluded_keywords', idx)} className="text-rose-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reply & Safety Rules */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Automated AI Reply Policies
            </h3>
            <p className="text-xs text-slate-500">
              Redes enforces strict rating and sentiment guardrails. High-risk or mixed reviews never auto-publish without human consent.
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reply_rules.auto_5_star}
                  onChange={e => setFormData({
                    ...formData,
                    reply_rules: { ...formData.reply_rules, auto_5_star: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Auto-Reply to 5-Star Reviews</div>
                  <div className="text-xs text-slate-500">Allows AI to generate and publish thank-you replies for purely positive 5-star reviews automatically.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reply_rules.auto_4_star}
                  onChange={e => setFormData({
                    ...formData,
                    reply_rules: { ...formData.reply_rules, auto_4_star: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Auto-Reply to 4-Star Reviews (Positive sentiment only)</div>
                  <div className="text-xs text-slate-500">Auto-publishes only if sentiment is positive and no complaint themes are detected.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reply_rules.require_approval_below_3}
                  onChange={e => setFormData({
                    ...formData,
                    reply_rules: { ...formData.reply_rules, require_approval_below_3: e.target.checked }
                  })}
                  className="mt-1 h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Strict Hold on 1★–3★ Complaints (Mandatory Approval)</div>
                  <div className="text-xs text-slate-500">Route all mixed, neutral or negative reviews to the AI Approval Center. Never auto-publish.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Claims & Escalations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approved Business Claims (Fact Bank)
              </h3>
              <p className="text-xs text-slate-500 mb-3">Claims the AI can state as verified truth in customer interactions.</p>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newClaim}
                  onChange={e => setNewClaim(e.target.value)}
                  placeholder="e.g. 100% Pure Vegetarian, Valet parking available..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag('approved_claims', newClaim, setNewClaim)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.approved_claims.map((claim, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {claim}
                    <button type="button" onClick={() => removeTag('approved_claims', idx)} className="text-emerald-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Restricted Claims (Do NOT Promise)
              </h3>
              <p className="text-xs text-slate-500 mb-3">Promises or claims the AI is strictly prohibited from making.</p>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newRestricted}
                  onChange={e => setNewRestricted(e.target.value)}
                  placeholder="e.g. Do not promise discounts, Do not guarantee immediate table on weekends..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag('restricted_claims', newRestricted, setNewRestricted)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.restricted_claims.map((claim, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-800">
                    {claim}
                    <button type="button" onClick={() => removeTag('restricted_claims', idx)} className="text-rose-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Knowledge Base & FAQs */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Business Knowledge Base (RAG Document Store)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload FAQs, operating hours, banquet packages, allergy guides and policies. The AI references these before crafting any response.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKbModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Knowledge Item
              </button>
            </div>

            {formData.knowledge_base.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Knowledge Documents Added</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Add custom FAQs, menu guidelines, or parking instructions so the AI can answer customer queries accurately.
                </p>
                <button
                  type="button"
                  onClick={() => setShowKbModal(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Add First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.knowledge_base.map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 relative group hover:border-indigo-400 transition">
                    <button
                      type="button"
                      onClick={() => removeKb(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded uppercase">
                        {doc.category || 'FAQ'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{doc.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">{doc.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add KB Modal */}
      {showKbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Add Knowledge Base Entry
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Document Title / Question</label>
              <input
                type="text"
                value={newKbDoc.title}
                onChange={e => setNewKbDoc({ ...newKbDoc, title: e.target.value })}
                placeholder="e.g. What are the banquet booking cancellation policies?"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Category</label>
              <select
                value={newKbDoc.category}
                onChange={e => setNewKbDoc({ ...newKbDoc, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="FAQ">FAQ</option>
                <option value="Policy">Policy / Rules</option>
                <option value="Pricing">Pricing & Packages</option>
                <option value="Hours">Hours & Accessibility</option>
                <option value="Menu">Menu & Ingredients</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Factual Answer / Content</label>
              <textarea
                rows={4}
                value={newKbDoc.content}
                onChange={e => setNewKbDoc({ ...newKbDoc, content: e.target.value })}
                placeholder="Detail the verified facts. The AI will cite these details verbatim..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowKbModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddKb}
                disabled={!newKbDoc.title || !newKbDoc.content}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
