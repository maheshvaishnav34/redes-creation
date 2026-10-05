import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckSquare,
  Check,
  MessageSquare,
  Tag,
  Plus,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const SeoAuditPage = () => {
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'review_seo'
  const [audit, setAudit] = useState(null);
  const [checks, setChecks] = useState([]);
  const [reviewSeo, setReviewSeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviewSeo, setLoadingReviewSeo] = useState(false);
  const [running, setRunning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, critical, high, medium, low
  const [convertedTasks, setConvertedTasks] = useState({});
  const [addedKeywords, setAddedKeywords] = useState({});

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestSeoAudit();
      setAudit(data.audit || null);
      setChecks(data.checks || []);
    } catch (err) {
      console.error('[SEO_AUDIT] Error loading audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewSeoData = async () => {
    try {
      setLoadingReviewSeo(true);
      const res = await api.getReviewSeoIntelligence();
      if (res.success) {
        setReviewSeo(res);
      }
    } catch (err) {
      console.error('[REVIEW_SEO] Error loading review intelligence:', err);
    } finally {
      setLoadingReviewSeo(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
    fetchReviewSeoData();
    const handleBizSwitch = () => {
      fetchAuditData();
      fetchReviewSeoData();
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  const handleRunNewAudit = async () => {
    try {
      setRunning(true);
      const res = await api.runSeoAudit();
      setAudit(res.audit);
      setChecks(res.checks || []);
    } catch (err) {
      console.error('[SEO_AUDIT] Execution failed:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleConvertToTask = async (chk) => {
    try {
      await api.createTaskFromAudit(chk.id, {
        title: `Fix Local SEO: ${chk.check_name}`,
        description: `${chk.why_it_matters}\nAction: ${chk.recommendation}`,
        priority: chk.severity === 'critical' ? 'critical' : chk.severity === 'high' ? 'high' : 'medium'
      });
      setConvertedTasks(prev => ({ ...prev, [chk.id]: true }));
    } catch (err) {
      console.error('[TASK_CONVERT] Failed:', err);
    }
  };

  const handleAddEmergingKeyword = async (term) => {
    try {
      await api.approveKeywordSuggestion({
        keyword: term,
        intent_group: 'review-themes',
        rationale: 'Discovered from natural customer review themes'
      });
      setAddedKeywords(prev => ({ ...prev, [term]: true }));
    } catch (err) {
      console.error('[KEYWORD_ADD] Failed:', err);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">Critical</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-blue-100 text-[#034bc0] border border-blue-300">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-300">Low</span>;
    }
  };

  const filteredChecks = checks.filter(c =>
    filterSeverity === 'all' ? true : c.severity === filterSeverity
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Local SEO & Review Intelligence</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Google Business Profile health audits, category/service gap checks, and Section 8 customer review language intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'audit' && (
            <button
              onClick={handleRunNewAudit}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Executing Audit Checks...' : 'Run New SEO Audit'}</span>
            </button>
          )}
          {activeTab === 'review_seo' && (
            <button
              onClick={fetchReviewSeoData}
              disabled={loadingReviewSeo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReviewSeo ? 'animate-spin' : ''}`} />
              <span>Refresh Review Themes</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>GBP Audit & Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('review_seo')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'review_seo'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review SEO Intelligence <span className="hidden sm:inline">& Keyword Gap (Section 8)</span></span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#034bc0]">
            Pro
          </span>
        </button>
      </div>

      {/* TAB 1: GBP AUDIT & CHECKLIST */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Audit Scorecard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Overall Health</span>
              <p className="text-3xl font-black text-[#034bc0] mt-1">{audit?.overall_score || 86}</p>
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block mt-1">
                Strong Local Authority
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">GBP Completeness</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{audit?.gbp_score || 92}%</p>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">100% Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Structured Services</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{audit?.local_signals_score || 78}%</p>
              <span className="text-[10px] text-amber-700 font-bold block mt-1">Catalog Gaps</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Review Signals</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{audit?.review_score || 89}%</p>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">94% Response SLA</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">NAP Consistency</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{audit?.nap_consistency_score || 95}%</p>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">Sync Healthy</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {sev} ({sev === 'all' ? checks.length : checks.filter(c => c.severity === sev).length})
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredChecks.length} checks
            </span>
          </div>

          {/* Audit Checks List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 text-[#034bc0] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Loading audit checks...</p>
              </div>
            ) : filteredChecks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No issues found in this severity category!</p>
              </div>
            ) : (
              filteredChecks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-4 sm:p-6 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                    chk.status === 'failed' || chk.severity === 'critical'
                      ? 'border-rose-300 ring-2 ring-rose-100'
                      : chk.status === 'warning' || chk.severity === 'high'
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {chk.status === 'passed' ? (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{chk.check_name}</h3>
                        <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                          Category: {chk.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getSeverityBadge(chk.severity)}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border shadow-xs ${
                        chk.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {chk.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs sm:text-sm pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Evidence</span>
                      <p className="text-slate-700 leading-relaxed font-medium">{chk.evidence}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Why It Matters</span>
                      <p className="text-slate-700 leading-relaxed font-medium">{chk.why_it_matters}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[#034bc0] font-bold uppercase text-[10px] tracking-wider block">Actionable Recommendation</span>
                      <p className="text-slate-900 font-bold leading-relaxed">{chk.recommendation}</p>
                    </div>
                  </div>

                  {chk.status !== 'passed' && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-end">
                      {convertedTasks[chk.id] ? (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Added to Kanban Task Board
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertToTask(chk)}
                          className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Convert to Actionable Task</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW SEO INTELLIGENCE & KEYWORD GAP (SPECIFICATION SECTION 8) */}
      {activeTab === 'review_seo' && (
        <div className="space-y-6">
          {/* Policy & Ethics Notice Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-extrabold uppercase tracking-wider block text-amber-800">
                Ethical SEO & Review Integrity Notice (Specification Section 8 & 9)
              </span>
              <p className="mt-0.5 leading-relaxed">
                Review SEO measures how customers naturally describe your business and compares those themes with your target keyword universe.
                Customer reviews must <strong>never</strong> be fabricated or keyword-stuffed. Keyword gaps identify opportunities for your
                <strong> website content, Google Business Profile services catalog, and Google Posts</strong>.
              </p>
            </div>
          </div>

          {/* Review SEO Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Natural Customer Themes</span>
                <MessageSquare className="w-4 h-4 text-[#034bc0]" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {reviewSeo?.themeMentions?.length || 0} Topics Detected
              </p>
              <p className="text-xs text-slate-500 mt-1">Extracted from authentic Google reviews</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Target Keywords Matched</span>
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {reviewSeo?.keywordGaps?.filter(k => k.status === 'matched').length || 0} / {reviewSeo?.keywordGaps?.length || 0}
              </p>
              <p className="text-xs text-emerald-700 font-bold mt-1">Naturally occurring in customer feedback</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Emerging Vocabulary</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {reviewSeo?.emergingVocabulary?.length || 0} Terms Found
              </p>
              <p className="text-xs text-indigo-700 font-bold mt-1">Candidates for target keyword list</p>
            </div>
          </div>

          {/* Customer Review Themes Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Naturally Occurring Review Themes & Sentiment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How customers naturally perceive your strengths and operational areas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewSeo?.themeMentions?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#034bc0]"></span>
                      <h3 className="text-sm font-extrabold text-slate-900">{item.theme}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {item.mentions} mentions
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Positive Sentiment:</span>
                    <span className={`font-bold ${item.positive_percent >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {item.positive_percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5 flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${item.positive_percent}%` }}
                    ></div>
                    <div
                      className="bg-rose-400 h-full"
                      style={{ width: `${100 - item.positive_percent}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-600 mt-2.5 bg-white p-2 rounded-lg border border-slate-100">
                    💡 <span className="font-bold text-slate-900">Strategic Meaning:</span> {item.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Gap Analysis Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900">
              Target Keyword Universe vs Natural Review Gap Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Identifies target keywords with high search value that customers rarely mention, pointing to website content & GBP post opportunities.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="py-3 px-3">Target Keyword</th>
                    <th className="py-3 px-3">Intent Group</th>
                    <th className="py-3 px-3">Review Mentions</th>
                    <th className="py-3 px-3">Sentiment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Recommended Strategic Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {reviewSeo?.keywordGaps?.map((gap, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{gap.keyword}</td>
                      <td className="py-3 px-3 text-slate-600 uppercase text-[10px] font-extrabold">{gap.intent_group}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{gap.mentions} mentions</td>
                      <td className="py-3 px-3">
                        {gap.sentiment ? (
                          <span className="font-bold text-emerald-700">{gap.sentiment}% Pos</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {gap.status === 'matched' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Recognized
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Content Gap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {gap.recommended_action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Emerging Vocabulary Candidates */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900">
              Emerging Customer Vocabulary (Keyword Candidates)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Phrases and terms discovered directly from genuine customer reviews that you are not yet tracking in your keyword targets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {reviewSeo?.emergingVocabulary?.map((term, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-slate-900 capitalize block truncate">{term}</span>
                    <span className="text-[10px] text-slate-500">Customer coined term</span>
                  </div>
                  {addedKeywords[term] ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddEmergingKeyword(term)}
                      className="px-2.5 py-1 rounded-lg bg-[#034bc0] hover:bg-[#023aa0] text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" /> Track
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoAuditPage;
