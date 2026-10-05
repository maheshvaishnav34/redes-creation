import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, 
  Trash2, Check, ArrowRight, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filterRead]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const param = filterRead === 'unread' ? '?isRead=false' : (filterRead === 'read' ? '?isRead=true' : '');
      const res = await api.listNotifications(param);
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Critical</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1"><Info className="w-3 h-3" /> Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">Low</span>;
    }
  };

  const getTargetLink = (type) => {
    if (type?.includes('review')) return '/reviews';
    if (type?.includes('rank') || type?.includes('keyword')) return '/keywords';
    if (type?.includes('geo')) return '/geo-grid';
    if (type?.includes('seo') || type?.includes('audit')) return '/seo';
    if (type?.includes('competitor')) return '/competitors';
    return '/dashboard';
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Connecting to Real-time Notification Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Alert Center & Intelligence Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time triggers for 1-star complaints, rank movements, auto-reply safeguards, and SEO health.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkAsRead('all')}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Read / Unread Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'read', label: 'Archived' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterRead(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterRead === tab.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Priority:
          </span>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                filterPriority === p
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Notifications in this filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your system is running smoothly with no pending alerts requiring urgent action.
            </p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !notif.is_read
                  ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {!notif.is_read ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block mt-1.5"></span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(notif.priority)}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    {notif.business_name && (
                      <span className="text-[11px] text-slate-400">
                        • {notif.business_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {notif.message}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Link
                  to={getTargetLink(notif.type)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-sm shadow-indigo-600/20"
                >
                  Inspect <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(notif.id)}
                  title="Dismiss notification"
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
