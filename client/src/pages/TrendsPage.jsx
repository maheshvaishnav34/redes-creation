import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Globe2,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  Flame,
  ArrowUpRight,
  Bookmark,
  Bell,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Share2,
  Plus,
  Trash2,
  Activity,
  ShieldCheck,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api.js';

const COUNTRIES = [
  { code: 'IN', label: 'India 🇮🇳' },
  { code: 'US', label: 'United States 🇺🇸' },
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'CA', label: 'Canada 🇨🇦' },
  { code: 'AU', label: 'Australia 🇦🇺' },
  { code: 'WORLDWIDE', label: 'Worldwide 🌐' }
];

const TIMEFRAMES = [
  { value: 'now 1-d', label: 'Past 24 Hours' },
  { value: 'now 7-d', label: 'Past 7 Days' },
  { value: 'today 1-m', label: 'Past 30 Days' },
  { value: 'today 3-m', label: 'Past 90 Days' },
  { value: 'today 12-m', label: 'Past 12 Months' },
  { value: 'today 5-y', label: 'Past 5 Years' }
];

const PROPERTIES = [
  { value: '', label: 'Web Search' },
  { value: 'youtube', label: 'YouTube Search' },
  { value: 'images', label: 'Google Images' },
  { value: 'news', label: 'Google News' },
  { value: 'froogle', label: 'Google Shopping' }
];

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer', 'forecast', 'compare', 'emerging', 'watchlist'

  // Explorer State
  const [searchQuery, setSearchQuery] = useState('electric vehicle');
  const [selectedGeo, setSelectedGeo] = useState('IN');
  const [selectedTimeframe, setSelectedTimeframe] = useState('today 12-m');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  // Prediction / Forecasting State (Section 4)
  const [forecastQuery, setForecastQuery] = useState('electric vehicle');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [forecastModel, setForecastModel] = useState('holt_linear');
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState(null);

  // Compare State
  const [compareTerms, setCompareTerms] = useState('ChatGPT, Claude AI, Gemini');
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Emerging Trends State (Live RSS)
  const [emergingGeo, setEmergingGeo] = useState('IN');
  const [emergingTrends, setEmergingTrends] = useState([]);
  const [emergingLoading, setEmergingLoading] = useState(false);


  // Watchlist State
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // Initial Load
  useEffect(() => {
    fetchExplorerData('electric vehicle', 'IN', 'today 12-m', '');
    fetchEmergingTrends('IN');
    fetchWatchlists();
  }, []);

  // 1. Fetch Explorer Data
  const fetchExplorerData = async (q, geo, timeframe, property) => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const params = `?q=${encodeURIComponent(q)}&geo=${geo}&timeframe=${encodeURIComponent(timeframe)}&property=${property}`;
      const res = await api.getTrendExplore(params);
      setTrendData(res);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to load Google Trends data.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch AI Trend Prediction & Forecast
  const fetchForecastData = async (kw, horizon, model, geo) => {
    setForecastLoading(true);
    setForecastError(null);
    try {
      const q = kw || forecastQuery;
      const h = horizon || forecastHorizon;
      const m = model || forecastModel;
      const g = geo || selectedGeo;
      const params = `?q=${encodeURIComponent(q)}&geo=${g}&timeframe=today 12-m&horizon=${h}&model=${m}`;
      const res = await api.getTrendForecast(params);
      setForecastData(res);
    } catch (err) {
      setForecastError(err.message || 'Failed to generate trend forecast.');
    } finally {
      setForecastLoading(false);
    }
  };

  // 3. Fetch Multi-Keyword Compare
  const fetchCompareData = async (overrideTerms) => {
    const terms = overrideTerms || compareTerms;
    if (!terms.trim()) return;
    setCompareLoading(true);
    try {
      const params = `?terms=${encodeURIComponent(terms)}&geo=${selectedGeo}&timeframe=${encodeURIComponent(selectedTimeframe)}`;
      const res = await api.getTrendCompare(params);
      setCompareData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  // 4. Fetch Live Emerging Trends
  const fetchEmergingTrends = async (geo) => {
    setEmergingLoading(true);
    try {
      const res = await api.getEmergingTrends(geo);
      setEmergingTrends(res.trends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setEmergingLoading(false);
    }
  };

  // 5. Track in Redes Creation SEO Keyword Engine
  const [keywordTrackingLoading, setKeywordTrackingLoading] = useState(null);
  const handleTrackInKeywords = async (kw) => {
    const targetKw = (kw || searchQuery).trim();
    if (!targetKw) return;
    setKeywordTrackingLoading(targetKw);
    try {
      await api.addKeyword({
        keyword: targetKw,
        intent: 'local'
      });
      setSaveToast(`Keyword "${targetKw}" added to Keyword Engine!`);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      setSaveToast(`Notice: ${err.message || 'Could not track keyword'}`);
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setKeywordTrackingLoading(null);
    }
  };

  // 6. Watchlist Operations
  const fetchWatchlists = async () => {
    setWatchlistLoading(true);
    try {
      const res = await api.getTrendWatchlists();
      setWatchlist(res.watchlists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAddToWatchlist = async (kw) => {
    try {
      await api.addTrendWatchlist({
        keyword: kw || searchQuery,
        geo: selectedGeo,
        property: selectedProperty
      });
      setSaveToast(`Added "${kw || searchQuery}" to active trend watchlist!`);
      setTimeout(() => setSaveToast(null), 3500);
      fetchWatchlists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWatchlist = async (id) => {
    try {
      await api.deleteTrendWatchlist(id);
      fetchWatchlists();
    } catch (err) {
      console.error(err);
    }
  };

  // Export Data to CSV
  const exportToCSV = () => {
    if (!trendData || !trendData.timeline) return;
    let csv = 'Date,Interest (0-100 Relative Index)\n';
    trendData.timeline.forEach(pt => {
      csv += `"${pt.date}",${pt.value}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_trends_${searchQuery}_${selectedGeo}.csv`;
    a.click();
  };

  // Construct Combined Historical + Forecast Chart Data
  const getCombinedForecastTimeline = () => {
    if (!forecastData || !forecastData.forecast?.feasible) return [];
    const hist = (forecastData.historicalTimeline || forecastData.timeline || []).slice(-15);
    const forecast = forecastData.forecast.forecastPoints || [];

    const combined = [];
    hist.forEach((pt, idx) => {
      combined.push({
        date: pt.date,
        historical: pt.value,
        forecast: idx === hist.length - 1 ? pt.value : null,
        upper80: idx === hist.length - 1 ? pt.value : null,
        lower80: idx === hist.length - 1 ? pt.value : null
      });
    });

    forecast.forEach(fc => {
      combined.push({
        date: fc.date,
        historical: null,
        forecast: fc.predictedValue,
        upper80: fc.upper80,
        lower80: fc.lower80,
        upper95: fc.upper95,
        lower95: fc.lower95
      });
    });

    return combined;
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#034bc0] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Trends Intelligence Pro • Local Search & Market Demand</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trend Research & Market Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Discover real-time search demand, rising customer queries, competitor popularity, and actionable SEO growth strategies.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleTrackInKeywords(searchQuery)}
            disabled={keywordTrackingLoading === searchQuery}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Track this keyword in SEO Keyword Engine"
          >
            {keywordTrackingLoading === searchQuery ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Track in SEO</span>
          </button>
          <button
            onClick={() => handleAddToWatchlist(searchQuery)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-blue-600" />
            <span>Track Query</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'explorer', label: 'Trend Explorer', icon: Search },
          { id: 'forecast', label: 'AI Prediction Center', icon: Activity, badge: 'Holt-Winters & MASE' },
          { id: 'compare', label: 'Multi-Keyword Compare', icon: Layers },
          { id: 'emerging', label: 'Live Emerging & Daily Trends', icon: Flame, badge: 'Live RSS' },
          { id: 'watchlist', label: 'Watchlists & Alerts', icon: Bell, count: watchlist.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'forecast' && !forecastData) fetchForecastData(searchQuery, 30, 'holt_linear', selectedGeo);
                if (tab.id === 'compare' && !compareData) fetchCompareData();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#034bc0] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Normalization & Methodology Notice Banner (Required by Section 3 & 21) */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Google Trends Measurement Methodology:</span> Google Trends reports{' '}
          <span className="font-semibold underline">normalized relative search interest</span> on a 0–100 scale, representing search popularity relative to the highest point on the chart for the given region and time. It does <em>not</em> represent absolute search volumes, unique queries, or ad impressions.
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: TREND EXPLORER */}
      {/* ============================================================== */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchExplorerData(searchQuery, selectedGeo, selectedTimeframe, selectedProperty);
              }}
              className="flex flex-col lg:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keyword, product, topic, or question (e.g. electric vehicle, AI agents, dal makhani)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {/* Geo Select */}
                <select
                  value={selectedGeo}
                  onChange={(e) => setSelectedGeo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>

                {/* Timeframe Select */}
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
                >
                  {TIMEFRAMES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Search Property Select */}
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer col-span-2 md:col-span-1"
                >
                  {PROPERTIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#034bc0] hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{loading ? 'Analyzing...' : 'Explore Trend'}</span>
              </button>
            </form>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#034bc0] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Retrieving Google Trends telemetry & running AI analysis...</p>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && !loading && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Trend Results View */}
          {trendData && !loading && (
            <div className="space-y-6">
              {/* Executive Metrics Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Search Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{trendData.analysis?.currentInterest ?? 0}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Latest normalized observation</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical Peak</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-blue-600">{trendData.analysis?.peak?.value ?? 0}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block truncate">Date: {trendData.analysis?.peak?.date || 'N/A'}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend Direction</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-sm font-extrabold px-2 py-0.5 rounded-full ${
                      trendData.analysis?.classification === 'Rising' || trendData.analysis?.classification === 'Emerging'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trendData.analysis?.classification === 'Declining'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {trendData.analysis?.classification || 'Stable'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {trendData.analysis?.percentChange > 0 ? '+' : ''}{trendData.analysis?.percentChange}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block truncate">vs historical baseline</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunity Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-black ${
                      (trendData.opportunityScore?.overallScore || 0) >= 70 ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {trendData.opportunityScore?.overallScore || 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-1 block truncate">
                    {trendData.opportunityScore?.rating || 'Calculating'}
                  </span>
                </div>
              </div>

              {/* Main Interest Over Time Chart */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#034bc0]" />
                      <span>Interest Over Time — "{trendData.keyword}"</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Normalized 0-100 trajectory for {trendData.geo} ({trendData.timeframe}) • {trendData.timeline?.length || 0} observation points
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600">
                    Source: Google Trends
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(val) => [`${val}/100`, 'Relative Search Interest']}
                        labelFormatter={(label) => `Interval: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={trendData.keyword}
                        stroke="#034bc0"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: '#034bc0', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Explanation text */}
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-start gap-2 border border-slate-100">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{trendData.analysis?.classificationReason}</span>
                </div>
              </div>

              {/* Two Column Layout: Opportunity Breakdown + Geographic Hotspots */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Opportunity Scorecard & Factor Breakdown */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Opportunity Score Breakdown</span>
                    </h3>
                    <span className="text-xs font-bold text-blue-600">
                      {trendData.opportunityScore?.overallScore}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {trendData.opportunityScore?.explanation}
                  </p>

                  <div className="space-y-3 pt-2">
                    {(trendData.opportunityScore?.factors || []).map((f, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{f.name} ({f.weight}%)</span>
                          <span className="font-bold text-slate-900">{f.score}/100</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              f.score >= 80 ? 'bg-emerald-500' : f.score >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${f.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block">{f.description}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                    Methodology: {trendData.opportunityScore?.methodology}
                  </div>
                </div>

                {/* 2. Geographic Demand & Regional Hotspots */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-[#034bc0]" />
                      <span>Interest by Region ({trendData.geo})</span>
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {trendData.regions?.length || 0} States / Regions
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {(trendData.regions || []).slice(0, 10).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-[10px] font-bold text-slate-400">#{i + 1}</span>
                          <span className="font-semibold text-slate-800 truncate">{r.geoName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${r.value}%` }}
                            />
                          </div>
                          <span className="font-extrabold text-slate-900 w-8 text-right">{r.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    Relative index: 100 indicates the state with peak relative interest proportion, not highest total population searches.
                  </p>
                </div>
              </div>

              {/* Related Queries: Rising Breakouts vs Top Queries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rising Queries */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span>Rising Queries & Breakouts</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">Velocity</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(trendData.relatedQueries?.rising || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No rising breakout queries reported for this period.</p>
                    ) : (
                      (trendData.relatedQueries?.rising || []).map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 text-xs hover:bg-slate-100/70 transition">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-slate-800 block truncate">{q.query}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                              q.isBreakout ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {q.formattedValue}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setSearchQuery(q.query);
                                fetchExplorerData(q.query, selectedGeo, selectedTimeframe, selectedProperty);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Explore this trend"
                            >
                              <Search className="w-3 h-3" />
                              <span>Explore</span>
                            </button>
                            <button
                              onClick={() => handleTrackInKeywords(q.query)}
                              disabled={keywordTrackingLoading === q.query}
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Track in SEO Keyword Engine"
                            >
                              {keywordTrackingLoading === q.query ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              <span>Track</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Queries */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-[#034bc0]" />
                      <span>Top High-Volume Related Queries</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">Relative Index</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(trendData.relatedQueries?.top || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No top related queries found.</p>
                    ) : (
                      (trendData.relatedQueries?.top || []).map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 text-xs hover:bg-slate-100/70 transition">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-slate-800 block truncate">{q.query}</span>
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.2 rounded-full inline-block mt-0.5">
                              {q.value}/100
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setSearchQuery(q.query);
                                fetchExplorerData(q.query, selectedGeo, selectedTimeframe, selectedProperty);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Explore this trend"
                            >
                              <Search className="w-3 h-3" />
                              <span>Explore</span>
                            </button>
                            <button
                              onClick={() => handleTrackInKeywords(q.query)}
                              disabled={keywordTrackingLoading === q.query}
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Track in SEO Keyword Engine"
                            >
                              {keywordTrackingLoading === q.query ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              <span>Track</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* AI Strategic Intelligence Engine Card */}
              {trendData.aiInsights && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-indigo-100 space-y-6 relative overflow-hidden">
                  {/* Decorative top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          AI Trend Intelligence & SEO Opportunities
                        </h3>
                        <p className="text-xs text-slate-500">
                          Evidence-Based Market Analysis • Methodological Fact & Hypothesis Separation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confidence: {trendData.aiInsights.confidenceScore ? `${trendData.aiInsights.confidenceScore}%` : '85%'}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Executive Summary
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {trendData.aiInsights.summary}
                    </p>
                  </div>

                  {/* 2 Pillars: Observed Empirical Data vs Unverified Hypotheses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Observed Data */}
                    <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2.5">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Observed Empirical Data</span>
                      </span>
                      <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                        {(trendData.aiInsights.observedData || []).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Unverified Hypotheses */}
                    <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2.5">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Unverified Hypotheses & Market Drivers</span>
                      </span>
                      <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                        {(trendData.aiInsights.unverifiedHypotheses || []).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actionable Content Recommendations */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Recommended Content Blueprints
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        High-Impact SEO Angles
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(trendData.aiInsights.contentRecommendations || []).map((rec, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {rec.format}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {rec.suggestedPublishTiming}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 leading-snug">
                            {rec.suggestedTitle}
                          </h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {rec.strategicAngle}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div className="flex flex-wrap gap-1">
                              {(rec.targetKeywords || []).map((kw, kwIdx) => (
                                <span key={kwIdx} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                            {rec.targetKeywords?.[0] && (
                              <button
                                onClick={() => handleTrackInKeywords(rec.targetKeywords[0])}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Track Keyword</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Local SEO & Business Marketing Tactics */}
                  {trendData.aiInsights.marketingTactics && trendData.aiInsights.marketingTactics.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Actionable Local SEO & Business Tactics
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Omnichannel Growth Plan
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trendData.aiInsights.marketingTactics.map((tac, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {tac.channel}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Impact: {tac.expectedImpact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">
                              {tac.action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: AI PREDICTION CENTER (SECTION 4) */}
      {/* ============================================================== */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Prediction Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Target className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={forecastQuery}
                  onChange={(e) => setForecastQuery(e.target.value)}
                  placeholder="Enter topic to forecast (e.g. electric vehicle, generative ai, cloud kitchen)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {/* Horizon Selector */}
                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
                >
                  <option value={7}>Horizon: 7 Days (Short-term)</option>
                  <option value={30}>Horizon: 30 Days (Medium-term)</option>
                  <option value={90}>Horizon: 90 Days (Quarterly)</option>
                </select>

                {/* Model Selector */}
                <select
                  value={forecastModel}
                  onChange={(e) => setForecastModel(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
                >
                  <option value="holt_linear">Model: Holt's Exponential Smoothing</option>
                  <option value="linear_trend">Model: Linear Drift / Trend</option>
                  <option value="persistence">Model: Persistence Naive Baseline</option>
                </select>

                {/* Geo Select */}
                <select
                  value={selectedGeo}
                  onChange={(e) => setSelectedGeo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer col-span-2 md:col-span-1"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchForecastData(forecastQuery, forecastHorizon, forecastModel, selectedGeo)}
                disabled={forecastLoading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {forecastLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                <span>{forecastLoading ? 'Computing...' : 'Generate Prediction'}</span>
              </button>
            </div>
          </div>

          {/* Forecast Error Notice */}
          {forecastError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{forecastError}</span>
            </div>
          )}

          {/* Forecast Main Content */}
          {forecastData && forecastData.forecast && (
            <div className="space-y-6">
              {/* Executive Forecast Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Observed Base</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{forecastData.forecast.currentObservedValue}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Baseline origin observation</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Trajectory</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-indigo-600">{forecastData.forecast.projectedValue}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 block ${
                    forecastData.forecast.projectedGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {forecastData.forecast.projectedGrowth >= 0 ? '+' : ''}{forecastData.forecast.projectedGrowth}% ({forecastData.forecast.forecastTrajectory})
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backtest Accuracy (MASE)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-600">
                      {forecastData.forecast.backtestMetrics?.mase ?? '0.0'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {forecastData.forecast.backtestMetrics?.mase < 1.0 ? '✓ Beats naive persistence' : 'Baseline comparable'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Statistical Model</span>
                  <div className="mt-1">
                    <span className="text-sm font-black text-slate-900 block truncate">
                      {forecastData.forecast.modelUsed}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600">
                      {forecastData.forecast.modelVersion}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {forecastData.forecast.trainingWindowPoints} historical points
                  </span>
                </div>
              </div>

              {/* Main Visual Forecast Chart with Uncertainty Bands */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span>{forecastData.keyword}: Historical Observations + {forecastData.forecast.horizonDays}-Day Forecast Projection</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Overlaid timeline with 80% & 95% statistical confidence expansion bounds
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Horizon: {forecastData.forecast.horizonDays} Days
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getCombinedForecastTimeline()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                        formatter={(val, name) => [`${val}/100`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        name="Observed Empirical Search"
                        stroke="#034bc0"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Statistical Projected Forecast"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="upper80"
                        name="80% Upper Band"
                        stroke="#93c5fd"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="lower80"
                        name="80% Lower Band"
                        stroke="#93c5fd"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Backtesting Performance Scorecard & Evaluation Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Walk-Forward Backtesting Evaluation (Holdout Test Set)</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500">No Temporal Leakage</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">MAE (Mean Absolute Error)</span>
                      <span className="text-lg font-black text-slate-800">{forecastData.forecast.backtestMetrics?.mae}</span>
                      <span className="text-[10px] text-slate-500 block">Baseline Naive: {forecastData.forecast.baselineMetrics?.mae}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">RMSE (Root Mean Square)</span>
                      <span className="text-lg font-black text-slate-800">{forecastData.forecast.backtestMetrics?.rmse}</span>
                      <span className="text-[10px] text-slate-500 block">Baseline Naive: {forecastData.forecast.baselineMetrics?.rmse}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">sMAPE (Symmetric Percentage)</span>
                      <span className="text-lg font-black text-slate-800">{forecastData.forecast.backtestMetrics?.smape}</span>
                      <span className="text-[10px] text-slate-500 block">Scale-independent relative error</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">MASE (Scaled vs Naive)</span>
                      <span className="text-lg font-black text-emerald-600">{forecastData.forecast.backtestMetrics?.mase}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {forecastData.forecast.backtestMetrics?.mase < 1.0 ? '✓ Outperforms Persistence' : 'Equal to random walk'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-1">
                    Evaluation partitioned chronological historical data: first 75% points reserved strictly for training; final 25% evaluated as unseen holdout test data.
                  </p>
                </div>

                {/* Assumptions & Methodological Limitations (Section 4.4 & 4.5) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Mathematical Assumptions & Limitations</span>
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Assumptions:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {(forecastData.forecast.assumptions || []).map((asm, idx) => (
                        <li key={idx}>{asm}</li>
                      ))}
                    </ul>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Disclosed Limitations:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                      {(forecastData.forecast.limitations || []).map((lim, idx) => (
                        <li key={idx}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MULTI-KEYWORD COMPARISON */}
      {/* ============================================================== */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#034bc0]" />
              <span>Compare Up to 5 Keywords or Brands Concurrently</span>
            </h3>

            {/* Quick Preset Comparison Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Quick Presets:</span>
              {[
                'ChatGPT, Claude AI, Gemini',
                'Local SEO, Google Ads, Social Media',
                'Electric Vehicle, Hybrid Car, Petrol Car'
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setCompareTerms(preset);
                    fetchCompareData(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-semibold text-slate-600 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={compareTerms}
                onChange={(e) => setCompareTerms(e.target.value)}
                placeholder="Comma separated topics: e.g. iPhone, Samsung, Pixel"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              <button
                onClick={() => fetchCompareData()}
                disabled={compareLoading}
                className="px-6 py-2.5 rounded-xl bg-[#034bc0] hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {compareLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>Compare</span>
              </button>
            </div>
          </div>

          {compareData && (
            <div className="space-y-6">
              {/* Overlaid Comparative Chart */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Comparative Relative Search Popularity</h4>
                    <p className="text-xs text-slate-500">Overlaid timeline normalized against peak competitor</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{compareData.timeframe}</span>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compareData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {(compareData.terms || []).map((term, idx) => {
                        const colors = ['#034bc0', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                        return (
                          <Line
                            key={term}
                            type="monotone"
                            dataKey={term}
                            name={term}
                            stroke={colors[idx % colors.length]}
                            strokeWidth={2.5}
                            dot={false}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparative Ranking Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(compareData.comparisons || []).map((comp, idx) => (
                  <div key={comp.term} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">#{idx + 1} {comp.term}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Avg: {comp.averageInterest}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Peak: {comp.peakInterest}/100</span>
                      <span>Current: {comp.currentInterest}/100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leader Takeaway */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>{compareData.insights?.leaderSummary}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: LIVE EMERGING & DAILY TRENDS (RSS) */}
      {/* ============================================================== */}
      {activeTab === 'emerging' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Trends Real-Time Daily Feed</h3>
                <p className="text-[11px] text-slate-500">Live search queries with associated news publications & traffic</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={emergingGeo}
                onChange={(e) => {
                  setEmergingGeo(e.target.value);
                  fetchEmergingTrends(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={() => fetchEmergingTrends(emergingGeo)}
                disabled={emergingLoading}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${emergingLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergingTrends.map((trend, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{trend.query}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                      {trend.traffic} searches
                    </span>
                  </div>

                  {trend.primaryArticle && (
                    <a
                      href={trend.primaryArticle.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-slate-600 hover:text-blue-600 line-clamp-2 transition leading-snug"
                    >
                      {trend.primaryArticle.title}
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {trend.primaryArticle?.source || 'Google News'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrackInKeywords(trend.query)}
                      disabled={keywordTrackingLoading === trend.query}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      title="Track in SEO Keyword Engine"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Track SEO</span>
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery(trend.query);
                        setActiveTab('explorer');
                        fetchExplorerData(trend.query, emergingGeo, 'today 12-m', '');
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Analyze</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: WATCHLISTS & ALERTS */}
      {/* ============================================================== */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>Monitored Trend Watchlist</span>
              </h3>
              <p className="text-xs text-slate-500">Tracked search terms with spike thresholds and alerts</p>
            </div>
            <button
              onClick={() => handleAddToWatchlist()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Current Query</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tracked Keyword</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Current Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Alert Trigger</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {watchlist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No tracked trends in your watchlist yet. Click "Track Query" to monitor keywords.
                    </td>
                  </tr>
                ) : (
                  watchlist.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.keyword}</td>
                      <td className="py-3 px-4 text-slate-600">{item.geo}</td>
                      <td className="py-3 px-4 font-black text-blue-600">{item.current_score}/100</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {item.trend_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">Spike &gt; {item.spike_threshold}%</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteWatchlist(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
