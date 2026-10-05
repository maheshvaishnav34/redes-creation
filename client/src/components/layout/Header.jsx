import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Building2,
  Check,
  Plus,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onOpenCommandPalette, onToggleMobileSidebar }) => {
  const { user, businesses, activeBusiness, switchBusiness, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-4 lg:px-8 flex items-center justify-between transition-colors shadow-xs">
      {/* Left Area: Mobile Menu + Business Selector */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Location Switcher */}
        <div className="relative">
          <button
            onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all text-xs font-semibold cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#034bc0]" />
            <span className="max-w-[110px] sm:max-w-[200px] truncate">
              {activeBusiness ? activeBusiness.name : 'Select Business'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {bizDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Business Location
              </div>
              <div className="space-y-1 my-1">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      switchBusiness(b.id);
                      setBizDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                      activeBusiness?.id === b.id
                        ? 'bg-blue-50 text-[#034bc0] font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold truncate">{b.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{b.industry_id} • Score {b.health_score || 88}%</span>
                    </div>
                    {activeBusiness?.id === b.id && <Check className="w-4 h-4 text-[#034bc0] shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setBizDropdownOpen(false);
                    navigate('/onboarding');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[#034bc0] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Location / Business</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Search / Command Launcher */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all text-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#034bc0] transition-colors" />
            <span>Search reviews, keywords, tasks...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Search (⌘K)"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-slate-600" />
        </button>
        {/* Quick AI Operations Button */}
        <button
          onClick={() => navigate('/ai-center')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#034bc0]" />
          <span className="hidden sm:inline">AI Operations</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 pl-2 focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#034bc0] flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {user?.fullName?.charAt(0) || 'D'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-[#034bc0] border border-blue-200">
                    {user?.role}
                  </span>
                  <span className="text-[9px] text-slate-500 capitalize">{user?.plan} Tier</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Workspace</span>
              </button>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  navigate('/billing');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Subscription & Usage</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
