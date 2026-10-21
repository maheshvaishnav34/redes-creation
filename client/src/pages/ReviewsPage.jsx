import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Star,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Check,
  X,
  Edit3,
  Clock,
  Send,
  RefreshCw,
  ThumbsUp,
  Tag,
  Lightbulb,
  Copy,
  RotateCw,
  Target,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GoogleReviewsSection, GoogleLogoIcon } from '../components/reviews/GoogleReviewsSection.jsx';

export const ReviewsPage = () => {
  const { activeBusiness } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [showGoogleShowcase, setShowGoogleShowcase] = useState(false);

  // Filters (Section 6)
  const [statusFilter, setStatusFilter] = useState('all'); // all, unanswered, replied
  const [starFilter, setStarFilter] = useState(null); // 1, 2, 3, 4, 5
  const [sentimentFilter, setSentimentFilter] = useState(null); // positive, mixed, neutral, negative
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, critical, high, medium, low
  const [topicFilter, setTopicFilter] = useState('all'); // all, service, staff, product, quality, cleanliness, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulesMatrix, setShowRulesMatrix] = useState(false);

  // AI Reply Generator Modal State (Section 7)
  const [activeModalReview, setActiveModalReview] = useState(null);
  const [aiOptions, setAiOptions] = useState([]);
  const [selectedOptionText, setSelectedOptionText] = useState('');
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [safetyChecks, setSafetyChecks] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let queryStr = '?limit=all&';
      if (statusFilter !== 'all') queryStr += `reply_status=${statusFilter}&`;
      if (starFilter) queryStr += `rating=${starFilter}&`;
      if (sentimentFilter) queryStr += `sentiment=${sentimentFilter}&`;
      if (priorityFilter !== 'all') queryStr += `priority=${priorityFilter}&`;
      if (topicFilter !== 'all') queryStr += `topic=${encodeURIComponent(topicFilter)}&`;
      if (searchQuery) queryStr += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await api.listReviews(queryStr);
      setReviews(data.reviews || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('[REVIEWS] Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const data = await api.getGoogleStatus();
      setGoogleStatus(data);
    } catch {}
  };

  useEffect(() => {
    fetchReviews();
    fetchGoogleStatus();
    const handleBizSwitch = () => {
      fetchReviews();
      fetchGoogleStatus();
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, [statusFilter, starFilter, sentimentFilter, priorityFilter, topicFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleSyncRecent = async () => {
    try {
      setSyncing(true);
      await api.syncGoogleNow();
      setTimeout(async () => {
        await fetchReviews();
        setSyncing(false);
      }, 1500);
    } catch (err) {
      console.error('[REVIEWS] Google sync failed:', err);
      await fetchReviews();
      setSyncing(false);
    }
  };

  const handleReanalyze = async (reviewId) => {
    try {
      setReanalyzingId(reviewId);
      const res = await api.reanalyzeReview(reviewId);
      if (res.success && res.review) {
        setReviews(prev => prev.map(r => r.id === reviewId ? res.review : r));
      } else {
        await fetchReviews();
      }
    } catch (err) {
      console.error('[REVIEWS] Re-analysis failed:', err);
      alert('Failed to re-analyze review: ' + (err.message || 'Server error'));
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleCopySuggestion = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenAiModal = async (review, prefilledText = null) => {
    setActiveModalReview(review);
    setGeneratingAi(true);
    setAiOptions([]);
    setFeedbackMsg('');

    if (prefilledText) {
      setSelectedOptionText(prefilledText);
      setGeneratingAi(false);
      return;
    }

    try {
      const res = await api.generateAIReply(review.id, { customTone: selectedTone });
      setAiOptions(res.options || []);
      setSelectedOptionText(res.response?.response_text || res.options?.[0]?.text || review.response_suggestion || '');
      setSafetyChecks(res.safetyChecks || null);
    } catch (err) {
      console.error('[AI_REPLY] Error generating reply:', err);
      setFeedbackMsg('Failed to generate AI options. Please try again.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handlePublishReply = async () => {
    if (!activeModalReview) return;
    setPublishing(true);

    try {
      await api.approveAndPublishReply(activeModalReview.id, {
        responseText: selectedOptionText,
        tone: selectedTone
      });
      setFeedbackMsg('Reply approved & published to Google successfully!');
      setTimeout(() => {
        setActiveModalReview(null);
        fetchReviews();
      }, 1000);
    } catch (err) {
      console.error('[AI_REPLY] Publish failed:', err);
      setFeedbackMsg('Failed to publish reply. Please verify connection.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Review & Local SEO Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#034bc0] border border-blue-200">
              Live Google Sync
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs">
            <span className="text-slate-600 font-medium">
              Account: <strong className="text-slate-900">{activeBusiness?.name || 'Selected Business'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            {googleStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected: {googleStatus.connection?.account_email || 'Google Account'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Google Profile Pending Connection</span>
                <Link to="/google" className="underline font-bold text-[#034bc0] hover:text-blue-800 ml-1">Connect now →</Link>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/google-reviews"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-[#034bc0] text-xs font-bold transition-all shadow-2xs shrink-0"
            title="Open dedicated Google Reviews Dashboard"
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span>Google Reviews Dashboard</span>
          </Link>

          <button
            onClick={() => setShowGoogleShowcase(prev => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${showGoogleShowcase
                ? 'bg-blue-50 border-blue-300 text-[#034bc0] shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            title="Preview customer-facing live Google Reviews widget"
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span>{showGoogleShowcase ? 'Hide Google Showcase' : 'Live Google Showcase'}</span>
          </button>

          <button
            onClick={() => setShowRulesMatrix(prev => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${showRulesMatrix
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Auto-Reply Rules (7.1)</span>
          </button>

          <button
            onClick={handleSyncRecent}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Recent Reviews'}</span>
          </button>
        </div>
      </div>

      {/* Live Google Reviews Customer-Facing Showcase */}
      {showGoogleShowcase && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GoogleLogoIcon className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-900">
                Live Google Reviews Showcase Preview ({activeBusiness?.name || 'Active Account'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                Live Place Details
              </span>
            </div>
            <button
              onClick={() => setShowGoogleShowcase(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer px-2 py-1 rounded hover:bg-slate-200/60 transition"
            >
              ✕ Close
            </button>
          </div>
          <GoogleReviewsSection businessId={activeBusiness?.id} className="py-6 sm:py-8 border-none" />
        </div>
      )}

      {/* Section 7.1 Auto-Reply Rules Guidance Card */}
      {showRulesMatrix && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                Section 7.1 Auto-Reply Engine Rules & Default Behavior Matrix
              </h3>
            </div>
            <button onClick={() => setShowRulesMatrix(false)} className="text-amber-700 hover:text-amber-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>5★ Positive Reviews</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">Auto Reply Allowed</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Policy-checked warm AI response automatically published within SLA timeframe.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>4★ Positive Reviews</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">Auto Reply Allowed</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Appreciates praise, reinforces high-satisfaction points without repetitive templates.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>3★ Mixed Feedback</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">AI Draft + Approval</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                AI prepares empathetic draft; queued in Approval Queue for owner review before posting.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>1–2★ Complaints</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">Manual Escalation</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Routed directly to Critical/High Priority escalation queue; requires manager approval.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>Legal / Safety Sensitive</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-extrabold">Manual Review</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                High-risk legal/safety triggers strictly bypass auto-reply for legal/medical review.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                <span>Spam / Suspicious</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">Human Review Queue</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Pattern-detected for human verification; never accuses customers publicly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Indexed</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{summary.total_reviews || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Average Rating</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">
            {summary.avg_rating ? Number(summary.avg_rating).toFixed(1) : (summary.total_reviews > 0 ? '0.0' : 'N/A')} ★
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">AI Analyzed</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {summary.processed_count || reviews.filter(r => r.aiAnalysis?.processed).length || 0} reviews
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Pending Action</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{summary.unanswered_count || 0}</p>
        </div>
      </div>

      {/* Filter Toolbar (Section 6) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs with Modern Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-xs font-semibold overflow-x-auto no-scrollbar w-full sm:w-auto shadow-2xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap font-bold text-xs ${
                statusFilter === 'all'
                  ? 'bg-white text-[#034bc0] shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>All Reviews</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                statusFilter === 'all'
                  ? 'bg-blue-50 text-[#034bc0]'
                  : 'bg-slate-200/70 text-slate-600'
              }`}>
                {summary.total_reviews || reviews.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('unanswered')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap font-bold text-xs ${
                statusFilter === 'unanswered'
                  ? 'bg-white text-rose-700 shadow-xs border border-rose-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Pending Reply</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                (summary.unanswered_count || 0) > 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : statusFilter === 'unanswered'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}>
                {summary.unanswered_count || 0}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('replied')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap font-bold text-xs ${
                statusFilter === 'replied'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Replied</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                statusFilter === 'replied'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}>
                {summary.replied_count || 0}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer or review text..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20"
            />
          </form>
        </div>

        {/* Secondary Filters Strip: Stars, Sentiment & Priority */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Rating:</span>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${starFilter === s
                  ? 'bg-amber-500 text-white ring-2 ring-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Sentiment:</span>
          {['positive', 'mixed', 'neutral', 'negative'].map((sent) => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sentimentFilter === sent ? null : sent)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${sentimentFilter === sent
                  ? 'bg-[#034bc0] text-white ring-2 ring-blue-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              {sent}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Section 6 Priority Filter */}
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Priority:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${priorityFilter === p
                  ? p === 'critical' ? 'bg-rose-600 text-white shadow-xs' : p === 'high' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              {p}
            </button>
          ))}

          {(starFilter || sentimentFilter || priorityFilter !== 'all' || topicFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStarFilter(null);
                setSentimentFilter(null);
                setPriorityFilter('all');
                setTopicFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-auto flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Section 6 Topics Filter Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Topic Theme:</span>
          {['all', 'service', 'staff', 'food', 'cleanliness', 'speed', 'pricing', 'ambience', 'facilities', 'support'].map((t) => (
            <button
              key={t}
              onClick={() => setTopicFilter(t)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer ${topicFilter === t
                  ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              {t === 'all' ? 'All Topics' : `#${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* ALL REVIEWS VISIBILITY STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-xs">
            <span className="font-black text-slate-900">
              Showing All {reviews.length} Verified Google Reviews
            </span>
            <span className="text-slate-500 text-[11px] ml-2 hidden sm:inline">
              Complete historical database (2024 – 2026) fully accessible for analysis & AI replies
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>All {reviews.length} Reviews Loaded</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        statusFilter === 'unanswered' ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">All Caught Up!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                No customer reviews are currently waiting for a reply. You are maintaining a 100% response SLA for {activeBusiness?.name || 'this location'}!
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                View All Reviews
              </button>
            </div>
          </div>
        ) : statusFilter === 'replied' ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">No Replied Reviews Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                None of your customer reviews have been marked as replied yet. Switch to pending reviews to generate and publish AI responses.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setStatusFilter('unanswered')}
                className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                View Pending Reviews
              </button>
            </div>
          </div>
        ) : (starFilter || sentimentFilter || priorityFilter !== 'all' || topicFilter !== 'all' || searchQuery) ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No reviews match your filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or clear active star/sentiment filters.
            </p>
            <button
              onClick={() => {
                setStarFilter(null);
                setSentimentFilter(null);
                setPriorityFilter('all');
                setTopicFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs max-w-xl mx-auto my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#034bc0] flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">No Real Google Reviews Synced Yet</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Whichever Google account is connected will display its genuine Google reviews here. Currently, no reviews have been imported for <strong className="text-slate-900">{activeBusiness?.name || 'this location'}</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={handleSyncRecent}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-70"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Real Google Reviews'}</span>
              </button>
              <a
                href="/google"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              >
                <span>Connect Google Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-5">
          {reviews.map((rev) => {
            const ai = rev.aiAnalysis || {};
            const feedbackText = rev.reviewFeedback || ai.reviewFeedback || '';
            const isReanalyzing = reanalyzingId === rev.id;

            return (
              <div
                key={rev.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${rev.priority === 'critical' || rev.urgency === 'critical'
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : rev.reply_status === 'pending_approval' || rev.urgency === 'high'
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                {/* Card Header: Author, Rating, Status, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#034bc0] flex items-center justify-center font-black text-white text-sm shrink-0 shadow-xs overflow-hidden">
                      {rev.author_photo_url ? (
                        <img src={rev.author_photo_url} alt={rev.author_name} className="w-full h-full object-cover" />
                      ) : (
                        rev.author_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{rev.author_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-700">⭐ {rev.rating}/5</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(rev.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  {/* Section 6 & 7.1 Badges Strip */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Priority Badge (Section 6) */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs ${(rev.priority || rev.urgency) === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : (rev.priority || rev.urgency) === 'high'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : (rev.priority || rev.urgency) === 'medium'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                      Priority: {rev.priority || rev.urgency || 'low'}
                    </span>

                    {/* Sentiment Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize border shadow-2xs flex items-center gap-1 ${rev.sentiment === 'positive'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : rev.sentiment === 'negative'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : rev.sentiment === 'mixed'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                      <span>
                        {rev.sentiment === 'positive' ? '🟢' : rev.sentiment === 'negative' ? '🔴' : rev.sentiment === 'mixed' ? '🟡' : '⚪'}
                      </span>
                      <span>{rev.sentiment} ({rev.sentiment_score ? Number(rev.sentiment_score).toFixed(2) : (ai.sentimentScore ? Number(ai.sentimentScore).toFixed(2) : '0.50')})</span>
                    </span>

                    {/* Section 7.1 Auto-Reply Rule Status Indicator */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${rev.is_sensitive
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : rev.is_suspicious || (rev.spam_score && rev.spam_score > 0.7)
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : rev.rating >= 4
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : rev.rating === 3
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                      {rev.is_sensitive
                        ? '⚖️ Rule 7.1: Legal/Safety Review'
                        : rev.is_suspicious || (rev.spam_score && rev.spam_score > 0.7)
                          ? '🛡️ Rule 7.1: Pattern Review Queue'
                          : rev.rating >= 4
                            ? '⚡ Rule 7.1: Auto Reply Allowed'
                            : rev.rating === 3
                              ? '📝 Rule 7.1: Approval Recommended'
                              : '🚨 Rule 7.1: Manual Escalation'}
                    </span>

                    {/* Reply Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs ${rev.reply_status === 'replied' || rev.reply_status === 'auto_replied'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : rev.reply_status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                      {rev.reply_status === 'auto_replied' ? '✓ Auto Replied' : rev.reply_status === 'replied' ? '✓ Replied' : 'Pending Action'}
                    </span>
                  </div>
                </div>

                {/* Customer Review Text */}
                <div className="mt-3.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Customer Review
                  </span>
                  <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-semibold">
                    "{rev.review_text}"
                  </p>
                </div>

                {/* Section 10: AUTOMATIC AI INTELLIGENCE & REVIEW FEEDBACK CARD */}
                {feedbackText ? (
                  <div className="mt-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-slate-50/80 to-indigo-50/50 border border-blue-200/90 p-4 space-y-3.5 shadow-xs">
                    {/* AI Feedback Header with Status & Re-analyze Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#034bc0]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#034bc0]">
                          Automatic AI Review Feedback
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Processed
                        </span>
                      </div>

                      {/* Manual Re-analyze Admin Action (Section 7) */}
                      <button
                        onClick={() => handleReanalyze(rev.id)}
                        disabled={isReanalyzing}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-60"
                        title="Re-analyze this review with AI Intelligence Engine"
                      >
                        <RotateCw className={`w-3 h-3 text-[#034bc0] ${isReanalyzing ? 'animate-spin' : ''}`} />
                        <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-analyze Review'}</span>
                      </button>
                    </div>

                    {/* AI Feedback Main Text */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        AI Feedback
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-white/80 p-3 rounded-lg border border-blue-100">
                        {feedbackText}
                      </p>
                    </div>

                    {/* Positive & Negative Points Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Positive Points & Praised Services */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Positive Points
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(rev.positive_points || ai.positivePoints || []).length > 0 ? (
                            (rev.positive_points || ai.positivePoints).map((pt, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                ✓ {pt}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None highlighted</span>
                          )}
                          {(rev.praised_services || ai.praisedServices || []).map((srv, i) => (
                            <span key={`srv-${i}`} className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-bold text-[#034bc0] border border-blue-200">
                              ★ {srv}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Negative Points & Complaints */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Negative Points & Complaints
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(rev.negative_points || ai.negativePoints || rev.complaints || ai.complaints || []).length > 0 ? (
                            Array.from(new Set([...(rev.negative_points || ai.negativePoints || []), ...(rev.complaints || ai.complaints || [])])).map((pt, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-50 text-xs font-bold text-rose-800 border border-rose-200 flex items-center gap-1">
                                ⚠ {pt}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No complaints detected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Keywords, Detected Issue & Customer Intent */}
                    <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2 text-xs">
                      {/* Issue Tag */}
                      {(rev.issue_type || ai.issueType) && (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-amber-700" />
                          <span>Issue: {(rev.issue_type || ai.issueType).replace('_', ' ')}</span>
                        </div>
                      )}

                      {/* Customer Intent */}
                      {(rev.customer_intent || ai.customerIntent) && (
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold flex items-center gap-1">
                          <span className="font-extrabold text-slate-500">Intent:</span>
                          <span>{rev.customer_intent || ai.customerIntent}</span>
                        </div>
                      )}

                      {/* Keywords */}
                      <div className="flex flex-wrap items-center gap-1 ml-auto">
                        <span className="text-[11px] font-bold text-slate-500 mr-1">Keywords:</span>
                        {Array.from(new Set([...(rev.detected_keywords || ai.keywords || []), ...(rev.detected_topics || ai.topics || [])])).slice(0, 5).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white text-[11px] font-semibold text-slate-700 border border-slate-200">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Response Suggestion (Section 10 & 14) */}
                    {(rev.response_suggestion || ai.responseSuggestion) && (
                      <div className="mt-2.5 p-3 rounded-lg bg-white border border-blue-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#034bc0] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Response Suggestion
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopySuggestion(rev.response_suggestion || ai.responseSuggestion, rev.id)}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedId === rev.id ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenAiModal(rev, rev.response_suggestion || ai.responseSuggestion)}
                              className="text-[11px] font-bold text-[#034bc0] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Use in Reply</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                          "{rev.response_suggestion || ai.responseSuggestion}"
                        </p>
                      </div>
                    )}

                    {/* Improvement Recommendation (Section 10) */}
                    {(rev.improvement_recommendation || ai.improvementRecommendation) && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-amber-900 block text-[11px] uppercase">
                            Operational Recommendation
                          </span>
                          <span className="text-slate-800 font-medium">
                            {rev.improvement_recommendation || ai.improvementRecommendation}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pending / Processing State */
                  <div className="mt-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <RotateCw className="w-4 h-4 text-[#034bc0] animate-spin" />
                      <span>AI Review Analysis in progress by background worker...</span>
                    </div>
                    <button
                      onClick={() => handleReanalyze(rev.id)}
                      disabled={isReanalyzing}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {isReanalyzing ? 'Analyzing...' : 'Trigger Analysis Now'}
                    </button>
                  </div>
                )}

                {/* Published / Drafted Response or AI Reply Action */}
                {rev.response_text ? (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#034bc0] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#034bc0]" />
                        {rev.reply_status === 'replied' || rev.reply_status === 'auto_replied' ? 'Published Response' : 'Drafted AI Response'}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">Tone: {rev.response_tone || 'Professional'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed font-medium">
                      "{rev.response_text}"
                    </p>

                    {rev.reply_status === 'pending_approval' && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAiModal(rev)}
                          className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Review & Approve Reply</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenAiModal(rev)}
                      className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open AI Reply Studio</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Reply Modal Dialog */}
      {activeModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setActiveModalReview(null)} />

          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#034bc0]" />
                  AI Reputation Reply Studio
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review by {activeModalReview.author_name} ({activeModalReview.rating}★ Stars)
                </p>
              </div>
              <button
                onClick={() => setActiveModalReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Review Snippet */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900">
              <span className="font-bold text-slate-600 block mb-1">Customer Review:</span>
              <p className="font-semibold italic">"{activeModalReview.review_text}"</p>
            </div>

            {/* Tone Selector (Section 7 Specification) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Select Brand Tone Preset (Section 7):</label>
              <div className="flex flex-wrap gap-1.5">
                {['Professional', 'Friendly', 'Premium', 'Concise', 'Warm', 'Hindi', 'English', 'Hinglish'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTone(t);
                      handleOpenAiModal(activeModalReview);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedTone === t
                        ? 'bg-[#034bc0] text-white shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Options / Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Review Response Draft:</label>
                {generatingAi && (
                  <span className="text-xs text-[#034bc0] flex items-center gap-1 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Generating AI options...
                  </span>
                )}
              </div>

              {aiOptions.length > 1 && (
                <div className="space-y-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Alternative Option:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {aiOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedOptionText(opt.text)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${selectedOptionText === opt.text
                            ? 'bg-blue-50/80 border-[#034bc0] ring-1 ring-[#034bc0]'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{opt.tone}</span>
                          {opt.isRecommended && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#034bc0] font-bold">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 italic font-medium leading-relaxed">"{opt.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                rows={5}
                value={selectedOptionText}
                onChange={(e) => setSelectedOptionText(e.target.value)}
                placeholder="Compose or refine the official review response..."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-medium"
              />
            </div>

            {/* Quality & Safety Check Pill Bar */}
            {safetyChecks && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Automated Compliance Verification:
                </span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">✓ Google Policy Passed</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">✓ Sentiment Alignment</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">✓ No Hallucinated Claims</span>
                </div>
              </div>
            )}

            {feedbackMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${feedbackMsg.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                {feedbackMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModalReview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishReply}
                disabled={publishing || !selectedOptionText}
                className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing to Google...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Publish to Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReviewsPage;
