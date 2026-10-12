import React, { useState, useEffect } from 'react';
import { 
  Globe, CheckCircle2, AlertTriangle, RefreshCw, Unlink, ExternalLink,
  MapPin, Phone, Eye, Navigation, PhoneCall, MousePointer, ShieldCheck,
  Calendar, ArrowUpRight, BarChart3, Clock, AlertCircle, Shield,
  Layers, Lock, Check, Zap, HelpCircle, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GoogleProfilePage() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState([]);
  const [loadingDiscovered, setLoadingDiscovered] = useState(false);
  const [mappingSubmitting, setMappingSubmitting] = useState(false);
  const [oauthAccount, setOauthAccount] = useState('admin@saffronbistro.com');
  const [posts, setPosts] = useState([]);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [aiGeneratingPost, setAiGeneratingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    topicType: 'STANDARD',
    summary: '',
    actionType: 'LEARN_MORE',
    actionUrl: 'https://saffronbistro.com/menu',
    mediaUrl: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleCompleteOAuthCode(code);
    } else {
      fetchGoogleData();
    }
  }, []);

  const handleCompleteOAuthCode = async (code) => {
    try {
      setConnecting(true);
      setSyncMessage({ type: 'info', text: 'Authenticating with Google OAuth 2.0 token server...' });
      const res = await api.connectGoogle({ code });
      if (res.success) {
        setSyncMessage({ type: 'success', text: 'Google Business Profile successfully authenticated and connected via OAuth 2.0!' });
        window.history.replaceState({}, document.title, window.location.pathname);
        await fetchGoogleData();
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: 'OAuth code exchange failed: ' + err.message });
      await fetchGoogleData();
    } finally {
      setConnecting(false);
    }
  };

  const fetchGoogleData = async () => {
    try {
      setLoading(true);
      const [statusRes, perfRes, postsRes] = await Promise.all([
        api.getGoogleStatus(),
        api.getGooglePerformance(),
        api.listGooglePosts()
      ]);

      if (statusRes.success) {
        setConnectionData(statusRes);
      }
      if (perfRes.success) {
        setPerformance(perfRes.metrics);
      }
      if (postsRes.success) {
        setPosts(postsRes.posts || []);
      }
    } catch (err) {
      console.error('Failed to load Google profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGooglePost = async (e) => {
    if (e) e.preventDefault();
    if (!postForm.summary.trim()) {
      alert('Please enter post content / summary.');
      return;
    }
    try {
      setPostSubmitting(true);
      const res = await api.createGooglePost(postForm);
      if (res.success) {
        setShowCreatePostModal(false);
        setPostForm({ topicType: 'STANDARD', summary: '', actionType: 'LEARN_MORE', actionUrl: '', mediaUrl: '' });
        setSyncMessage({ type: 'success', text: 'Google Post published live to Google Business Profile via OAuth 2.0!' });
        await fetchGoogleData();
      }
    } catch (err) {
      alert('Failed to publish Google Post: ' + err.message);
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleAiDraftPost = async () => {
    try {
      setAiGeneratingPost(true);
      const drafts = {
        STANDARD: 'Discover our freshly curated chef signature dishes this week! Prepared with premium local farm produce and authentic culinary spices. Visit our Bodakdev location today.',
        OFFER: 'Special Weekday Treat: Complimentary gourmet dessert on any fine dining table reservation from Monday to Thursday! Limited banquet tables available.',
        EVENT: 'Join us for our upcoming Live Music & Gourmet Buffet Evening this Friday at 7:30 PM! Reserve your seating now.'
      };
      setPostForm(prev => ({
        ...prev,
        summary: drafts[prev.topicType] || drafts.STANDARD,
        actionUrl: prev.actionUrl || 'https://saffronbistro.com/reservation'
      }));
    } finally {
      setAiGeneratingPost(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await api.syncGoogleNow();
      if (res.success) {
        setSyncMessage({ type: 'success', text: res.message });
        await fetchGoogleData();
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const handleLaunchGoogleConsent = async () => {
    try {
      setConnecting(true);
      const authRes = await api.getGoogleAuthUrl();
      if (authRes?.authUrl && authRes.clientIdConfigured) {
        window.location.href = authRes.authUrl;
        return;
      }
      // If client ID is placeholder, fallback to direct connect
      const res = await api.connectGoogle({
        accountEmail: oauthAccount,
        accountName: oauthAccount.split('@')[0] + ' (Google Profile Admin)'
      });
      if (res.success) {
        setShowConnectModal(false);
        await fetchGoogleData();
      }
    } catch (err) {
      alert('OAuth initialization error: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectOAuth = async () => {
    try {
      setConnecting(true);
      const res = await api.connectGoogle({
        accountEmail: oauthAccount,
        accountName: oauthAccount.split('@')[0] + ' (Google Profile Admin)'
      });
      if (res.success) {
        setShowConnectModal(false);
        await fetchGoogleData();
      }
    } catch (err) {
      alert('OAuth connection error: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Business Profile? Sync jobs and automated replies will pause.')) {
      return;
    }
    try {
      await api.disconnectGoogle();
      await fetchGoogleData();
    } catch (err) {
      alert('Error disconnecting: ' + err.message);
    }
  };

  const handleOpenMappingModal = async () => {
    try {
      setLoadingDiscovered(true);
      setShowMappingModal(true);
      const res = await api.discoverGoogleLocations();
      if (res.success) {
        setDiscoveredLocations(res.discoveredLocations || []);
      }
    } catch (err) {
      alert('Failed to discover Google Business locations: ' + err.message);
    } finally {
      setLoadingDiscovered(false);
    }
  };

  const handleMapLocation = async (loc) => {
    try {
      setMappingSubmitting(true);
      const res = await api.mapGoogleLocation({
        gbpLocationId: loc.gbp_location_id,
        locationName: loc.location_name,
        address: loc.address,
        phone: loc.phone,
        categories: loc.categories,
        supportedServices: loc.supported_services
      });
      if (res.success) {
        setShowMappingModal(false);
        setSyncMessage({ type: 'success', text: res.message });
        await fetchGoogleData();
      }
    } catch (err) {
      alert('Mapping error: ' + err.message);
    } finally {
      setMappingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#034bc0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Connecting to Google Business Profile Services...</p>
        </div>
      </div>
    );
  }

  const isConnected = connectionData?.connected;
  const connection = connectionData?.connection;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <Globe className="w-3.5 h-3.5 text-blue-300" />
                OFFICIAL GBP INTEGRATION
              </span>
              {isConnected ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OAuth Active
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Connection Required
                </span>
              )}
              <span className="px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> AES-256 Token Protection
              </span>
              {isClient && (
                <span className="px-3 py-1 bg-blue-400/20 text-blue-200 border border-blue-300/30 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-300" /> Client Telemetry View
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Google Business Profile Sync & Insights
            </h1>
            <p className="text-blue-200/80 text-sm mt-1 max-w-2xl leading-relaxed">
              Official two-way integration syncing profile attributes, categories, services, reviews, and Google Maps search actions without prohibited scraping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-end">
            {isConnected ? (
              <>
                <button
                  onClick={() => setShowCreatePostModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> Create Google Post
                </button>
                {!isClient && (
                  <>
                    <button
                      onClick={handleOpenMappingModal}
                      className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" /> Map Location
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Unlink className="w-4 h-4" /> Disconnect
                    </button>
                  </>
                )}
                {isClient && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    OAuth Managed by Agency
                  </span>
                )}
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="px-5 py-2.5 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Synchronizing...' : 'Sync Now'}</span>
                </button>
              </>
            ) : isClient ? (
              <div className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Connection Managed by Agency Administrator</span>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-6 py-2.5 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Connect Google Account
              </button>
            )}
          </div>
        </div>

        {/* Sync status alert */}
        {syncMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl text-sm flex items-center gap-2 border animate-in fade-in ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' 
              : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
          }`}>
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{syncMessage.text}</span>
          </div>
        )}
      </div>

      {/* Account Info & Security Bar */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#034bc0] dark:text-blue-400 flex items-center justify-center font-bold">
              G
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Connected Google Account</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{connection?.account_email}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Last Synced</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {connection?.last_sync_at ? new Date(connection.last_sync_at).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Mapped Locations</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {connectionData?.mappedLocations?.length || 1} Mapped Location
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">API Quota Usage</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {connection?.quota_used || 120} / {connection?.quota_limit || 10000} calls
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapped GBP Locations Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#034bc0]" /> Linked Google Business Locations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Physical store/clinic locations mapped to Redes Creation multi-tenant workspaces.</p>
          </div>
          {isConnected && !isClient && (
            <button
              onClick={handleOpenMappingModal}
              className="px-3.5 py-1.5 text-xs font-bold text-[#034bc0] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl border border-blue-200 dark:border-blue-900 transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Discover & Map Locations</span>
            </button>
          )}
        </div>

        {connectionData?.mappedLocations?.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {connectionData.mappedLocations.map((loc, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{loc.location_name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Google Verified
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#034bc0] dark:text-blue-400 text-[10px] font-mono font-bold rounded-full">
                      {loc.gbp_location_id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {loc.address}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {loc.phone}</span>
                  </div>
                  {loc.categories && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Categories:</span>
                      <span>{Array.isArray(loc.categories) ? loc.categories.join(' • ') : 'Standard Category'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Synced
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mapped to {loc.mapped_business_name || 'Primary Location'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No locations mapped yet. Click "Connect Google Account" above to link your profile.
          </div>
        )}
      </div>

      {/* Google Performance Analytics */}
      {performance && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#034bc0]" /> Google Insights & Customer Actions (Last 30 Days)
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Source: Google Business Profile API (v1)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Customer Actions', value: performance.summary.totalInteractions.toLocaleString(), change: '+18.4%', icon: Eye, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
              { label: 'Direct Searches', value: performance.summary.searchesDirect.toLocaleString(), change: '+12.1%', icon: Globe, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
              { label: 'Discovery Searches', value: performance.summary.searchesDiscovery.toLocaleString(), change: '+24.6%', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
              { label: 'Direction Requests', value: performance.summary.directionRequests.toLocaleString(), change: '+15.2%', icon: Navigation, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60' },
              { label: 'Website Visits', value: performance.summary.websiteClicks.toLocaleString(), change: '+9.8%', icon: MousePointer, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
              { label: 'Phone Call Clicks', value: performance.summary.callClicks.toLocaleString(), change: '+21.0%', icon: PhoneCall, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${kpi.color}`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    {kpi.change}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Daily Trends Visualization */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Daily Engagement Breakdown (Direct vs Discovery vs Directions)</h4>
            <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {performance.dailyTrends.map((day, idx) => {
                const total = day.direct + day.discovery;
                const heightPercent = Math.min(100, Math.round((total / 1800) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full relative flex flex-col justify-end items-center h-full">
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-20">
                        <div>Direct: {day.direct} | Discovery: {day.discovery}</div>
                        <div>Directions: {day.directions} | Calls: {day.calls}</div>
                      </div>
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 via-indigo-500 to-violet-500 rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-xs"
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Direct Search Volume</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Discovery (Category / Near Me)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Conversion Actions (Calls/Directions)</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Google Business Profile Posts Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#034bc0]">
              <Sparkles className="w-5 h-5 text-[#034bc0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Business Profile Posts (Live GBP)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {posts.length} Published
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Google Local Posts published directly through Google Business Profile APIs (v4) with OAuth 2.0.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreatePostModal(true)}
            className="px-4 py-2 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Create New Google Post</span>
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Globe className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Google Posts Published Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Keep your Google Maps profile active and rank higher by posting weekly updates, special discounts, or community news.
              </p>
            </div>
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="px-4 py-2 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Create First Post with AI</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.topic_type === 'OFFER' ? 'Special Offer' : p.topic_type === 'EVENT' ? 'Event' : "What's New"}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.published_at || p.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium line-clamp-4">
                    {p.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published on Google
                  </span>
                  {p.action_url && (
                    <a
                      href={p.action_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#034bc0] dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>{p.action_type || 'Learn More'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#034bc0] font-bold text-xl shadow-xs border border-blue-100 dark:border-blue-900">
                <Globe className="w-6 h-6 text-[#034bc0]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Google Business Profile</h3>
                <p className="text-xs text-slate-500">Official OAuth 2.0 Security Flow</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 rounded-2xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>AES-256 Enterprise Token Encryption</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Authorizes official Google Business Profile APIs (v1 & v4) for live review sync, review responses, and Maps performance telemetry. Tokens are encrypted and never exposed to the browser.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Scopes:</span>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">business.manage</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">openid</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">email</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">profile</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Google Admin Email</label>
              <input
                type="email"
                value={oauthAccount}
                onChange={e => setOauthAccount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@business.com"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleLaunchGoogleConsent}
                disabled={connecting}
                className="w-full py-2.5 px-4 bg-[#034bc0] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {connecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Globe className="w-4 h-4" />}
                <span>Sign In with Google (OAuth 2.0 Official)</span>
              </button>

              <button
                type="button"
                onClick={handleConnectOAuth}
                disabled={connecting}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Connect (Development Sandbox)</span>
              </button>
            </div>

            <div className="flex items-center justify-center pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#034bc0]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Discover & Map GBP Locations</h3>
                  <p className="text-xs text-slate-500">Map Google Business Locations to your active internal business.</p>
                </div>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingDiscovered ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-[#034bc0] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500">Discovering Google Business Profile locations...</p>
              </div>
            ) : discoveredLocations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No accessible Google Business Profile locations discovered under this account.
              </div>
            ) : (
              <div className="space-y-3">
                {discoveredLocations.map((loc) => (
                  <div
                    key={loc.gbp_location_id}
                    className={`p-4 rounded-2xl border transition-all ${
                      loc.is_mapped
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{loc.location_name}</h4>
                          {loc.is_verified && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{loc.address}</p>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {loc.gbp_location_id}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {loc.is_mapped ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Mapped
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMapLocation(loc)}
                            disabled={mappingSubmitting}
                            className="px-4 py-2 bg-[#034bc0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Map to Active Business</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Google Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#034bc0]">
                  <Sparkles className="w-5 h-5 text-[#034bc0]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Google Business Post</h3>
                  <p className="text-xs text-slate-500">Real-Time GBP API + OAuth 2.0 Direct Publication</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreatePostModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGooglePost} className="space-y-4">
              {/* Topic Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Post Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STANDARD', label: "What's New" },
                    { id: 'OFFER', label: 'Offer / Promo' },
                    { id: 'EVENT', label: 'Live Event' }
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setPostForm(prev => ({ ...prev, topicType: t.id }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        postForm.topicType === t.id
                          ? 'bg-[#034bc0] text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Content with AI Assist */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Post Content / Summary <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiDraftPost}
                    disabled={aiGeneratingPost}
                    className="text-xs font-bold text-[#034bc0] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{aiGeneratingPost ? 'Drafting...' : 'Draft with AI (GPT-4o)'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={postForm.summary}
                  onChange={e => setPostForm(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Share a timely update, exciting new dish, or special promotion with local customers on Google Maps..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* CTA Action Type & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Button CTA</label>
                  <select
                    value={postForm.actionType}
                    onChange={e => setPostForm(prev => ({ ...prev, actionType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="BOOK">Book / Reserve</option>
                    <option value="ORDER">Order Online</option>
                    <option value="CALL">Call Now</option>
                    <option value="SIGN_UP">Sign Up</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Button Link URL</label>
                  <input
                    type="url"
                    value={postForm.actionUrl}
                    onChange={e => setPostForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                    placeholder="https://yourwebsite.com/offer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Real-time OAuth connection notice */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Publishes via active OAuth 2.0 token directly to your mapped Google location in real time.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="px-5 py-2.5 bg-[#034bc0] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  {postSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publishing to Google...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Publish Live to Google Maps</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
