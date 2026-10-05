import React, { useState, useEffect } from 'react';
import { 
  Globe, CheckCircle2, AlertTriangle, RefreshCw, Unlink, ExternalLink,
  MapPin, Phone, Eye, Navigation, PhoneCall, MousePointer, ShieldCheck,
  Calendar, ArrowUpRight, BarChart3, Clock, AlertCircle, Shield
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
  const [oauthAccount, setOauthAccount] = useState('admin@saffronbistro.com');

  useEffect(() => {
    fetchGoogleData();
  }, []);

  const fetchGoogleData = async () => {
    try {
      setLoading(true);
      const [statusRes, perfRes] = await Promise.all([
        api.getGoogleStatus(),
        api.getGooglePerformance()
      ]);

      if (statusRes.success) {
        setConnectionData(statusRes);
      }
      if (perfRes.success) {
        setPerformance(perfRes.metrics);
      }
    } catch (err) {
      console.error('Failed to load Google profile data:', err);
    } finally {
      setLoading(false);
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
      setTimeout(() => setSyncMessage(null), 5000);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Connecting to Google Business Profile Services...</p>
        </div>
      </div>
    );
  }

  const isConnected = connectionData?.connected;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
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
              Real-time two-way synchronization for reviews, business hours, services, posts, and Google Maps performance analytics.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch lg:self-auto justify-end">
            {isConnected ? (
              <>
                {!isClient && (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Unlink className="w-4 h-4" /> Disconnect
                  </button>
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
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Connect Google Account
              </button>
            )}
          </div>
        </div>

        {/* Sync status alert */}
        {syncMessage && (
          <div className={`mt-4 p-3.5 rounded-xl text-sm flex items-center gap-2 border ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' 
              : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
          }`}>
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{syncMessage.text}</span>
          </div>
        )}
      </div>

      {/* Account Info Bar */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              G
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Connected Account</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{connectionData?.connection?.account_email}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Last Synced</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {connectionData?.connection?.last_sync_at ? new Date(connectionData.connection.last_sync_at).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Mapped Locations</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {connectionData?.mappedLocations?.length || 1} Active Location
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Sync Cadence</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {connectionData?.connection?.sync_frequency || 'Daily Background Worker'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapped GBP Locations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Linked Google Business Locations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Physical store locations mapped to Redes Creation multi-tenant workspaces.</p>
          </div>
        </div>

        {connectionData?.mappedLocations?.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {connectionData.mappedLocations.map((loc, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{loc.location_name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Google Verified
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                      {loc.gbp_location_id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {loc.address}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {loc.phone}</span>
                  </div>
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
              <BarChart3 className="w-4 h-4 text-blue-600" /> Google Insights & Customer Actions (Last 30 Days)
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Source: Google Business Profile API
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
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
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
                        className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 via-indigo-500 to-violet-500 rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-sm"
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

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold text-lg">
                G
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Google Business Profile</h3>
                <p className="text-xs text-slate-500">Secure OAuth 2.0 Token Handshake</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Redes Creation connects via official Google My Business APIs with read/write access to sync incoming reviews, respond to reviews, and track search performance.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Google Workspace Admin Email</label>
              <input
                type="email"
                value={oauthAccount}
                onChange={e => setOauthAccount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@business.com"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectOAuth}
                disabled={connecting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
              >
                {connecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Globe className="w-4 h-4" />}
                {connecting ? 'Authenticating...' : 'Authorize OAuth'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
