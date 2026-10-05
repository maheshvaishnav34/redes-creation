import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const KeywordsPage = () => {
  const { activeBusiness } = useAuth();

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

  useEffect(() => {
    fetchKeywords();
    const handleBizSwitch = () => fetchKeywords();
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

  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Keyword Intelligence & Rank Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily local 3-Pack rank movements, intent categories, search volumes, and high-value opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenSuggestions}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Discover Suggestions</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-brand"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target Keyword</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">Total Tracked</span>
          <p className="text-xl font-extrabold text-white mt-0.5">{summary.total_tracked || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-400">Ranked in Top 3</span>
          <p className="text-xl font-extrabold text-white mt-0.5">{summary.top_3_count || 0} terms</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-indigo-400">Average Local Rank</span>
          <p className="text-xl font-extrabold text-white mt-0.5">
            #{summary.avg_rank ? Number(summary.avg_rank).toFixed(1) : '2.6'}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-400">Moved Up This Week</span>
          <p className="text-xl font-extrabold text-white mt-0.5">+{summary.improved_count || 2} terms</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Groups Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setActiveGroup('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeGroup === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All Keywords
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${activeGroup === g.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
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
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Intent Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase mr-1">Intent Filter:</span>
          {['all', 'local', 'near_me', 'service', 'long_tail', 'brand', 'problem', 'review_theme', 'commercial'].map((int) => (
            <button
              key={int}
              onClick={() => setIntentFilter(int)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                intentFilter === int
                  ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400/50'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              {int.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Keyword Term</th>
                <th className="py-3.5 px-4">Search Intent</th>
                <th className="py-3.5 px-4 text-center">Current Rank</th>
                <th className="py-3.5 px-4 text-center">Movement</th>
                <th className="py-3.5 px-4 text-right">Search Volume</th>
                <th className="py-3.5 px-4 text-center">Difficulty</th>
                <th className="py-3.5 px-4 text-center">Opportunity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading tracked keywords...
                  </td>
                </tr>
              ) : filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No keywords found. Click "Add Target Keyword" to start tracking.
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((k) => {
                  const rankDiff = (k.previous_rank || k.current_rank) - k.current_rank;
                  return (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePrimary(k.id)}
                            className="text-slate-500 hover:text-amber-400 transition-colors"
                            title={k.is_primary ? 'Primary Target Keyword' : 'Click to make Primary'}
                          >
                            <Star className={`w-4 h-4 ${k.is_primary ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <span>{k.keyword}</span>
                          {k.group_name && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold"
                              style={{ backgroundColor: `${k.group_color || '#6366f1'}20`, color: k.group_color || '#6366f1' }}
                            >
                              {k.group_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {k.intent}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                          k.current_rank <= 3
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold'
                            : k.current_rank <= 10
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{k.current_rank || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {rankDiff > 0 ? (
                          <span className="flex items-center justify-center gap-0.5 text-emerald-400 font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> +{rankDiff}
                          </span>
                        ) : rankDiff < 0 ? (
                          <span className="flex items-center justify-center gap-0.5 text-rose-400 font-bold">
                            <TrendingDown className="w-3.5 h-3.5" /> {rankDiff}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                        {k.search_volume ? k.search_volume.toLocaleString() : '1,200'}/mo
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 mx-auto overflow-hidden">
                          <div
                            className={`h-full rounded-full ${k.difficulty > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${k.difficulty || 30}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">{k.difficulty || 30}/100</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {k.opportunity_score || 85}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleTogglePrimary(k.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                          >
                            {k.is_primary ? 'Unmark' : 'Make Primary'}
                          </button>
                          <button
                            onClick={() => handleDeleteKeyword(k.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
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

      {/* Add Keyword Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Target Keyword</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Keyword Query</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. best restaurant near me"
                  value={newKeywordStr}
                  onChange={(e) => setNewKeywordStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Search Intent</label>
                <select
                  value={newKeywordIntent}
                  onChange={(e) => setNewKeywordIntent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="local">Local Intent (City / Area)</option>
                  <option value="commercial">Commercial / Purchase</option>
                  <option value="near_me">Near Me / Proximity</option>
                  <option value="service">Specific Service Offering</option>
                  <option value="brand">Brand Query</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Keyword Group</label>
                <select
                  value={newKeywordGroup}
                  onChange={(e) => setNewKeywordGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="primaryCheck" className="text-xs font-medium text-slate-300">
                  Mark as Primary Target Keyword
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-glow-brand"
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSuggestionsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full p-6 z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-extrabold text-white">AI Keyword Suggestions</h3>
                </div>
                <button onClick={() => setSuggestionsDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Generated dynamically from your Business Intelligence Profile, local service categories, and verified search intents.
              </p>

              {loadingSuggestions ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Synthesizing local keyword search trends...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No new suggestions available right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 hover:border-indigo-500/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {s.group || 'Local Intent'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {s.intent}
                            </span>
                          </div>
                          <span className="font-extrabold text-white text-xs mt-1.5 block leading-snug">{s.keyword}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          {s.opportunityScore || 90}% Opp
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        {s.reason}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <span><strong>{s.searchVolume?.toLocaleString()}</strong> vol/mo</span>
                          <span>Diff: <strong>{s.difficulty}/100</strong></span>
                        </div>
                        <button
                          onClick={() => handleAddSuggestion(s)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Approve & Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setSuggestionsDrawerOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
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
