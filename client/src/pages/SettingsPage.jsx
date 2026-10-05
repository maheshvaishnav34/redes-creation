import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Shield, Lock, Building, Globe, CheckCircle2, 
  UserPlus, Mail, Key, Sparkles, AlertCircle, Save, Clock, Check, HelpCircle,
  Eye, CheckSquare, XCircle, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const [activeTab, setActiveTab] = useState('permissions'); // permissions, workspace, security
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [workspace, setWorkspace] = useState({
    name: '',
    country: 'India',
    timezone: 'Asia/Kolkata',
    default_language: 'en'
  });

  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'client'
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [wsRes, memRes] = await Promise.all([
        api.getCurrentWorkspace(),
        api.getMembers()
      ]);
      if (wsRes.success) setWorkspace(wsRes.workspace);
      if (memRes.success) setMembers(memRes.members);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (isClient) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      await api.updateWorkspace({
        name: workspace.name,
        country: workspace.country,
        timezone: workspace.timezone,
        defaultLanguage: workspace.default_language
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Error updating workspace: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.fullName) return;
    try {
      setInviting(true);
      const res = await api.addMember(inviteForm);
      if (res.success) {
        setMembers(prev => [...prev, res.member]);
        setShowInviteModal(false);
        setInviteForm({ fullName: '', email: '', role: 'client' });
      }
    } catch (err) {
      alert('Invite error: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  // 3-Level Client Permission Definitions
  const level1ViewPermissions = [
    { module: 'Dashboard', perm: 'dashboard.view', desc: 'Real-time overview of rating, velocity, health score, and visibility.' },
    { module: 'Business Profile', perm: 'business.view', desc: 'Transparency into approved brand voice, services catalog, and AI prompt context.' },
    { module: 'Locations', perm: 'locations.view', desc: 'Google Business Profile location telemetry, map pins, and operating hours.' },
    { module: 'Reviews', perm: 'reviews.view', desc: 'Unified reviews inbox across all locations with sentiment and topic tags.' },
    { module: 'Review Campaigns', perm: 'campaigns.view', desc: 'Campaign performance metrics, scan counts, and conversion funnels.' },
    { module: 'QR / Review Links', perm: 'review_links.view', desc: 'Generated customer links and QR destination badges.' },
    { module: 'Keywords', perm: 'keywords.view', desc: 'Tracked target keywords across 10 search intent groups.' },
    { module: 'Rank Tracking', perm: 'rankings.view', desc: 'Google Maps and SERP rank telemetry and historical position movement.' },
    { module: 'Geo-Grid Heatmap', perm: 'geo_grid.view', desc: 'Multi-radius proximity ranking heatmap scans and average rank.' },
    { module: 'Competitors', perm: 'competitors.view', desc: 'Competitor rating benchmarks, review velocity comparison, and SERP visibility.' },
    { module: 'SEO Audit', perm: 'seo_audit.view', desc: 'Automated multi-point audit of GBP completeness, categories, and NAP consistency.' },
    { module: 'SEO Recommendations', perm: 'recommendations.view', desc: 'Strategic recommendations with expected ranking impact scores.' },
    { module: 'Tasks Board', perm: 'tasks.view', desc: 'Kanban view of actionable SEO improvements and assigned workflows.' },
    { module: 'Analytics', perm: 'analytics.view', desc: 'Rating trends, response SLA rate, and keyword visibility graphs.' },
    { module: 'Reports', perm: 'reports.view & download', desc: 'Executive intelligence briefs with 1-click Print and PDF export.' },
    { module: 'Notifications', perm: 'notifications.view', desc: 'Instant review alerts, negative rating warnings, and audit updates.' }
  ];

  const level2ApprovePermissions = [
    { action: 'Approve AI Review Replies', perm: 'reviews.approve_reply', status: 'Approved', desc: 'Review AI-generated draft replies before publishing live to Google Maps.' },
    { action: 'AI Content & Reply Generation', perm: 'ai.generate', status: 'Allowed', desc: 'Generate multi-tone natural review reply options using approved facts.' },
    { action: 'Approve Keyword Suggestions', perm: 'keywords.approve', status: 'Approved', desc: 'Accept or dismiss system-discovered keywords into active tracking targets.' },
    { action: 'SEO Recommendations to Tasks', perm: 'tasks.update', status: 'Allowed', desc: 'Convert identified audit opportunities into tracked Kanban action items.' },
    { action: 'Review Campaigns Creation', perm: 'campaigns.create/edit', status: 'Optional', desc: 'Create custom feedback campaigns with customer review writing assistant.' }
  ];

  const level3RestrictedPermissions = [
    { control: 'Google Connection / OAuth', perm: 'google.connect/disconnect', reason: 'Prevent accidental token revocation and disruption to review sync jobs.' },
    { control: 'Auto-Reply Rules & Automation', perm: 'automation.manage', reason: 'Safety policies, rating thresholds, and escalation rules configured by agency.' },
    { control: 'Users & Roles Management', perm: 'users.manage', reason: 'Tenant membership and security roles strictly enforced at agency level.' },
    { control: 'Business Profile Configuration', perm: 'business.edit', reason: 'Core taxonomy, approved claims, and industry context protected against tampering.' },
    { control: 'Industry Taxonomy Configuration', perm: 'industry.manage', reason: 'Global prompt packs and industry compliance templates are platform-wide.' },
    { control: 'API Key & Webhook Management', perm: 'api.manage', reason: 'Developer tokens, Google Cloud endpoints, and background queue workers.' },
    { control: 'SaaS Billing & Subscriptions', perm: 'billing.manage', reason: 'Subscription tier and billing relationship governed by primary agency agreement.' },
    { control: 'System Settings', perm: 'settings.manage', reason: 'Multi-tenant routing, workspace slugs, and server environment variables.' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#034bc0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Client Settings & Permissions</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Granular 3-level permission architecture: View telemetry, approve AI outputs, while agency protects core system controls.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Client Permissions <span className="hidden sm:inline">(3-Level)</span></span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#034bc0]">
            RBAC
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workspace')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Business Workspace</span>
          {isClient && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
              View Only
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Sessions</span>
        </button>
      </div>

      {/* Tab 1: 3-Level Permission Architecture */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Architecture Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-[#034bc0] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <span className="font-extrabold text-[#034bc0] uppercase tracking-wider block">
                Permission Philosophy: Client Oversight Without Risk
              </span>
              <p className="mt-0.5 leading-relaxed font-medium">
                The Client role is structured in 3 distinct tiers. You have full transparency to <strong>View (Level 1)</strong> all business telemetry and <strong>Approve & Execute (Level 2)</strong> AI replies, keywords, and tasks. Core operational controls are <strong>Restricted (Level 3)</strong> to ensure that Google OAuth, auto-reply policies, and platform configurations remain protected.
              </p>
            </div>
          </div>

          {/* LEVEL 1: VIEW (Read-Only Transparency) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Level 1: View (Read-Only Visibility)</h3>
                  <p className="text-xs text-slate-500">Full visibility into rankings, reviews, SEO telemetry, and competitor movements.</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                16 Modules Allowed ✅
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {level1ViewPermissions.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.module}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      ✅
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#034bc0] block font-bold">{item.perm}</span>
                  <p className="text-[11px] text-slate-600 leading-snug font-medium pt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* LEVEL 2: APPROVE & EXECUTE (Operational Input) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Level 2: Approve & Execute (Client Control)</h3>
                  <p className="text-xs text-slate-500">Client approves AI-generated drafts, accepts keyword suggestions, and converts tasks.</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                Active Approver ✅
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {level2ApprovePermissions.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.action}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 block font-bold">{item.perm}</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* LEVEL 3: RESTRICTED (Agency Protected Controls) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Level 3: Restricted (Protected Agency Governance)</h3>
                  <p className="text-xs text-slate-500">Controls locked from client to protect OAuth stability, safety rules, and database integrity.</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                Locked from Client ❌
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {level3RestrictedPermissions.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.control}</span>
                    <span className="text-[10px] font-bold font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                      ❌
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-700 block font-bold">{item.perm}</span>
                  <p className="text-[11px] text-slate-600 leading-snug font-medium pt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Authorized Client Users Table - Removed in Client Mode (users.manage ❌) */}
          {!isClient && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Authorized Team Users</h3>
                  <p className="text-xs text-slate-500">Users authorized under this workspace account.</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite User</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 px-3">User</th>
                      <th className="pb-3 px-3">Email Address</th>
                      <th className="pb-3 px-3">Role Tier</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-[#034bc0] border border-blue-200 flex items-center justify-center font-extrabold text-xs">
                            {m.full_name?.charAt(0) || 'U'}
                          </div>
                          <span>{m.full_name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{m.email}</td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {m.role || 'client'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Business Workspace Profile */}
      {activeTab === 'workspace' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Business Workspace Information</h3>
              <p className="text-xs text-slate-500">Primary client workspace identification, country, and regional preferences.</p>
            </div>
            {isClient && (
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                View Only (settings.manage ❌)
              </span>
            )}
          </div>

          {isClient && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#034bc0] shrink-0 mt-0.5" />
              <span>
                <strong>Managed by Agency Administrator:</strong> System settings, workspace name, and billing details are governed by your agency agreement. Contact your account manager for structural modifications.
              </span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Workspace preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Client Business Name</label>
              <input
                type="text"
                disabled={isClient}
                required
                value={workspace.name}
                onChange={e => setWorkspace({ ...workspace, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Country / Region</label>
                <input
                  type="text"
                  disabled={isClient}
                  value={workspace.country || 'India'}
                  onChange={e => setWorkspace({ ...workspace, country: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Timezone</label>
                <input
                  type="text"
                  disabled={isClient}
                  value={workspace.timezone || 'Asia/Kolkata'}
                  onChange={e => setWorkspace({ ...workspace, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">System Language</label>
              <select
                disabled={isClient}
                value={workspace.default_language || 'en'}
                onChange={e => setWorkspace({ ...workspace, default_language: e.target.value })}
                className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              >
                <option value="en">English (Global)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="hinglish">Hinglish (Colloquial)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            <div className="pt-2">
              {isClient ? (
                <div className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 inline-flex">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Settings Locked (Agency Managed)</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Workspace Info'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Sessions */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Security & Authentication</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your client session is protected with encrypted JWT authentication and multi-tenant PostgreSQL database isolation.
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Session Security Details:</span>
            <ul className="text-xs text-slate-600 space-y-1 font-medium list-disc list-inside">
              <li>Tenant Workspace ID: <code className="text-[#034bc0] font-mono text-[11px] font-bold">{user?.workspaceId}</code></li>
              <li>User Role: <span className="font-bold text-emerald-700 uppercase">Client</span></li>
              <li>Token Expiration: 7 Days with auto-renewal</li>
            </ul>
          </div>
        </div>
      )}

      {/* Invite Modal (Agency Only) */}
      {showInviteModal && !isClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#034bc0]" /> Invite Client Team Member
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={inviteForm.fullName}
                onChange={e => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="rahul@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#034bc0] font-bold">
              User will be invited with full <strong>Client</strong> role permissions to manage reviews, local SEO, campaigns, and reports.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={inviting || !inviteForm.email || !inviteForm.fullName}
                className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {inviting ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
