import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  MapPin,
  MessageSquare,
  QrCode,
  Search,
  Sparkles,
  Users2,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  Globe2,
  Zap,
  TrendingUp,
  Star,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, activeBusiness, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminUser = ['super_admin', 'owner'].includes(user?.role?.toLowerCase());

  const navGroups = [
    {
      group: 'Main Menu',
      items: [
        { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Google Reviews', path: '/google-reviews', icon: Star, badge: 'Live', badgeType: 'live' },
        { label: 'Review Management', path: '/reviews', icon: MessageSquare },
        { label: 'AI Review Studio', path: '/ai-center', icon: Sparkles },
      ]
    },
    {
      group: 'Local SEO & Growth',
      items: [
        { label: 'Geo-Grid Heatmap', path: '/geo-grid', icon: MapPin },
        { label: 'Target Keywords', path: '/keywords', icon: Search },
        { label: 'Local SEO Audit', path: '/seo', icon: TrendingUp },
        { label: 'Competitor Tracker', path: '/competitors', icon: Users2 },
        { label: 'Review Campaigns', path: '/campaigns', icon: QrCode },
        { label: 'Website Analytics', path: '/website-analytics', icon: Globe2, badge: 'GA4', badgeType: 'ga4' },
      ]
    },
    {
      group: 'Management & Config',
      items: [
        { label: 'Business Locations', path: '/business-intelligence', icon: BrainCircuit },
        { label: 'Google Connection', path: '/google', icon: ShieldCheck },
        { label: 'Sync History', path: '/reports', icon: FileText },
        { label: 'Billing & Plans', path: '/billing', icon: CreditCard },
        { label: 'Settings', path: '/settings', icon: Settings },
        ...(isAdminUser ? [{ label: 'Super Admin', path: '/admin', icon: ShieldCheck, badge: 'Admin', badgeType: 'admin' }] : [])
      ]
    }
  ];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 select-none m-0">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 m-0">
        <NavLink to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
          <img src="/redes-logo.png" alt="Redes Creation" className="h-6 w-auto object-contain" />
        </NavLink>
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Business Indicator */}
      {activeBusiness && (
        <div className="mx-3.5 my-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800 truncate" title={activeBusiness.name}>
              {activeBusiness.name}
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 shrink-0">
            {Number(activeBusiness.health_score || 95).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs font-medium scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((grp, idx) => (
          <div key={idx} className="space-y-1">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {grp.group}
            </span>
            <div className="space-y-0.5">
              {grp.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group cursor-pointer
                      ${isActive
                        ? 'bg-blue-50 text-[#034bc0] font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#034bc0]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                        item.badgeType === 'live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : item.badgeType === 'ga4'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Compact Scale Business / Pro Plan Card */}
      <div className="mx-3.5 my-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#034bc0] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Scale Business</p>
            <p className="text-[10px] text-slate-500 leading-tight truncate">Multi-Location & AI</p>
          </div>
        </div>
        <NavLink
          to="/plans"
          className="px-2.5 py-1 rounded-lg bg-[#034bc0] hover:bg-blue-700 text-white text-[10px] font-bold transition shadow-2xs shrink-0"
        >
          Upgrade
        </NavLink>
      </div>

      {/* User Footer Profile & Quick Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white hover:shadow-2xs transition-all">
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            title="Open Account Settings"
          >
            <div className="w-8 h-8 rounded-full bg-[#034bc0] flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0">
              {user?.fullName?.charAt(0) || 'D'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">{user?.fullName || 'Business Owner'}</span>
              <span className="text-[10px] text-slate-500 truncate capitalize">{user?.role || 'Owner'} • {user?.plan || 'Agency'}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 ml-1"
            title="Log Out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-30 m-0">
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
