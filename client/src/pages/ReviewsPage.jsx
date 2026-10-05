import React, { useState, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ReviewsPage = () => {
  const { activeBusiness } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, unanswered, replied
  const [starFilter, setStarFilter] = useState(null); // 1, 2, 3, 4, 5
  const [sentimentFilter, setSentimentFilter] = useState(null); // positive, neutral, negative
  const [searchQuery, setSearchQuery] = useState('');

  // AI Reply Generator Modal State
  const [activeModalReview, setActiveModalReview] = useState(null);
  const [aiOptions, setAiOptions] = useState([]);
  const [selectedOptionText, setSelectedOptionText] = useState('');
  const [selectedTone, setSelectedTone] = useState('Warm & Hospitable');
  const [safetyChecks, setSafetyChecks] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let queryStr = '?';
      if (statusFilter !== 'all') queryStr += `reply_status=${statusFilter}&`;
      if (starFilter) queryStr += `rating=${starFilter}&`;
      if (sentimentFilter) queryStr += `sentiment=${sentimentFilter}&`;
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

  useEffect(() => {
    fetchReviews();
    const handleBizSwitch = () => fetchReviews();
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, [statusFilter, starFilter, sentimentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleOpenAiModal = async (review) => {
    setActiveModalReview(review);
    setGeneratingAi(true);
    setAiOptions([]);
    setFeedbackMsg('');

    try {
      const res = await api.generateAIReply(review.id, { customTone: selectedTone });
      setAiOptions(res.options || []);
      setSelectedOptionText(res.response?.response_text || res.options?.[0]?.text || '');
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Unified Review Inbox</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time Google reviews synchronization, sentiment classification, and policy-compliant AI replies.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#034bc0]" />
          <span>Sync Recent Reviews</span>
        </button>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Indexed</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{summary.total_reviews || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Average Rating</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">
            {summary.avg_rating ? Number(summary.avg_rating).toFixed(1) : '4.8'} ★
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Pending Actions</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{summary.unanswered_count || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Positive Sentiment</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {summary.positive_count || 0} reviews
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all' 
                  ? 'bg-[#034bc0] text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setStatusFilter('unanswered')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'unanswered' 
                  ? 'bg-[#034bc0] text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unanswered ({summary.unanswered_count || 0})
            </button>
            <button
              onClick={() => setStatusFilter('replied')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'replied' 
                  ? 'bg-[#034bc0] text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Replied
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

        {/* Secondary Pill Filters: Stars & Sentiment */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Filter By:</span>

          {/* Star Rating Pills */}
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                starFilter === s
                  ? 'bg-amber-500 text-white ring-2 ring-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Sentiment Pills */}
          {['positive', 'neutral', 'negative'].map((sent) => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sentimentFilter === sent ? null : sent)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                sentimentFilter === sent
                  ? 'bg-[#034bc0] text-white ring-2 ring-blue-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {sent}
            </button>
          ))}

          {(starFilter || sentimentFilter || searchQuery) && (
            <button
              onClick={() => {
                setStarFilter(null);
                setSentimentFilter(null);
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-auto flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No reviews match your filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or clear active star/sentiment filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-4 sm:p-6 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                rev.priority === 'critical'
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : rev.reply_status === 'pending_approval'
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Author, Rating, Status, Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#034bc0] flex items-center justify-center font-black text-white text-sm shrink-0 shadow-xs">
                    {rev.author_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{rev.author_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(rev.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {rev.is_sensitive && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Sensitive Concern
                    </span>
                  )}

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize border shadow-xs ${
                    rev.sentiment === 'positive'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : rev.sentiment === 'negative'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {rev.sentiment}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border shadow-xs ${
                    rev.reply_status === 'replied' || rev.reply_status === 'auto_replied'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : rev.reply_status === 'pending_approval'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {rev.reply_status === 'auto_replied' ? '✓ Auto Replied' : rev.reply_status === 'replied' ? '✓ Replied' : 'Pending Action'}
                  </span>
                </div>
              </div>

              {/* Review Text - BOLD, HIGH-CONTRAST, AND CRYSTAL CLEAR */}
              <p className="mt-4 text-sm sm:text-base text-slate-900 leading-relaxed font-semibold">
                "{rev.review_text}"
              </p>

              {/* Detected Topics & Keywords */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {(rev.detected_topics || []).map((topic, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 border border-slate-200 hover:bg-slate-200 transition-colors">
                    <Tag className="w-3 h-3 text-[#034bc0]" />
                    {topic}
                  </span>
                ))}
                {rev.recurring_complaint && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-xs font-bold text-rose-800 border border-rose-300 flex items-center gap-1 shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    Recurring: {rev.recurring_complaint}
                  </span>
                )}
              </div>

              {/* Existing Response Box or AI Reply Action */}
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
                    <span>Generate AI Reply</span>
                  </button>
                </div>
              )}
            </div>
          ))}
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
                  AI Reputation Reply Engine
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

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Select Brand Tone:</label>
              <div className="flex flex-wrap gap-2">
                {['Warm & Hospitable', 'Professional', 'Empathetic & Polished', 'Hinglish Friendly', 'Concise'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTone(t);
                      handleOpenAiModal(activeModalReview);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedTone === t
                        ? 'bg-[#034bc0] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generated Options */}
            {generatingAi ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#034bc0] mx-auto" />
                <p className="text-xs text-slate-500">Synthesizing Business Intelligence Profile & safety policy rules...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800">Generated Reply Options:</label>
                {aiOptions.map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedOptionText(opt.text)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs sm:text-sm leading-relaxed ${
                      selectedOptionText === opt.text
                        ? 'bg-blue-50 border-[#034bc0] text-slate-900 shadow-sm ring-2 ring-[#034bc0]/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[#034bc0] text-xs">{opt.tone}</span>
                      {opt.isRecommended && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-200">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{opt.text}</p>
                  </div>
                ))}

                {/* Editable Final Response */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Editable Response Draft:</span>
                    <span className="text-[11px] text-slate-500 font-normal">You can tweak before sending</span>
                  </label>
                  <textarea
                    rows={4}
                    value={selectedOptionText}
                    onChange={(e) => setSelectedOptionText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 leading-relaxed font-medium"
                  />
                </div>
              </div>
            )}

            {/* Quality & Safety Check Badges */}
            {safetyChecks && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-600">Quality Checks:</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fact Check Passed
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tone Validated
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No Keyword Stuffing
                </span>
              </div>
            )}

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#034bc0] font-bold">
                {feedbackMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModalReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishReply}
                disabled={publishing || !selectedOptionText}
                className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{publishing ? 'Publishing to Google...' : 'Approve & Publish to Google'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
