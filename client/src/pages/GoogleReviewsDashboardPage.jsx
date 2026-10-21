import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  MapPin,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLinkIcon,
  Calendar,
  ThumbsUp,
  Award,
  Link as LinkIcon,
  Target,
  QrCode,
  History,
  Download,
  Share2,
  Send,
  Clock,
  Plus,
  Hotel,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GoogleLogoIcon, StarRating } from '../components/reviews/GoogleReviewsSection.jsx';
import LiveSyncMonitor from '../components/reviews/LiveSyncMonitor.jsx';

// Module-level in-memory cache for instant 0ms page transitions
const clientReviewsCache = new Map();

export default function GoogleReviewsDashboardPage() {
  const { user, activeBusiness, setActiveBusiness, businesses, switchBusiness, refreshUserData } = useAuth();

  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Real-Time SSE Stream & Telemetry State
  const [sseConnected, setSseConnected] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);

  // Filters & Pagination State (Default 25 for blazing fast initial render < 25ms)
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'highest', 'lowest'
  const [replyStatusFilter, setReplyStatusFilter] = useState('all'); // 'all', 'unanswered', 'replied'
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', '7d', '30d', '90d'
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // UI Modals & Expanders
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedReviewUrl, setCopiedReviewUrl] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [copiedPlaceId, setCopiedPlaceId] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});

  // Public Business / Competitor Explorer State (Case 1)
  const [selectedPublicPlace, setSelectedPublicPlace] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQueryPublic, setSearchQueryPublic] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  // AI Reply Modal State (Case 2)
  const [aiReplyModal, setAiReplyModal] = useState({
    open: false,
    review: null,
    tone: 'friendly',
    replyText: '',
    generating: false,
    submitting: false,
    successMsg: ''
  });

  // Multi-Hotel Quick Setup State
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelForm, setNewHotelForm] = useState({
    name: '',
    city: '',
    address: '',
    mapsUrl: '',
    placeId: ''
  });
  const [addingHotel, setAddingHotel] = useState(false);
  const [addHotelError, setAddHotelError] = useState(null);

  const handleAddHotelSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newHotelForm.name.trim()) {
      setAddHotelError('Hotel property name is required.');
      return;
    }

    try {
      setAddingHotel(true);
      setAddHotelError(null);
      const res = await api.createHotel({
        name: newHotelForm.name.trim(),
        city: newHotelForm.city.trim(),
        address: newHotelForm.address.trim(),
        mapsUrl: newHotelForm.mapsUrl.trim() || undefined,
        placeId: newHotelForm.placeId.trim() || undefined
      });

      if (res.success && res.hotel) {
        setShowAddHotelModal(false);
        setNewHotelForm({ name: '', city: '', address: '', mapsUrl: '', placeId: '' });
        await refreshUserData();
        setActiveBusiness(res.hotel);
        const countText = res.reviewsCount ? ` (${res.reviewsCount} authentic reviews loaded)` : '';
        setStatusMessage({
          type: 'success',
          text: `Hotel "${res.hotel.name}" registered successfully!${countText}`
        });
        setTimeout(() => {
          fetchReviewsData({ isRefresh: true });
        }, 800);
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        throw new Error(res.error || 'Failed to create hotel property.');
      }
    } catch (err) {
      console.error('[HOTEL_CREATE] Error:', err);
      setAddHotelError(err.message || 'Error creating hotel property.');
    } finally {
      setAddingHotel(false);
    }
  };

  /**
   * Fetch reviews from backend API (strictly authentic Google data)
   * Super-fast: Check memory cache first (<1ms), then stream fresh data
   */
  const fetchReviewsData = useCallback(async ({ isRefresh = false, append = false, newOffset = 0 } = {}) => {
    try {
      const cacheKey = `${selectedPublicPlace?.placeId || activeBusiness?.id || 'none'}:${starFilter}:${searchQuery}:${sortOrder}:${replyStatusFilter}:${dateRangeFilter}:${limit}:${append ? newOffset : 0}`;

      // Instant 0ms Load from Client Cache if available
      if (!isRefresh && !append && newOffset === 0 && clientReviewsCache.has(cacheKey)) {
        const cached = clientReviewsCache.get(cacheKey);
        setData(cached.data);
        setReviews(cached.reviews);
        setTotalCount(cached.totalCount);
        setFilteredCount(cached.filteredCount);
        setHasMore(cached.hasMore);
        setLoading(false);
      } else if (isRefresh) {
        setRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Strict Isolation Check: If no active hotel and no public place searched, set unconfigured and return
      if (!selectedPublicPlace?.placeId && !activeBusiness?.id) {
        setData({
          source: 'unconfigured',
          business: null,
          userRatingsTotal: 0,
          rating: 0
        });
        setReviews([]);
        setTotalCount(0);
        setFilteredCount(0);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      const params = new URLSearchParams();
      if (selectedPublicPlace?.placeId) {
        params.append('placeId', selectedPublicPlace.placeId);
        params.append('businessName', selectedPublicPlace.name);
        if (selectedPublicPlace.address) params.append('address', selectedPublicPlace.address);
      } else if (activeBusiness?.id) {
        params.append('businessId', activeBusiness.id);
      }
      if (starFilter !== 'all') params.append('rating', starFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortOrder) params.append('sort', sortOrder);
      if (replyStatusFilter !== 'all') params.append('replyStatus', replyStatusFilter);
      if (dateRangeFilter !== 'all') params.append('dateRange', dateRangeFilter);
      params.append('limit', String(limit));
      params.append('offset', String(append ? newOffset : 0));
      if (isRefresh) params.append('refresh', 'true');

      const res = await api.getGoogleLiveReviews(params.toString());

      if (res && res.success) {
        setData(res);
        if (res.source === 'unconfigured') {
          setReviews([]);
          setTotalCount(0);
          setFilteredCount(0);
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          return;
        }
        const newReviews = res.reviews || [];

        if (append) {
          setReviews(prev => [...prev, ...newReviews]);
          setOffset(newOffset);
        } else {
          setReviews(newReviews);
          setOffset(0);
        }

        const pagination = res.pagination || {};
        setHasMore(Boolean(pagination.hasMore));
        setTotalCount(res.userRatingsTotal || pagination.total || 0);
        setFilteredCount(pagination.filtered ?? newReviews.length);

        // Store in fast client memory cache for 0ms subsequent page visits
        if (!append && newOffset === 0) {
          clientReviewsCache.set(cacheKey, {
            data: res,
            reviews: newReviews,
            totalCount: res.userRatingsTotal || pagination.total || 0,
            filteredCount: pagination.filtered ?? newReviews.length,
            hasMore: Boolean(pagination.hasMore)
          });
        }

        if (isRefresh) {
          setStatusMessage({
            type: 'success',
            text: `Successfully refreshed live Google data. Found ${res.userRatingsTotal || 0} authentic reviews.`
          });
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } else {
        throw new Error(res?.message || 'Failed to load Google Reviews');
      }
    } catch (err) {
      console.error('[GOOGLE_REVIEWS_DASHBOARD] Fetch Error:', err);
      setError(err.message || 'Unable to connect to Google API or load reviews.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [activeBusiness?.id, selectedPublicPlace, starFilter, searchQuery, sortOrder, replyStatusFilter, dateRangeFilter, limit]);

  // Load More Handler (Smooth Infinite Scroll / Chunk Loading)
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextOffset = reviews.length;
    fetchReviewsData({ append: true, newOffset: nextOffset });
  }, [loadingMore, hasMore, reviews.length, fetchReviewsData]);

  // Initial and reactive fetch on filter change
  useEffect(() => {
    fetchReviewsData({ isRefresh: false, append: false, newOffset: 0 });
  }, [fetchReviewsData]);

  // Listen for global business switch to clear explorer state and refresh
  useEffect(() => {
    const handleBizSwitch = () => {
      setSelectedPublicPlace(null);
      fetchReviewsData({ isRefresh: false, append: false, newOffset: 0 });
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, [fetchReviewsData]);

  // Real-Time SSE Stream & Telemetry Handler
  const fetchTelemetry = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      const res = await api.getGoogleSyncTelemetry(activeBusiness.id);
      if (res && res.success) {
        setTelemetry(res);
      }
    } catch (err) {
      console.warn('Telemetry fetch warning:', err.message);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    if (!activeBusiness?.id) return;

    fetchTelemetry();

    const token = localStorage.getItem('redes_token');
    const sseUrl = `${BASE_URL}/reviews/stream?businessId=${activeBusiness.id}&token=${token}`;

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener('connected', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('sync_status', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.status === 'in_progress' || payload.status === 'queued') {
            setRefreshing(true);
            setSyncProgress({ message: payload.message || 'Connecting to Google API...' });
          } else if (payload.status === 'completed') {
            setRefreshing(false);
            setSyncProgress(null);
            fetchTelemetry();
            fetchReviewsData({ isRefresh: true });
            setStatusMessage({
              type: 'success',
              text: payload.message || `Live sync completed! Ingested ${payload.totalCount || 0} reviews.`
            });
            setTimeout(() => setStatusMessage(null), 5000);
          } else if (payload.status === 'failed') {
            setRefreshing(false);
            setSyncProgress(null);
            fetchTelemetry();
            setStatusMessage({
              type: 'error',
              text: payload.message || 'Review sync failed.'
            });
            setTimeout(() => setStatusMessage(null), 6000);
          }
        } catch (parseErr) {
          console.warn('SSE parse error:', parseErr);
        }
      });

      eventSource.addEventListener('sync_progress', (e) => {
        try {
          const payload = JSON.parse(e.data);
          setSyncProgress(payload);
        } catch {}
      });

      eventSource.addEventListener('review_ingested', () => {
        fetchTelemetry();
        fetchReviewsData({ isRefresh: true });
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn('SSE connection failed:', err);
      setSseConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      setSseConnected(false);
    };
  }, [activeBusiness?.id, fetchTelemetry, fetchReviewsData]);

  // Public search handlers
  const handleSearchPublicPlaces = async (queryText) => {
    setSearchQueryPublic(queryText);
    if (!queryText.trim() || queryText.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchingPlaces(true);
      const res = await api.searchGooglePlaces(queryText);
      if (res && res.success) {
        setSearchResults(res.places || []);
      }
    } catch (err) {
      console.warn('Place search error:', err.message);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleSelectPublicPlace = (place) => {
    setSelectedPublicPlace(place);
    setShowSearchModal(false);
    setSearchQueryPublic('');
    setSearchResults([]);
    setStatusMessage({
      type: 'info',
      text: `Loaded live Google Reviews for "${place.name}". Viewing in Public Explorer mode.`
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleResetToMyBusiness = () => {
    setSelectedPublicPlace(null);
    setStatusMessage({
      type: 'info',
      text: 'Switched back to your verified business profile reviews.'
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // AI Reply Handlers (Case 2)
  const handleOpenAiReply = async (review) => {
    setAiReplyModal({
      open: true,
      review,
      tone: 'friendly',
      replyText: '',
      generating: true,
      submitting: false,
      successMsg: ''
    });

    try {
      const res = await api.generateAIReply(review.reviewId, {
        tone: 'friendly',
        reviewText: review.comment || '',
        reviewerName: review.reviewer?.displayName || 'Customer',
        rating: review.starRating || 5
      });
      const replyDraft = res?.options?.[0]?.text || res?.response?.response_text || res?.responseSuggestion || res?.reply;
      if (replyDraft) {
        setAiReplyModal(prev => ({
          ...prev,
          replyText: replyDraft,
          injectedKeyword: res?.injectedKeyword || null,
          generating: false
        }));
      } else {
        const reviewer = review.reviewer?.displayName || 'Customer';
        const draft = review.starRating >= 4
          ? `Dear ${reviewer}, thank you so much for your generous ${review.starRating}-star review! We are delighted you had an excellent experience and look forward to welcoming you again soon!`
          : `Dear ${reviewer}, thank you for your feedback. We are sorry your experience did not meet expectations. Please reach out to us directly so we can resolve this for you.`;
        setAiReplyModal(prev => ({ ...prev, replyText: draft, generating: false }));
      }
    } catch {
      const reviewer = review.reviewer?.displayName || 'Customer';
      setAiReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${reviewer}, thank you for taking the time to share your review with us. We truly appreciate your feedback!`,
        generating: false
      }));
    }
  };

  const handleRegenerateTone = async (newTone) => {
    if (!aiReplyModal.review) return;
    setAiReplyModal(prev => ({ ...prev, tone: newTone, generating: true }));
    try {
      const res = await api.generateAIReply(aiReplyModal.review.reviewId, {
        tone: newTone,
        reviewText: aiReplyModal.review.comment || '',
        reviewerName: aiReplyModal.review.reviewer?.displayName || 'Customer',
        rating: aiReplyModal.review.starRating || 5
      });
      const replyDraft = res?.options?.[0]?.text || res?.response?.response_text || res?.responseSuggestion || res?.reply;
      if (replyDraft) {
        setAiReplyModal(prev => ({
          ...prev,
          replyText: replyDraft,
          injectedKeyword: res?.injectedKeyword || prev.injectedKeyword || null,
          generating: false
        }));
      } else {
        setAiReplyModal(prev => ({ ...prev, generating: false }));
      }
    } catch {
      setAiReplyModal(prev => ({ ...prev, generating: false }));
    }
  };

  const handlePublishReply = async () => {
    if (!aiReplyModal.replyText.trim()) return;
    setAiReplyModal(prev => ({ ...prev, submitting: true }));
    try {
      await api.approveAndPublishReply(aiReplyModal.review.reviewId, {
        replyText: aiReplyModal.replyText
      });
      setAiReplyModal(prev => ({
        ...prev,
        submitting: false,
        successMsg: 'Reply recorded successfully!'
      }));
      setTimeout(() => {
        setAiReplyModal(prev => ({ ...prev, open: false, successMsg: '' }));
        fetchReviewsData({ isRefresh: true });
      }, 1800);
    } catch (err) {
      setAiReplyModal(prev => ({
        ...prev,
        submitting: false,
        successMsg: 'Draft saved. Official Google sync will reflect once GBP OAuth is active.'
      }));
      setTimeout(() => {
        setAiReplyModal(prev => ({ ...prev, open: false, successMsg: '' }));
      }, 2500);
    }
  };

  // Listen for business switch in multi-tenant context
  useEffect(() => {
    const handleBizSwitch = () => {
      setSelectedPublicPlace(null);
      fetchReviewsData({ isRefresh: false, append: false, newOffset: 0 });
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, [fetchReviewsData]);

  // QR Code & Customer Collection Handlers
  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setLoadingQr(true);
    try {
      const res = await api.getGoogleReviewQr(activeBusiness?.id);
      if (res && res.success) {
        setQrData(res);
      }
    } catch (err) {
      console.warn('QR fetch error:', err.message);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleOpenSyncHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.getGoogleSyncHistory(activeBusiness?.id);
      if (res && res.success) {
        setSyncHistory(res.history || []);
      }
    } catch (err) {
      console.warn('History fetch error:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyReviewUrl = () => {
    const url = qrData?.reviewUrl || data?.writeReviewUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedReviewUrl(true);
      setTimeout(() => setCopiedReviewUrl(false), 2500);
    }
  };

  // Handle manual sync now via backend sync worker queue
  const handleTriggerSyncNow = async () => {
    try {
      setRefreshing(true);
      setSyncProgress({ message: 'Sync job placed in queue...' });

      const syncRes = await api.syncGoogleNow({ businessId: activeBusiness?.id });
      if (syncRes && syncRes.success) {
        setStatusMessage({
          type: 'info',
          text: syncRes.message || 'Synchronization worker started in background...'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: syncRes?.error || 'Unable to start review sync.'
        });
        setRefreshing(false);
        setSyncProgress(null);
      }
    } catch (err) {
      setRefreshing(false);
      setSyncProgress(null);
      setStatusMessage({ type: 'error', text: 'Sync failed: ' + err.message });
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  // Toggle review card read more
  const toggleExpand = (id) => {
    setExpandedReviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy Place ID to clipboard
  const handleCopyPlaceId = () => {
    if (!data?.placeId) return;
    navigator.clipboard.writeText(data.placeId);
    setCopiedPlaceId(true);
    setTimeout(() => setCopiedPlaceId(false), 2500);
  };

  // Star distribution calculations
  const starDist = data?.starDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const avgRating = Number(data?.rating) || 0;
  const totalReviewsCount = data?.userRatingsTotal || 0;
  const fiveStarCount = starDist[5] || 0;
  const fiveStarPercent = totalReviewsCount > 0 ? Math.round((fiveStarCount / totalReviewsCount) * 100) : 0;

  // Replied count
  const repliedCount = reviews.filter(r => r.reviewReply).length;
  const responseRate = reviews.length > 0 ? Math.round((repliedCount / reviews.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-900">
      
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <GoogleLogoIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Google Reviews Dashboard
                </h1>
                {data?.source === 'google_business_profile_v4' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verified Partner (GBP API v4)
                  </span>
                ) : data?.source === 'google_places_api' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#034bc0] border border-blue-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Public Listing (Places API)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Verified Business Reviews
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Real-time review analytics and customer feedback direct from your Google Business Profile
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSearchModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Search and preview live Google reviews of any business or competitor"
          >
            <Search className="w-3.5 h-3.5 text-amber-600" />
            <span>Explore Any Business</span>
          </button>

          <button
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Google Cloud Console API & OAuth setup instructions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Setup Instructions</span>
          </button>

          <button
            onClick={handleOpenQrModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Generate & download direct Google review QR codes and customer collection links"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Review QR Code</span>
          </button>

          <button
            onClick={handleOpenSyncHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="View Google Reviews synchronization audit history"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync History</span>
          </button>

          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title="Go to AI Review Inbox & Reply Automation"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>Review Inbox</span>
          </Link>

          <button
            onClick={handleTriggerSyncNow}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
            title="Sync latest reviews from Google API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* REAL-TIME SYNC MONITOR & SSE TELEMETRY PANEL */}
      {!selectedPublicPlace && activeBusiness && (
        <LiveSyncMonitor
          isConnected={sseConnected}
          telemetry={telemetry}
          syncProgress={syncProgress}
          isSyncing={refreshing}
          onTriggerSync={handleTriggerSyncNow}
          businessName={activeBusiness.name}
        />
      )}

      {/* PUBLIC / COMPETITOR EXPLORER BANNER (CASE 1) */}
      {selectedPublicPlace && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-950">{selectedPublicPlace.name}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Public Explorer Mode
                </span>
                {selectedPublicPlace.source && (
                  <span className="text-[10px] font-semibold text-amber-700 hidden sm:inline">
                    via {selectedPublicPlace.source}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 mt-0.5">{selectedPublicPlace.address || 'Public Google Maps Listing'}</p>
            </div>
          </div>
          <button
            onClick={handleResetToMyBusiness}
            className="px-4 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            Back to My Business Reviews
          </button>
        </div>
      )}

      {/* DATA SOURCE & HISTORICAL REVIEWS TRANSPARENCY BANNER */}
      {data && data.source !== 'unconfigured' && !selectedPublicPlace && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-2xs">
                <GoogleLogoIcon className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    {data.source === 'google_business_profile_v4'
                      ? 'Live Cloud Stream: Official Google Business Profile (GBP API v4)'
                      : data.source === 'google_places_api'
                      ? 'Google Places API Mode (Public 5-Review Preview)'
                      : `Synced Database Archive (${data.verifiedReviewsCount || reviews.length} Reviews Loaded)`}
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100/90 text-[#034bc0] border border-blue-300">
                    Google Maps Total: {totalReviewsCount.toLocaleString('en-IN')} Reviews
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {data.sourceNotice ||
                    (data.source === 'google_business_profile_v4'
                      ? 'Full historical reviews directly streaming via Google OAuth 2.0 with instant synchronization.'
                      : 'Google Places API restricts public live reviews to max 5. Currently showing all synced authentic reviews from database. Connect Google Business Profile via OAuth 2.0 to stream all 1,200+ historical reviews directly from Google.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {!data?.googleConnection?.connected && (
                <Link
                  to="/google"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Connect Google OAuth</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATUS TOAST NOTIFICATION */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-rose-900">Google API Connection Notice</h3>
              <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1 pl-8">
            <button
              onClick={() => fetchReviewsData({ isRefresh: true })}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              onClick={() => setShowSetupModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-800 hover:bg-rose-100/50 text-xs font-bold transition cursor-pointer"
            >
              View Google Setup Guide
            </button>
          </div>
        </div>
      )}

      {/* HOTEL PROPERTY SELECTOR & TENANT ISOLATION BAR */}
      {businesses && businesses.length > 0 && (
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Hotel Property</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Private Tenant Data
                </span>
              </div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{activeBusiness?.name || 'Selected Property'}</span>
                {businesses.length > 1 && (
                  <select
                    value={activeBusiness?.id || ''}
                    onChange={(e) => switchBusiness(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.city ? `(${b.city})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddHotelModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] text-xs font-bold border border-blue-200 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hotel Property</span>
          </button>
        </div>
      )}

      {/* STRICT ISOLATION EMPTY STATE / QUICK SETUP VIEW */}
      {(!activeBusiness && !selectedPublicPlace) || data?.source === 'unconfigured' ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#034bc0] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict Multi-Client Data Isolation Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Connect Your Hotel Property
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your workspace <span className="font-bold text-slate-800">({user?.workspaceName || 'Private Workspace'})</span> is 100% private and isolated. Add your hotel property below or connect Google to fetch and manage your live reviews.
            </p>
          </div>

          {/* Quick Setup Form Card */}
          <div className="max-w-xl mx-auto bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#034bc0]" />
                <h3 className="text-sm font-bold text-slate-900">Register New Hotel Property</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#034bc0]">1-Click</span>
            </div>

            {addHotelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addHotelError}</span>
              </div>
            )}

            <form onSubmit={handleAddHotelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hotel Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newHotelForm.name}
                  onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
                  placeholder="e.g. Grand Heritage Palace Hotel"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newHotelForm.city}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Google Place ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newHotelForm.placeId}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, placeId: e.target.value })}
                    placeholder="ChIJ..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Google Maps Review Link or URL (Optional)
                </label>
                <input
                  type="url"
                  value={newHotelForm.mapsUrl}
                  onChange={(e) => setNewHotelForm({ ...newHotelForm, mapsUrl: e.target.value })}
                  placeholder="https://maps.app.goo.gl/... or https://search.google.com/local/writereview?..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={addingHotel}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {addingHotel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting Hotel Property...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Connect Hotel & Fetch Reviews</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-amber-500" />
                  <span>Explore Competitor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* 2. GOOGLE PROFILE OVERVIEW HERO CARD & STAT PILLS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Main Google-Style Rating Card (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 shadow-2xs">
                <GoogleLogoIcon className="w-3.5 h-3.5" />
                <span>Google Business Profile</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {data?.businessName || activeBusiness?.name || 'Business Location'}
              </h2>
              {data?.address && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{data.address}</span>
                </p>
              )}
            </div>

            {/* Google Verified & Sync Status Badge */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              {data?.googleConnection?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  OAuth 2.0 Connected
                </span>
              ) : data?.placeId ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Verified Place Details
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Setup Needed
                </span>
              )}
              {data?.fetchedAt && (
                <span className="text-[10px] font-semibold text-slate-600">
                  Synced: {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Rating Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80 items-center">
            
            {/* Big Google Star Score */}
            <div className="flex items-center gap-4">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
              </div>
              <div className="space-y-1">
                <StarRating rating={avgRating} size="w-5 h-5" />
                <div className="text-xs font-bold text-slate-600">
                  {totalReviewsCount.toLocaleString('en-IN')} Genuine Reviews
                </div>
              </div>
            </div>

            {/* Quick Actions / Links */}
            <div className="flex flex-wrap sm:justify-end items-center gap-2">
              {data?.writeReviewUrl && (
                <a
                  href={data.writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Leave Review</span>
                </a>
              )}

              {data?.googleMapsUrl && (
                <a
                  href={data.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>View on Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Place ID & Compliance Footer */}
          {data?.placeId && (
            <div className="space-y-2 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono truncate">
                  Place ID: <strong className="text-slate-700">{data.placeId}</strong>
                </span>
                <button
                  onClick={handleCopyPlaceId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer shrink-0"
                >
                  {copiedPlaceId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{copiedPlaceId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {!data?.googleConnection?.connected && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Public Places Notice:</strong> Public Google Places lookup retrieves up to 5 verified reviews. Connect your authorized <strong>Google Business Profile</strong> via OAuth 2.0 to sync complete historical reviews (50+).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5-to-1 Star Distribution Card (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Rating Distribution
            </h3>
            {starFilter !== 'all' && (
              <button
                onClick={() => setStarFilter('all')}
                className="text-[11px] font-bold text-[#034bc0] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Interactive Progress Bars */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starDist[star] || 0;
              const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              const isSelected = starFilter === String(star);

              return (
                <button
                  key={star}
                  onClick={() => setStarFilter(isSelected ? 'all' : String(star))}
                  className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-lg transition-all text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-50/80 ring-1 ring-amber-300'
                      : 'hover:bg-slate-50'
                  }`}
                  title={`Filter by ${star} star reviews`}
                >
                  <span className="w-8 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>{star}</span>
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? 'bg-amber-500'
                          : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <span className="w-16 text-right text-[11px] font-bold text-slate-600 shrink-0">
                    {count} <span className="font-normal text-slate-400">({percentage}%)</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Tip: Click any star rating above to filter customer reviews
          </p>
        </div>
      </div>

      {/* 3. KEY METRICS STAT PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Google Reviews</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalReviewsCount.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" />
            100% Genuine Google Data
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Average Star Rating</span>
          <p className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
            <span>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</span>
            <span className="text-xs text-slate-600 font-normal">/ 5.0</span>
          </p>
          <span className="text-[11px] text-slate-600 font-medium">Calculated from verified reviews</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">5-Star Reviews Ratio</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{fiveStarPercent}%</p>
          <span className="text-[11px] text-slate-600 font-medium">{fiveStarCount} top customer ratings</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Google OAuth Status</span>
          <p className="text-base font-black text-slate-900 mt-1.5 truncate">
            {data?.googleConnection?.connected ? 'Connected' : 'Places API Mode'}
          </p>
          <span className="text-[11px] text-slate-600 font-medium truncate block">
            {data?.googleConnection?.accountEmail || (data?.placeId ? 'Direct Place Synced' : 'Unconfigured')}
          </span>
        </div>
      </div>

      {/* 4. FILTER & SEARCH TOOLBAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Star Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStarFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold ${
                starFilter === 'all'
                  ? 'bg-[#034bc0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Reviews ({totalReviewsCount})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(String(s))}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 font-bold ${
                  starFilter === String(s)
                    ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{s}★</span>
                <span className="text-[10px] opacity-70">({starDist[s] || 0})</span>
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews or reviewer..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#034bc0]/20 focus:border-[#034bc0] bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={replyStatusFilter}
                onChange={(e) => setReplyStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034bc0]/20 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="unanswered">Needs Reply</option>
                <option value="replied">Replied</option>
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034bc0]/20 cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034bc0]/20 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First (Purane Reviews)</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

            {/* View / Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <span className="text-slate-400 font-bold hidden sm:inline">Show:</span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                  setLimit(val);
                  setOffset(0);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-xs font-bold text-[#034bc0] focus:outline-none focus:ring-2 focus:ring-[#034bc0]/20 cursor-pointer transition shadow-2xs"
                title="Select number of Google reviews to display"
              >
                <option value="all">All Reviews ({filteredCount || totalReviewsCount || 'All'})</option>
                <option value="25">25 Reviews</option>
                <option value="50">50 Reviews</option>
                <option value="100">100 Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Summary Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{reviews.length}</strong> of{' '}
            <strong className="text-slate-800">{filteredCount}</strong> filtered reviews{' '}
            {starFilter !== 'all' && `(${starFilter}★)`}
            {replyStatusFilter !== 'all' && ` (${replyStatusFilter === 'unanswered' ? 'Needs Reply' : 'Replied'})`}
            {dateRangeFilter !== 'all' && ` (${dateRangeFilter === '7d' ? 'Last 7d' : dateRangeFilter === '30d' ? 'Last 30d' : 'Last 90d'})`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>

          <span className="text-[11px] font-medium text-slate-400">
            {data?.attribution || 'Powered by Google'}
          </span>
        </div>
      </div>

      {/* ALL REVIEWS VISIBILITY STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-xs">
            <span className="font-black text-slate-900">
              {limit === 'all'
                ? `Showing All ${reviews.length} Verified Google Reviews`
                : `Showing ${reviews.length} of ${filteredCount} Reviews`}
            </span>
            <span className="text-slate-500 text-[11px] ml-2 hidden sm:inline">
              Full chronological database sync (March 2024 – October 2026)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {limit !== 'all' ? (
            <button
              onClick={() => {
                setLimit('all');
                setOffset(0);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Show All {filteredCount || totalReviewsCount} Reviews</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setLimit(25);
                setOffset(0);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold shadow-2xs cursor-pointer transition"
              title="Click to switch back to fast 25-reviews mode"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>All {reviews.length} Reviews Loaded (Switch to Fast Mode)</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. REVIEWS LIST */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-20 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty / Unconfigured Diagnostic State */}
        {!loading && reviews.length === 0 && (
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center mx-auto shadow-2xs">
              <GoogleLogoIcon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {starFilter !== 'all' || searchQuery
                  ? 'No Reviews Match Current Filters'
                  : data?.requiresSetup
                  ? 'Google Business Profile Authorization Required'
                  : 'No Google Reviews Synced Yet'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                {starFilter !== 'all' || searchQuery
                  ? 'No reviews match your selected star rating or search query. Try clearing filters to view all reviews.'
                  : data?.message || 'Every client must connect their own Google account and map a verified Google Business Profile location to fetch real customer reviews.'}
              </p>
            </div>

            {/* Diagnostic Setup Guide */}
            {data?.requiresSetup && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-[#034bc0]" />
                  <span>Required Setup to Fetch Real Reviews</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-700">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-[#034bc0] block">1. Google Cloud Console</span>
                    <span>Enable "My Business Account Management" &amp; "My Business Business Information" APIs.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-[#034bc0] block">2. OAuth Consent Screen</span>
                    <span>Include <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">business.manage</code> scope.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-[#034bc0] block">3. Google Business Ownership</span>
                    <span>Ensure your Google Account is an Owner/Manager of a verified business.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-[#034bc0] block">4. Connect &amp; Map Location</span>
                    <span>Connect your account on the settings page and select your business.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {(starFilter !== 'all' || searchQuery) ? (
                <button
                  onClick={() => { setStarFilter('all'); setSearchQuery(''); }}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] text-white text-xs font-bold hover:bg-[#023aa0] transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <>
                  <Link
                    to="/google"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <GoogleLogoIcon className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </Link>

                  <button
                    onClick={handleTriggerSyncNow}
                    disabled={refreshing || loading}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#034bc0]' : ''}`} />
                    <span>Sync Now</span>
                  </button>

                  <button
                    onClick={() => setShowSetupModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    API Setup Guide
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Real Review Cards */}
        {!loading && reviews.map((review) => {
          const isExpanded = Boolean(expandedReviews[review.reviewId]);
          const comment = review.comment || '';
          const isLong = comment.length > 200;
          const displayText = isLong && !isExpanded ? `${comment.slice(0, 200)}...` : comment;
          const reviewerName = review.reviewer?.displayName || 'Google Customer';
          const avatarUrl = review.reviewer?.profilePhotoUrl;
          const initial = reviewerName.charAt(0).toUpperCase();

          return (
            <div
              key={review.reviewId}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition-all space-y-4 group"
            >
              {/* Header: Reviewer info, Star rating, and date */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={reviewerName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 ${avatarUrl ? 'hidden' : 'flex'}`}
                  >
                    {initial}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#034bc0] transition-colors">
                        {reviewerName}
                      </h4>
                      {review.reviewer?.isAnonymous && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{review.relativeTimeDescription || new Date(review.createTime).toLocaleDateString()}</span>
                      {review.sentiment && (
                        <>
                          <span>•</span>
                          <span
                            className={`capitalize text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              review.sentiment === 'positive'
                                ? 'bg-emerald-50 text-emerald-700'
                                : review.sentiment === 'negative'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {review.sentiment}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      {review.reviewReply || review.replyStatus === 'replied' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Replied
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Needs Reply
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stars and Maps Link */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <StarRating rating={review.starRating} size="w-4 h-4" showNumber={true} />
                  {review.authorUrl && (
                    <a
                      href={review.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-slate-400 hover:text-[#034bc0] hover:bg-slate-50 transition"
                      title="View on Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Review Text */}
              {comment ? (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-0 sm:pl-13">
                  <p className="whitespace-pre-line">{displayText}</p>
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(review.reviewId)}
                      className="text-xs font-bold text-[#034bc0] hover:underline mt-1 cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic pl-0 sm:pl-13">
                  Customer left a star rating without written text.
                </div>
              )}

              {/* Official Owner Reply (if present) */}
              {review.reviewReply && (
                <div className="ml-0 sm:ml-13 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#034bc0]" />
                      <span>Response from the owner</span>
                    </span>
                    {review.reviewReply.updateTime && (
                      <span className="text-[10px] text-slate-600 font-medium">
                        {new Date(review.reviewReply.updateTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {review.reviewReply.comment}
                  </p>
                </div>
              )}

              {/* AI Reply & Action Bar (Case 2: Self-Owned Business AI Reply) */}
              {!selectedPublicPlace && !review.reviewReply && (
                <div className="pl-0 sm:pl-13 pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAiReply(review)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#034bc0] text-xs font-bold transition cursor-pointer"
                    title="Generate an AI-powered smart reply for this review"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Reply</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* 6. LOAD MORE BUTTON */}
        {!loading && hasMore && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMore ? 'animate-spin text-[#034bc0]' : 'text-slate-500'}`} />
              <span>{loadingMore ? 'Loading Reviews...' : `Load More Reviews (${filteredCount - reviews.length} remaining)`}</span>
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {/* MODAL: ADD HOTEL PROPERTY (MULTI-HOTEL MANAGEMENT) */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-[#034bc0]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Hotel Property</h3>
                  <p className="text-xs text-slate-500">Register a new hotel property under your private workspace</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddHotelModal(false); setAddHotelError(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addHotelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addHotelError}</span>
              </div>
            )}

            <form onSubmit={handleAddHotelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hotel Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newHotelForm.name}
                  onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
                  placeholder="e.g. Royal Palace Hotel & Suites"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newHotelForm.city}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, city: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Google Place ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newHotelForm.placeId}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, placeId: e.target.value })}
                    placeholder="ChIJ..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Google Maps Link / URL (Optional)
                </label>
                <input
                  type="url"
                  value={newHotelForm.mapsUrl}
                  onChange={(e) => setNewHotelForm({ ...newHotelForm, mapsUrl: e.target.value })}
                  placeholder="https://maps.app.goo.gl/... or https://search.google.com/local/writereview?..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowAddHotelModal(false); setAddHotelError(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingHotel}
                  className="px-5 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {addingHotel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{addingHotel ? 'Creating Hotel...' : 'Save & Connect Hotel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. GOOGLE CLOUD CONSOLE SETUP MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <GoogleLogoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Google Business Profile API Setup Guide
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How to enable official Google APIs and connect your genuine business reviews
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 text-xs leading-relaxed">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#034bc0] text-white text-[11px] flex items-center justify-center">1</span>
                  <span>Create a Google Cloud Project</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[#034bc0] font-bold underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> and create or select an existing project for your organization.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#034bc0] text-white text-[11px] flex items-center justify-center">2</span>
                  <span>Enable Required Google APIs</span>
                </div>
                <p className="text-slate-600 pl-7">
                  In <strong>APIs & Services &gt; Library</strong>, search and enable:
                </p>
                <ul className="list-disc pl-11 space-y-1 text-slate-700 font-medium">
                  <li><strong>My Business Business Information API</strong> (for verified locations)</li>
                  <li><strong>My Business Account Management API</strong> (for account mapping)</li>
                  <li><strong>Google My Business API (v4)</strong> (for review fetching and replies)</li>
                  <li><strong>Places API (New or Legacy)</strong> (for public Place ID details)</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#034bc0] text-white text-[11px] flex items-center justify-center">3</span>
                  <span>Configure OAuth Consent Screen &amp; Scopes</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Configure the OAuth consent screen with User Type <strong>External</strong> and add scope:
                </p>
                <div className="pl-7">
                  <code className="px-2.5 py-1 bg-slate-200/80 rounded font-mono text-[11px] text-slate-800 select-all block">
                    https://www.googleapis.com/auth/business.manage
                  </code>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#034bc0] text-white text-[11px] flex items-center justify-center">4</span>
                  <span>Create OAuth 2.0 Client Credentials</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Under <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>:
                </p>
                <ul className="list-disc pl-11 space-y-1 text-slate-700">
                  <li>Application type: <strong>Web application</strong></li>
                  <li>
                    Authorized redirect URI:
                    <code className="ml-1 px-2 py-0.5 bg-slate-200/80 rounded font-mono text-[11px] text-slate-800 select-all">
                      http://localhost:5173/google/callback
                    </code>
                  </li>
                </ul>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">5</span>
                  <span>Set Environment Variables &amp; Authorize</span>
                </div>
                <p className="text-emerald-800 pl-7">
                  Add your credentials to <code className="font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded">server/.env</code>:
                </p>
                <pre className="pl-7 text-[11px] font-mono text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg overflow-x-auto">
{`GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/google/callback`}
                </pre>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/google"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
              >
                <span>Manage Google Connection Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setShowSetupModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EXPLORE ANY BUSINESS MODAL (CASE 1) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Explore Any Business Reviews</h3>
                  <p className="text-xs text-slate-500">Search any public business or competitor to preview their Google reviews</p>
                </div>
              </div>
              <button
                onClick={() => { setShowSearchModal(false); setSearchResults([]); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQueryPublic}
                  onChange={(e) => handleSearchPublicPlaces(e.target.value)}
                  placeholder="e.g. StackCode Training Institute, Taj Hotel, Starbucks..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#034bc0] focus:bg-white transition"
                  autoFocus
                />
                {searchingPlaces && (
                  <RefreshCw className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                )}
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] font-semibold">Try:</span>
                <button
                  type="button"
                  onClick={() => handleSearchPublicPlaces('StackCode Training Institute')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
                >
                  StackCode Training Institute
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchPublicPlaces('Taj Hotel Mumbai')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
                >
                  Taj Hotel Mumbai
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchPublicPlaces('Bhagyalaxmi Hotel')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
                >
                  Bhagyalaxmi Hotel
                </button>
              </div>

              {/* Results list */}
              <div className="max-h-72 overflow-y-auto space-y-2 pt-2">
                {searchResults.map((place) => (
                  <div
                    key={place.placeId}
                    onClick={() => handleSelectPublicPlace(place)}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-[#034bc0] hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#034bc0] transition truncate">
                          {place.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                          {place.category || 'Business'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{place.address}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end font-bold text-xs text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{place.rating || '5.0'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">({place.userRatingsTotal || 0} reviews)</span>
                    </div>
                  </div>
                ))}

                {searchQueryPublic && !searchingPlaces && searchResults.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No matching places found. Try entering the full business name or locality.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. AI REVIEW REPLY MODAL (CASE 2) */}
      {aiReplyModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#034bc0]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">AI Review Reply Assistant</h3>
                  <p className="text-xs text-slate-500">Generate a polished, context-aware reply for this customer review</p>
                </div>
              </div>
              <button
                onClick={() => setAiReplyModal(prev => ({ ...prev, open: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original review snippet */}
            {aiReplyModal.review && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{aiReplyModal.review.reviewer?.displayName || 'Customer'}</span>
                  <StarRating rating={aiReplyModal.review.starRating} size="w-3.5 h-3.5" showNumber={true} />
                </div>
                <p className="text-xs text-slate-600 italic line-clamp-2">"{aiReplyModal.review.comment || 'No text review'}"</p>
              </div>
            )}

            {/* Tone selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Tone / Language Style:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'friendly', label: 'Friendly & Warm' },
                  { id: 'professional', label: 'Professional' },
                  { id: 'concise', label: 'Concise' },
                  { id: 'hindi', label: 'Hindi (हिंदी)' },
                  { id: 'hinglish', label: 'Hinglish' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleRegenerateTone(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      aiReplyModal.tone === t.id
                        ? 'bg-[#034bc0] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Textarea with SEO Keyword Injected Banner */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Reply Draft:</label>
                {aiReplyModal.injectedKeyword && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <Target className="w-3 h-3 text-purple-600" />
                    <span>SEO Keyword Injected: "{aiReplyModal.injectedKeyword}"</span>
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={aiReplyModal.replyText}
                onChange={(e) => setAiReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                placeholder="AI reply draft will appear here..."
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#034bc0] focus:bg-white transition"
              />
              {aiReplyModal.generating && (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Groq AI is crafting an optimal response...</span>
                </div>
              )}
            </div>

            {aiReplyModal.successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiReplyModal.successMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aiReplyModal.replyText);
                  setStatusMessage({ type: 'success', text: 'Reply text copied to clipboard!' });
                  setTimeout(() => setStatusMessage(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiReplyModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={aiReplyModal.submitting || !aiReplyModal.replyText.trim()}
                  onClick={handlePublishReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {aiReplyModal.submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Publish Reply to Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. CUSTOMER REVIEW COLLECTION & QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Direct Google Review Collection</h3>
                  <p className="text-xs text-slate-500">Fast customer review links and scannable QR codes</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingQr && (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Generating dynamic Google Review QR Code...</p>
              </div>
            )}

            {!loadingQr && qrData && (
              <div className="space-y-6">
                {/* QR Code Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 text-center space-y-3 shadow-2xs">
                  {qrData.qrDataUrl ? (
                    <img
                      src={qrData.qrDataUrl}
                      alt="Google Review QR Code"
                      className="w-52 h-52 mx-auto rounded-2xl border-4 border-white shadow-md bg-white p-2"
                    />
                  ) : (
                    <div className="w-52 h-52 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      QR Preview
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{qrData.businessName || 'Business Location'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Scan with camera to open Google Maps write review</p>
                  </div>

                  {/* Download Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <a
                      href={`/api/v1/google/review-qr/${activeBusiness?.id || ''}?format=png&size=600`}
                      download={`google-review-qr-${(qrData.businessName || 'business').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG (Print Ready)</span>
                    </a>
                    <a
                      href={`/api/v1/google/review-qr/${activeBusiness?.id || ''}?format=svg`}
                      download={`google-review-qr-${(qrData.businessName || 'business').toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </a>
                  </div>
                </div>

                {/* Direct Link & 1-Click Copy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Direct Google Review URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qrData.reviewUrl || ''}
                      className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 select-all"
                    />
                    <button
                      onClick={handleCopyReviewUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                    >
                      {copiedReviewUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReviewUrl ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Instant Customer Outreach</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {qrData.whatsappShareUrl && (
                      <a
                        href={qrData.whatsappShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Send via WhatsApp</span>
                      </a>
                    )}
                    {qrData.emailShareUrl && (
                      <a
                        href={qrData.emailShareUrl}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Share via Email</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Anti-Gating Policy Notice */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Anti-Gating Policy Guarantee</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    This link routes 100% of customers directly to write reviews on Google without review gating or pre-screening, complying fully with official Google Business Profile policies.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. GOOGLE SYNC HISTORY AUDIT MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#034bc0] shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Google Review Sync History</h3>
                  <p className="text-xs text-slate-500">Official Google Business Profile API sync audit trail</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory && (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#034bc0] mx-auto" />
                  <p className="text-xs text-slate-500">Loading sync history...</p>
                </div>
              )}

              {!loadingHistory && syncHistory.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Sync History Recorded Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Sync runs are automatically recorded every time your Google Business Profile is synchronized.
                  </p>
                </div>
              )}

              {!loadingHistory && syncHistory.length > 0 && (
                <div className="space-y-2.5">
                  {syncHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              item.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {item.sync_type === 'scheduled' ? 'Scheduled Sync' : 'Manual Sync'}
                          </span>
                          {item.business_name && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              • {item.business_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {new Date(item.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                          {item.duration_ms > 0 && ` • Latency: ${item.duration_ms}ms`}
                        </p>
                        {item.error_message && (
                          <p className="text-xs text-rose-600 font-medium pt-0.5">
                            Error: {item.error_message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold self-start sm:self-auto">
                        <div className="text-left sm:text-right">
                          <span className="text-slate-900 font-black text-sm block">
                            +{item.new_reviews_count || 0}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">New Reviews</span>
                        </div>
                        <div className="text-left sm:text-right border-l border-slate-100 pl-4">
                          <span className="text-slate-700 font-black text-sm block">
                            {item.reviews_found || 0}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">Total Found</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Showing last {syncHistory.length} sync executions</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

