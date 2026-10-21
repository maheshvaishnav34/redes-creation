import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Globe,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ExternalLink,
  Target
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const WebsiteAnalyticsPage = () => {
  const { activeBusiness } = useAuth();
  const [loading, setLoading] = useState(false);
  const [realtimeVisitors, setRealtimeVisitors] = useState(18);
  const [timeRange, setTimeRange] = useState('30D');

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Google Analytics 4 (GA4)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#034bc0] border border-blue-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Realtime Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Realtime website traffic, visitor behavior, conversion attribution, and Google Analytics 4 property intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span>{realtimeVisitors} Active Visitors Now</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-[#034bc0]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">24,850</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> +14.2% vs previous period
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sessions</span>
            <Globe className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">38,420</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> +9.8% engagement
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Key Conversions</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">1,248</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">Calls, Bookings & Quotes</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Session Duration</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">2m 44s</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">68.4% Engagement Rate</span>
        </div>
      </div>

      {/* Main Attribution & Channels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Top Acquisition Channels (GA4)</h3>
              <p className="text-xs text-slate-500">Visitor session sources and conversion contribution</p>
            </div>
            <span className="text-xs font-bold text-[#034bc0]">Last 30 Days</span>
          </div>

          <div className="space-y-3">
            {[
              { channel: 'Organic Search (Google Maps & Search)', sessions: '18,420 (48%)', conv: '680 leads', color: 'bg-[#034bc0]' },
              { channel: 'Direct Traffic (Brand & QR Codes)', sessions: '9,120 (24%)', conv: '320 leads', color: 'bg-indigo-600' },
              { channel: 'Organic Social (Instagram, Facebook)', sessions: '5,840 (15%)', conv: '145 leads', color: 'bg-emerald-600' },
              { channel: 'Referral (Local Directories & Media)', sessions: '3,210 (8%)', conv: '78 leads', color: 'bg-amber-500' },
              { channel: 'Paid Search (Google Ads)', sessions: '1,830 (5%)', conv: '25 leads', color: 'bg-slate-500' }
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900">{item.channel}</span>
                  <span className="text-[#034bc0]">{item.conv}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: item.sessions.split('(')[1]?.split('%')[0] + '%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Sessions: {item.sessions}</span>
                  <span className="text-emerald-600 font-semibold">High Intent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Live Cities */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Live Visitor Locations</h3>
              <p className="text-xs text-slate-500">Realtime geographic pulse</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Live
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { city: 'Ahmedabad (Bodakdev & SG Highway)', count: 9, page: '/menu & private-dining' },
              { city: 'Ahmedabad (Satellite & Prahladnagar)', count: 5, page: '/table-booking' },
              { city: 'Gandhinagar (Infocity)', count: 2, page: '/banquets' },
              { city: 'Vadodara (Alkapuri)', count: 1, page: '/corporate-events' },
              { city: 'Mumbai (Bandra)', count: 1, page: '/home' }
            ].map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{item.city}</span>
                  <span className="text-[11px] text-slate-500 truncate block max-w-[170px]">{item.page}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-[#034bc0] font-black text-xs">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalyticsPage;
