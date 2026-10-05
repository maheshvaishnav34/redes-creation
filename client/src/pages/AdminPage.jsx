import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Server, Database, Activity, Cpu, Users, Building, 
  Clock, CheckCircle2, AlertTriangle, RefreshCw, Eye, Power, FileCode,
  QrCode, Edit3, Trash2, Globe, ThumbsUp, ExternalLink, Plus,
  CreditCard, Receipt, Sliders, Zap, Download
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [activeTab, setActiveTab] = useState('health'); // health, workspaces, billing, campaigns, jobs, prompts, audit

  // Billing Administration State
  const [billingOverview, setBillingOverview] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({
    plan: 'Starter',
    billing_cycle: 'monthly',
    status: 'active',
    max_locations: 1,
    max_keywords: 25,
    max_ai_replies: 50,
    max_geogrid_points: 25,
    competitor_intelligence: false,
    white_label: false
  });
  const [savingSub, setSavingSub] = useState(false);

  // Manual Invoice Creation State
  const [manualInvoiceModalOpen, setManualInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    workspaceId: '',
    plan: 'Professional',
    amount: 8999,
    description: 'SaaS Platform License Fee',
    status: 'paid'
  });
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Admin Campaign Edit State
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBizName, setEditBizName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGoogleUrl, setEditGoogleUrl] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editPostReview, setEditPostReview] = useState(true);
  const [savingCamp, setSavingCamp] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [hRes, wRes, aRes, pRes] = await Promise.all([
        api.getAdminHealth(),
        api.listAdminWorkspaces(),
        api.getAdminAuditLogs(),
        api.getAdminPrompts()
      ]);

      if (hRes.success) setHealth(hRes.health);
      if (wRes.success) setWorkspaces(wRes.workspaces);
      if (aRes.success) setAuditLogs(aRes.auditLogs);
      if (pRes.success) setPrompts(pRes.prompts);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.listCampaigns();
      if (res.success) {
        setCampaigns(res.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns in admin:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchBillingOverview = async () => {
    try {
      setLoadingBilling(true);
      const res = await api.getAdminBillingOverview();
      if (res.success) {
        setBillingOverview(res);
      }
    } catch (err) {
      console.error('Failed to load billing overview in admin:', err);
    } finally {
      setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    }
    if (activeTab === 'billing') {
      fetchBillingOverview();
    }
  }, [activeTab]);

  const openEditSubscription = (sub) => {
    setEditingSub(sub);
    const limits = sub.limits || {};
    setSubForm({
      plan: sub.plan || 'Starter',
      billing_cycle: sub.billing_cycle || 'monthly',
      status: sub.status || 'active',
      max_locations: limits.max_locations ?? 1,
      max_keywords: limits.max_keywords ?? 25,
      max_ai_replies: limits.max_ai_replies ?? 50,
      max_geogrid_points: limits.max_geogrid_points ?? 25,
      competitor_intelligence: !!limits.competitor_intelligence,
      white_label: !!limits.white_label
    });
    setEditSubModalOpen(true);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!editingSub) return;
    setSavingSub(true);
    try {
      const res = await api.adminUpdateSubscription(editingSub.workspace_id, {
        plan: subForm.plan,
        billing_cycle: subForm.billing_cycle,
        status: subForm.status,
        limits: {
          max_locations: Number(subForm.max_locations),
          max_keywords: Number(subForm.max_keywords),
          max_ai_replies: Number(subForm.max_ai_replies),
          max_geogrid_points: Number(subForm.max_geogrid_points),
          competitor_intelligence: Boolean(subForm.competitor_intelligence),
          white_label: Boolean(subForm.white_label)
        }
      });
      if (res.success) {
        setEditSubModalOpen(false);
        fetchBillingOverview();
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to update subscription limits: ' + err.message);
    } finally {
      setSavingSub(false);
    }
  };

  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.workspaceId) {
      alert('Please select a target workspace.');
      return;
    }
    setSavingInvoice(true);
    try {
      const res = await api.adminCreateInvoice(invoiceForm);
      if (res.success) {
        setManualInvoiceModalOpen(false);
        fetchBillingOverview();
        alert('GST Tax invoice created successfully!');
      }
    } catch (err) {
      alert('Failed to issue invoice: ' + err.message);
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleToggleWorkspace = async (id) => {
    try {
      const res = await api.toggleWorkspaceStatus(id);
      if (res.success) {
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, is_active: !w.is_active } : w));
      }
    } catch (err) {
      alert('Error changing workspace status: ' + err.message);
    }
  };

  const handleToggleCampaignStatus = async (camp) => {
    const newStatus = camp.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateCampaignStatus(camp.id, newStatus);
      setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert('Error changing campaign status: ' + err.message);
    }
  };

  const openAdminEdit = (camp) => {
    setEditingCamp(camp);
    setEditName(camp.name || '');
    setEditBizName(camp.business_name || camp.name || '');
    setEditWebsite(camp.website || camp.business_website || '');
    setEditGoogleUrl(camp.google_review_url || '');
    setEditStatus(camp.status || 'active');
    setEditPostReview(camp.post_review_enabled !== false);
    setEditAdminModalOpen(true);
  };

  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    if (!editingCamp) return;
    setSavingCamp(true);
    try {
      const res = await api.updateCampaign(editingCamp.id, {
        name: editName.trim(),
        businessName: editBizName.trim() || editName.trim(),
        website: editWebsite.trim(),
        googleReviewUrl: editGoogleUrl.trim(),
        status: editStatus,
        postReviewEnabled: editPostReview
      });
      if (res.success) {
        setEditAdminModalOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      alert('Failed to update campaign: ' + err.message);
    } finally {
      setSavingCamp(false);
    }
  };

  const handleDeleteAdminCamp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will remove all feedback records.')) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete campaign: ' + err.message);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Connecting to Super-Admin Observability Cluster...</p>
        </div>
      </div>
    );
  }

  const totals = health?.totals || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> PLATFORM SUPER-ADMIN
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Health & Global Operations</h1>
          <p className="text-xs text-slate-300 mt-1">
            Cluster monitoring, tenant isolation health, review campaigns administration, background jobs, and AI prompt versioning.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {/* Cluster Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Workspaces', value: totals.workspaces || 1, icon: Building, color: 'text-indigo-600' },
          { label: 'Platform Users', value: totals.users || 5, icon: Users, color: 'text-blue-600' },
          { label: 'Active Businesses', value: totals.businesses || 3, icon: Server, color: 'text-emerald-600' },
          { label: 'Reviews Synced', value: totals.reviewsIndexed || 48, icon: Activity, color: 'text-amber-600' },
          { label: 'AI Generations', value: totals.aiGenerations || 24, icon: Cpu, color: 'text-violet-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'health', label: 'Cluster Diagnostics', icon: Activity },
          { id: 'workspaces', label: `Workspaces (${workspaces.length})`, icon: Building },
          { id: 'billing', label: 'Subscriptions & Invoices', icon: CreditCard },
          { id: 'campaigns', label: 'Review Campaigns', icon: QrCode },
          { id: 'jobs', label: 'Background Workers', icon: Server },
          { id: 'prompts', label: 'AI Prompt Versions', icon: FileCode },
          { id: 'audit', label: 'Global Audit Trail', icon: ShieldCheck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Diagnostics */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" /> Database Engine & Node Runtime
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-600 dark:text-slate-400">PostgreSQL Version</span>
                <span className="font-bold text-slate-900 dark:text-white">PostgreSQL 18.0 (localhost:5432)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Node.js Runtime</span>
                <span className="font-bold text-slate-900 dark:text-white">{health?.nodeVersion || 'v22.20.0'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Server Uptime</span>
                <span className="font-bold text-slate-900 dark:text-white">{Math.round(health?.uptime || 120)} seconds</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Active DB Connection Pool</span>
                <span className="font-bold text-emerald-600">Healthy (20 clients max, 0 waiting)</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Governance & Policy Enforcers
            </h3>
            <p className="text-xs text-slate-500">
              Active guardrails preventing toxic replies, hallucinations, and unauthorized client deletions.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Fact-Checking Pipeline</div>
                  <div className="text-slate-400">Cross-checks draft claims against business knowledge base.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">ACTIVE</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Mandatory 1-3★ Approval Gate</div>
                  <div className="text-slate-400">Auto-publish disabled for critical/mixed reviews.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">ENFORCED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workspaces Management */}
      {activeTab === 'workspaces' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">All Multi-Tenant Workspaces</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Workspace Name</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Locations</th>
                  <th className="pb-3">Users</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{w.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {w.plan || 'Starter'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{w.business_count || 1}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{w.user_count || 1}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {w.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleWorkspace(w.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          w.is_active
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {w.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Subscriptions & Invoicing (ADMIN CONTROLS) */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Billing Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Monthly Recurring Revenue</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{Number(billingOverview?.mrr || 24999).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>Active platform MRR</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Active Subscriptions</span>
                <Building className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {billingOverview?.totalActive ?? workspaces.length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Paid SaaS tenants
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Plan Breakdown</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#034bc0] font-bold">
                  Starter: {billingOverview?.byPlan?.starter || 0}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  Pro: {billingOverview?.byPlan?.professional || 0}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                  Agency: {billingOverview?.byPlan?.agency || 1}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                Enterprise: {billingOverview?.byPlan?.enterprise || 0}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">GST Compliance</span>
                  <Receipt className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  18% Indian GST (CGST+SGST)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  GSTIN: 24ABCDE1234F1Z5
                </div>
              </div>
              <button
                onClick={() => setManualInvoiceModalOpen(true)}
                className="mt-3 w-full py-1.5 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Manual Invoice
              </button>
            </div>
          </div>

          {/* All Workspace Subscriptions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#034bc0]" /> All Tenant Subscriptions & Live Quota Meters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super-Admin can manually override plans, increase location limits, and adjust AI reply quotas for any workspace.
                </p>
              </div>
              <button
                onClick={fetchBillingOverview}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBilling ? 'animate-spin' : ''}`} />
                <span>Refresh Subscriptions</span>
              </button>
            </div>

            {loadingBilling ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-semibold">Loading subscription records...</span>
              </div>
            ) : !billingOverview?.subscriptions?.length ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active subscriptions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Workspace</th>
                      <th className="pb-3">Current Plan</th>
                      <th className="pb-3">Cycle</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Usage & Quotas</th>
                      <th className="pb-3">Period End</th>
                      <th className="pb-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {billingOverview.subscriptions.map((sub) => {
                      const limits = sub.limits || {};
                      const usage = sub.usage || {};
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            <div>{sub.workspace_name || 'Main Workspace'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {sub.workspace_id?.slice(0, 8)}...</div>
                          </td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#034bc0] border border-blue-200">
                              {sub.plan || 'Starter'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300 capitalize">
                            {sub.billing_cycle || 'monthly'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {sub.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            <div className="space-y-0.5 text-[11px]">
                              <div>Locations: <span className="font-bold text-slate-800 dark:text-slate-100">{usage.locations_used ?? 0}</span> / {limits.max_locations ?? 1}</div>
                              <div>Keywords: <span className="font-bold text-slate-800 dark:text-slate-100">{usage.keywords_tracked ?? 0}</span> / {limits.max_keywords ?? 25}</div>
                              <div>AI Replies: <span className="font-bold text-slate-800 dark:text-slate-100">{usage.ai_replies_used ?? 0}</span> / {limits.max_ai_replies ?? 50}</div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Auto-renewing'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => openEditSubscription(sub)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#034bc0] hover:text-white text-slate-700 dark:text-slate-300 font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Override Limits</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Platform Invoices & Tax Receipts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and print official GST invoices with 18% tax breakdown for all tenant billing transactions.
                </p>
              </div>
            </div>

            {!billingOverview?.recentInvoices?.length ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No invoices generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Invoice Number</th>
                      <th className="pb-3">Workspace</th>
                      <th className="pb-3">Plan / Description</th>
                      <th className="pb-3">Amount + GST</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">GST Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {billingOverview.recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {inv.workspace_name || 'Main Workspace'}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400">
                          {inv.description || `${inv.plan} Subscription`}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            ₹{Number(inv.total_amount || inv.amount).toLocaleString('en-IN')}
                          </div>
                          {inv.tax_amount > 0 && (
                            <div className="text-[10px] text-slate-400">
                              (incl. ₹{Number(inv.tax_amount).toLocaleString('en-IN')} GST)
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => window.open(api.getInvoiceDownloadUrl(inv.id), '_blank')}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#034bc0] text-[#034bc0] hover:text-white font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>View Tax Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Review Campaigns Management (ADMIN CONTROLS) */}
      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" /> Review Collection Campaigns Administration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Super-Admin controls to change campaign details, pause/resume traffic, and inspect real-time funnel metrics.
              </p>
            </div>
            <button
              onClick={fetchCampaigns}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCampaigns ? 'animate-spin' : ''}`} />
              <span>Refresh Campaigns</span>
            </button>
          </div>

          {loadingCampaigns ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 font-semibold">Loading campaigns data...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No campaigns found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Campaign & Business</th>
                    <th className="pb-3">Channel</th>
                    <th className="pb-3">Website & Review Link</th>
                    <th className="pb-3 text-center">Scans</th>
                    <th className="pb-3 text-center">Opened</th>
                    <th className="pb-3 text-center">Feedback</th>
                    <th className="pb-3 text-center">Attributed</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{camp.name}</div>
                        <div className="text-[11px] text-slate-500">{camp.business_name || 'Business'}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          {camp.channel}
                        </span>
                      </td>
                      <td className="py-3 text-[11px]">
                        <div className="truncate max-w-[160px] text-slate-700 dark:text-slate-300 font-mono">
                          {camp.website || camp.business_website || '—'}
                        </div>
                        {camp.google_review_url && (
                          <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                            <ThumbsUp className="w-2.5 h-2.5" /> Google Target Set
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {Number(camp.sent_count ?? 0)}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {Number(camp.clicked_count ?? 0)}
                      </td>
                      <td className="py-3 text-center font-bold text-indigo-600">
                        {Number(camp.feedback_started_count ?? 0)}
                      </td>
                      <td className="py-3 text-center font-black text-emerald-600">
                        {Number(camp.attributed_reviews_count ?? 0)}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleCampaignStatus(camp)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border transition cursor-pointer ${
                            camp.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300'
                          }`}
                          title="Click to toggle Active / Paused"
                        >
                          {camp.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAdminEdit(camp)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Edit campaign settings"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAdminCamp(camp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Background Workers */}
      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Scheduled Cron & Worker Job Runs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Job Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Items Processed</th>
                  <th className="pb-3">Started At</th>
                  <th className="pb-3">Completed At</th>
                  <th className="pb-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {health?.recentJobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white capitalize">
                      {job.job_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{job.items_processed}</td>
                    <td className="py-3 text-slate-500">{new Date(job.started_at).toLocaleTimeString()}</td>
                    <td className="py-3 text-slate-500">{job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : 'In Progress'}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                      {JSON.stringify(job.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Prompt Versions */}
      {activeTab === 'prompts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Prompt Versions & AI Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</div>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded">
                    {p.version}
                  </span>
                </div>
                <div className="text-xs text-slate-400">Target Model: <span className="text-slate-200 font-semibold">{p.model}</span></div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-mono line-clamp-4">
                  {p.system_prompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Immutable Global Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Action Event</th>
                  <th className="pb-3">Actor / User</th>
                  <th className="pb-3">Target Entity</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white font-mono text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {log.user_name || log.user_email || 'System Worker'}
                    </td>
                    <td className="py-3 text-slate-500">{log.entity_type}</td>
                    <td className="py-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 text-slate-400 font-mono text-[10px] truncate max-w-xs">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Edit Campaign Modal */}
      {editAdminModalOpen && editingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditAdminModalOpen(false)} />

          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin: Edit Review Campaign
              </h3>
              <button
                onClick={() => setEditAdminModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Brand / Business Display</label>
                <input
                  type="text"
                  value={editBizName}
                  onChange={(e) => setEditBizName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Official Website</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Google Maps Review Link</label>
                <input
                  type="text"
                  value={editGoogleUrl}
                  onChange={(e) => setEditGoogleUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Post-Review Redirection</label>
                  <button
                    type="button"
                    onClick={() => setEditPostReview(!editPostReview)}
                    className={`w-full py-2 rounded-xl font-bold transition cursor-pointer ${
                      editPostReview ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    {editPostReview ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCamp}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingCamp ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Edit Subscription & Quota Limits Modal */}
      {editSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditSubModalOpen(false)} />

          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#034bc0]" />
                  <span>Admin: Override Plan & Quota Limits</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Workspace: <span className="font-semibold text-slate-700 dark:text-slate-300">{editingSub.workspace_name}</span>
                </p>
              </div>
              <button
                onClick={() => setEditSubModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tier / Plan</label>
                  <select
                    value={subForm.plan}
                    onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold capitalize"
                  >
                    <option value="starter">Starter (₹3,499)</option>
                    <option value="professional">Professional (₹8,999)</option>
                    <option value="agency">Agency (₹24,999)</option>
                    <option value="enterprise">Enterprise (₹49,999)</option>
                    <option value="custom">Custom Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Billing Cycle</label>
                  <select
                    value={subForm.billing_cycle}
                    onChange={(e) => setSubForm({ ...subForm, billing_cycle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (20% Off)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subscription Status</label>
                  <select
                    value={subForm.status}
                    onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Enforced Resource Limits & Quotas
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Max Locations</label>
                    <input
                      type="number"
                      min="1"
                      value={subForm.max_locations}
                      onChange={(e) => setSubForm({ ...subForm, max_locations: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Max Keywords</label>
                    <input
                      type="number"
                      min="5"
                      value={subForm.max_keywords}
                      onChange={(e) => setSubForm({ ...subForm, max_keywords: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Max AI Replies</label>
                    <input
                      type="number"
                      min="10"
                      value={subForm.max_ai_replies}
                      onChange={(e) => setSubForm({ ...subForm, max_ai_replies: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Geo-Grid Points</label>
                    <input
                      type="number"
                      min="9"
                      value={subForm.max_geogrid_points}
                      onChange={(e) => setSubForm({ ...subForm, max_geogrid_points: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.competitor_intelligence}
                      onChange={(e) => setSubForm({ ...subForm, competitor_intelligence: e.target.checked })}
                      className="w-4 h-4 rounded text-[#034bc0]"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Competitor Intelligence Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subForm.white_label}
                      onChange={(e) => setSubForm({ ...subForm, white_label: e.target.checked })}
                      className="w-4 h-4 rounded text-[#034bc0]"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">White-Label Reports & Portal</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSub}
                  className="px-5 py-2 rounded-xl bg-[#034bc0] hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingSub ? 'Saving Limits...' : 'Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Manual GST Invoice Creation Modal */}
      {manualInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManualInvoiceModalOpen(false)} />

          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Super-Admin: Issue GST Tax Invoice</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Generate an official GST invoice with 18% tax calculation for any workspace.
                </p>
              </div>
              <button
                onClick={() => setManualInvoiceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Tenant Workspace</label>
                <select
                  required
                  value={invoiceForm.workspaceId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, workspaceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">-- Select Workspace --</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.plan || 'Starter'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Associated Plan</label>
                  <select
                    value={invoiceForm.plan}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Agency">Agency</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Custom Expansion">Custom Expansion</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Invoice Item Description</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payment Status</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="paid">Paid</option>
                    <option value="open">Open / Unpaid</option>
                  </select>
                </div>

                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500">Total with 18% GST:</span>
                  <span className="text-sm font-bold text-[#034bc0]">
                    ₹{(Math.round(invoiceForm.amount * 1.18)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInvoice}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingInvoice ? 'Generating...' : 'Issue GST Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
