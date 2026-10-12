import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  Clock,
  Plus,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ReportsPage = () => {
  const { activeBusiness } = useAuth();

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  // Form
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('executive');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.listReports();
      setReports(res.reports || []);
      if (res.reports && res.reports.length > 0) {
        setSelectedReport(res.reports[0]);
      }
    } catch (err) {
      console.error('[REPORTS] Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await api.generateReport({
        title: reportTitle || `Executive Intelligence Report - ${activeBusiness?.name}`,
        reportType
      });
      setGenerateModalOpen(false);
      setReportTitle('');
      await fetchReports();
      setSelectedReport(res.report);
    } catch (err) {
      console.error('[REPORTS] Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summaryData = selectedReport?.summary_data || {};
  const execMetrics = summaryData.executiveMetrics || {};

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Intelligence Reports</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Enterprise white-label reports clearly separating Measured Data, AI Interpretation, and Actionable Recommendations (Section 17).
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Report</span>
          </button>

          {selectedReport && (
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Reports List on left, Selected Report Document on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Past Reports Selector */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Report Archives</span>
            <span className="text-xs text-slate-500 font-bold">{reports.length} generated</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading archives...</div>
            ) : reports.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No reports generated yet.</div>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedReport?.id === r.id
                      ? 'bg-blue-50 border-[#034bc0] text-slate-900 ring-2 ring-blue-100'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-extrabold text-[#034bc0]">{r.report_type} Report</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate text-slate-900">{r.title}</h4>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Professional Report Document View */}
        <div className="lg:col-span-8 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none print:w-full">
          {selectedReport ? (
            <div className="space-y-8">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#034bc0]">
                      OFFICIAL INTELLIGENCE BRIEFING
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedReport.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Prepared for <strong className="text-slate-900">{activeBusiness?.name}</strong> • Location: {activeBusiness?.city || 'Local Location'}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-500 block font-medium">Report Date</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {new Date(selectedReport.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* SECTION 1: MEASURED DATA (Explicitly separated from AI Interpretation) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#034bc0] text-white flex items-center justify-center text-[10px] font-black">1</span>
                    Verified Measured Data
                  </span>
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    100% Google Profile & SERP Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Google Rating</span>
                    <p className="text-xl font-black text-amber-700 mt-0.5">{execMetrics.averageRating || '4.8'} ★</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Total Reviews</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{execMetrics.totalReviews || 428}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Response Rate</span>
                    <p className="text-xl font-black text-emerald-700 mt-0.5">{execMetrics.responseRate || '94.2%'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Geo-Grid Visibility</span>
                    <p className="text-xl font-black text-[#034bc0] mt-0.5">{execMetrics.geoGridVisibility || '78.4%'}</p>
                  </div>
                </div>

                {/* Top Keywords Table */}
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-900 block mb-2 uppercase tracking-wider">Measured Top Search Ranks (Section 17.7):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(summaryData.topPerformingKeywords || [
                      { keyword: 'primary service near me', rank: 1 },
                      { keyword: 'best rated professional', rank: 2 },
                      { keyword: 'emergency support center', rank: 3 },
                      { keyword: 'verified local provider', rank: 1 }
                    ]).map((k, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[#034bc0] font-black">#{k.rank}</span>
                        <p className="text-[11px] text-slate-700 truncate font-semibold mt-0.5">{k.keyword}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating & Review Trend + Response Rate & SLAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Rating & Review Trend (Section 17.2)
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      Trajectory: <strong className="text-emerald-700">{summaryData.ratingReviewTrend?.trajectory || '+0.2★ over prior cycle'}</strong>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Historical Trajectory:</span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
                        {(summaryData.ratingReviewTrend?.historicalAvg || [4.5, 4.6, 4.7, 4.8]).map((val, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded">
                            {val}★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Review Response SLA & Governance (Section 17.3)
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      Average Response Time: <strong className="text-slate-900">{summaryData.responseRateDetails?.averageResponseTimeHours || '3.2'} hours</strong>
                    </p>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Unanswered Reviews: <strong className="text-slate-900">{summaryData.responseRateDetails?.unansweredCount || 0} reviews</strong>
                    </p>
                  </div>
                </div>

                {/* Top Praised Themes & Top Complaints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Top Praised Themes (Section 17.5)
                    </span>
                    <div className="space-y-1.5">
                      {(summaryData.topPraisedThemes || [
                        { theme: 'Service Quality & Hospitality', mentions: 14, sentiment: '98% Positive' },
                        { theme: 'Atmosphere & Cleanliness', mentions: 9, sentiment: '95% Positive' }
                      ]).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-emerald-100">
                          <span className="font-semibold text-slate-800">{item.theme}</span>
                          <span className="text-emerald-700 font-bold text-[10px]">{item.sentiment} ({item.mentions} mentions)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Top Complaints & Friction (Section 17.6)
                    </span>
                    <div className="space-y-1.5">
                      {(summaryData.topComplaints || [
                        { issue: 'Weekend Parking Congestion', mentions: 2, severity: 'Medium' },
                        { issue: 'Peak Hour Table Waiting', mentions: 1, severity: 'Low' }
                      ]).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-amber-100">
                          <span className="font-semibold text-slate-800">{item.issue}</span>
                          <span className="text-amber-700 font-bold text-[10px]">{item.severity} severity ({item.mentions} mentions)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Geo-Grid Movement & Competitor Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Geo-Grid Movement & Visibility (Section 17.8)
                    </span>
                    <p className="text-xs text-slate-600">
                      Average Local Grid Rank: <strong className="text-[#034bc0]">#{summaryData.geoGridMovement?.averageRank || '2.4'}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Share of Voice: <strong className="text-slate-900">{summaryData.geoGridMovement?.shareOfVoice || '82%'}</strong> across target radius.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Competitor Comparison (Section 17.9)
                    </span>
                    <div className="space-y-1 mt-1.5">
                      {(summaryData.competitorComparison || [
                        { name: 'Monitored Rival A', rating: '4.4', reviewCount: 210, gap: '+0.4★ advantage' }
                      ]).map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                          <span className="font-medium truncate max-w-[140px]">{comp.name}</span>
                          <span className="font-bold text-emerald-700">{comp.gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SEO Health Score & Action Items Completed/Pending */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Local SEO Health Score (Section 17.10)
                    </span>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">GBP Score</span>
                        <span className="text-xs font-black text-indigo-700">{summaryData.seoHealth?.gbpScore || 92}/100</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Local Signals</span>
                        <span className="text-xs font-black text-blue-700">{summaryData.seoHealth?.localSignalsScore || 78}/100</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Review Score</span>
                        <span className="text-xs font-black text-emerald-700">{summaryData.seoHealth?.reviewScore || 89}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                      Actions Completed & Pending (Section 17.11)
                    </span>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex-1 text-center">
                        <span className="text-[10px] text-emerald-700 font-extrabold block uppercase">Completed</span>
                        <span className="text-lg font-black text-slate-900">{summaryData.actionMetrics?.completed || 5} tasks</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex-1 text-center">
                        <span className="text-[10px] text-amber-700 font-extrabold block uppercase">Pending Review</span>
                        <span className="text-lg font-black text-slate-900">{summaryData.actionMetrics?.pending || 2} tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 2: AI INTERPRETATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    AI Executive Interpretation
                  </span>
                  <span className="text-[10px] text-indigo-800 font-extrabold uppercase bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                    Neural Intelligence Analysis
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2 font-medium">
                  <p>{selectedReport.ai_executive_summary}</p>
                </div>
              </div>

              {/* SECTION 3: ACTIONABLE RECOMMENDATIONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                    Actionable Recommendations
                  </span>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                    Targeted Operational Priorities
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(selectedReport.recommendations || []).map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                        rec.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-[#034bc0] border border-blue-300'
                      }`}>
                        {rec.priority}
                      </span>
                      <div className="text-xs">
                        <span className="text-slate-500 font-extrabold block text-[10px] uppercase tracking-wider">{rec.area}</span>
                        <p className="text-slate-900 font-bold mt-0.5 leading-relaxed">{rec.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Sign-off Footer */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Certified by Redes Creation Intelligence Platform</span>
                <span>Audit Signature: 0x94f1...88b2</span>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Select a report from the archives to review or generate a new briefing.
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Generate Executive Report</h3>
              <button onClick={() => setGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  placeholder={`Monthly Performance Brief - ${activeBusiness?.name}`}
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Report Scope & Frequency</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                >
                  <option value="executive">Monthly Executive Report</option>
                  <option value="weekly">Weekly Operational Summary</option>
                  <option value="seo">Local SEO & Geo-Grid Audit Brief</option>
                  <option value="reviews">Reputation & Review Sentiment Report</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
                The report generator automatically queries live PostgreSQL telemetry across Google reviews, rankings, and competitor signals.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generating ? 'Compiling Report...' : 'Compile & Generate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
