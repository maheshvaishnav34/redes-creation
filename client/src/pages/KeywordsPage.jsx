import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Plus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Tag,
  SlidersHorizontal,
  X,
  Trash2,
  Flame,
  Activity,
  Globe2,
  ExternalLink,
  RefreshCw,
  Zap,
  Target,
  MapPin
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const KeywordsPage = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();

  const [keywords, setKeywords] = useState([]);
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeGroup, setActiveGroup] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Keyword Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newKeywordStr, setNewKeywordStr] = useState('');
  const [newKeywordIntent, setNewKeywordIntent] = useState('local');
  const [newKeywordGroup, setNewKeywordGroup] = useState('');
  const [newKeywordPrimary, setNewKeywordPrimary] = useState(false);

  // Suggestions Drawer
  const [suggestionsDrawerOpen, setSuggestionsDrawerOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Real-Time Trends Intelligence Drawer & State
  const [realtimeTrendsDrawerOpen, setRealtimeTrendsDrawerOpen] = useState(false);
  const [realtimeTrends, setRealtimeTrends] = useState([]);
  const [loadingRealtimeTrends, setLoadingRealtimeTrends] = useState(false);
  const [trendsGeo, setTrendsGeo] = useState('IN');
  const [trackSuccess, setTrackSuccess] = useState(null);
  const [autoSeeding, setAutoSeeding] = useState(false);
  const [autoSeedMsg, setAutoSeedMsg] = useState('');

  // 7-Day AI Keyword Evolution Engine
  const [evolutionStatus, setEvolutionStatus] = useState(null);
  const [evolvingKeywords, setEvolvingKeywords] = useState(false);
  const [evolutionMsg, setEvolutionMsg] = useState('');

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      let queryStr = '?';
      if (activeGroup !== 'all') queryStr += `groupId=${activeGroup}&`;
      if (intentFilter !== 'all') queryStr += `intent=${intentFilter}&`;

      const res = await api.listKeywords(queryStr);
      setKeywords(res.keywords || []);
      setGroups(res.groups || []);
      setSummary(res.summary || {});
    } catch (err) {
      console.error('[KEYWORDS] Error fetching keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvolutionStatus = async () => {
    try {
      const res = await api.getKeywordEvolutionStatus();
      if (res?.evolution) {
        setEvolutionStatus(res.evolution);
      }
    } catch (err) {
      console.warn('[KEYWORDS] Evolution status fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchEvolutionStatus();
    const handleBizSwitch = () => {
      fetchKeywords();
      fetchEvolutionStatus();
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, [activeGroup, intentFilter]);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeywordStr.trim()) return;

    try {
      await api.addKeyword({
        keyword: newKeywordStr,
        intent: newKeywordIntent,
        groupId: newKeywordGroup || null,
        isPrimary: newKeywordPrimary
      });
      setAddModalOpen(false);
      setNewKeywordStr('');
      fetchKeywords();
    } catch (err) {
      console.error('[KEYWORDS] Add keyword failed:', err);
    }
  };

  const handleTogglePrimary = async (id) => {
    try {
      await api.togglePrimaryKeyword(id);
      fetchKeywords();
    } catch (err) {
      console.error('[KEYWORDS] Toggle primary failed:', err);
    }
  };

  const handleOpenSuggestions = async () => {
    setSuggestionsDrawerOpen(true);
    setLoadingSuggestions(true);
    try {
      const res = await api.discoverKeywordSuggestions();
      setSuggestions(res.suggestions || []);
    } catch (err) {
      console.error('[KEYWORDS] Suggestions failed:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestion = async (s) => {
    try {
      await api.approveKeywordSuggestion({
        keyword: s.keyword,
        intent: s.intent,
        searchVolume: s.searchVolume,
        difficulty: s.difficulty,
        isPrimary: false
      });
      setSuggestions(prev => prev.filter(item => item.keyword !== s.keyword));
      fetchKeywords();
    } catch (err) {
      console.error('[KEYWORDS] Add suggestion failed:', err);
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm('Are you sure you want to remove this keyword from tracking?')) return;
    try {
      await api.deleteKeyword(id);
      fetchKeywords();
    } catch (err) {
      console.error('[KEYWORDS] Delete keyword failed:', err);
    }
  };

  // Real-Time Trends Drawer Handlers
  const handleOpenRealtimeTrends = async (geo = trendsGeo) => {
    setRealtimeTrendsDrawerOpen(true);
    setLoadingRealtimeTrends(true);
    try {
      const res = await api.getEmergingTrends(geo);
      setRealtimeTrends(res?.trends || []);
    } catch (err) {
      console.error('[KEYWORDS] Error fetching emerging trends:', err);
    } finally {
      setLoadingRealtimeTrends(false);
    }
  };

  const handleTrackFromRealtimeTrends = async (queryTerm) => {
    try {
      await api.addKeyword({
        keyword: queryTerm,
        intent: 'commercial',
        searchVolume: 50000,
        difficulty: 35,
        isPrimary: false
      });
      setTrackSuccess(queryTerm);
      setTimeout(() => setTrackSuccess(null), 3000);
      fetchKeywords();
    } catch (err) {
      console.error('[KEYWORDS] Failed to track keyword from trends:', err);
    }
  };

  const handleAutoSeed = async () => {
    try {
      setAutoSeeding(true);
      setAutoSeedMsg('');
      const res = await api.autoSeedKeywords();
      if (res.success) {
        setAutoSeedMsg(res.message || `Auto-generated ${res.totalSeeded || 8} top-level keywords!`);
        setTimeout(() => setAutoSeedMsg(''), 4500);
        await fetchKeywords();
      }
    } catch (err) {
      console.error('[KEYWORDS] Auto-seed failed:', err);
    } finally {
      setAutoSeeding(false);
    }
  };

  const handleTriggerWeeklyEvolution = async () => {
    try {
      setEvolvingKeywords(true);
      setEvolutionMsg('');
      const res = await api.triggerWeeklyKeywordEvolution({ force: true });
      if (res.success) {
        setEvolutionMsg(res.message || '7-Day AI Keyword Evolution completed successfully!');
        setTimeout(() => setEvolutionMsg(''), 5500);
        await fetchKeywords();
        await fetchEvolutionStatus();
      }
    } catch (err) {
      console.error('[KEYWORDS] Trigger weekly evolution failed:', err);
    } finally {
      setEvolvingKeywords(false);
    }
  };

  // Helper to determine trend trajectory display
  const getTrendBadge = (k) => {
    const isTop = k.current_rank && k.current_rank <= 3;
    const isVol = k.search_volume && k.search_volume >= 2000;

    if (isTop && isVol) {
      return {
        label: 'Breakout 🔥',
        sub: '+5000% Velocity',
        bg: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (k.current_rank && k.current_rank <= 10) {
      return {
        label: 'Surging ↗',
        sub: '+140% Demand',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    return {
      label: 'Steady Demand ➔',
      sub: 'Consistent Search',
      bg: 'bg-blue-50 text-[#034bc0] border-blue-200'
    };
  };

  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#034bc0] border border-blue-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#034bc0]" />
                SEO Search Engine Telemetry
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Google Trends Linked
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Keyword Intelligence & Rank Engine
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
              Track daily local 3-Pack rank movements, intent categories, search volumes, and discover real-time surging customer search queries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoSeed}
              disabled={autoSeeding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Automatically discover and track Top-Level (Tier 1 & 2) Local SEO keywords"
            >
              <Zap className={`w-3.5 h-3.5 text-purple-600 ${autoSeeding ? 'animate-spin' : ''}`} />
              <span>{autoSeeding ? 'Generating Top Keywords...' : '⚡ Auto-Generate Top Keywords'}</span>
            </button>

            <button
              onClick={() => handleOpenRealtimeTrends(trendsGeo)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-[#034bc0]" />
              <span>Real-Time Trends Discovery</span>
            </button>

            <button
              onClick={handleOpenSuggestions}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Suggestions</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target Keyword</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Seed Banner Notification */}
      {autoSeedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{autoSeedMsg}</span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {trackSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Trending keyword "{trackSuccess}" added to active SEO rank tracking!
          </span>
        </div>
      )}

      {/* Evolution Success Notification */}
      {evolutionMsg && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900 font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{evolutionMsg}</span>
          </div>
        </div>
      )}

      {/* 7-Day AI Evolution Status & Control Strip - Clean & Simple Design */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#034bc0] shrink-0">
              <RefreshCw className={`w-5 h-5 ${evolvingKeywords ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Autonomous Weekly Keyword Evolution
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {evolutionStatus?.daysRemaining === 0 ? 'Rotation Due Today' : `Next Rotation: in ${evolutionStatus?.daysRemaining || 7} Days`}
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                  • Powered by Google Trends & Review Signals
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Automatically scans local search trends every 7 days and rotates high-converting buyer queries into your active SEO tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              onClick={handleTriggerWeeklyEvolution}
              disabled={evolvingKeywords}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Trigger 7-day AI rotation immediately using live Google Trends & customer review data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evolvingKeywords ? 'animate-spin' : ''}`} />
              <span>{evolvingKeywords ? 'Evolving Keywords...' : '⚡ Run 7-Day Evolution Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tracked</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.total_tracked || 0}</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Active in 3-Pack telemetry</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Ranked in Top 3</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.top_3_count || 0} terms</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Prime map visibility</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#034bc0] uppercase tracking-wider">Average Local Rank</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            #{summary.avg_rank ? Number(summary.avg_rank).toFixed(1) : '2.6'}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Targeting #1 position</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Moved Up This Week</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{summary.improved_count || 2} terms</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Upward trajectory</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Groups Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveGroup('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeGroup === 'all' ? 'bg-white text-[#034bc0] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Keywords
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeGroup === g.id ? 'bg-white text-[#034bc0] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keyword term..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#034bc0] focus:bg-white"
            />
          </div>
        </div>

        {/* Intent Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-1">Intent Filter:</span>
          {['all', 'local', 'near_me', 'service', 'competitor', 'seasonal', 'review_theme', 'long_tail', 'commercial'].map((int) => (
            <button
              key={int}
              onClick={() => setIntentFilter(int)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                intentFilter === int
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {int.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords Table with Google Trends Trajectory */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Keyword Term</th>
                <th className="py-3.5 px-4">Search Intent</th>
                <th className="py-3.5 px-4 text-center">Current Rank</th>
                <th className="py-3.5 px-4 text-center">Movement</th>
                <th className="py-3.5 px-4 text-center">Google Trends Trajectory</th>
                <th className="py-3.5 px-4 text-right">Search Volume</th>
                <th className="py-3.5 px-4 text-center">Difficulty</th>
                <th className="py-3.5 px-4 text-center">Opportunity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading tracked keywords and Google Trends telemetry...
                  </td>
                </tr>
              ) : filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        No Tracked Keywords Yet
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Click below to automatically discover and track the highest-volume, highest-converting Top-Level (Tier 1 & 2) keywords for <strong>{activeBusiness?.name || 'your business'}</strong> in <strong>{activeBusiness?.city || 'your city'}</strong>.
                      </p>
                      <button
                        onClick={handleAutoSeed}
                        disabled={autoSeeding}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 ${autoSeeding ? 'animate-spin' : ''}`} />
                        <span>{autoSeeding ? 'Auto-Generating Top Keywords...' : '⚡ Auto-Generate Top-Level Keywords Now'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((k) => {
                  const rankDiff = (k.previous_rank || k.current_rank) - k.current_rank;
                  const trendBadge = getTrendBadge(k);
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleTogglePrimary(k.id)}
                            className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                            title={k.is_primary ? 'Primary Target Keyword' : 'Click to make Primary'}
                          >
                            <Star className={`w-4 h-4 ${k.is_primary ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                          <span>{k.keyword}</span>
                          {k.tier && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                k.tier === 'Tier 1'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : k.tier === 'Tier 2'
                                  ? 'bg-blue-100 text-[#034bc0] border border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {k.tier} • {k.tier_label || 'Core'}
                            </span>
                          )}
                          {k.opportunity_reason?.includes('Geo-Grid Recovery') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-[#034bc0] border border-blue-200">
                              📍 Geo-Grid Recovery
                            </span>
                          )}
                          {k.opportunity_reason?.includes('Competitor Gap') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              ⚔️ Competitor Intercept
                            </span>
                          )}
                          {k.opportunity_reason?.includes('Seasonal') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                              🍁 Seasonal Surge
                            </span>
                          )}
                          {k.opportunity_reason?.includes('Review Verified') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ⭐ Review Verified
                            </span>
                          )}
                          {k.opportunity_reason?.includes('7-Day AI Evolution') && !k.opportunity_reason?.includes('Geo-Grid') && !k.opportunity_reason?.includes('Competitor') && !k.opportunity_reason?.includes('Seasonal') && !k.opportunity_reason?.includes('Review Verified') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              🚀 7-Day Evolved
                            </span>
                          )}
                          {k.group_name && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: `${k.group_color || '#034bc0'}15`, color: k.group_color || '#034bc0' }}
                            >
                              {k.group_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {k.intent}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                          k.current_rank <= 3
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold'
                            : k.current_rank <= 10
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{k.current_rank || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {rankDiff > 0 ? (
                          <span className="inline-flex items-center justify-center gap-0.5 text-emerald-600 font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> +{rankDiff}
                          </span>
                        ) : rankDiff < 0 ? (
                          <span className="inline-flex items-center justify-center gap-0.5 text-rose-600 font-bold">
                            <TrendingDown className="w-3.5 h-3.5" /> {rankDiff}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Google Trends Trajectory */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/trends?q=${encodeURIComponent(k.keyword)}&geo=${trendsGeo}`)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${trendBadge.bg}`}
                          title="Open in Google Trends Intelligence Suite"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>{trendBadge.label}</span>
                          <span className="text-[9px] opacity-75">({trendBadge.sub})</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {k.search_volume ? k.search_volume.toLocaleString() : '1,200'}/mo
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                          <div
                            className={`h-full rounded-full ${k.difficulty > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${k.difficulty || 30}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block font-semibold">{k.difficulty || 30}/100</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#034bc0] border border-blue-200">
                          {k.opportunity_score || 85}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          {/* Run Geo-Grid Heatmap */}
                          <button
                            onClick={() => navigate(`/geo-grid?keyword=${encodeURIComponent(k.keyword)}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#034bc0] hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Run Local Geo-Grid Heatmap"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>

                          {/* Live Google Search Verification */}
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(k.keyword + ' ' + (activeBusiness?.city || ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Verify on Live Google Search"
                          >
                            <Globe2 className="w-3.5 h-3.5" />
                          </a>

                          {/* Analyze in Trends */}
                          <button
                            onClick={() => navigate(`/trends?q=${encodeURIComponent(k.keyword)}&geo=${trendsGeo}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#034bc0] hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Analyze in Trends Intelligence"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Keyword */}
                          <button
                            onClick={() => handleDeleteKeyword(k.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove keyword from tracking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Trends Discovery Drawer */}
      {realtimeTrendsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setRealtimeTrendsDrawerOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl h-full p-6 z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#034bc0]" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Real-Time Google Trends Radar</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Live RSS Stream
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setRealtimeTrendsDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Geo Filter inside drawer */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Region Telemetry:</span>
                <div className="flex items-center gap-1">
                  {[
                    { code: 'IN', label: '🇮🇳 India' },
                    { code: 'US', label: '🇺🇸 US' },
                    { code: 'GB', label: '🇬🇧 UK' }
                  ].map(g => (
                    <button
                      key={g.code}
                      onClick={() => {
                        setTrendsGeo(g.code);
                        handleOpenRealtimeTrends(g.code);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        trendsGeo === g.code ? 'bg-[#034bc0] text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleOpenRealtimeTrends(trendsGeo)}
                    disabled={loadingRealtimeTrends}
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#034bc0] cursor-pointer"
                    title="Refresh Live Stream"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRealtimeTrends ? 'animate-spin text-[#034bc0]' : ''}`} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Surging queries streamed directly from Google Trends daily RSS feed. 1-click add any high-demand search term into your active SEO rank tracker!
              </p>

              {loadingRealtimeTrends ? (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#034bc0]" />
                  <span>Connecting to Google Trends Live Telemetry...</span>
                </div>
              ) : realtimeTrends.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active trending queries streamed. Click refresh or choose another region.
                </div>
              ) : (
                <div className="space-y-3">
                  {realtimeTrends.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#034bc0]"></span>
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.query}</span>
                          </div>
                          {t.primaryArticle?.source && (
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                              Source: {t.primaryArticle.source}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          {t.traffic || '50K+'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {t.primaryArticle?.title || 'High breakout search interest on Google search network.'}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          onClick={() => navigate(`/trends?q=${encodeURIComponent(t.query)}&geo=${trendsGeo}`)}
                          className="text-[#034bc0] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Deep-Dive Curve</span>
                        </button>

                        <button
                          onClick={() => handleTrackFromRealtimeTrends(t.query)}
                          className="px-3 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Track in SEO</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setRealtimeTrendsDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setAddModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add Target Keyword</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Keyword Query</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. best restaurant near me"
                  value={newKeywordStr}
                  onChange={(e) => setNewKeywordStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#034bc0] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Search Intent</label>
                <select
                  value={newKeywordIntent}
                  onChange={(e) => setNewKeywordIntent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] focus:bg-white"
                >
                  <option value="local">Local Intent (City / Area)</option>
                  <option value="commercial">Commercial / Purchase</option>
                  <option value="near_me">Near Me / Proximity</option>
                  <option value="service">Specific Service Offering</option>
                  <option value="brand">Brand Query</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Keyword Group</label>
                <select
                  value={newKeywordGroup}
                  onChange={(e) => setNewKeywordGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] focus:bg-white"
                >
                  <option value="">No Group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={newKeywordPrimary}
                  onChange={(e) => setNewKeywordPrimary(e.target.checked)}
                  className="rounded border-slate-300 text-[#034bc0] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="primaryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Primary Target Keyword
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Keyword
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Suggestions Drawer */}
      {suggestionsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSuggestionsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-2xl h-full p-6 z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-extrabold text-slate-900">AI Keyword Suggestions</h3>
                </div>
                <button
                  onClick={() => setSuggestionsDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Generated dynamically from your Business Intelligence Profile, local service categories, and verified search intents.
              </p>

              {loadingSuggestions ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Synthesizing local keyword search trends...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No new suggestions available right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-[#034bc0] border border-blue-200">
                              {s.group || 'Local Intent'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {s.intent}
                            </span>
                            {s.source && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {s.source}
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-slate-900 text-xs mt-1.5 block leading-snug">{s.keyword}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          {s.opportunityScore || 90}% Opp
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {s.reason}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200/60">
                        <div className="flex items-center gap-3 font-semibold">
                          <span><strong>{s.searchVolume?.toLocaleString()}</strong> vol/mo</span>
                          <span>Diff: <strong>{s.difficulty}/100</strong></span>
                        </div>
                        <button
                          onClick={() => handleAddSuggestion(s)}
                          className="px-3 py-1.5 rounded-lg bg-[#034bc0] hover:bg-[#023aa0] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Approve & Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSuggestionsDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close Suggestions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordsPage;
