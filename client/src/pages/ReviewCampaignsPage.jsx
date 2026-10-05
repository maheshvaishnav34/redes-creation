import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Plus,
  Copy,
  ExternalLink,
  Download,
  Share2,
  TrendingUp,
  MessageSquare,
  Users,
  Check,
  Sparkles,
  RefreshCw,
  Send,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Info,
  Globe,
  ThumbsUp,
  ShieldCheck,
  Star,
  Edit3,
  Trash2,
  Eye,
  X,
  Play,
  Pause,
  Award
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ReviewCampaignsPage = () => {
  const { activeBusiness, user } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [serverIp, setServerIp] = useState('10.55.164.78');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [qrMode, setQrMode] = useState('mobile'); // 'mobile' (Wi-Fi LAN IP) or 'local' (localhost)
  const [dynamicQrCodes, setDynamicQrCodes] = useState({});

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFeedbackCamp, setActiveFeedbackCamp] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form error & success states
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Create Form State
  const [campName, setCampName] = useState('');
  const [campBizName, setCampBizName] = useState('');
  const [campWebsite, setCampWebsite] = useState('');
  const [campGoogleUrl, setCampGoogleUrl] = useState('');
  const [campPostReviewOn, setCampPostReviewOn] = useState(true);
  const [userCustomizedWebsite, setUserCustomizedWebsite] = useState(false);
  const [userCustomizedGoogleUrl, setUserCustomizedGoogleUrl] = useState(false);
  const [campChannel, setCampChannel] = useState('qr');
  const [campAudience, setCampAudience] = useState('');
  const [campTemplate, setCampTemplate] = useState('');
  const [campServices, setCampServices] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editBizName, setEditBizName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGoogleUrl, setEditGoogleUrl] = useState('');
  const [editPostReviewOn, setEditPostReviewOn] = useState(true);
  const [editChannel, setEditChannel] = useState('qr');
  const [editAudience, setEditAudience] = useState('');
  const [editTemplate, setEditTemplate] = useState('');
  const [editServices, setEditServices] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const autoRefreshTimerRef = useRef(null);

  const fetchCampaigns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const data = await api.listCampaigns();
      setCampaigns(data.campaigns || []);
      if (data.serverIp) {
        setServerIp(data.serverIp);
      }
    } catch (err) {
      console.error('[CAMPAIGNS] Error fetching campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const handleBizSwitch = () => fetchCampaigns();
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  // Real-time polling
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchCampaigns(true);
      }, 10000);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh]);

  const showSuccessBanner = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleCampNameChange = (val) => {
    setCampName(val);
    setCampBizName(val);

    const cleanSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!userCustomizedWebsite) {
      if (val.trim()) {
        setCampWebsite(`https://${cleanSlug}.com`);
      } else {
        setCampWebsite(activeBusiness?.website || 'https://redescreation.in');
      }
    }

    if (!userCustomizedGoogleUrl) {
      if (val.trim()) {
        setCampGoogleUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val.trim())}`);
      } else {
        setCampGoogleUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBusiness?.name || 'Redes Creation')}`);
      }
    }
  };

  const getWorkingReviewUrl = (camp, mode = qrMode) => {
    let slug = 'post-dine-table-qr';
    if (camp.review_link) {
      const parts = camp.review_link.split('/feedback/');
      if (parts.length > 1) {
        slug = parts[1].replace(/[^a-zA-Z0-9_-]/g, '');
      } else {
        slug = camp.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || camp.id;
      }
    } else if (camp.name) {
      slug = camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';

    if (mode === 'mobile') {
      const targetIp = isLocalhost ? (serverIp || '10.55.164.78') : host;
      return `http://${targetIp}:5173/feedback/${slug}`;
    }
    return `${window.location.origin}/feedback/${slug}`;
  };

  // Generate dynamic working QR codes
  useEffect(() => {
    if (campaigns.length > 0) {
      campaigns.forEach(async (camp) => {
        const url = getWorkingReviewUrl(camp, qrMode);
        try {
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 320,
            margin: 2,
            color: {
              dark: '#034bc0', // Redes Creation Royal Blue
              light: '#ffffff'
            }
          });
          setDynamicQrCodes(prev => ({ ...prev, [camp.id]: qrDataUrl }));
        } catch (e) {
          console.error('[QR] Failed to generate code:', e);
        }
      });
    }
  }, [campaigns, qrMode, serverIp]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!campName.trim()) {
      setFormError('Campaign Name is required');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.createCampaign({
        name: campName.trim(),
        businessName: (campBizName.trim() || campName.trim()),
        website: campWebsite.trim(),
        googleReviewUrl: campGoogleUrl.trim(),
        postReviewEnabled: campPostReviewOn,
        channel: campChannel,
        targetAudience: campAudience.trim(),
        messageTemplate: campTemplate.trim(),
        services: campServices ? campServices.split(',').map(s => s.trim()).filter(Boolean) : []
      });

      setCreateModalOpen(false);
      setCampName('');
      setCampBizName('');
      setCampWebsite('');
      setCampGoogleUrl('');
      setUserCustomizedWebsite(false);
      setUserCustomizedGoogleUrl(false);
      setCampAudience('');
      setCampTemplate('');
      setCampServices('');
      showSuccessBanner('Campaign created successfully with dynamic QR code & Google review routing!');
      await fetchCampaigns();
    } catch (err) {
      console.error('[CAMPAIGNS] Create failed:', err);
      setFormError(err.message || 'Failed to create campaign. Please verify input fields.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (camp) => {
    setEditingCamp(camp);
    setEditName(camp.name || '');
    setEditBizName(camp.business_name || camp.name || '');
    setEditWebsite(camp.website || camp.business_website || '');
    setEditGoogleUrl(camp.google_review_url || '');
    setEditPostReviewOn(camp.post_review_enabled !== false);
    setEditChannel(camp.channel || 'qr');
    setEditAudience(camp.target_audience || '');
    setEditTemplate(camp.message_template || '');

    let srvStr = '';
    if (Array.isArray(camp.services)) {
      srvStr = camp.services.join(', ');
    } else if (typeof camp.services === 'string') {
      try {
        const parsed = JSON.parse(camp.services);
        srvStr = Array.isArray(parsed) ? parsed.join(', ') : camp.services;
      } catch {
        srvStr = camp.services;
      }
    }
    setEditServices(srvStr);

    setEditStatus(camp.status || 'active');
    setFormError('');
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCamp) return;
    setFormError('');
    setFormSubmitting(true);

    try {
      await api.updateCampaign(editingCamp.id, {
        name: editName.trim(),
        businessName: editBizName.trim() || editName.trim(),
        website: editWebsite.trim(),
        googleReviewUrl: editGoogleUrl.trim(),
        postReviewEnabled: editPostReviewOn,
        channel: editChannel,
        targetAudience: editAudience.trim(),
        messageTemplate: editTemplate.trim(),
        status: editStatus,
        services: editServices ? editServices.split(',').map(s => s.trim()).filter(Boolean) : []
      });

      setEditModalOpen(false);
      setEditingCamp(null);
      showSuccessBanner('Campaign details updated successfully!');
      await fetchCampaigns();
    } catch (err) {
      console.error('[CAMPAIGNS] Update failed:', err);
      setFormError(err.message || 'Failed to update campaign');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (camp) => {
    const newStatus = camp.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateCampaignStatus(camp.id, newStatus);
      showSuccessBanner(`Campaign marked as ${newStatus}`);
      await fetchCampaigns(true);
    } catch (err) {
      console.error('[CAMPAIGNS] Status change failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteCampaign(id);
      setDeleteConfirmId(null);
      showSuccessBanner('Campaign deleted successfully');
      await fetchCampaigns();
    } catch (err) {
      console.error('[CAMPAIGNS] Delete failed:', err);
      alert('Delete failed: ' + (err.message || 'Action could not be completed'));
    }
  };

  const openFeedbacksModal = async (camp) => {
    setActiveFeedbackCamp(camp);
    setFeedbackModalOpen(true);
    setLoadingFeedbacks(true);
    try {
      const res = await api.getCampaignFeedbacks(camp.id);
      setFeedbackList(res.feedbacks || []);
    } catch (err) {
      console.error('[FEEDBACKS] Load error:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleCopyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Aggregate Funnel Metrics across campaigns
  const totalScans = campaigns.reduce((acc, c) => acc + Number(c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + Number(c.clicked_count || 0), 0);
  const totalFeedbacks = campaigns.reduce((acc, c) => acc + Number(c.feedback_started_count || 0), 0);
  const totalAttributed = campaigns.reduce((acc, c) => acc + Number(c.attributed_reviews_count || 0), 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const conversionRate = totalFeedbacks > 0 ? Math.round((totalAttributed / totalFeedbacks) * 100) : 0;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#034bc0] border border-blue-200">
              Review Growth Engine
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {autoRefresh ? 'Live Real-Time Sync' : 'Live Sync Paused'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Review Collection Campaigns</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Automate authentic customer feedback collection with custom websites, dynamic QR codes, and Google Maps post-review routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            onClick={() => fetchCampaigns(false)}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Refresh Real-Time Campaign Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#034bc0] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          {/* QR Destination Target Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 text-xs font-bold shadow-xs w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setQrMode('mobile')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                qrMode === 'mobile'
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`QR code encodes Wi-Fi IP (${serverIp}) for scanning from phone camera`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone Scan</span>
            </button>
            <button
              onClick={() => setQrMode('local')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                qrMode === 'local'
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="QR code encodes localhost URL for testing on this computer"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>PC Localhost</span>
            </button>
          </div>

          <button
            onClick={() => {
              setCampName('');
              setCampBizName(activeBusiness?.name || '');
              setCampWebsite(activeBusiness?.website || 'https://redescreation.in');
              setCampGoogleUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBusiness?.name || 'Redes Creation')}`);
              setCampPostReviewOn(true);
              setUserCustomizedWebsite(false);
              setUserCustomizedGoogleUrl(false);
              setFormError('');
              setCreateModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Aggregate Real-Time KPIs Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Campaigns</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{activeCount}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {campaigns.length} total</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Scans & Clicks</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalOpened}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Feedbacks Received</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalFeedbacks}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Attributed Google Reviews</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-700">{totalAttributed}</span>
              <span className="text-xs text-emerald-600 font-bold">({conversionRate}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Wi-Fi Mobile Scan Note */}
      <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-[#034bc0] shrink-0" />
          <span>
            <strong>Mobile Scanner Ready:</strong> The QR codes below are live and encoded with{' '}
            <code className="px-1.5 py-0.5 rounded bg-white border border-blue-200 font-mono text-[#034bc0] font-bold">
              {qrMode === 'mobile' ? `http://${serverIp}:5173/feedback/...` : 'http://localhost:5173/feedback/...'}
            </code>
            . Scan with your phone camera on Wi-Fi to test the live guest feedback portal!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-[#034bc0] focus:ring-[#034bc0]"
            />
            <span>Auto-refresh real time</span>
          </label>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="lg:col-span-2 space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
            <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Review Campaigns Created</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a review collection campaign to generate branded QR codes and automatically redirect customers to Google Reviews.
            </p>
            <button
              onClick={() => {
                setCampName('');
                setCampBizName(activeBusiness?.name || '');
                setCampWebsite(activeBusiness?.website || 'https://redescreation.in');
                setCampGoogleUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBusiness?.name || 'Redes Creation')}`);
                setCreateModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#034bc0] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#023aa0] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Campaign</span>
            </button>
          </div>
        ) : (
          campaigns.map((camp) => {
            const workingUrl = getWorkingReviewUrl(camp, qrMode);
            const qrImage = dynamicQrCodes[camp.id] || camp.qr_code_data;
            const campWebsiteDisplay = camp.website || camp.business_website || 'https://redescreation.in';
            const realFeedbackCount = Number(camp.real_feedback_count || camp.feedback_started_count || 0);

            return (
              <div
                key={camp.id}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Channel, Status Toggle, and Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-[#034bc0] border border-blue-200">
                          {camp.channel} Channel
                        </span>

                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(camp)}
                          className={`text-[10px] font-bold uppercase flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                            camp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          }`}
                          title={`Click to ${camp.status === 'active' ? 'pause' : 'activate'} campaign`}
                        >
                          <span className={`w-2 h-2 rounded-full ${camp.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                          <span>{camp.status}</span>
                        </button>

                        {camp.post_review_enabled !== false && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200">
                            <ThumbsUp className="w-2.5 h-2.5 text-[#034bc0]" />
                            Google Review On
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">{camp.name}</h3>

                      {camp.business_name && camp.business_name !== camp.name && (
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">
                          Brand: <span className="font-bold text-slate-900">{camp.business_name}</span>
                        </div>
                      )}

                      {/* Associated Website & Post Review Link */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <a
                          href={campWebsiteDisplay}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#034bc0] hover:underline"
                          title="Campaign Official Website"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#034bc0]" />
                          <span>{campWebsiteDisplay.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>

                        {camp.google_review_url && (
                          <a
                            href={camp.google_review_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                            title="Direct Google Maps Review Destination"
                          >
                            <ThumbsUp className="w-3 h-3 text-amber-500" />
                            <span>Google Maps Target</span>
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1">{camp.target_audience || 'All diners & in-store guests'}</p>
                    </div>

                    {/* QR Preview Box */}
                    {qrImage && (
                      <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                        <img src={qrImage} alt="QR Code" className="w-24 h-24 object-contain" />
                        <span className="text-[9px] font-extrabold text-[#034bc0] uppercase tracking-wider mt-1">
                          {qrMode === 'mobile' ? 'Phone Scan' : 'PC Local'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Funnel Metrics Grid - 100% REAL-TIME DATA */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-b border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Scans / Sent</span>
                      <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{Number(camp.sent_count ?? 0)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Opened</span>
                      <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{Number(camp.clicked_count ?? 0)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100">
                      <span className="text-[10px] text-[#034bc0] uppercase font-bold tracking-wider block">Feedback Started</span>
                      <span className="text-base font-extrabold text-[#034bc0] mt-0.5 block">{Number(camp.feedback_started_count ?? 0)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Attributed</span>
                      <span className="text-base font-black text-emerald-700 mt-0.5 block">{Number(camp.attributed_reviews_count ?? 0)}</span>
                    </div>
                  </div>

                  {/* Direct Working Feedback Link */}
                  <div className="pt-3">
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">Direct Feedback Link:</span>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-800 truncate flex-1 font-mono text-[11px] font-semibold">{workingUrl}</span>
                      <button
                        onClick={() => handleCopyLink(workingUrl, camp.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#034bc0] text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200 cursor-pointer shrink-0"
                      >
                        {copiedId === camp.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === camp.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <a
                        href={workingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-[#034bc0] hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Open Live Customer Feedback Page in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons: Edit, View Feedbacks, Download QR, Delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Customer Feedbacks Button */}
                    <button
                      type="button"
                      onClick={() => openFeedbacksModal(camp)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="View all customer feedback submissions for this campaign"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#034bc0]" />
                      <span>Responses ({realFeedbackCount})</span>
                    </button>

                    {/* Edit Campaign Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(camp)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Edit Campaign Details (Name, Website, Redirection URL, Status)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Campaign</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {qrImage && (
                      <a
                        href={qrImage}
                        download={`${camp.name}-qr.png`}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#034bc0]" />
                        <span className="hidden sm:inline">Download QR</span>
                      </a>
                    )}

                    {/* Delete Confirmation Button */}
                    {deleteConfirmId === camp.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(camp.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(camp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Responses Modal / Drawer */}
      {feedbackModalOpen && activeFeedbackCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFeedbackModalOpen(false)} />

          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#034bc0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Real-Time Verified Feedback
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  Customer Responses: {activeFeedbackCamp.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing all genuine submissions received via QR code scan or feedback link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingFeedbacks ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-[#034bc0] border-t-transparent animate-spin"></div>
                <span className="text-xs font-bold text-slate-500">Loading feedback submissions...</span>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Responses Recorded Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When customers scan the QR code or submit feedback on the portal, their ratings and reviews will appear here live.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((fb, idx) => {
                  let parsedThemes = [];
                  if (Array.isArray(fb.themes_selected)) {
                    parsedThemes = fb.themes_selected;
                  } else if (typeof fb.themes_selected === 'string') {
                    try {
                      parsedThemes = JSON.parse(fb.themes_selected);
                    } catch {
                      parsedThemes = [];
                    }
                  }

                  return (
                    <div key={fb.id || idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <span>{fb.customer_name || 'Anonymous Guest'}</span>
                            {fb.customer_phone && (
                              <span className="text-[11px] font-normal text-slate-500 font-mono">
                                ({fb.customer_phone})
                              </span>
                            )}
                          </div>
                          {fb.service_experienced && (
                            <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                              Service: <strong className="text-slate-800">{fb.service_experienced}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= (fb.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-slate-800 ml-1">{fb.rating || 5}.0</span>
                        </div>
                      </div>

                      {fb.feedback_text && (
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-normal">
                          "{fb.feedback_text}"
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {parsedThemes.map((th, tidx) => (
                            <span key={tidx} className="px-2 py-0.5 rounded-full bg-blue-50 text-[#034bc0] text-[10px] font-bold border border-blue-200">
                              {th}
                            </span>
                          ))}
                          {fb.proceeded_to_google && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-300">
                              <Check className="w-2.5 h-2.5" /> Proceeded to Google
                            </span>
                          )}
                        </div>

                        <span>
                          {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editModalOpen && editingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />

          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#034bc0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Admin & Client Controls
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  Edit Campaign: {editingCamp.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update campaign name, official website, Google Maps review destination, and operational status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Brand / Business Display Name
                </label>
                <input
                  type="text"
                  value={editBizName}
                  onChange={(e) => setEditBizName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                />
              </div>

              {/* Status and Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Operational Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-semibold"
                  >
                    <option value="active">Active (Collecting Reviews)</option>
                    <option value="paused">Paused (Temporarily Suspended)</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Distribution Channel</label>
                  <select
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                  >
                    <option value="qr">QR Code (Printed Standees & Receipts)</option>
                    <option value="sms">SMS Text Message</option>
                    <option value="email">Email Campaign</option>
                    <option value="whatsapp">WhatsApp Business</option>
                  </select>
                </div>
              </div>

              {/* Official Website */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#034bc0]" />
                  <span>Official Website URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://yourwebsite.com"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                />
              </div>

              {/* Google Maps Review URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Maps Review Destination Link</span>
                </label>
                <input
                  type="text"
                  placeholder="https://maps.google.com/?cid=... or search URL"
                  value={editGoogleUrl}
                  onChange={(e) => setEditGoogleUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono"
                />
              </div>

              {/* Services Offered */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Services Offered (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Web Development, Python Programming, MERN Stack"
                  value={editServices}
                  onChange={(e) => setEditServices(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  These services will appear in the customer feedback dropdown.
                </span>
              </div>

              {/* Post Review Button Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Post Review on Google Button:</span>
                  <span className="text-[11px] text-slate-500">
                    {editPostReviewOn ? 'Enabled: Satisfied guests (4★ & 5★) are prompted to publish on Google' : 'Disabled'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditPostReviewOn(!editPostReviewOn)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    editPostReviewOn ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {editPostReviewOn ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</label>
                <input
                  type="text"
                  placeholder="e.g. In-store guests, dine-in customers"
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message Template (Optional)</label>
                <textarea
                  rows={2}
                  value={editTemplate}
                  onChange={(e) => setEditTemplate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Campaign Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />

          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Launch New Review Campaign</h3>
                <p className="text-xs text-slate-500 mt-0.5">Campaign Name ke hisaab se Website aur Google Post Review link automatically set hoga.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Bistro Luxury Lounge or Redes Creation Studio"
                  value={campName}
                  onChange={(e) => handleCampNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 font-semibold"
                />
              </div>

              {/* Dynamic Name-based Settings Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#034bc0] uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-[#034bc0]" />
                    <span>Dynamic Website & Google Review Routing</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                    Auto-Configured
                  </span>
                </div>

                {/* Business Brand Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Brand / Business Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saffron Bistro"
                    value={campBizName}
                    onChange={(e) => setCampBizName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                  />
                </div>

                {/* Website URL */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#034bc0]" />
                    <span>Official Website URL (Linked to Campaign Name)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourwebsite.com"
                    value={campWebsite}
                    onChange={(e) => {
                      setCampWebsite(e.target.value);
                      setUserCustomizedWebsite(true);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Customer review portal par ye website button show hoga aur link open karega.
                  </span>
                </div>

                {/* Google Review URL */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>Google Maps Post Review URL</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://search.google.com/local/writereview?placeid=... or Google Maps search"
                    value={campGoogleUrl}
                    onChange={(e) => {
                      setCampGoogleUrl(e.target.value);
                      setUserCustomizedGoogleUrl(true);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#034bc0] font-mono font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Satisfied customers (4★ & 5★) click karenge to direct is Google Review link par jayenge.
                  </span>
                </div>

                {/* Post Review On / Off Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Website & Google Post-Review Button:</span>
                    <span className="text-[11px] text-slate-500">
                      {campPostReviewOn ? 'Active: Customers can click "Post Review on Google" & "Visit Website"' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCampPostReviewOn(!campPostReviewOn)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      campPostReviewOn
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{campPostReviewOn ? 'Post Review ON' : 'Turned OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Distribution & Template */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Channel Distribution</label>
                  <select
                    value={campChannel}
                    onChange={(e) => setCampChannel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#034bc0] font-medium"
                  >
                    <option value="qr">QR Code (Printed Standees & Receipts)</option>
                    <option value="sms">SMS Text Message Campaign</option>
                    <option value="email">Email Follow-up</option>
                    <option value="whatsapp">WhatsApp Business Notification</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</label>
                  <input
                    type="text"
                    placeholder="e.g. In-store guests, website visitors"
                    value={campAudience}
                    onChange={(e) => setCampAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Services Offered (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Web Development, Python Programming, MERN Stack (or your business services)"
                  value={campServices}
                  onChange={(e) => setCampServices(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  These services will be shown in the feedback form for customer selection.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message Template (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Thank you for visiting! We would love your feedback: {link}"
                  value={campTemplate}
                  onChange={(e) => setCampTemplate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] font-medium leading-relaxed"
                />
              </div>

              {/* Customer Portal Live Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Customer Feedback Portal Preview:
                </span>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {campBizName || campName || 'Your Business Name'}
                    </span>
                    <span className="text-[10px] text-[#034bc0] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {campWebsite ? campWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'website.com'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  {campPostReviewOn && (
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-[11px] text-[#034bc0] font-bold">
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#034bc0]" />
                        <span>Post Review for {campBizName || campName || 'Business'} on Google</span>
                      </span>
                      <span className="text-[10px] bg-[#034bc0] text-white px-2 py-0.5 rounded">Active</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Generating QR & Launching...</span>
                    </>
                  ) : (
                    <span>Generate QR & Launch</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCampaignsPage;
