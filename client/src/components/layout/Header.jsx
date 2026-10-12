import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  Edit3,
  Trash2,
  Settings,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';

export const Header = ({ onOpenCommandPalette, onToggleMobileSidebar }) => {
  const { user, businesses, activeBusiness, switchBusiness, refreshUserData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Edit Location Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locForm, setLocForm] = useState({
    name: '',
    industry_id: 'restaurant',
    address: '',
    city: '',
    phone: '',
    website: '',
    googleReviewUrl: '',
    placeId: ''
  });
  const [savingLoc, setSavingLoc] = useState(false);

  const bizDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bizDropdownRef.current && !bizDropdownRef.current.contains(e.target)) {
        setBizDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenEdit = (b) => {
    setEditingLoc(b);
    setLocForm({
      name: b.name || '',
      industry_id: b.industry_id || 'restaurant',
      address: b.address || '',
      city: b.city || '',
      phone: b.phone || '',
      website: b.website || '',
      googleReviewUrl: b.google_review_url || '',
      placeId: b.gbp_place_id || ''
    });
    setBizDropdownOpen(false);
    setEditModalOpen(true);
  };

  const handleSaveLoc = async (e) => {
    e.preventDefault();
    if (!editingLoc) return;
    setSavingLoc(true);
    try {
      await api.updateAdminLocation(editingLoc.id, {
        name: locForm.name.trim(),
        industryId: locForm.industry_id,
        address: locForm.address.trim(),
        city: locForm.city.trim(),
        phone: locForm.phone.trim(),
        website: locForm.website.trim(),
        googleReviewUrl: locForm.googleReviewUrl.trim(),
        placeId: locForm.placeId.trim()
      });
      await refreshUserData();
      setEditModalOpen(false);
      window.dispatchEvent(new Event('redes:business-switched'));
    } catch (err) {
      alert('Failed to update location: ' + (err.message || 'Error'));
    } finally {
      setSavingLoc(false);
    }
  };

  const handleDeleteLoc = async (b) => {
    if (businesses.length <= 1) {
      alert('Cannot delete the only remaining location. Please add another location first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${b.name}"? This will permanently delete this business location.`)) {
      return;
    }
    try {
      await api.deleteAdminLocation(b.id);
      await refreshUserData();
      window.dispatchEvent(new Event('redes:business-switched'));
    } catch (err) {
      alert('Failed to remove location: ' + (err.message || 'Error'));
    }
  };

  return (
    <>
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
        <div className="relative" ref={bizDropdownRef}>
          <button
            onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all text-xs font-semibold cursor-pointer active:scale-98"
          >
            <Building2 className="w-4 h-4 text-[#034bc0] shrink-0" />
            <span className="max-w-[100px] sm:max-w-[180px] md:max-w-[220px] truncate">
              {activeBusiness ? activeBusiness.name : 'Select Business'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${bizDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {bizDropdownOpen && (
            <div className="absolute left-0 mt-2 min-w-full w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Business Location
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {businesses.length} Locations
                </span>
              </div>
              <div className="space-y-1 my-1.5 max-h-72 overflow-y-auto pr-0.5">
                {businesses.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      switchBusiness(b.id);
                      setBizDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer border group ${
                      activeBusiness?.id === b.id
                        ? 'bg-blue-50 text-[#034bc0] font-bold border-blue-200 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-100'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate text-[13px]">{b.name}</span>
                        {activeBusiness?.id === b.id && <Check className="w-3.5 h-3.5 text-[#034bc0] shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 capitalize mt-0.5">
                        {b.industry_id ? `${b.industry_id} • ` : (b.industry ? `${b.industry} • ` : '')}Score {b.health_score || 88}%
                      </span>
                    </div>

                    {/* Quick Edit & Remove Action Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(b);
                        }}
                        title={`Edit ${b.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#034bc0] hover:bg-blue-100/70 transition-all cursor-pointer border border-transparent hover:border-blue-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLoc(b);
                        }}
                        title={`Remove ${b.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 transition-all cursor-pointer border border-transparent hover:border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-1.5 mt-1 space-y-1">
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
                <button
                  onClick={() => {
                    setBizDropdownOpen(false);
                    navigate('/admin?tab=locations');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manage All Locations in Super-Admin</span>
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
        <div className="relative" ref={userDropdownRef}>
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

      {/* Edit Location Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 text-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Edit Business Location</h3>
                  <p className="text-[11px] text-slate-500">Update business details, industry, and Google links</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={locForm.name}
                  onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                  placeholder="e.g. StackCode Training Institute"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Industry / Category
                </label>
                <select
                  value={locForm.industry_id}
                  onChange={(e) => setLocForm({ ...locForm, industry_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium bg-white"
                >
                  <option value="restaurant">Restaurant & Food Service</option>
                  <option value="education_training">Education & Training Institute</option>
                  <option value="dental">Dental & Healthcare Spa</option>
                  <option value="healthcare">Medical & Healthcare</option>
                  <option value="hospitality">Hotel, Resort & Hospitality</option>
                  <option value="retail">Retail Store & Supermarket</option>
                  <option value="it_software">IT, Software & Agency</option>
                  <option value="salon">Salon, Beauty & Wellness</option>
                  <option value="automotive">Automotive & Dealership</option>
                  <option value="real_estate">Real Estate & Property</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={locForm.address}
                    onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                    placeholder="e.g. Makarba, SG Highway"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={locForm.city}
                    onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                    placeholder="e.g. Ahmedabad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={locForm.phone}
                    onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Website
                  </label>
                  <input
                    type="url"
                    value={locForm.website}
                    onChange={(e) => setLocForm({ ...locForm, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Place ID
                </label>
                <input
                  type="text"
                  value={locForm.placeId}
                  onChange={(e) => setLocForm({ ...locForm, placeId: e.target.value })}
                  placeholder="e.g. ChIJZfgH1p-bXjkRb35jguD2Icw"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Direct Review URL
                </label>
                <input
                  type="url"
                  value={locForm.googleReviewUrl}
                  onChange={(e) => setLocForm({ ...locForm, googleReviewUrl: e.target.value })}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLoc}
                  className="px-5 py-2 rounded-xl bg-[#034bc0] hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingLoc ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
