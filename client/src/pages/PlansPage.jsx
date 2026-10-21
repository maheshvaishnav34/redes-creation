import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  CreditCard,
  QrCode,
  Smartphone,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Lock,
  Star,
  Download,
  Info
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PlansPage() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [plans, setPlans] = useState([]);
  
  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentType, setPaymentType] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.fullName || '');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscription();
      if (res.success) {
        setSubscription(res.subscription);
        setPlans(res.plans || []);
      }
    } catch (err) {
      console.error('[PLANS] Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutError('');
    setCheckoutSuccess(null);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setCheckoutError('');
    setProcessing(true);

    try {
      let paymentLabel = 'UPI';
      let cardDetails = null;

      if (paymentType === 'upi') {
        if (!upiId.trim() || !upiId.includes('@')) {
          setCheckoutError('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
          setProcessing(false);
          return;
        }
        paymentLabel = `UPI (${upiId.trim()})`;
      } else if (paymentType === 'card') {
        if (!cardNumber.replace(/\s+/g, '') || cardNumber.replace(/\s+/g, '').length < 15) {
          setCheckoutError('Please enter a valid 16-digit card number');
          setProcessing(false);
          return;
        }
        const [expMonth, expYear] = cardExpiry.split('/').map(s => parseInt(s.trim(), 10));
        cardDetails = {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          brand: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'RuPay',
          expMonth: expMonth || 12,
          expYear: expYear ? 2000 + expYear : 2028,
          cardholderName: cardHolder
        };
        paymentLabel = `${cardDetails.brand} •••• ${cardDetails.cardNumber.slice(-4)}`;
      } else {
        paymentLabel = `NetBanking (${selectedBank})`;
      }

      const res = await api.upgradePlan({
        plan: selectedPlan.id,
        billingCycle,
        paymentMethod: paymentLabel,
        upiId: paymentType === 'upi' ? upiId.trim() : null,
        cardDetails
      });

      if (res.success) {
        setCheckoutSuccess(res);
        if (refreshUserData) {
          await refreshUserData();
        }
        await fetchBilling();
      }
    } catch (err) {
      console.error('[CHECKOUT] Payment failed:', err);
      setCheckoutError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlanId = subscription?.plan?.toLowerCase() || 'professional';

  // Fallback plans if loading
  const displayPlans = plans.length > 0 ? plans : [
    {
      id: 'starter',
      name: 'Starter',
      priceMonthly: 3499,
      priceAnnual: 34990,
      limits: { locations: 1, reviews: 300, aiGenerations: 150, keywords: 25, geoGrids: 10 },
      features: ['1 Location', 'Google Review Sync', 'AI Reply Drafting', '25 Keywords', 'Basic SEO Audit']
    },
    {
      id: 'professional',
      name: 'Professional',
      priceMonthly: 8999,
      priceAnnual: 89990,
      popular: true,
      limits: { locations: 5, reviews: 1500, aiGenerations: 600, keywords: 100, geoGrids: 50 },
      features: ['Up to 5 Locations', 'Auto-Reply Engine', 'Geo-Grid Heatmaps', 'Competitor Intelligence', '100 Keywords', 'Weekly Reports']
    },
    {
      id: 'agency',
      name: 'Agency',
      priceMonthly: 24999,
      priceAnnual: 249990,
      limits: { locations: 25, reviews: 5000, aiGenerations: 2000, keywords: 500, geoGrids: 200 },
      features: ['Up to 25 Locations', 'Multi-Client Management', 'Agency Portal', 'White-label Reports', 'AI Orchestrator', 'Unlimited Users']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceMonthly: 49999,
      priceAnnual: 499990,
      limits: { locations: 100, reviews: 20000, aiGenerations: 10000, keywords: 2500, geoGrids: 1000 },
      features: ['Dedicated Account Manager', 'Custom AI Prompt Packs', 'SSO / SAML', 'Custom Domain White-label', 'SLA 99.9%']
    }
  ];

  return (
    <div className="space-y-10 text-slate-900 pb-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#034bc0] text-xs font-black uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Scalable SaaS Tiers • Indian Rupee (₹) Billing</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Supercharge Your Local SEO & Google Review Growth
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Upgrade your workspace capacity with automated AI responses, precision geo-grid rank radar, and multi-location review collection.
        </p>

        {/* Monthly vs Annual Toggle with 20% Savings Badge */}
        <div className="pt-2 flex items-center justify-center">
          <div className="flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pricing Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {displayPlans.map((p) => {
          const isCurrent = currentPlanId === p.id.toLowerCase();
          const baseMonthly = p.priceMonthly;
          const price = billingCycle === 'annual' ? Math.round(p.priceAnnual / 12) : baseMonthly;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-6 sm:p-7 border relative flex flex-col justify-between transition-all duration-200 ${
                p.popular
                  ? 'bg-gradient-to-b from-blue-50/80 via-white to-white border-[#034bc0] ring-2 ring-[#034bc0]/20 shadow-xl'
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#034bc0] to-indigo-600 text-white text-[11px] font-black rounded-full shadow-md uppercase tracking-wider">
                  MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900 capitalize">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>

                {billingCycle === 'annual' && (
                  <div className="text-[11px] text-emerald-700 font-bold mt-1">
                    Billed annually at ₹{p.priceAnnual.toLocaleString('en-IN')}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                    What's Included:
                  </span>
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-2xl cursor-default text-center block"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(p)}
                    className={`w-full py-3 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                      p.popular
                        ? 'bg-[#034bc0] hover:bg-[#023aa0] text-white shadow-blue-600/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Upgrade to {p.name}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900">Compare All Tier Capabilities</h3>
          <p className="text-xs text-slate-500 mt-1">
            Detailed breakdown of locations, reviews automation quotas, keyword tracking, and white-label rights.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="pb-3 text-slate-900">Feature Breakdown</th>
                <th className="pb-3 text-center">Starter</th>
                <th className="pb-3 text-center text-[#034bc0]">Professional</th>
                <th className="pb-3 text-center">Agency</th>
                <th className="pb-3 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { feature: 'Locations Quota', starter: '1 Location', pro: '5 Locations', agency: '25 Locations', ent: '100+ Locations' },
                { feature: 'Synced Google Reviews / mo', starter: '300 Reviews', pro: '1,500 Reviews', agency: '5,000 Reviews', ent: '20,000 Reviews' },
                { feature: 'AI Auto-Replies / mo', starter: '150 Generations', pro: '600 Generations', agency: '2,000 Generations', ent: '10,000 Generations' },
                { feature: 'Tracked Local Keywords', starter: '25 Keywords', pro: '100 Keywords', agency: '500 Keywords', ent: '2,500 Keywords' },
                { feature: 'Geo-Grid SERP Radar Scans', starter: '10 Scans / mo', pro: '50 Scans / mo', agency: '200 Scans / mo', ent: '1,000 Scans / mo' },
                { feature: 'Review QR Codes & Dynamic Links', starter: 'Included', pro: 'Included', agency: 'Unlimited', ent: 'Custom Branded' },
                { feature: 'Competitor Intelligence', starter: '—', pro: 'Up to 5', agency: 'Up to 25', ent: 'Unlimited' },
                { feature: 'Client & Team User Seats', starter: '1 Seat', pro: '5 Seats', agency: 'Unlimited Users', ent: 'Unlimited Users + SSO' },
                { feature: 'White-label PDF Reports', starter: '—', pro: 'Standard', agency: 'Full Agency Branding', ent: 'Custom Domain White-label' },
                { feature: 'Support SLA', starter: 'Standard Email', pro: 'Priority Email', agency: 'Dedicated Slack', ent: '24/7 Phone + SLA 99.9%' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-900">{row.feature}</td>
                  <td className="py-3 text-center text-slate-600">{row.starter}</td>
                  <td className="py-3 text-center font-bold text-[#034bc0] bg-blue-50/30">{row.pro}</td>
                  <td className="py-3 text-center text-slate-700 font-semibold">{row.agency}</td>
                  <td className="py-3 text-center font-black text-slate-900">{row.ent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Checkout Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !processing && setCheckoutModalOpen(false)} />

          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {checkoutSuccess ? (
              <div className="text-center py-6 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Payment & Activation Successful!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your workspace has been upgraded to the <strong>{selectedPlan.name}</strong> tier. Your new location limits and AI generation quotas are live.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-bold text-slate-900">{checkoutSuccess.invoice?.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-700">₹{Number(checkoutSuccess.invoice?.amount).toLocaleString('en-IN')} (Incl. GST)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-800">{checkoutSuccess.invoice?.payment_method}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <a
                    href={`/api/v1/billing/invoices/${checkoutSuccess.invoice?.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#034bc0]" />
                    <span>Download Tax Invoice</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      navigate('/dashboard');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#034bc0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Instant Upgrade Checkout
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                      Activate {selectedPlan.name} Plan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Plan Cost Breakdown */}
                {(() => {
                  const baseAmount = billingCycle === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly;
                  const gst = Math.round(baseAmount * 0.18);
                  const total = baseAmount + gst;

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-slate-50 border border-blue-100 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{selectedPlan.name} Plan ({billingCycle === 'annual' ? '12 Months' : 'Monthly'})</span>
                        <span>₹{baseAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Goods & Services Tax (GST 18%)</span>
                        <span>₹{gst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                        <span>Total Payable Amount</span>
                        <span className="text-base text-[#034bc0]">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Method Selector */}
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('upi')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentType === 'upi'
                            ? 'bg-blue-50 border-[#034bc0] text-[#034bc0] ring-1 ring-[#034bc0]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType('card')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentType === 'card'
                            ? 'bg-blue-50 border-[#034bc0] text-[#034bc0] ring-1 ring-[#034bc0]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card (Debit/Credit)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType('netbanking')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentType === 'netbanking'
                            ? 'bg-blue-50 border-[#034bc0] text-[#034bc0] ring-1 ring-[#034bc0]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>NetBanking</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Inputs */}
                  {paymentType === 'upi' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Virtual Payment Address (UPI ID)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. mobile@okhdfcbank or business@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Supports Google Pay, PhonePe, Paytm, BHIM and all major bank apps.</span>
                      </div>
                    </div>
                  )}

                  {paymentType === 'card' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4123 4567 8901 2345"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Name as on Card"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0]"
                        />
                      </div>
                    </div>
                  )}

                  {paymentType === 'netbanking' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>256-bit encrypted checkout. Automatic GST tax receipt generated on payment.</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-6 py-3 rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          <span>Processing Payment & Activating...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Pay ₹{(
                              (billingCycle === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly) * 1.18
                            ).toLocaleString('en-IN', { maximumFractionDigits: 0 })} & Activate
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
