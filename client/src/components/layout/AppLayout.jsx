import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  MapPin, 
  Sparkles, 
  Star,
  Menu 
} from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { CommandPalette } from '../common/CommandPalette.jsx';

export const AppLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Reviews', path: '/google-reviews', icon: Star },
    { label: 'Geo-Grid', path: '/geo-grid', icon: MapPin },
    { label: 'AI Center', path: '/ai-center', icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors m-0 p-0">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full m-0 p-0">
        <Header
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Main Content with clean top spacing and bottom padding on mobile for the fixed Bottom Nav */}
        <main className="flex-1 min-w-0 overflow-x-hidden px-3.5 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 lg:pt-5 pb-24 lg:pb-10 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (Visible only on screens < lg) */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg transition-transform"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-[10px] font-bold transition-all relative ${
                isActive
                  ? 'text-[#034bc0]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#034bc0]' : 'text-slate-500'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-600 text-white min-w-[14px] text-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`mt-0.5 tracking-tight ${isActive ? 'font-extrabold' : 'font-medium'}`}>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Menu button to open full sidebar drawer */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer ${
            mobileSidebarOpen ? 'text-[#034bc0]' : ''
          }`}
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5" />
          <span className="mt-0.5 font-medium tracking-tight">More</span>
        </button>
      </nav>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};
