import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  Plus,
  TrendingUp,
  Star,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BarChart2,
  X,
  Trash2,
  Compass,
  Check,
  HelpCircle,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const CompetitorsPage = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [competitors, setCompetitors] = useState([]);
  const [myBusiness, setMyBusiness] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [trackedSet, setTrackedSet] = useState({});

  // New Competitor Form
  const [compName, setCompName] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compRating, setCompRating] = useState('4.3');
  const [compReviews, setCompReviews] = useState('500');

  const fetchCompetitorData = async () => {
    try {
      setLoading(true);
      const res = await api.listCompetitors();
      setCompetitors(res.competitors || []);
      setMyBusiness(res.myBusiness || null);

      const compRes = await api.getCompetitorComparison();
      setComparison(compRes.comparison || null);
    } catch (err) {
      console.error('[COMPETITORS] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitorData();
    const handleBizSwitch = () => {
      fetchCompetitorData();
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  const handleOpenDiscovery = async () => {
    setDiscoveryModalOpen(true);
    setLoadingDiscovery(true);
    try {
      const res = await api.discoverCompetitors();
      setDiscoveredCompetitors(res.suggestions || []);
    } catch (err) {
      console.error('[COMPETITORS] Discovery failed:', err);
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const handleApproveDiscovered = async (cand) => {
    try {
      await api.addCompetitor({
        name: cand.name,
        categories: cand.categories,
        rating: cand.rating,
        reviewCount: cand.review_count,
        review_velocity: cand.review_velocity,
        visibility_score: cand.visibility_score
      });
      setTrackedSet(prev => ({ ...prev, [cand.name]: true }));
      fetchCompetitorData();
    } catch (err) {
      console.error('[COMPETITORS] Approve failed:', err);
    }
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!compName.trim()) return;

    try {
      await api.addCompetitor({
        name: compName,
        website: compWebsite,
        rating: parseFloat(compRating),
        reviewCount: parseInt(compReviews, 10)
      });
      setAddModalOpen(false);
      setCompName('');
      setCompWebsite('');
      fetchCompetitorData();
    } catch (err) {
      console.error('[COMPETITORS] Add failed:', err);
    }
  };

  const handleDeleteCompetitor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to stop tracking "${name}"?`)) return;
    try {
      await api.deleteCompetitor(id);
      fetchCompetitorData();
    } catch (err) {
      console.error('[COMPETITORS] Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Competitor Intelligence Center</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track top local competitors, review volume velocities, review theme gaps, and keyword visibility benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              const myName = myBusiness?.name || activeBusiness?.name || 'My Business';
              const topComp = competitors[0]?.name || 'Top Competitor';
              navigate(`/trends?tab=compare&terms=${encodeURIComponent(myName + ', ' + topComp)}`);
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Compare search demand on Google Trends"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#034bc0]" />
            <span>Compare Search Trends</span>
          </button>

          <button
            onClick={handleOpenDiscovery}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#034bc0]" />
            <span>Auto-Discover Competitors</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Competitor Manually</span>
          </button>
        </div>
      </div>

      {/* Compliance & Policy Banner (Section 10) */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#034bc0] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <span className="font-extrabold text-[#034bc0] uppercase tracking-wider block">
            Competitive Governance (Specification Section 10)
          </span>
          <p className="mt-0.5 leading-relaxed font-medium">
            Tracks publicly available categories, ratings, review velocities, sentiment themes, and SERP visibility.
            <strong> System strictly prohibits copying competitor review content or profiles.</strong> Use this intelligence solely
            to uncover service and positioning gaps.
          </p>
        </div>
      </div>

      {/* Benchmark Matrix */}
      {comparison && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Head-to-Head Competitive Benchmark</h2>
              <p className="text-xs text-slate-500">Your location metrics vs tracked market average</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl self-start sm:self-auto">
              Competitive Advantage Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {(comparison.metrics || []).map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold block tracking-wider">{m.metric}</span>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">You</span>
                    <span className="text-lg font-black text-[#034bc0]">{m.myScore}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-bold">Market Avg</span>
                    <span className="text-sm font-bold text-slate-600">{m.competitorsAvg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors List Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">Tracked Local Competitors</h3>
          <span className="text-xs text-slate-500 font-bold">{competitors.length} active competitors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4 text-center">Google Rating</th>
                <th className="py-3.5 px-4 text-right">Review Count</th>
                <th className="py-3.5 px-4 text-center">Review Velocity</th>
                <th className="py-3.5 px-4 text-center">Visibility Score</th>
                <th className="py-3.5 px-4">Primary Review Themes</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Highlight My Business Row */}
              <tr className="bg-blue-50/50 font-bold border-b border-blue-200">
                <td className="py-3.5 px-4 text-[#034bc0] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#034bc0] animate-pulse"></span>
                  <span className="font-extrabold">{myBusiness?.name || activeBusiness?.name} (Your Location)</span>
                </td>
                <td className="py-3.5 px-4 text-center text-amber-700 font-black">
                  {myBusiness?.avg_rating ? parseFloat(myBusiness.avg_rating).toFixed(1) : '4.8'} ★
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900">
                  {myBusiness?.review_count || 428}
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">+24 / mo</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    78.4%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Service Quality (96%), Responsiveness (94%)</td>
                <td className="py-3.5 px-4 text-center text-slate-400 font-bold">—</td>
              </tr>

              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">Loading competitor signals...</td>
                </tr>
              ) : competitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No competitors tracked yet. Click "Auto-Discover Competitors" to scan nearby competitors in your niche.
                  </td>
                </tr>
              ) : competitors.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{c.name}</span>
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#034bc0]">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                    {c.rating} ★
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                    {c.review_count?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                    +{c.review_velocity || 12} / mo
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.visibility_score || 65}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {(c.review_themes || []).map((t) => t.theme).join(', ') || 'General services'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(c.name + ' ' + (activeBusiness?.city || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title={`Verify "${c.name}" on Google Maps`}
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          const myName = myBusiness?.name || activeBusiness?.name || 'My Business';
                          navigate(`/trends?tab=compare&terms=${encodeURIComponent(myName + ', ' + c.name)}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#034bc0] hover:bg-blue-50 transition-colors cursor-pointer"
                        title={`Compare "${c.name}" vs your brand on Google Trends`}
                      >
                        <TrendingUp className="w-4 h-4 text-[#034bc0]" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompetitor(c.id, c.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Competitor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Market Gaps Cards */}
      {comparison?.gaps && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparison.gaps.map((gap, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                  {gap.gapType}
                </span>
                <span className="text-xs font-bold text-slate-500">vs {gap.competitor}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{gap.impact}</p>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#034bc0] font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Advantage: {gap.actionableAdvantage}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUTO-DISCOVERY MODAL (Section 10) */}
      {discoveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 m-0 !m-0 !mt-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#034bc0]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  System Competitor Discovery
                </h3>
              </div>
              <button
                onClick={() => setDiscoveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Based on your business niche and target city, the system detected these key competitors appearing in top local search results.
              Review their metrics and approve them to begin tracking.
            </p>

            {loadingDiscovery ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 text-[#034bc0] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Discovering local market rivals...</p>
              </div>
            ) : discoveredCompetitors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No new competitor candidates detected in this radius.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {discoveredCompetitors.map((cand, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{cand.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium flex-wrap">
                          <span className="text-amber-700 font-bold">{cand.rating} ★</span>
                          <span>•</span>
                          <span>{cand.review_count} reviews</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">+{cand.review_velocity}/mo</span>
                          {cand.distance_km !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-[#034bc0] font-bold">{cand.distance_km} km away</span>
                            </>
                          )}
                          {cand.source && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {cand.source}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {trackedSet[cand.name] ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveDiscovered(cand)}
                          className="px-3 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Approve & Track
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      🎯 <span className="font-bold text-slate-900">Rationale:</span> {cand.rationale}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cand.common_themes?.map((th, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {th}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDiscoveryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 m-0 !m-0 !mt-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add Local Competitor</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Competitor Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Apex Health Clinic"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Website / Google Maps URL (Optional)
                </label>
                <input
                  type="url"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Current Rating (★)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={compRating}
                    onChange={(e) => setCompRating(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Approx Reviews
                  </label>
                  <input
                    type="number"
                    value={compReviews}
                    onChange={(e) => setCompReviews(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save & Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsPage;
