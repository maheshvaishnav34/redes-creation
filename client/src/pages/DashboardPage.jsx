import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  Plus,
  QrCode
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const DashboardPage = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsOverview();
      setOverview(res);
    } catch (err) {
      console.error('[DASHBOARD] Error loading overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleBizSwitch = () => fetchDashboardData();
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200 shadow-sm"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 shadow-sm"></div>
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-slate-200 shadow-sm"></div>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const healthScore = overview?.healthScore || {};
  const trends = overview?.trends || {};

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Welcome & Health Score Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 lg:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#034bc0] border border-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#034bc0]" />
                Executive Command Center
              </span>
              <span className="text-xs text-slate-400">• Updated Just Now</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeBusiness?.name || 'Saffron Fine Dine & Banquets'}
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Operating in the <span className="text-[#034bc0] font-semibold capitalize">{activeBusiness?.industry_id || 'Hospitality'}</span> niche. AI reputation engine is actively monitoring Google reviews, local rank coordinates, and competitor movements.
            </p>
          </div>

          {/* Health Score Dial */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${healthScore.overall || 94}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-extrabold text-lg text-slate-900">
                {Math.round(healthScore.overall || 95)}%
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Local SEO Health</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Optimal Authority</span>
              <button
                onClick={() => navigate('/seo')}
                className="text-[11px] text-[#034bc0] hover:underline font-semibold mt-1 flex items-center gap-1 cursor-pointer"
              >
                View Audit Breakdown <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI TODAY INTELLIGENCE BAR */}
      <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#034bc0] flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">AI Briefing</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold">
                  2 Actions Requiring Approval
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Target keyword <span className="text-slate-900 font-semibold">"best fine dining restaurant ahmedabad"</span> moved up to <span className="text-emerald-600 font-bold">#2</span>. A 1-star allergen concern review is drafted and awaiting manager signoff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/ai-center')}
              className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Review AI Approvals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#034bc0]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Rating */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Google Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-200">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {stats.avgRating || '4.8'}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+0.2 vs last month</span>
            <span className="text-slate-400 font-normal ml-1">({stats.totalReviews || 428} total)</span>
          </div>
        </div>

        {/* Metric 2: Review Response Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Review Response Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#034bc0] border border-blue-200">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {stats.responseRate || '94.2%'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Avg Reply Speed: 2.4 hours</span>
          </div>
        </div>

        {/* Metric 3: Top-3 Keywords */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Top-3 Local Rankings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {stats.top3Keywords || '5'}
            </span>
            <span className="text-xs text-slate-400 font-medium">terms in 3-Pack</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{stats.improvedKeywords || 2} moved up this week</span>
          </div>
        </div>

        {/* Metric 4: Geo-Grid Coverage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Geo-Grid Visibility</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-200">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">78.4%</span>
            <span className="text-xs text-slate-400 font-medium">(5km radius)</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#034bc0] font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span onClick={() => navigate('/geo-grid')} className="cursor-pointer hover:underline">
              Inspect 5x5 heatmap pins
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Review Velocity & Rating Timeline */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Review Volume & Sentiment Velocity</h2>
              <p className="text-xs text-slate-500">Daily incoming reviews and positive satisfaction ratio</p>
            </div>
            <button
              onClick={() => navigate('/reviews')}
              className="text-xs text-[#034bc0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Open Inbox <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.reviewTrends || []}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#034bc0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#034bc0" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="reviews" stroke="#034bc0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReviews)" name="Reviews Received" />
                <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} fillOpacity={0} name="5★ / 4★ Positive" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Local Rank Visibility Trend */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Local Rank Visibility Trend</h2>
              <p className="text-xs text-slate-500">Average local 3-Pack rank progression over the past 7 days</p>
            </div>
            <button
              onClick={() => navigate('/keywords')}
              className="text-xs text-[#034bc0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Keywords <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.keywordRankTrends || []}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} reversed domain={[1, 5]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="avgRank" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Average Rank (1 is top)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Review Intelligence Topics & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Praise & Complaint Themes */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer Review Intelligence Themes</h2>
              <p className="text-xs text-slate-500">Dynamic niche topics extracted from customer review language</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Live NLP Detection</span>
          </div>

          <div className="space-y-3">
            {(trends.topThemes || []).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${t.type === 'praise' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{t.name}</span>
                    <span className="text-[10px] text-slate-500">{t.mentions} customer mentions in reviews</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.type === 'praise' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${t.sentiment}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold ${t.type === 'praise' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {t.sentiment}% {t.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Launchpad */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Operations Launchpad</h2>
            <p className="text-xs text-slate-500">Execute essential Local SEO and Reputation actions</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/reviews')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors border border-slate-200 text-xs font-semibold text-slate-800 hover:text-[#034bc0] group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#034bc0]" />
                <span>Review Inbox ({stats.unansweredReviews || 2} unanswered)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#034bc0] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/geo-grid')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors border border-slate-200 text-xs font-semibold text-slate-800 hover:text-[#034bc0] group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#034bc0]" />
                <span>Geo-Grid Heatmap Scanner</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#034bc0] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/campaigns')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors border border-slate-200 text-xs font-semibold text-slate-800 hover:text-[#034bc0] group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>QR Code Review Campaigns</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors border border-slate-200 text-xs font-semibold text-slate-800 hover:text-[#034bc0] group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Export Executive PDF Report</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Agency Multi-Tenant Node: {overview?.business?.city || 'Ahmedabad, Gujarat'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
