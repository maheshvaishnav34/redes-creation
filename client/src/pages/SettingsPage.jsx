import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings, Users, Shield, Lock, Building, Globe, CheckCircle2,
  UserPlus, Mail, Key, Sparkles, AlertCircle, Save, Clock, Check, HelpCircle,
  Eye, EyeOff, CheckSquare, XCircle, ShieldAlert, ShieldCheck, Trash2,
  UserX, UserCheck, ChevronDown, RefreshCw, Search, Filter, Edit3, Copy, X, KeyRound,
  ArrowRight, ShieldQuestion, UserCheck2, User, MapPin
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['owner', 'admin', 'manager', 'staff', 'client'];
const ROLE_COLORS = {
  owner:   'bg-purple-100 text-purple-800 border-purple-300',
  admin:   'bg-rose-100 text-rose-800 border-rose-300',
  manager: 'bg-amber-100 text-amber-800 border-amber-300',
  staff:   'bg-blue-100 text-blue-800 border-blue-300',
  client:  'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export default function SettingsPage() {
  const { user, activeBusiness, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [workspace, setWorkspace] = useState({
    name: '',
    country: 'India',
    timezone: 'Asia/Kolkata',
    default_language: 'en'
  });

  const [members, setMembers] = useState([]);

  // Computed effective role and permissions
  const currentUserMember = members.find(m => m.id === user?.id);
  const effectiveRole = currentUserMember?.role || user?.role || 'client';
  const isClient = effectiveRole === 'client';
  const isAdmin = !isClient && (['owner', 'admin'].includes(effectiveRole) || (members.length > 0 && members.every(m => m.id === user?.id)));
  const canManageTeam = isAdmin || isClient;

  // Search & Filters for User Management
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddUserPanel, setShowAddUserPanel] = useState(false);

  // Edit User Modal State
  const [editUserModal, setEditUserModal] = useState({
    open: false,
    user: null,
    fullName: '',
    email: '',
    role: 'staff',
    saving: false,
    error: '',
    success: ''
  });

  // Reset Password Modal State
  const [resetPwdModal, setResetPwdModal] = useState({
    open: false,
    user: null,
    newPassword: '',
    showPassword: true,
    saving: false,
    error: '',
    success: ''
  });

  const [copiedEmailId, setCopiedEmailId] = useState(null);
  const [copiedPwd, setCopiedPwd] = useState(false);

  // Legacy invite modal state (kept for backward compat)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', role: 'client' });
  const [inviting, setInviting] = useState(false);

  // Create user form state
  const [createForm, setCreateForm] = useState({
    fullName: '', email: '', role: 'client', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Per-row action state
  const [actioningId, setActioningId] = useState(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setOpenRoleDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [wsRes, memRes] = await Promise.all([
        api.getCurrentWorkspace(),
        api.getMembers()
      ]);
      if (wsRes.success) setWorkspace(wsRes.workspace);
      if (memRes.success) setMembers(memRes.members);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (isClient) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      await api.updateWorkspace({
        name: workspace.name,
        country: workspace.country,
        timezone: workspace.timezone,
        defaultLanguage: workspace.default_language
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Error updating workspace: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.fullName) return;
    try {
      setInviting(true);
      const res = await api.addMember(inviteForm);
      if (res.success) {
        setMembers(prev => [...prev, res.member]);
        setShowInviteModal(false);
        setInviteForm({ fullName: '', email: '', role: 'client' });
      }
    } catch (err) {
      alert('Invite error: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!canManageTeam) return;
    if (createForm.password && createForm.password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }
    setCreatingUser(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const targetRole = isClient ? 'client' : createForm.role;
      const res = await api.addMember({
        fullName: createForm.fullName,
        email: createForm.email,
        role: targetRole,
        password: createForm.password || 'TemporaryPass123!'
      });
      if (res.success) {
        setMembers(prev => [...prev, { ...res.member, is_active: true }]);
        setCreateForm({ fullName: '', email: '', role: isClient ? 'client' : 'manager', password: '' });
        setCreateSuccess(`✅ Team member "${res.member.full_name}" added successfully!`);
        setTimeout(() => setCreateSuccess(''), 6000);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to add team member. Email may already be in use.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangeRole = async (memberId, newRole, e) => {
    e?.stopPropagation();
    setOpenRoleDropdown(null);
    if (!isAdmin) return;
    setActioningId(memberId);
    try {
      const res = await api.updateMemberRole(memberId, newRole);
      if (res.success) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleActive = async (member) => {
    if (!canManageTeam) return;
    setActioningId(member.id);
    try {
      if (member.is_active) {
        await api.deactivateMember(member.id);
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: false } : m));
      } else {
        await api.reactivateMember(member.id);
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: true } : m));
      }
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!canManageTeam) return;
    setActioningId(memberId);
    setConfirmDeleteId(null);
    try {
      await api.deleteMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      alert('Failed to delete team member: ' + err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleOpenEditUser = (member) => {
    const target = member || currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' };
    setEditUserModal({
      open: true,
      user: target,
      fullName: target.full_name || target.fullName || user?.fullName || '',
      email: target.email || user?.email || '',
      role: isClient ? 'client' : (target.role || 'staff'),
      saving: false,
      error: '',
      success: ''
    });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUserModal.user) return;
    try {
      setEditUserModal(prev => ({ ...prev, saving: true, error: '', success: '' }));
      const targetRole = isClient ? 'client' : editUserModal.role;
      const res = await api.updateMember(editUserModal.user.id, {
        fullName: editUserModal.fullName,
        email: editUserModal.email,
        role: targetRole
      });
      if (res.success) {
        setMembers(prev => prev.map(m => m.id === editUserModal.user.id ? { ...m, ...res.member } : m));
        if (refreshUserData) {
          await refreshUserData();
        }
        setEditUserModal(prev => ({ ...prev, saving: false, success: 'Client details updated successfully!' }));
        setTimeout(() => {
          setEditUserModal({ open: false, user: null, fullName: '', email: '', role: 'client', saving: false, error: '', success: '' });
        }, 1200);
      }
    } catch (err) {
      setEditUserModal(prev => ({ ...prev, saving: false, error: err.message || 'Failed to update member' }));
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleOpenResetPwd = (member) => {
    const target = member || currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' };
    setResetPwdModal({
      open: true,
      user: target,
      newPassword: generateRandomPassword(),
      showPassword: true,
      saving: false,
      error: '',
      success: ''
    });
  };

  const handleSaveResetPwd = async (e) => {
    e.preventDefault();
    if (!resetPwdModal.user || !resetPwdModal.newPassword) return;
    try {
      setResetPwdModal(prev => ({ ...prev, saving: true, error: '', success: '' }));
      const res = await api.resetMemberPassword(resetPwdModal.user.id, resetPwdModal.newPassword);
      if (res.success) {
        setResetPwdModal(prev => ({ ...prev, saving: false, success: res.message || 'Password updated successfully!' }));
        setTimeout(() => {
          setResetPwdModal({ open: false, user: null, newPassword: '', showPassword: true, saving: false, error: '', success: '' });
        }, 1500);
      }
    } catch (err) {
      setResetPwdModal(prev => ({ ...prev, saving: false, error: err.message || 'Failed to reset password' }));
    }
  };

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (m.full_name && m.full_name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || m.role === roleFilter;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && m.is_active !== false) ||
        (statusFilter === 'inactive' && m.is_active === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const totalUsersCount = members.length;
  const activeUsersCount = members.filter(m => m.is_active !== false).length;
  const adminUsersCount = members.filter(m => ['owner', 'admin'].includes(m.role)).length;
  const managerStaffCount = members.filter(m => ['manager', 'staff'].includes(m.role)).length;



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#034bc0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isClient ? 'Account Settings' : 'Settings & Users'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {isClient
            ? 'Manage your account profile, personal credentials, and workspace preferences.'
            : 'Manage team members, workspace configuration, security sessions, and third-party integrations.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isClient ? 'Client Details' : 'User Management'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            isClient
              ? 'bg-emerald-100 text-emerald-800'
              : isAdmin
                ? 'bg-blue-100 text-[#034bc0]'
                : 'bg-slate-100 text-slate-500'
          }`}>
            {isClient ? 'Client' : isAdmin ? 'Admin' : 'Staff'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workspace')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Business Workspace</span>
          {isClient && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Client
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-b-2 border-[#034bc0] text-[#034bc0]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Integrations &amp; GA4</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
            Analytics
          </span>
        </button>
      </div>
      {/* Client Details (for Client) / User Management (for Admin) */}
      {activeTab === 'users' && (
        <>
          {isClient ? (
            /* ONLY Client Details */
            <div className="space-y-6">
              {/* Top Identity Hero Card (Pixel-perfect match to screenshot) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Soft Light Blue Rounded Squircle Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#dbeafe] dark:bg-blue-950/60 text-slate-900 dark:text-blue-100 flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-2xs">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                      {user?.fullName || 'Mahesh Vaishnav'}
                    </h2>

                    {/* VERIFIED CLIENT Pill Badge */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[11px] font-black uppercase tracking-wider">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a] flex items-center justify-center text-white shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>VERIFIED CLIENT</span>
                      </span>
                    </div>

                    {/* Email */}
                    <div className="pt-0.5 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold truncate">
                      <Mail className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                      <span className="truncate">{user?.email || 'maheshvaishnav78499@gmail.com'}</span>
                    </div>

                    {/* Business Location */}
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium truncate">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{workspace.name || activeBusiness?.name || 'Bhagyalaxmi Hotel & Resort'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleOpenEditUser(currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' })}
                    className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-[#034bc0] hover:bg-[#023aa0] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                    <span>Edit Name &amp; Email</span>
                  </button>

                  <button
                    onClick={() => handleOpenResetPwd(currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' })}
                    className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-[#eff6ff] hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-[#2563eb] text-[#034bc0] dark:text-blue-300 font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Key className="w-4 h-4 text-[#034bc0] dark:text-blue-300" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>

              {/* Client Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Client Account Details */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">Client Profile Details</h3>
                        <p className="text-[11px] text-slate-500">Official client credentials for this portal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEditUser(currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <span className="font-bold text-slate-500">Client Name</span>
                      <span className="font-extrabold text-slate-900">{user?.fullName || 'Mahesh Vaishnav'}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <span className="font-bold text-slate-500">Login Email</span>
                      <span className="font-bold text-slate-800 font-mono">{user?.email}</span>
                    </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Portal Role</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase text-[10px]">
                      Client Portal
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Member Since</span>
                    <span className="font-medium text-slate-700">
                      {currentUserMember?.created_at
                        ? new Date(currentUserMember.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '19 Oct 2026'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="font-bold text-slate-500">Last Login Activity</span>
                    <span className="font-medium text-slate-700">
                      {currentUserMember?.last_login_at
                        ? new Date(currentUserMember.last_login_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Active Session'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Assigned Business Workspace */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Assigned Business Location</h3>
                      <p className="text-[11px] text-slate-500">Business linked to your client dashboard</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-[#034bc0] border border-blue-200">
                    Online &amp; Synced
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Business Name</span>
                    <span className="font-extrabold text-slate-900">{workspace.name || activeBusiness?.name || 'Bhagyalaxmi Hotel & Resort'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Industry / Category</span>
                    <span className="font-bold text-slate-800">
                      {activeBusiness?.industry_id ? activeBusiness.industry_id.replace(/_/g, ' ').toUpperCase() : 'HOTEL & RESORT'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">City / Country</span>
                    <span className="font-medium text-slate-700">
                      {activeBusiness?.city || 'Udaipur'}, {workspace.country || 'India'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Google Connection</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      GBP Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="font-bold text-slate-500">Timezone</span>
                    <span className="font-medium text-slate-700">{workspace.timezone || 'Asia/Kolkata (IST)'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Subscribed Services */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Active Client Services</h3>
                      <p className="text-[11px] text-slate-500">Verified features active for your business</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Live Google Reviews</p>
                      <p className="text-[10px] text-slate-500">15m Auto-sync</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">AI Review Replies</p>
                      <p className="text-[10px] text-slate-500">1-Click approval</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Local SEO Heatmap</p>
                      <p className="text-[10px] text-slate-500">Geo-grid tracking</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Executive Briefs</p>
                      <p className="text-[10px] text-slate-500">PDF &amp; Print reports</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Personal Password & Security */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Account Password &amp; Access</h3>
                      <p className="text-[11px] text-slate-500">Your personal login credentials</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenResetPwd(currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' })}
                    className="px-3.5 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Account Password</p>
                      <p className="text-[11px] text-slate-500">Encrypted password stored securely. Change anytime.</p>
                    </div>
                    <button
                      onClick={() => handleOpenResetPwd(currentUserMember || { id: user?.id, full_name: user?.fullName, email: user?.email, role: 'client' })}
                      className="px-3.5 py-1.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    User directory management and access configuration for this workspace are managed by your administrator. Contact support for additional user licenses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full User Management ONLY for Admin */
          <div className="space-y-6">
            {!isAdmin && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <ShieldQuestion className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-amber-900">View-Only Workspace Directory</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You are viewing this workspace team directory in View-Only mode. Account creation, role assignment, and password resets are managed by <strong>Admin</strong> and <strong>Owner</strong> accounts.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Total Users</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{totalUsersCount}</p>
                <span className="text-[10px] text-slate-400 font-medium">In current workspace</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Active Status</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-2">{activeUsersCount}</p>
                <span className="text-[10px] text-slate-400 font-medium">Eligible to sign in</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Owners &amp; Admins</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{adminUsersCount}</p>
                <span className="text-[10px] text-slate-400 font-medium">Full management access</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Operations &amp; Staff</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{managerStaffCount}</p>
                <span className="text-[10px] text-slate-400 font-medium">Managers &amp; team members</span>
              </div>
            </div>

            {/* Quick Add User Panel */}
            {isAdmin && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
                <div
                  onClick={() => setShowAddUserPanel(v => !v)}
                  className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#034bc0] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        Create New Team User
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                          Instant Setup
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add a manager, staff member, or client with custom login credentials.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#034bc0] text-xs font-bold text-slate-700 hover:text-[#034bc0] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {showAddUserPanel ? 'Hide Form' : '+ Add User'}
                  </button>
                </div>

                {showAddUserPanel && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/40">
                    {createSuccess && (
                      <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{createSuccess}</span>
                      </div>
                    )}

                    {createError && (
                      <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{createError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={createForm.fullName}
                          onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                          placeholder="e.g. Ramesh Vaishnav"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:border-[#034bc0] transition"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Work Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={createForm.email}
                          onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                          placeholder="ramesh@hotelresort.com"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:border-[#034bc0] transition"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Role &amp; Permissions <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={createForm.role}
                          onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:border-[#034bc0] transition cursor-pointer"
                        >
                          <option value="manager">Manager — Reviews, Campaigns, Local SEO, Keywords</option>
                          <option value="admin">Admin — Full Workspace &amp; System Configuration</option>
                          <option value="staff">Staff — Review Inbox &amp; Response Execution</option>
                          <option value="client">Client — Client Portal, Telemetry &amp; Approval</option>
                        </select>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Initial Password <span className="text-slate-400 font-normal">(min. 8 chars)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setCreateForm(f => ({ ...f, password: generateRandomPassword() }))}
                            className="text-[11px] text-[#034bc0] hover:underline font-bold cursor-pointer"
                          >
                            Generate Strong
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={createForm.password}
                            onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                            placeholder="Create password (or leave blank for default)..."
                            className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:border-[#034bc0] transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Default fallback: <code className="text-[#034bc0] font-semibold">TemporaryPass123!</code>
                        </p>
                      </div>

                      {/* Submit Bar */}
                      <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-200">
                        <p className="text-[11px] text-slate-500">
                          Account is activated immediately upon creation.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddUserPanel(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={creatingUser || !createForm.fullName || !createForm.email}
                            className="px-5 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            {creatingUser
                              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating User...</>
                              : <><UserPlus className="w-3.5 h-3.5" /> Confirm &amp; Create User</>
                            }
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* User Directory Table Card (Only Admin) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Header + Search/Filter Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Workspace Users</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
                        {filteredMembers.length} {filteredMembers.length === 1 ? 'user' : 'users'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Active team members and accounts for <strong>{workspace.name || 'Workspace'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchSettings}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Refresh List"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                    {isAdmin && !showAddUserPanel && (
                      <button
                        onClick={() => setShowAddUserPanel(true)}
                        className="px-4 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add User</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-1">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#034bc0] focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {['all', 'owner', 'admin', 'manager', 'staff', 'client'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap cursor-pointer ${
                          roleFilter === r
                            ? 'bg-[#034bc0] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034bc0] cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Login</th>
                      <th className="py-3 px-4">Joined</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className={`hover:bg-slate-50/60 transition-colors ${!m.is_active ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        {/* Avatar + Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                              m.role === 'owner' ? 'bg-gradient-to-br from-purple-600 to-indigo-700' :
                              m.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-red-600' :
                              m.role === 'manager' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              m.role === 'staff' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                              'bg-gradient-to-br from-emerald-500 to-teal-600'
                            }`}>
                              {m.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">{m.full_name}</span>
                              {m.id === user?.id && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-md bg-blue-100 text-[#034bc0] text-[9px] font-extrabold">
                                  You (Active)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email + Copy */}
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5 group max-w-[220px]">
                            <span className="truncate">{m.email}</span>
                            <button
                              onClick={() => handleCopyEmail(m.email, m.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="Copy email"
                            >
                              {copiedEmailId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role Dropdown */}
                        <td className="py-3 px-4">
                          {isAdmin && m.id !== user?.id && m.role !== 'owner' ? (
                            <div className="relative inline-block">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenRoleDropdown(openRoleDropdown === m.id ? null : m.id); }}
                                disabled={actioningId === m.id}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer hover:opacity-80 transition ${ROLE_COLORS[m.role] || 'bg-slate-100 text-slate-600 border-slate-300'}`}
                              >
                                {m.role || 'client'}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {openRoleDropdown === m.id && (
                                <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[150px]">
                                  {ROLES.filter(r => r !== m.role && (r !== 'owner' || effectiveRole === 'owner')).map(r => (
                                    <button
                                      key={r}
                                      onClick={(e) => handleChangeRole(m.id, r, e)}
                                      className="w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 flex items-center gap-2 cursor-pointer capitalize transition"
                                    >
                                      <span className={`inline-block w-2 h-2 rounded-full ${
                                        r === 'owner' ? 'bg-purple-500' :
                                        r === 'admin' ? 'bg-rose-500' :
                                        r === 'manager' ? 'bg-amber-500' :
                                        r === 'staff' ? 'bg-blue-500' : 'bg-emerald-500'
                                      }`} />
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${ROLE_COLORS[m.role] || 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                              {m.role || 'client'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {m.is_active !== false ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              Active
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold flex items-center gap-1.5 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {m.last_login_at
                            ? new Date(m.last_login_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : <span className="text-slate-300">Never</span>}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions (Only Admin) */}
                        {isAdmin && (
                          <td className="py-3 px-4">
                            {m.id === user?.id ? (
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => handleOpenEditUser(m)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  title="Edit your profile"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenResetPwd(m)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  title="Change your password"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : confirmDeleteId === m.id ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[10px] text-rose-600 font-bold">Delete?</span>
                                <button
                                  onClick={() => handleDeleteMember(m.id)}
                                  disabled={actioningId === m.id}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => handleOpenEditUser(m)}
                                  disabled={actioningId === m.id}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  title="Edit user details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleOpenResetPwd(m)}
                                  disabled={actioningId === m.id}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                  title="Reset user password"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                {m.role !== 'owner' && (
                                  <button
                                    onClick={() => handleToggleActive(m)}
                                    disabled={actioningId === m.id}
                                    title={m.is_active !== false ? 'Suspend user account' : 'Reactivate user account'}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                      m.is_active !== false
                                        ? 'text-amber-600 hover:bg-amber-50'
                                        : 'text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {actioningId === m.id
                                      ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      : m.is_active !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />
                                    }
                                  </button>
                                )}

                                {m.role !== 'owner' && (
                                  <button
                                    onClick={() => setConfirmDeleteId(m.id)}
                                    disabled={actioningId === m.id}
                                    title="Delete user permanently"
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}

                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-xs text-slate-500">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700">No users match your filter criteria</p>
                          <p className="text-slate-400 mt-0.5">Try clearing your search query or role filter.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Permissions Reference Card (Only Admin) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#034bc0]" />
                  Role &amp; Permissions Matrix
                </h3>
                <p className="text-xs text-slate-500">Overview of capabilities granted to each user role in this workspace.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                    Owner
                  </span>
                  <p className="text-xs font-bold text-slate-900">Full Governance</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Total system control, billing subscriptions, workspace deletion, and user role authority.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                    Admin
                  </span>
                  <p className="text-xs font-bold text-slate-900">Administration</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Team creation, member role assignment, Google Business Profile links, and integration keys.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Manager
                  </span>
                  <p className="text-xs font-bold text-slate-900">Campaigns &amp; SEO</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Review campaigns, rank tracking, SEO recommendations, task assignments, and AI replies.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                    Staff
                  </span>
                  <p className="text-xs font-bold text-slate-900">Review Execution</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Reviews inbox monitoring, manual review responses, and frontline task completion.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Client
                  </span>
                  <p className="text-xs font-bold text-slate-900">Client Portal</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    View-only business telemetry, executive reports download, and 1-click review reply approvals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit User / Client Details */}
        {editUserModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#034bc0]" />
                    {isClient ? 'Edit Client Profile Details' : 'Edit User Details'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isClient
                      ? 'Update your name and primary login email address'
                      : 'Edit member account credentials and role for this workspace'}
                  </p>
                </div>
                <button
                  onClick={() => setEditUserModal({ open: false, user: null, fullName: '', email: '', role: 'client', saving: false, error: '', success: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editUserModal.success && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editUserModal.success}</span>
                </div>
              )}

              {editUserModal.error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editUserModal.error}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editUserModal.fullName}
                    onChange={e => setEditUserModal({ ...editUserModal, fullName: e.target.value })}
                    placeholder="e.g. Mahesh Vaishnav"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login Email Address</label>
                  <input
                    type="email"
                    required
                    value={editUserModal.email}
                    onChange={e => setEditUserModal({ ...editUserModal, email: e.target.value })}
                    placeholder="name@business.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Access Level</label>
                  {isClient ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Client Portal (Verified Business Access)
                    </div>
                  ) : (
                    <select
                      value={editUserModal.role}
                      onChange={e => setEditUserModal({ ...editUserModal, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#034bc0] cursor-pointer"
                    >
                      {effectiveRole === 'owner' && <option value="owner">Owner — Full Platform &amp; Workspace Ownership</option>}
                      <option value="admin">Admin — Team &amp; Workspace Administration</option>
                      <option value="manager">Manager — Reviews, Campaigns, SEO &amp; Keywords</option>
                      <option value="staff">Staff — Frontline Reviews &amp; Tasks</option>
                      <option value="client">Client — View Only Portal &amp; Telemetry</option>
                    </select>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditUserModal({ open: false, user: null, fullName: '', email: '', role: 'client', saving: false, error: '', success: '' })}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editUserModal.saving || !editUserModal.fullName || !editUserModal.email}
                    className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {editUserModal.saving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset / Update Password */}
        {resetPwdModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#034bc0] flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {isClient ? 'Update Account Password' : 'Reset User Password'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isClient
                        ? `Set a new secure password for ${user?.fullName || 'your account'}`
                        : `For ${resetPwdModal.user?.full_name || resetPwdModal.user?.email}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetPwdModal({ open: false, user: null, newPassword: '', showPassword: true, saving: false, error: '', success: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetPwdModal.success && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetPwdModal.success}</span>
                </div>
              )}

              {resetPwdModal.error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetPwdModal.error}</span>
                </div>
              )}

              <form onSubmit={handleSaveResetPwd} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">New Password (min. 8 characters)</label>
                    <button
                      type="button"
                      onClick={() => setResetPwdModal(p => ({ ...p, newPassword: generateRandomPassword() }))}
                      className="text-[11px] text-[#034bc0] hover:underline font-bold cursor-pointer"
                    >
                      Generate Random
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={resetPwdModal.showPassword ? 'text' : 'password'}
                      required
                      value={resetPwdModal.newPassword}
                      onChange={e => setResetPwdModal({ ...resetPwdModal, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-20 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(resetPwdModal.newPassword);
                          setCopiedPwd(true);
                          setTimeout(() => setCopiedPwd(false), 2000);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedPwd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetPwdModal(p => ({ ...p, showPassword: !p.showPassword }))}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Toggle visibility"
                      >
                        {resetPwdModal.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  {isClient
                    ? 'You will use this new password immediately on your next login. Keep it confidential.'
                    : 'The user will be able to log in immediately with this new password. Remember to share it securely with them.'}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetPwdModal({ open: false, user: null, newPassword: '', showPassword: true, saving: false, error: '', success: '' })}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPwdModal.saving || resetPwdModal.newPassword.length < 8}
                    className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {resetPwdModal.saving ? 'Updating Password...' : isClient ? 'Update My Password' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )}

      {/* Tab 3: Business Workspace Profile */}
      {activeTab === 'workspace' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Business Workspace Information</h3>
              <p className="text-xs text-slate-500">Primary client workspace identification, country, and regional preferences.</p>
            </div>
            {isClient && (
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Client Workspace
              </span>
            )}
          </div>

          {isClient && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#034bc0] shrink-0 mt-0.5" />
              <span>
                <strong>Managed Workspace:</strong> Your workspace profile and Google integration are actively managed for your business by Redes Creation. To update your legal business name or billing contact, please reach out to your account manager.
              </span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Workspace preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Client Business Name</label>
              <input
                type="text"
                disabled={isClient}
                required
                value={workspace.name}
                onChange={e => setWorkspace({ ...workspace, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Country / Region</label>
                <input
                  type="text"
                  disabled={isClient}
                  value={workspace.country || 'India'}
                  onChange={e => setWorkspace({ ...workspace, country: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Timezone</label>
                <input
                  type="text"
                  disabled={isClient}
                  value={workspace.timezone || 'Asia/Kolkata'}
                  onChange={e => setWorkspace({ ...workspace, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">System Language</label>
              <select
                disabled={isClient}
                value={workspace.default_language || 'en'}
                onChange={e => setWorkspace({ ...workspace, default_language: e.target.value })}
                className="w-full px-4 py-2.5 bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              >
                <option value="en">English (Global)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="hinglish">Hinglish (Colloquial)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            <div className="pt-2">
              {isClient ? (
                <div className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 inline-flex">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Settings Locked (Agency Managed)</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Workspace Info'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Security & Sessions */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Security &amp; Authentication</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your client session is protected with encrypted JWT authentication and multi-tenant PostgreSQL database isolation.
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Session Security Details:</span>
            <ul className="text-xs text-slate-600 space-y-1 font-medium list-disc list-inside">
              <li>Tenant Workspace ID: <code className="text-[#034bc0] font-mono text-[11px] font-bold">{user?.workspaceId}</code></li>
              <li>User Role: <span className="font-bold text-emerald-700 uppercase">{user?.role || 'Client'}</span></li>
              <li>Token Expiration: 7 Days with auto-renewal</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 5: Integrations & Google Analytics 4 */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Google Analytics 4 (GA4) Integration
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Connected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized via Google OAuth 2.0 with read-only reporting access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/website-analytics"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  Open Website Analytics Dashboard →
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Connected Account</span>
                <span className="font-extrabold text-slate-900 block truncate">agency.analytics@redescreation.com</span>
                <span className="text-[10px] text-emerald-600 font-semibold">● OAuth 2.0 Token Valid</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active GA4 Property</span>
                <span className="font-extrabold text-slate-900 block truncate">Bhagyalaxmi Hotel Official (389271625)</span>
                <span className="text-[10px] text-slate-500">Stream: Web | Asia/Kolkata</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security &amp; Storage</span>
                <span className="font-extrabold text-slate-900 block truncate">AES-256-GCM Encrypted</span>
                <span className="text-[10px] text-slate-500">Tokens never sent to frontend</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Scope: <code>https://www.googleapis.com/auth/analytics.readonly</code></span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/website-analytics"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Change Property
                </a>
              </div>
            </div>
          </div>

          {/* Search Console & Local SEO Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Search Console Integration</h4>
                  <p className="text-xs text-slate-500">Query impressions, average organic positions, and click-through rates.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Optional Add-on
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Invite Modal (Agency Only) */}
      {showInviteModal && !isClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#034bc0]" /> Invite Client Team Member
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={inviteForm.fullName}
                onChange={e => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="rahul@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034bc0]"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#034bc0] font-bold">
              User will be invited with full <strong>Client</strong> role permissions to manage reviews, local SEO, campaigns, and reports.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={inviting || !inviteForm.email || !inviteForm.fullName}
                className="px-4 py-2.5 bg-[#034bc0] hover:bg-[#023aa0] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {inviting ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
