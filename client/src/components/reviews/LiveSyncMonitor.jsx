import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

export default function LiveSyncMonitor({
  isConnected,
  telemetry,
  syncProgress,
  isSyncing,
  onTriggerSync,
  businessName
}) {
  const lastSyncDate = telemetry?.lastSyncedAt ? new Date(telemetry.lastSyncedAt) : null;
  const localCount = telemetry?.totalReviewsLocal ?? 0;
  const googleReported = telemetry?.totalReviewsGoogle ?? localCount;
  const inSync = localCount >= googleReported && localCount > 0;

  // Format relative time
  const getRelativeTime = (date) => {
    if (!date) return 'Not yet synced';
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              )}
            </span>
            <span className="text-xs font-black tracking-tight text-slate-800">
              Real-Time Sync Engine
            </span>
          </div>

          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isConnected ? 'SSE Live Stream Active' : 'Connecting Stream...'}
          </span>

          <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
            • {businessName || 'Hotel Property'}
          </span>
        </div>

        {/* Sync Now Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            title="Trigger instant paginated Google reviews sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Pages...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Sync in Progress Live Banner */}
      {isSyncing && (
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-200/60 flex items-center gap-2.5 text-xs text-blue-900 font-semibold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          <span>
            {syncProgress?.message || 'Sync worker active: querying Google Business Profile paginated endpoints...'}
          </span>
          {syncProgress?.processed !== undefined && (
            <span className="ml-auto font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              {syncProgress.processed} / {syncProgress.total} reviews
            </span>
          )}
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-y-3">
        {/* Metric 1: Status */}
        <div className="px-3 py-1 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Sync Status
          </span>
          <div className="flex items-center gap-1.5">
            {isSyncing ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-blue-700">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                In Progress
              </span>
            ) : inSync ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% In Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-black text-slate-700">
                <Check className="w-3.5 h-3.5 text-slate-500" />
                Ready
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Last Successful Sync */}
        <div className="px-3 py-1 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Last Successful Sync
          </span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-800">
              {getRelativeTime(lastSyncDate)}
            </span>
          </div>
          {lastSyncDate && (
            <span className="text-[10px] text-slate-600 block">
              {lastSyncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Metric 3: Reviews Reported vs Ingested */}
        <div className="px-3 py-1 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Reviews Ingestion Ratio
          </span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-black text-slate-900">
              {Number(localCount).toLocaleString('en-IN')} <span className="text-slate-400 font-normal">/ {Number(googleReported).toLocaleString('en-IN')}</span>
            </span>
            {inSync ? (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Matched
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 animate-pulse">
                Syncing Active
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 block">
            Local DB vs Google Reported
          </span>
        </div>

        {/* Metric 4: Auto-Update Worker Cadence */}
        <div className="px-3 py-1 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Worker Cadence
          </span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-slate-800">
              Every 15 mins
            </span>
          </div>
          <span className="text-[10px] text-slate-600 block">
            Scheduled background sweep
          </span>
        </div>
      </div>

      {/* Latest Error Notice (if any) */}
      {telemetry?.latestSyncError && (
        <div className="px-5 py-3 bg-rose-50 border-t border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <span className="font-bold block">Previous Sync Notice:</span>
            <p className="text-[11px] text-rose-700 leading-relaxed">{telemetry.latestSyncError}</p>
          </div>
          <button
            onClick={onTriggerSync}
            className="text-[11px] font-extrabold text-rose-700 underline hover:text-rose-900 shrink-0 cursor-pointer"
          >
            Retry Now
          </button>
        </div>
      )}
    </div>
  );
}
