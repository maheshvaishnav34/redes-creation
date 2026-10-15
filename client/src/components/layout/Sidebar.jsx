import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  MapPin,
  MessageSquare,
  QrCode,
  Search,
  Sparkles,
  Users2,
  BarChart3,
  FileText,
  CheckSquare,
  Bell,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronRight,
  Flame,
  Globe2,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, activeBusiness } = useAuth();
  const location = useLocation();

  const isAdminUser = ['super_admin', 'admin', 'owner'].includes(user?.role?.toLowerCase());

  const navGroups = [
    {
      group: 'Core Intelligence',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Business Profile', path: '/business-intelligence', icon: BrainCircuit },
        { label: 'Google Profile', path: '/google', icon: Globe2 },
      ]
    },
    {
      group: 'Reputation & Reviews',
      items: [
        { label: 'Review Inbox', path: '/reviews', icon: MessageSquare, badge: '6' },
        { label: 'Review Campaigns', path: '/campaigns', icon: QrCode },
      ]
    },
    {
      group: 'Local SEO & Search',
      items: [
        { label: 'Trends Intelligence', path: '/trends', icon: TrendingUp, badge: 'Live Pro' },
        { label: 'Keyword Engine', path: '/keywords', icon: Search },
        { label: 'Geo-Grid Heatmap', path: '/geo-grid', icon: MapPin, highlight: true },
        { label: 'Local SEO Audit', path: '/seo', icon: Sparkles },
        { label: 'Competitors', path: '/competitors', icon: Users2 },
      ]
    },
    {
      group: 'Operations & AI',
      items: [
        { label: 'AI Center & Approvals', path: '/ai-center', icon: Flame, badge: '2', alert: true },
        { label: 'Tasks & Actions', path: '/tasks', icon: CheckSquare },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Reports', path: '/reports', icon: FileText },
      ]
    },
    {
      group: 'Workspace & System',
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Billing & Usage', path: '/billing', icon: CreditCard },
        { label: 'Pricing & Upgrade', path: '/plans', icon: Zap, badge: 'New Plans' },
        { label: 'Settings', path: '/settings', icon: Settings },
        ...(isAdminUser ? [{ label: 'Super Admin', path: '/admin', icon: ShieldCheck, badge: 'Admin' }] : [])
      ]
    }
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 text-slate-600">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
        <NavLink to="/" className="flex items-center hover:opacity-90 transition-opacity">
          <img src="/redes-logo.png" alt="Redes Creation" className="h-7 w-auto object-contain" />
        </NavLink>
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Business Mini-Badge */}
      {activeBusiness && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-800 truncate">{activeBusiness.name}</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {Number(activeBusiness.health_score || 94.5).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((grp, idx) => (
          <div key={idx} className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{grp.group}</span>
            <div className="space-y-0.5 mt-1">
              {grp.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer
                      ${isActive
                        ? 'bg-blue-50 text-[#034bc0] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#034bc0]' : 'text-slate-400 group-hover:text-[#034bc0]'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          item.alert 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : isActive 
                              ? 'bg-blue-200/80 text-[#034bc0]' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-[#034bc0] border border-blue-200 font-bold uppercase tracking-wider">
                          Heatmap
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Mini Upgrade Promotion Box */}
      <div className="mx-3 mb-2 p-3 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100/50 rounded-2xl border border-indigo-200/60 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-lg bg-[#034bc0] text-white flex items-center justify-center">
            <Zap className="w-3 h-3 fill-current" />
          </div>
          <span className="text-[11px] font-bold text-slate-900">Scale Your Growth</span>
        </div>
        <p className="text-[10px] text-slate-600 mb-2 leading-tight">
          Multi-location management, Geo-Grid Heatmaps & AI Auto-Reply engine.
        </p>
        <NavLink
          to="/plans"
          className="w-full py-1.5 px-2 bg-[#034bc0] hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-wide transition flex items-center justify-center gap-1 shadow-xs"
        >
          <span>Upgrade Tier</span>
          <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all">
          <div className="w-8 h-8 rounded-full bg-[#034bc0] flex items-center justify-center font-bold text-white text-xs shadow-xs">
            {user?.fullName?.charAt(0) || 'D'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 truncate">{user?.fullName || 'Demo User'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.role || 'Owner'} • {user?.plan || 'Agency'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
