import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe2,
  Calendar,
  Layers,
  Sparkles,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Target,
  Plus,
  Trophy,
  Award,
  BarChart3,
  ChevronRight,
  X,
  Clock,
  HelpCircle,
  Building2,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const COUNTRIES = [
  { code: 'IN', label: 'India 🇮🇳' },
  { code: 'US', label: 'United States 🇺🇸' },
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'CA', label: 'Canada 🇨🇦' },
  { code: 'AU', label: 'Australia 🇦🇺' },
  { code: 'WORLDWIDE', label: 'Worldwide 🌐' }
];

const TIMEFRAMES = [
  { value: 'now 7-d', label: 'Past 7 Days' },
  { value: 'today 1-m', label: 'Past 30 Days' },
  { value: 'today 3-m', label: 'Past 90 Days' },
  { value: 'today 12-m', label: 'Past 12 Months' },
  { value: 'today 5-y', label: 'Past 5 Years' }
];

const PROPERTIES = [
  { value: '', label: 'Web Search' },
  { value: 'images', label: 'Google Images' },
  { value: 'news', label: 'Google News' },
  { value: 'youtube', label: 'YouTube' }
];

const COMPARE_COLORS = ['#034bc0', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Smart context-aware presets based on active business
function getBusinessPresets(activeBusiness) {
  const name = (activeBusiness?.name || '').toLowerCase();
  const subcat = (activeBusiness?.subcategory_name || activeBusiness?.industry_id || '').toLowerCase();

  // Hospitality / Hotel / Resort
  if (
    name.includes('hotel') ||
    name.includes('resort') ||
    subcat.includes('hotel') ||
    subcat.includes('resort') ||
    subcat.includes('hospitality') ||
    subcat.includes('lodging')
  ) {
    return {
      defaultKeyword: 'resort',
      presetChips: ['Luxury Resort', 'Hotel with Pool', 'Weekend Getaway', 'Family Restaurant', 'Banquet Hall', 'Day Outing'],
      comparePresets: [
        { label: 'Resort vs Hotel vs Villa', terms: 'resort, hotel, villa' },
        { label: 'Fine Dining vs Casual Dining', terms: 'fine dining, family restaurant, cafe' },
        { label: 'Weekend Getaway vs Staycation', terms: 'weekend getaway, staycation, day outing' },
        { label: 'Banquet Hall vs Marriage Lawn', terms: 'banquet hall, wedding lawn, party plot' }
      ]
    };
  }

  // Salon / Spa / Wellness
  if (name.includes('salon') || name.includes('spa') || subcat.includes('beauty') || subcat.includes('wellness')) {
    return {
      defaultKeyword: 'luxury spa',
      presetChips: ['Luxury Spa', 'Hair Salon', 'Bridal Makeup', 'Facial Treatment', 'Body Massage', 'Nail Art'],
      comparePresets: [
        { label: 'Spa vs Salon vs Parlour', terms: 'spa, salon, beauty parlour' },
        { label: 'Facial vs Clean Up', terms: 'facial, skin cleanup, hydrafacial' },
        { label: 'Bridal Makeup vs Party Makeup', terms: 'bridal makeup, party makeup' }
      ]
    };
  }

  // Clinic / Healthcare
  if (name.includes('clinic') || name.includes('dental') || name.includes('hospital') || subcat.includes('health')) {
    return {
      defaultKeyword: 'dental clinic',
      presetChips: ['Dental Clinic', 'Teeth Whitening', 'Root Canal Treatment', 'Orthodontist', 'Dental Implants'],
      comparePresets: [
        { label: 'Dental Clinic vs Dentist', terms: 'dental clinic, dentist, teeth doctor' },
        { label: 'Root Canal vs Dental Implant', terms: 'root canal, dental implant' },
        { label: 'Teeth Whitening vs Braces', terms: 'teeth whitening, braces, aligners' }
      ]
    };
  }

  // Default General Local Business
  return {
    defaultKeyword: 'local service',
    presetChips: ['Local Service', 'Near Me', 'Best Rated', 'Top Rated Services', 'Affordable Deals', 'Customer Reviews'],
    comparePresets: [
      { label: 'Near Me vs Best', terms: 'services near me, best service' },
      { label: 'Local vs Online', terms: 'local business, online booking' }
    ]
  };
}

export default function TrendsPage() {
  const { activeBusiness } = useAuth();
  const presets = useMemo(() => getBusinessPresets(activeBusiness), [activeBusiness]);

  // View Mode: 'explorer' | 'compare'
  const [activeTab, setActiveTab] = useState('explorer');

  // Explorer Mode State
  const [searchQuery, setSearchQuery] = useState(presets.defaultKeyword);
  const [selectedGeo, setSelectedGeo] = useState('IN');
  const [selectedTimeframe, setSelectedTimeframe] = useState('today 12-m');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [queryTab, setQueryTab] = useState('rising'); // 'rising' | 'top'

  // Compare Mode State
  const [compareInput, setCompareInput] = useState(presets.comparePresets[0]?.terms || 'resort, hotel, villa');
  const [compareGeo, setCompareGeo] = useState('IN');
  const [compareTimeframe, setCompareTimeframe] = useState('today 3-m');
  const [compareProperty, setCompareProperty] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareError, setCompareError] = useState(null);

  // Recent Searches History
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('redes_recent_trends');
      return saved ? JSON.parse(saved) : [presets.defaultKeyword, 'hotel with pool', 'resort'];
    } catch {
      return [presets.defaultKeyword];
    }
  });

  // Tracked Keywords & Toast
  const [trackedKeywords, setTrackedKeywords] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const saveRecentSearch = (term) => {
    if (!term) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('redes_recent_trends', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  // Initial Fetch for Explorer
  useEffect(() => {
    fetchExplorer(presets.defaultKeyword, selectedGeo, selectedTimeframe, selectedProperty);
  }, []);

  // Update default search query when business preset changes
  useEffect(() => {
    if (presets.defaultKeyword && !trendData) {
      setSearchQuery(presets.defaultKeyword);
      setCompareInput(presets.comparePresets[0]?.terms || 'resort, hotel, villa');
    }
  }, [presets]);

  // 1. Fetch Explorer Data
  const fetchExplorer = async (kw, geo, timeframe, prop) => {
    const q = (kw || searchQuery || '').trim();
    if (!q) return;
    setLoading(true);
    setErrorNotice(null);
    try {
      saveRecentSearch(q);
      const params = `?q=${encodeURIComponent(q)}&geo=${geo || selectedGeo}&timeframe=${encodeURIComponent(timeframe || selectedTimeframe)}&property=${prop ?? selectedProperty}`;
      const res = await api.getTrendExplore(params);
      setTrendData(res);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to load Google Trends data. Please try another term.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Multi-Keyword Comparison
  const fetchCompare = async (overrideTerms) => {
    const rawTerms = overrideTerms || compareInput;
    const terms = rawTerms.split(',').map(t => t.trim()).filter(Boolean);
    if (terms.length < 2) {
      setCompareError('Please enter at least 2 comma-separated keywords to compare.');
      return;
    }
    setCompareLoading(true);
    setCompareError(null);
    try {
      const params = `?terms=${encodeURIComponent(terms.join(','))}&geo=${compareGeo}&timeframe=${encodeURIComponent(compareTimeframe)}&property=${compareProperty}`;
      const res = await api.getTrendCompare(params);
      setCompareData(res);
    } catch (err) {
      setCompareError(err.message || 'Failed to compare keyword trends.');
    } finally {
      setCompareLoading(false);
    }
  };

  // Handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExplorer(searchQuery, selectedGeo, selectedTimeframe, selectedProperty);
  };

  const handleChipClick = (chip) => {
    setSearchQuery(chip);
    fetchExplorer(chip, selectedGeo, selectedTimeframe, selectedProperty);
  };

  const handleExploreSingle = (queryStr) => {
    setSearchQuery(queryStr);
    setActiveTab('explorer');
    fetchExplorer(queryStr, selectedGeo, selectedTimeframe, selectedProperty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackKeyword = async (keyword) => {
    const clean = keyword.trim();
    if (trackedKeywords[clean.toLowerCase()]) {
      showToast(`"${clean}" is already tracked in your SEO Keyword Engine.`, 'info');
      return;
    }

    try {
      await api.addKeyword({
        keyword: clean,
        intent: 'local',
        isPrimary: false
      });
      setTrackedKeywords(prev => ({ ...prev, [clean.toLowerCase()]: true }));
      showToast(`Added "${clean}" to SEO Keyword Engine!`, 'success');
    } catch (err) {
      showToast(err.message || `Could not track "${clean}"`, 'error');
    }
  };

  // CSV Export
  const handleExportCSV = (mode) => {
    if (mode === 'explorer') {
      if (!trendData?.timeline?.length) return;
      const headers = ['Date', 'Timeframe Range', 'Normalized Interest (0-100)'];
      const rows = trendData.timeline.map(pt => [
        `"${pt.date}"`,
        `"${pt.formattedTime || pt.date}"`,
        pt.value
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `google_trends_${trendData.keyword}_${selectedGeo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported CSV for "${trendData.keyword}"`, 'success');
    } else {
      if (!compareData?.timeline?.length) return;
      const terms = compareData.terms || [];
      const headers = ['Date', 'Timeframe Range', ...terms.map(t => `"${t}"`)];
      const rows = compareData.timeline.map(pt => [
        `"${pt.date}"`,
        `"${pt.formattedTime || pt.date}"`,
        ...terms.map(t => pt[t] ?? 0)
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `google_trends_compare_${terms.join('_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported comparison CSV!', 'success');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          {toast.type === 'info' && <Lightbulb className="w-5 h-5 text-[#034bc0] flex-shrink-0" />}
          <span className="text-sm font-medium text-slate-800">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 ml-2 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Container */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#034bc0] rounded-xl border border-blue-100">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trends Intelligence</h1>
                  <p className="text-sm text-slate-500">
                    Live Google search demand, breakout queries, AI strategic blueprints, and competitor benchmarking.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Business Context Pill */}
            {activeBusiness && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg self-start md:self-auto">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-500 font-medium">Business Context:</span>
                <span className="text-xs font-semibold text-slate-900">{activeBusiness.name}</span>
              </div>
            )}
          </div>

          {/* Clean 2-Mode Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-200 -mb-px overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'explorer'
                  ? 'border-[#034bc0] text-[#034bc0]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Compass className="w-4 h-4" />
              Trend Explorer & AI Insights
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                if (!compareData && !compareLoading) {
                  fetchCompare();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'compare'
                  ? 'border-[#034bc0] text-[#034bc0]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              Competitor & Topic Comparison
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ============================================================== */}
        {/* MODE 1: TREND EXPLORER & AI STRATEGIC INTELLIGENCE            */}
        {/* ============================================================== */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any keyword, topic, or local query (e.g. resort, hotel with pool, family dining)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Geo Selector */}
                  <select
                    value={selectedGeo}
                    onChange={(e) => {
                      setSelectedGeo(e.target.value);
                      fetchExplorer(searchQuery, e.target.value, selectedTimeframe, selectedProperty);
                    }}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* Timeframe Selector */}
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => {
                      setSelectedTimeframe(e.target.value);
                      fetchExplorer(searchQuery, selectedGeo, e.target.value, selectedProperty);
                    }}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                  >
                    {TIMEFRAMES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  {/* Property Selector */}
                  <select
                    value={selectedProperty}
                    onChange={(e) => {
                      setSelectedProperty(e.target.value);
                      fetchExplorer(searchQuery, selectedGeo, selectedTimeframe, e.target.value);
                    }}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                  >
                    {PROPERTIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-[#034bc0] hover:bg-[#023b98] active:scale-[0.98] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Explore
                  </button>
                </div>
              </form>

              {/* Context Presets & Recent Searches */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  {presets.presetChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-[#034bc0] text-slate-700 rounded-lg transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {recentSearches.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">Recent:</span>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleChipClick(term)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-900 hover:underline"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Notice */}
            {errorNotice && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <p className="text-sm font-medium text-rose-800">{errorNotice}</p>
                </div>
                <button
                  onClick={() => fetchExplorer(searchQuery, selectedGeo, selectedTimeframe, selectedProperty)}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <RefreshCw className="w-8 h-8 text-[#034bc0] animate-spin mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Gathering Google Trends Data</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Fetching normalized search interest, regional demand, and breakout queries for "{searchQuery}"...
                </p>
              </div>
            )}

            {/* Content Display when Data Loaded */}
            {!loading && trendData && (
              <>
                {/* 1. KEY METRICS BAR (4 KPI CARDS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Current Interest */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Current Interest
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                          (trendData.analysis?.currentInterest || 0) >= 70
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (trendData.analysis?.currentInterest || 0) >= 40
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {(trendData.analysis?.currentInterest || 0) >= 70
                          ? 'High Demand'
                          : (trendData.analysis?.currentInterest || 0) >= 40
                          ? 'Moderate'
                          : 'Low / Steady'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {trendData.analysis?.currentInterest ?? 0}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">/ 100 Index</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Historical baseline avg: <span className="font-semibold text-slate-700">{trendData.analysis?.baselineAverage ?? 0}</span>
                    </p>
                  </div>

                  {/* Peak Interest */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Peak Popularity
                      </span>
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {trendData.analysis?.peak?.value ?? 100}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">/ 100 Peak</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Reached on <span className="font-semibold text-slate-700">{trendData.analysis?.peak?.date || 'N/A'}</span>
                    </p>
                  </div>

                  {/* Trend Momentum */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Trend Momentum
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                        {trendData.analysis?.classification || 'Stable'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span
                        className={`text-3xl font-extrabold flex items-center gap-1 ${
                          (trendData.analysis?.percentChange || 0) >= 0 ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {(trendData.analysis?.percentChange || 0) >= 0 ? '+' : ''}
                        {trendData.analysis?.percentChange ?? 0}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Volatility ratio: <span className="font-semibold text-slate-700">{trendData.analysis?.volatilityRatio ?? 0}%</span> (variance)
                    </p>
                  </div>

                  {/* Opportunity Score */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Opportunity Score
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        {trendData.opportunityScore?.confidence ?? 85}% Conf.
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#034bc0]">
                        {trendData.opportunityScore?.overallScore ?? 70}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">/ 100</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-emerald-700 truncate">
                      {trendData.opportunityScore?.rating || 'Promising Opportunity'}
                    </p>
                  </div>
                </div>

                {/* 2. TRAJECTORY RECHARTS TIMELINE CARD */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#034bc0]" />
                        <h2 className="text-base font-bold text-slate-900">
                          Search Interest Trajectory: "{trendData.keyword}"
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Google Trends normalized index (0–100 relative popularity benchmark across chosen timeframe)
                      </p>
                    </div>

                    <button
                      onClick={() => handleExportCSV('explorer')}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export CSV
                    </button>
                  </div>

                  {/* Chart */}
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#034bc0" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#034bc0" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const pt = payload[0].payload;
                            return (
                              <div className="bg-white border border-slate-200 shadow-md rounded-xl p-3 text-xs">
                                <div className="text-slate-500 font-medium">{pt.formattedTime || pt.date}</div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#034bc0]" />
                                  <span className="font-bold text-slate-900 text-sm">{pt.value} / 100</span>
                                  <span className="text-slate-500 font-medium">Relative Interest</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#034bc0"
                          strokeWidth={2.5}
                          fill="url(#trendGradient)"
                          name="Normalized Interest"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trajectory Footnote */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Normalized index 0–100 represents relative search interest compared to peak popularity, not total monthly search volumes or clicks.
                    </span>
                  </div>
                </div>

                {/* 3. TWO-COLUMN DEEP-DIVE: OPPORTUNITY BREAKDOWN & REGIONAL HOTSPOTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Opportunity Score Factor Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Opportunity Score Breakdown</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Weighted multi-factor evaluation of velocity, stability, and market feasibility
                          </p>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-[#034bc0] rounded-lg border border-blue-100">
                          {trendData.opportunityScore?.overallScore ?? 70}/100
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                        {trendData.opportunityScore?.explanation ||
                          'Solid interest base with favorable growth indicators and actionable keyword expansion.'}
                      </p>

                      {/* Factors Progress Bars */}
                      <div className="mt-5 space-y-3.5">
                        {trendData.opportunityScore?.factors?.map((f) => (
                          <div key={f.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800">{f.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-medium">Weight: {f.weight}%</span>
                                <span className="font-bold text-slate-900">{f.score}/100</span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  f.score >= 70
                                    ? 'bg-emerald-500'
                                    : f.score >= 40
                                    ? 'bg-[#034bc0]'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, f.score))}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500">{f.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      Methodology: {trendData.opportunityScore?.methodology || '5-factor weighted algorithm evaluating velocity, volatility, and related query diversity.'}
                    </div>
                  </div>

                  {/* Right: Regional Demand Hotspots */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Regional Demand Hotspots</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Sub-region demand intensity for "{trendData.keyword}" ({COUNTRIES.find(c => c.code === selectedGeo)?.label || selectedGeo})
                          </p>
                        </div>
                        {trendData.topRegion && (
                          <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                            Top: {trendData.topRegion.geoName}
                          </span>
                        )}
                      </div>

                      {/* Region list */}
                      <div className="mt-4 space-y-3">
                        {trendData.regions?.length === 0 && (
                          <div className="text-center py-8 text-sm text-slate-400">
                            No regional breakdown available for this query.
                          </div>
                        )}
                        {(showAllRegions ? trendData.regions : trendData.regions?.slice(0, 6))?.map((r) => (
                          <div key={r.geoCode || r.geoName} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800">{r.geoName}</span>
                              <span className="font-bold text-slate-900">{r.value} / 100</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#034bc0] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(3, r.value))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {trendData.regions && trendData.regions.length > 6 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <button
                          onClick={() => setShowAllRegions(!showAllRegions)}
                          className="text-xs font-semibold text-[#034bc0] hover:underline"
                        >
                          {showAllRegions ? 'Show Top 6 States' : `Show all ${trendData.regions.length} sub-regions`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. RISING BREAKOUT & RELATED QUERIES (WITH 1-CLICK TRACK & EXPLORE) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Related Search Queries & Breakouts
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        High-growth customer search queries related to "{trendData.keyword}" with 1-click SEO tracking.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                      <button
                        onClick={() => setQueryTab('rising')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          queryTab === 'rising'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        Rising Breakouts ({trendData.relatedQueries?.rising?.length || 0})
                      </button>
                      <button
                        onClick={() => setQueryTab('top')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          queryTab === 'top'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-[#034bc0]" />
                        Top Queries ({trendData.relatedQueries?.top?.length || 0})
                      </button>
                    </div>
                  </div>

                  {/* Query Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
                    {queryTab === 'rising' &&
                      trendData.relatedQueries?.rising?.map((item) => {
                        const isTracked = Boolean(trackedKeywords[item.query.toLowerCase()]);
                        return (
                          <div
                            key={item.query}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 hover:bg-white transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-sm text-slate-900 group-hover:text-[#034bc0] transition-colors line-clamp-2">
                                {item.query}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[11px] font-bold rounded-md flex-shrink-0 ${
                                  item.isBreakout
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {item.formattedValue || (item.isBreakout ? 'Breakout' : `+${item.value}%`)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-2.5 border-t border-slate-200/60">
                              <button
                                onClick={() => handleExploreSingle(item.query)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Search className="w-3 h-3 text-slate-400" />
                                Explore
                              </button>
                              <button
                                onClick={() => handleTrackKeyword(item.query)}
                                disabled={isTracked}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isTracked
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#034bc0] hover:bg-[#023b98] text-white'
                                }`}
                              >
                                {isTracked ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Tracked
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-3 h-3" />
                                    Track in SEO
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {queryTab === 'top' &&
                      trendData.relatedQueries?.top?.map((item) => {
                        const isTracked = Boolean(trackedKeywords[item.query.toLowerCase()]);
                        return (
                          <div
                            key={item.query}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 hover:bg-white transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-sm text-slate-900 group-hover:text-[#034bc0] transition-colors line-clamp-2">
                                {item.query}
                              </span>
                              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-[#034bc0] border border-blue-200 flex-shrink-0">
                                {item.formattedValue || `${item.value} Index`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-2.5 border-t border-slate-200/60">
                              <button
                                onClick={() => handleExploreSingle(item.query)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Search className="w-3 h-3 text-slate-400" />
                                Explore
                              </button>
                              <button
                                onClick={() => handleTrackKeyword(item.query)}
                                disabled={isTracked}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isTracked
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#034bc0] hover:bg-[#023b98] text-white'
                                }`}
                              >
                                {isTracked ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Tracked
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-3 h-3" />
                                    Track in SEO
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 5. GROQ AI STRATEGIC MARKET INSIGHTS CARD */}
                {trendData.aiInsights && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-[#034bc0] rounded-xl border border-blue-100">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Groq AI Strategic Market Blueprint
                          </h3>
                          <p className="text-xs text-slate-500">
                            Automated local marketing tactics, SEO content angles, and execution recommendations.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                          Confidence: {trendData.aiInsights.confidenceScore || 90}%
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {trendData.aiInsights.modelUsed || 'Groq AI Engine'}
                        </span>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {trendData.aiInsights.summary && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Executive Summary
                        </h4>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">
                          {trendData.aiInsights.summary}
                        </p>
                      </div>
                    )}

                    {/* Content Recommendations */}
                    {trendData.aiInsights.contentRecommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Recommended Content Pieces & Formats
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {trendData.aiInsights.contentRecommendations.map((c, i) => (
                            <div
                              key={i}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                            >
                              <div>
                                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-[#034bc0] border border-blue-200">
                                  {c.format}
                                </span>
                                <h5 className="font-bold text-sm text-slate-900 mt-2.5 leading-snug">
                                  {c.suggestedTitle}
                                </h5>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                  {c.strategicAngle}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                                <div className="text-[11px] text-slate-500">
                                  <span className="font-semibold text-slate-700">Timing:</span> {c.suggestedPublishTiming}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {c.targetKeywords?.slice(0, 3).map((kw) => (
                                    <span
                                      key={kw}
                                      className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded text-slate-600"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Marketing Tactics */}
                    {trendData.aiInsights.marketingTactics?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-emerald-600" />
                          Local Business Marketing Tactics
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                          {trendData.aiInsights.marketingTactics.map((t, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                                    {t.channel}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                      t.expectedImpact === 'High'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {t.expectedImpact} Impact
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                                  {t.action}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: COMPETITOR & TOPIC COMPARISON                          */}
        {/* ============================================================== */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            {/* Compare Controls Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Layers className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={compareInput}
                    onChange={(e) => setCompareInput(e.target.value)}
                    placeholder="Enter 2 to 5 comma-separated terms (e.g. resort, hotel, homestay, villa)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Geo Selector */}
                  <select
                    value={compareGeo}
                    onChange={(e) => setCompareGeo(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* Timeframe Selector */}
                  <select
                    value={compareTimeframe}
                    onChange={(e) => setCompareTimeframe(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                  >
                    {TIMEFRAMES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  {/* Compare Submit */}
                  <button
                    onClick={() => fetchCompare()}
                    disabled={compareLoading}
                    className="px-5 py-2.5 bg-[#034bc0] hover:bg-[#023b98] active:scale-[0.98] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {compareLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    Compare Trends
                  </button>
                </div>
              </div>

              {/* Quick Presets for Comparison */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
                  Quick Presets:
                </span>
                {presets.comparePresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setCompareInput(p.terms);
                      fetchCompare(p.terms);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-[#034bc0] text-slate-700 rounded-lg transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Notice */}
            {compareError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <p className="text-sm font-medium text-rose-800">{compareError}</p>
                </div>
                <button
                  onClick={() => fetchCompare()}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {compareLoading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <RefreshCw className="w-8 h-8 text-[#034bc0] animate-spin mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Comparing Search Trajectories</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Calculating side-by-side relative search interest across multiple terms...
                </p>
              </div>
            )}

            {/* Compare Content Display */}
            {!compareLoading && compareData && (
              <>
                {/* Leader Takeaway Banner */}
                {compareData.insights && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-[#034bc0] text-white rounded-xl shadow-xs">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#034bc0]">
                            Market Leader
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-white text-slate-900 rounded-md border border-blue-200">
                            "{compareData.insights.leadingTerm}"
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium mt-1 leading-relaxed">
                          {compareData.insights.leaderSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Term Comparative Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {compareData.comparisons?.map((c, idx) => {
                    const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
                    const isTracked = Boolean(trackedKeywords[c.term.toLowerCase()]);
                    return (
                      <div
                        key={c.term}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <h4 className="font-bold text-sm text-slate-900 truncate">{c.term}</h4>
                          </div>

                          <div className="mt-3.5 space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Avg Interest:</span>
                              <span className="font-bold text-slate-900">{c.averageInterest}/100</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Peak Interest:</span>
                              <span className="font-bold text-slate-900">{c.peakInterest}/100</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Current Interest:</span>
                              <span className="font-bold text-slate-900">{c.currentInterest}/100</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <button
                            onClick={() => handleExploreSingle(c.term)}
                            className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Compass className="w-3 h-3 text-slate-400" />
                            Explore
                          </button>
                          <button
                            onClick={() => handleTrackKeyword(c.term)}
                            disabled={isTracked}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isTracked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#034bc0] hover:bg-[#023b98] text-white'
                            }`}
                          >
                            {isTracked ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Tracked
                              </>
                            ) : (
                              <>
                                <Target className="w-3 h-3" />
                                Track
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-Series Recharts Line Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Multi-Keyword Interest Trajectory
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Concurrently normalized search interest compared side-by-side against the highest peak.
                      </p>
                    </div>

                    <button
                      onClick={() => handleExportCSV('compare')}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export CSV
                    </button>
                  </div>

                  <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareData.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const pt = payload[0].payload;
                            return (
                              <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-xs min-w-[170px]">
                                <div className="text-slate-500 font-medium mb-2 pb-1 border-b border-slate-100">
                                  {pt.formattedTime || pt.date}
                                </div>
                                <div className="space-y-1.5">
                                  {compareData.terms?.map((term, i) => (
                                    <div key={term} className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                                        />
                                        <span className="font-semibold text-slate-700">{term}</span>
                                      </div>
                                      <span className="font-bold text-slate-900">{pt[term] ?? 0}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: 16 }}
                          formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                        />
                        {compareData.terms?.map((term, idx) => (
                          <Line
                            key={term}
                            type="monotone"
                            dataKey={term}
                            stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
