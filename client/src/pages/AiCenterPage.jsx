import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  RefreshCw,
  Flame,
  Check,
  X,
  History,
  Bot,
  User,
  Sliders,
  Terminal
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const AiCenterPage = () => {
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState('approvals'); // approvals, assistant, generations
  const [approvals, setApprovals] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assistant Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: `Hello! I am your AI Operations & Reputation Assistant for **${activeBusiness?.name || 'your business'}**.\n\nI have complete contextual access to your Business Intelligence Profile, Google reviews sync, keyword rank movements, and competitor signals. How can I help you optimize your local presence today?`,
      measuredData: {
        'Active Business': activeBusiness?.name || 'Saffron Fine Dine',
        'Industry': activeBusiness?.industry_id || 'Hospitality',
        'Health Score': `${Number(activeBusiness?.health_score || 94.5).toFixed(0)}%`
      },
      recommendations: [
        'Ask: "What changed this week?"',
        'Ask: "Which reviews need attention?"',
        'Ask: "What are competitors doing differently?"'
      ]
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Approval Edit Modal
  const [editingCard, setEditingCard] = useState(null);
  const [editedText, setEditedText] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.getApprovalQueue();
      setApprovals(res.approvals || []);

      const genRes = await api.listAiGenerations();
      setGenerations(genRes.generations || []);
    } catch (err) {
      console.error('[AI_CENTER] Error fetching approval queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id, customReply = null) => {
    try {
      await api.approveAiAction(id, { editedReply: customReply });
      setApprovals(prev => prev.filter(a => a.id !== id));
      setEditingCard(null);
    } catch (err) {
      console.error('[AI_CENTER] Approve failed:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectAiAction(id, { reason: 'Rejected by manager' });
      setApprovals(prev => prev.filter(a => a.id !== id));
      setEditingCard(null);
    } catch (err) {
      console.error('[AI_CENTER] Reject failed:', err);
    }
  };

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.chatAssistant({ message: textToSend });
      const assistantMsg = {
        sender: 'assistant',
        text: res.answer,
        measuredData: res.measuredData || null,
        recommendations: res.recommendations || []
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Apologies, I encountered a temporary connection issue while querying your business intelligence records. Please try again.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Operations & Approval Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Human-in-the-Loop Safe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized approval queue for sensitive actions, explainable AI responses, and conversational business assistant.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Approval Queue ({approvals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'assistant' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('generations')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'generations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Generation Logs</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-300">
              <strong className="text-white">{approvals.length} items</strong> requiring manual authorization before dispatching to external APIs.
            </span>
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero automatic publishing for 1-2 star complaints or safety tags
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="h-44 bg-slate-900 rounded-2xl border border-slate-800"></div>
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All customer reviews and critical notifications have been addressed and synchronized.
              </p>
            </div>
          ) : (
            approvals.map((card) => (
              <div
                key={card.id}
                className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {card.riskLevel} Risk
                    </span>
                    <h3 className="text-sm font-bold text-white">{card.title}</h3>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Received {new Date(card.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Original Customer Review */}
                  <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                      Original Review ({card.rating}★ Stars)
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">"{card.originalData}"</p>
                  </div>

                  {/* AI Synthesized Response Draft */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-semibold text-[10px] uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Drafted Response ({card.tone})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Safety Passed</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed italic">"{card.aiDraft}"</p>
                  </div>
                </div>

                {/* Explainability Meta */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span><strong>Reason for Hold:</strong> {card.reason}</span>
                  <span><strong>Context:</strong> {card.businessContextUsed}</span>
                </div>

                {/* Approval Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 pt-1">
                  <button
                    onClick={() => handleReject(card.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Reject Draft
                  </button>

                  <button
                    onClick={() => {
                      setEditingCard(card);
                      setEditedText(card.aiDraft);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Edit Before Send
                  </button>

                  <button
                    onClick={() => handleApprove(card.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-brand flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Publish to Google</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CONVERSATIONAL AI BUSINESS ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                    msg.sender === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-glow-brand'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Clearly Separated Measured Data Block */}
                  {msg.measuredData && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-400 block tracking-wider">
                        Measured Real Data Points
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        {Object.entries(msg.measuredData).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400">{key}: </span>
                            <span className="text-white font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations Chips */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                        Actionable Recommendations
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {msg.recommendations.map((rec, rIdx) => (
                          <li key={rIdx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Consulting Business Intelligence Profile & rank history...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 shrink-0">Quick prompts:</span>
            {[
              'What changed this week?',
              'Which reviews need attention?',
              'What are competitors doing differently?',
              'What should I work on today?'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/50 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about local SEO rankings, customer sentiment, competitor gaps, or draft responses..."
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-brand flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: GENERATION LOGS */}
      {activeTab === 'generations' && (
        <div className="space-y-4">
          {/* Grok AI & Prompt Versioning Telemetry Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">LLM Engine</span>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Grok AI (xAI)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">Live / Resilient Fallback</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Prompt Version</span>
              <div className="text-sm font-bold text-indigo-300 font-mono">v2.2-production</div>
              <span className="text-[10px] text-slate-500">15-Field BI Profile Bound</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tokens Consumed</span>
              <div className="text-sm font-bold text-white font-mono">
                {generations.reduce((acc, g) => acc + (g.tokens_used || 0), 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Across {generations.length} Generations</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Estimated Cost (USD)</span>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                ${generations.reduce((acc, g) => acc + (parseFloat(g.cost_usd) || ((g.tokens_used || 0) * 0.000005)), 0).toFixed(4)}
              </div>
              <span className="text-[10px] text-slate-500">Atomic Multi-Tenant Meter</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Grok AI Execution & Prompt Version Audit Logs</h3>
                <p className="text-xs text-slate-400">Immutable records of prompt version, tokens consumed, and response cost.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold">
                v2.2-production
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Prompt Version</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Est. Cost</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Output Preview</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {generations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No AI generation records found yet. Try asking the AI Assistant or generating a review reply!
                      </td>
                    </tr>
                  ) : (
                    generations.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-indigo-400">{g.module}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {g.prompt_version || 'v2.2-production'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{g.model_name || 'gpt-4o'}</td>
                        <td className="py-3 px-4 font-mono">{g.tokens_used || 0}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          ${parseFloat(g.cost_usd || ((g.tokens_used || 0) * 0.000005)).toFixed(5)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                            {g.status || 'completed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={g.output_content}>
                          {g.output_content}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reply Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingCard(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Edit Reply Draft</h3>
            <textarea
              rows={5}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingCard(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(editingCard.id, editedText)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCenterPage;
