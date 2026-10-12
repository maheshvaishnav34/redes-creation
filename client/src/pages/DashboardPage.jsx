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
  QrCode,
  Lightbulb,
  BarChart3,
  FileText,
  Users2,
  Flame,
  Globe,
  Layers,
  Send
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

      {/* Primary KPI Metric Cards (6-Card Executive Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Local SEO Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Local SEO Score</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.localSeoScore || 82}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>Optimal Level</span>
          </div>
        </div>

        {/* Metric 2: Google Rating */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Google Rating</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.avgRating || '4.6'}
            </span>
            <span className="text-amber-500 text-sm">⭐</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+0.2 vs last month</span>
          </div>
        </div>

        {/* Metric 3: Total Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reviews</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#034bc0] border border-blue-200">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {(stats.totalReviews || 1284).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#034bc0] font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Growth +6.7%</span>
          </div>
        </div>

        {/* Metric 4: Reviews This Month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-200">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.reviewsThisMonth || '+86'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Campaign Active</span>
          </div>
        </div>

        {/* Metric 5: Sentiment Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sentiment</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.positivePercent || 87}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold">POS</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <span className="text-rose-600 font-bold">{stats.negativePercent || 8}% Neg</span>
            <span>•</span>
            <span className="text-slate-500">{stats.neutralPercent || 5}% Neu</span>
          </div>
        </div>

        {/* Metric 6: Competitor Position */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Competitor Rank</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <span className="text-xs font-black">#</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.competitorPosition || '#2'}
            </span>
            <span className="text-xs text-slate-500 font-medium">in Area</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>Targeting #1 Spot</span>
          </div>
        </div>
      </div>

      {/* Section 9: AUTOMATIC REVIEW FEEDBACK & LOCAL SEO INTELLIGENCE DASHBOARD PANEL */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#034bc0] shrink-0">
              <Sparkles className="w-5 h-5 text-[#034bc0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Automatic Review Feedback & Intelligence</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#034bc0]">
                  Real-time NLP
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Continuous AI monitoring aggregating genuine Google customer feedback, complaints, and local search signals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border ${
              trends.aiIntelligence?.priority === 'HIGH'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              Priority: {trends.aiIntelligence?.priority || 'MEDIUM'}
            </span>
            <button
              onClick={() => navigate('/reviews')}
              className="text-xs font-bold text-[#034bc0] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Review Feedback */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#034bc0]" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#034bc0]">
                Review Feedback
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              "{trends.aiIntelligence?.identifiedPattern || "Customers frequently appreciate the staff's behaviour and service quality, while waiting time is the most common complaint."}"
            </p>
          </div>

          {/* Box 2: AI Insight */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-800">
                AI Trend Insight
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              "{trends.aiIntelligence?.unresolvedAlert || "Waiting time has appeared in recent reviews during the last 30 days."}"
            </p>
          </div>

          {/* Box 3: Recommendation */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-800">
                Recommendation
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              "{trends.aiIntelligence?.actionableRecommendation || "Consider increasing staffing during peak hours and improving appointment/service scheduling."}"
            </p>
          </div>
        </div>

        {/* Customer Search / Topic Signals (Section 13) */}
        {trends.aiIntelligence?.localSeoSignals?.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mr-1">
              Customer Search & Topic Signals:
            </span>
            {trends.aiIntelligence.localSeoSignals.map((sig, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 flex items-center gap-1.5"
                title={sig.opportunity}
              >
                <Search className="w-3 h-3 text-[#034bc0]" />
                <span className="capitalize">{sig.phrase}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-600 font-black">
                  {sig.mentions} mentions
                </span>
              </span>
            ))}
          </div>
        )}
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

      {/* AI INTELLIGENCE & RECOMMENDATION SPOTLIGHT */}
      <div className="rounded-2xl bg-linear-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#034bc0] text-white flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                AI Customer Voice & Reputation Insights
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                87% Positive Sentiment
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              “Customers frequently mention staff behaviour, service quality and waiting time.”
            </h3>
            <div className="p-3.5 rounded-xl bg-white/90 border border-blue-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              <strong className="text-[#034bc0]">💡 AI Recommendation:</strong> “Improve response time and address waiting-time complaints to increase customer satisfaction and review sentiment.”
            </div>
          </div>

          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => navigate('/reviews')}
              className="px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Generate AI Review Replies</span>
            </button>
            <button
              onClick={() => navigate('/campaigns')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Collect Feedback with AI Booster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Competitor Intelligence & Review Themes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitor Intelligence Comparison Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏆 Competitor Intelligence</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Rank #2 Local
                </span>
              </h2>
              <p className="text-xs text-slate-500">Benchmark your business against top local competitor</p>
            </div>
            <button
              onClick={() => navigate('/competitors')}
              className="text-xs text-[#034bc0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              All Competitors <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Metric</th>
                  <th className="py-2.5 font-bold text-[#034bc0]">Your Business</th>
                  <th className="py-2.5 font-bold text-slate-600">Top Competitor</th>
                  <th className="py-2.5 font-bold text-right">Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {(trends.competitorComparison || [
                  { metric: 'Google Rating', yourBusiness: '4.6 ⭐', competitor: '4.4 ⭐', status: 'ahead' },
                  { metric: 'Total Reviews', yourBusiness: '1,284', competitor: '1,850', status: 'behind' },
                  { metric: 'Review Growth Rate', yourBusiness: '+6.7%', competitor: '+3.2%', status: 'ahead' },
                  { metric: 'Positive Sentiment', yourBusiness: '87%', competitor: '81%', status: 'ahead' },
                  { metric: 'Local SEO Health Score', yourBusiness: '82 / 100', competitor: '76 / 100', status: 'ahead' }
                ]).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 text-slate-800 font-bold">{row.metric}</td>
                    <td className="py-3 text-[#034bc0] font-extrabold">{row.yourBusiness}</td>
                    <td className="py-3 text-slate-600">{row.competitor}</td>
                    <td className="py-3 text-right">
                      {row.status === 'ahead' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <TrendingUp className="w-3 h-3" /> Ahead
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Targeting
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Review Intelligence Themes */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer Review Voice Topics</h2>
              <p className="text-xs text-slate-500">Key topics extracted from genuine customer reviews</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">NLP Monitored</span>
          </div>

          <div className="space-y-2.5">
            {(trends.topThemes || []).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.type === 'praise' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{t.name}</span>
                    <span className="text-[10px] text-slate-500">{t.mentions} customer mentions in reviews</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.type === 'praise' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${t.sentiment}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold ${t.type === 'praise' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {t.sentiment}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPECIFICATION SECTION 11: DASHBOARD KEY WIDGETS HUB */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-[#034bc0]">
                Specification Section 11
              </span>
              <h2 className="text-base font-extrabold text-slate-900">Dashboard Core Modules & Key Widgets</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant operational status across all 8 intelligence engines with live signals and direct execution shortcuts
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl self-start sm:self-auto">
            8 / 8 Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Widget 1: Overview */}
          <div
            onClick={() => navigate('/seo')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#034bc0]" />
                  <span>Overview</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Health 94%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Rating: <strong>{stats.avgRating || '4.6'}★</strong> • Reviews: <strong>{stats.totalReviews || '1,284'}</strong> • Unanswered: <strong>{stats.unansweredReviews || '2'}</strong>
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                SLA: <span className="text-emerald-700 font-bold">94.2%</span> • Rank: <span className="text-[#034bc0] font-bold">+2 positions</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#034bc0] group-hover:translate-x-0.5 transition-transform mt-3">
              <span>View Health Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 2: Reviews */}
          <div
            onClick={() => navigate('/reviews')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#034bc0]" />
                  <span>Reviews Engine</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  2 Pending Signoff
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                NLP Topics: <strong>Staff, Food, Waiting Time</strong>
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Positive: <span className="text-emerald-700 font-bold">87%</span> • Auto-replies: <span className="text-slate-700 font-bold">Active</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#034bc0] group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Open Review Inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 3: Keywords */}
          <div
            onClick={() => navigate('/keywords')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Keywords & Geo-Grid</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  4 in Top 3
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                8 Targets tracked • Geo-Grid: <strong>78.4% (5km)</strong>
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Opportunity Score: <span className="text-emerald-700 font-bold">85 / 100</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Explore Keyword Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 4: Review Campaigns */}
          <div
            onClick={() => navigate('/campaigns')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Review Campaigns</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                QR & Direct Links • <strong>86 submissions</strong> this month
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Google Conversion: <span className="text-emerald-700 font-bold">64.5%</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Manage QR Funnels</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 5: SEO & Growth Engine */}
          <div
            onClick={() => navigate('/seo')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Maps Growth Engine</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Section 9
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                4 Secondary Categories • 3 Ready Google Posts
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                NAP Consistency: <span className="text-emerald-700 font-bold">96% verified</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Optimize Profile Signals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 6: Competitors */}
          <div
            onClick={() => navigate('/competitors')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-purple-600" />
                  <span>Competitor Intel</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Rank #2 Local
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                3 Market Rivals • Velocity Advantage: <strong>+51%</strong>
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Advantage: <span className="text-emerald-700 font-bold">Higher 4.8★ vs 4.2★</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Analyze Competitor Gaps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 7: Analytics */}
          <div
            onClick={() => navigate('/analytics')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Analytics & Trends</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  +6.7% MoM
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Rating trend: <strong>+0.2★</strong> • Sentiment Velocity: <strong>Upward</strong>
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Keywords trajectory: <span className="text-emerald-700 font-bold">Bullish</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>View Deep Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Widget 8: Reports */}
          <div
            onClick={() => navigate('/reports')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Reports & Delivery</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Executive Weekly & Monthly PDF Export
              </p>
              <div className="text-[10px] text-slate-500 font-semibold">
                Schedule: <span className="text-slate-700 font-bold">Auto-sent on 1st of month</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform mt-3">
              <span>Generate Client Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
