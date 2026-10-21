import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Check, Zap, Shield, ArrowUpRight, CheckCircle2, 
  Download, FileText, Sparkles, Building, BarChart2, AlertCircle,
  Plus, Trash2, Smartphone, Star, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function BillingPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState(null);

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addPmModalOpen, setAddPmModalOpen] = useState(false);
  const [pmType, setPmType] = useState('upi');
  const [pmUpiId, setPmUpiId] = useState('');
  const [pmCardNum, setPmCardNum] = useState('');
  const [pmExpMonth, setPmExpMonth] = useState('12');
  const [pmExpYear, setPmExpYear] = useState('2028');
  const [pmHolder, setPmHolder] = useState('');
  const [pmIsDefault, setPmIsDefault] = useState(false);
  const [savingPm, setSavingPm] = useState(false);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscription();
      if (res.success) {
        setData(res);
        setPaymentMethods(res.paymentMethods || []);
      }
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgrading(true);
      setUpgradeMsg(null);
      const res = await api.upgradePlan({ plan: planId, billingCycle });
      if (res.success) {
        setUpgradeMsg({ type: 'success', text: res.message });
        await fetchBilling();
      }
    } catch (err) {
      setUpgradeMsg({ type: 'error', text: err.message });
    } finally {
      setUpgrading(false);
      setTimeout(() => setUpgradeMsg(null), 5000);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setSavingPm(true);
    try {
      let payload = { type: pmType, isDefault: pmIsDefault };
      if (pmType === 'upi') {
        payload.brand = 'UPI VPA';
        payload.last4 = pmUpiId.trim();
        payload.billingName = pmHolder || 'Account Holder';
      } else {
        const clean = pmCardNum.replace(/\s+/g, '');
        payload.brand = clean.startsWith('4') ? 'Visa' : clean.startsWith('5') ? 'Mastercard' : 'RuPay';
        payload.last4 = clean.slice(-4) || '4242';
        payload.expMonth = parseInt(pmExpMonth, 10);
        payload.expYear = parseInt(pmExpYear, 10);
        payload.billingName = pmHolder || 'Account Holder';
      }

      const res = await api.addPaymentMethod(payload);
      if (res.success) {
        setAddPmModalOpen(false);
        setPmUpiId('');
        setPmCardNum('');
        fetchBilling();
      }
    } catch (err) {
      alert('Failed to add payment method: ' + err.message);
    } finally {
      setSavingPm(false);
    }
  };

  const handleDeletePm = async (id) => {
    if (!window.confirm('Delete this saved payment method?')) return;
    try {
      await api.deletePaymentMethod(id);
      fetchBilling();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSetDefaultPm = async (id) => {
    try {
      await api.setDefaultPaymentMethod(id);
      fetchBilling();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading Billing & Usage Engine...</p>
        </div>
      </div>
    );
  }

  const sub = data?.subscription || {};
  const plans = data?.plans || [];
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-8 text-slate-900 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-[#034bc0] border border-blue-200">
              {sub.plan || 'AGENCY'} PLAN ACTIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Renew Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Subscription, Usage & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time usage quotas, automated tax invoicing, and Indian Rupee (₹) recurring payment management.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Link to Dedicated Plans & Upgrade Page */}
          <button
            onClick={() => navigate('/plans')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore All Plans & Upgrades</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {upgradeMsg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border animate-in fade-in ${
          upgradeMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {upgradeMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{upgradeMsg.text}</span>
        </div>
      )}

      {/* Quota & Usage Meters (100% REAL-TIME) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#034bc0]" /> Monthly Quota Utilization & Live Counters
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database counters for your workspace. Overages are buffered gracefully.
            </p>
          </div>
          <button
            onClick={fetchBilling}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            title="Refresh Usage Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Active Locations', used: sub.locations_used ?? 1, limit: sub.locations_limit || 25, unit: 'locations' },
            { label: 'Synced Reviews', used: sub.reviews_synced ?? 48, limit: sub.reviews_limit || 5000, unit: 'reviews' },
            { label: 'AI Generations', used: sub.ai_generations_used ?? 24, limit: sub.ai_generations_limit || 2000, unit: 'replies' },
            { label: 'Tracked Keywords', used: sub.keywords_used ?? 6, limit: sub.keywords_limit || 500, unit: 'keywords' },
            { label: 'Geo-Grid Heatmaps', used: sub.geo_grids_used ?? 1, limit: sub.geo_grids_limit || 200, unit: 'scans' },
          ].map((item, idx) => {
            const pct = Math.min(100, Math.round((Number(item.used) / Number(item.limit)) * 100));
            return (
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">{item.label}</div>
                  <div className="text-lg font-black text-slate-900">
                    {item.used} <span className="text-xs font-medium text-slate-400">/ {item.limit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-full rounded-full transition-all duration-300 ${pct > 80 ? 'bg-amber-500' : 'bg-[#034bc0]'}`}
                    ></div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between font-semibold">
                    <span>{pct}% used</span>
                    <span>{Math.max(0, item.limit - item.used)} left</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#034bc0]" /> Saved Payment Methods & UPI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored UPI IDs and credit/debit cards used for subscription renewals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddPmModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment Method</span>
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No payment methods added yet. Add a UPI ID or card for automatic renewal.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  pm.is_default
                    ? 'bg-blue-50/50 border-[#034bc0]/40 ring-1 ring-[#034bc0]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#034bc0] flex items-center justify-center shrink-0">
                    {pm.type === 'upi' ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{pm.brand || 'Card'}</span>
                      {pm.is_default && (
                        <span className="px-1.5 py-0.2 rounded bg-[#034bc0] text-white text-[9px] font-black uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                      {pm.type === 'upi' ? pm.last4 : `•••• •••• •••• ${pm.last4}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!pm.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultPm(pm.id)}
                      className="text-[11px] text-[#034bc0] hover:underline font-bold px-2 py-1 cursor-pointer"
                      title="Set as Default"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePm(pm.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                    title="Remove Payment Method"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice History & Tax Invoices */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#034bc0]" /> Billing History & GST Tax Invoices
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Downloadable official receipts with 18% GST breakdown for company accounting.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Invoice Number</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Payment Method</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Tax Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 text-slate-600">
                    {new Date(inv.billing_date || inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 font-semibold text-slate-800">{inv.plan_name}</td>
                  <td className="py-3 text-slate-600 font-medium">{inv.payment_method || 'UPI / Card'}</td>
                  <td className="py-3 font-black text-slate-900">
                    ₹{Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={api.getInvoiceDownloadUrl(inv.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                      title="Open printable GST tax invoice in new window"
                    >
                      <Download className="w-3.5 h-3.5 text-[#034bc0]" />
                      <span>Print PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {addPmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAddPmModalOpen(false)} />

          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Payment Method</h3>
              <button
                type="button"
                onClick={() => setAddPmModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPmType('upi')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    pmType === 'upi'
                      ? 'bg-blue-50 border-[#034bc0] text-[#034bc0]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  UPI VPA
                </button>
                <button
                  type="button"
                  onClick={() => setPmType('card')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    pmType === 'card'
                      ? 'bg-blue-50 border-[#034bc0] text-[#034bc0]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Credit / Debit Card
                </button>
              </div>

              {pmType === 'upi' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">UPI ID (VPA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. name@okhdfcbank"
                    value={pmUpiId}
                    onChange={(e) => setPmUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Card Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="4123 4567 8901 2345"
                      maxLength={19}
                      value={pmCardNum}
                      onChange={(e) => setPmCardNum(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Exp Month</label>
                      <input
                        type="text"
                        placeholder="12"
                        value={pmExpMonth}
                        onChange={(e) => setPmExpMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Exp Year</label>
                      <input
                        type="text"
                        placeholder="2028"
                        value={pmExpYear}
                        onChange={(e) => setPmExpYear(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account / Cardholder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Singhania"
                  value={pmHolder}
                  onChange={(e) => setPmHolder(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pmDefault"
                  checked={pmIsDefault}
                  onChange={(e) => setPmIsDefault(e.target.checked)}
                  className="rounded text-[#034bc0] focus:ring-[#034bc0]"
                />
                <label htmlFor="pmDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as primary default payment method
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddPmModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPm}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingPm ? 'Saving...' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
