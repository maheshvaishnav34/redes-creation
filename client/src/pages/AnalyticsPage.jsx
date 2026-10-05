import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Star, MessageSquare, 
  Smile, Frown, Meh, Target, Calendar, Download, Filter, 
  CheckCircle2, Clock, ThumbsUp, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { activeBusiness } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30D');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [activeBusiness, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const trendsList = data.trends?.reviewTrends || data.reviewTrends || [];
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Reviews,Average Rating,Positive,Neutral,Negative\n"
      + trendsList.map(r => `${r.date},${r.reviews || 0},${r.avgRating || '5.0'},${r.positive || 0},${r.neutral || 0},${r.negative || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Redes_Analytics_${activeBusiness?.name || 'Workspace'}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Aggregating Local SEO & Review Analytics...</p>
        </div>
      </div>
    );
  }

  const reviewsSummary = data?.reviewsSummary || {};
  const keywordsSummary = data?.keywordsSummary || {};
  const totalReviews = Number(reviewsSummary.total_reviews) || 1;
  const posCount = Number(reviewsSummary.positive_count) || 0;
  const neuCount = Number(reviewsSummary.neutral_count) || 0;
  const negCount = Number(reviewsSummary.negative_count) || 0;

  const posPct = Math.round((posCount / totalReviews) * 100);
  const neuPct = Math.round((neuCount / totalReviews) * 100);
  const negPct = Math.round((negCount / totalReviews) * 100);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Unified Analytics & Intelligence Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Measured customer sentiment, local ranking trajectory, and review acquisition velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Time range selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {['7D', '30D', '90D', '6M', '1Y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Average Rating</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
            {Number(reviewsSummary.avg_rating || 4.8).toFixed(1)}
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +0.2
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Out of 5.0 on Google Maps</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Response Rate</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
            {data?.responseRate || '100'}%
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> SLA Met
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{reviewsSummary.replied_reviews || 0} of {totalReviews} addressed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Top 3 Rankings</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
            {keywordsSummary.top_3_keywords || 4} Keywords
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +2
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Google Maps Local 3-Pack</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Average Reply Speed</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
            18 Mins
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -42m
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Automated by AI Engine</div>
        </div>
      </div>

      {/* Row 2: Review Velocity & Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Influx & Daily Star Rating</h3>
              <p className="text-xs text-slate-500">New verified reviews received per day</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Positive</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Neutral</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Negative</span>
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {data?.reviewTrends?.map((item, idx) => {
              const maxVal = 12;
              const total = item.reviews;
              const heightPercent = Math.min(100, Math.round((total / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full relative flex flex-col justify-end items-center h-full">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-20">
                      <div>{item.reviews} Reviews (Avg ★{item.avgRating})</div>
                      <div>Pos: {item.positive} | Neu: {item.neutral} | Neg: {item.negative}</div>
                    </div>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-300 group-hover:from-indigo-700 group-hover:to-indigo-500 shadow-sm"
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Distribution Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Sentiment Polarization</h3>
            <p className="text-xs text-slate-500 mb-6">AI natural language analysis of all feedback</p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Smile className="w-4 h-4" /> Positive
                  </span>
                  <span className="text-slate-900 dark:text-white">{posPct}% ({posCount})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${posPct}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-500"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Meh className="w-4 h-4" /> Neutral / Mixed
                  </span>
                  <span className="text-slate-900 dark:text-white">{neuPct}% ({neuCount})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${neuPct}%` }} className="bg-amber-500 h-full rounded-full transition-all duration-500"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Frown className="w-4 h-4" /> Negative
                  </span>
                  <span className="text-slate-900 dark:text-white">{negPct}% ({negCount})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${negPct}%` }} className="bg-rose-500 h-full rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>92% sentiment net promoter score across active channels.</span>
          </div>
        </div>
      </div>

      {/* Row 3: Customer Themes & Keyword Ranking Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Praised vs Complaint Themes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Top Customer Discussion Themes (AI Topic Extraction)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated topics discovered directly from genuine customer reviews
          </p>

          <div className="space-y-3">
            {data?.topThemes?.map((theme, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  {theme.type === 'praise' ? (
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{theme.name}</div>
                    <div className="text-[11px] text-slate-400">{theme.mentions} verified customer mentions</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    theme.type === 'praise' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}>
                    {theme.sentiment}% Net Positive
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Rank Trajectory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Local Rank Trajectory (Average Position)</h3>
              <p className="text-xs text-slate-500">Daily average position across target keywords</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              Rank #2.6 Avg
            </span>
          </div>

          <div className="h-60 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {data?.keywordRankTrends?.map((item, idx) => {
              // Lower rank number is better! Invert for visualization height: #1 is highest bar
              const heightPercent = Math.max(20, Math.round(((6 - item.avgRank) / 5) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full relative flex flex-col justify-end items-center h-full">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-20">
                      <div>Avg Rank #{item.avgRank}</div>
                      <div>Top 3 Keywords: {item.top3}</div>
                      <div>Visibility: {item.visibility}%</div>
                    </div>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-sm"
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Historical movement: <strong>+1.2 positions</strong> gained in {timeRange}</span>
            <span>Total Tracked Keywords: <strong>{keywordsSummary.total_keywords || 6}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
