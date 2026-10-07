const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const getHeaders = () => {
  const token = localStorage.getItem('redes_token');
  const workspaceId = localStorage.getItem('redes_workspace_id');
  const businessId = localStorage.getItem('redes_business_id');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (workspaceId) headers['x-workspace-id'] = workspaceId;
  if (businessId) headers['x-business-id'] = businessId;

  return headers;
};

async function request(url, options = {}) {
  const headers = { ...getHeaders(), ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  
  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    localStorage.removeItem('redes_token');
    window.location.href = '/login';
    throw new Error('Session expired, please login again.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Workspaces
  getCurrentWorkspace: () => request('/workspaces/current'),
  updateWorkspace: (payload) => request('/workspaces/current', { method: 'PUT', body: JSON.stringify(payload) }),
  getMembers: () => request('/workspaces/members'),
  addMember: (payload) => request('/workspaces/members', { method: 'POST', body: JSON.stringify(payload) }),
  updateMemberRole: (id, role) => request(`/workspaces/members/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  getClients: () => request('/workspaces/clients'),
  createClient: (payload) => request('/workspaces/clients', { method: 'POST', body: JSON.stringify(payload) }),

  // Business & Onboarding
  getIndustries: () => request('/business/industries'),
  listBusinesses: () => request('/business/list'),
  getBusinessProfile: (id) => request(`/business/${id || 'current/profile'}`),
  updateBusinessProfile: (id, payload) => request(`/business/${id}/profile`, { method: 'PUT', body: JSON.stringify(payload) }),
  submitOnboarding: (payload) => request('/business/onboarding', { method: 'POST', body: JSON.stringify(payload) }),

  // Google Business Profile
  getGoogleStatus: () => request('/google/status'),
  connectGoogle: (payload) => request('/google/connect', { method: 'POST', body: JSON.stringify(payload || {}) }),
  syncGoogleNow: () => request('/google/sync', { method: 'POST' }),
  disconnectGoogle: () => request('/google/disconnect', { method: 'POST' }),
  getGooglePerformance: () => request('/google/performance'),

  // Reviews & AI Replies
  listReviews: (params = '') => request(`/reviews${params}`),
  getReviewById: (id) => request(`/reviews/${id}`),
  getReviewFeedback: (id) => request(`/reviews/${id}/feedback`),
  analyzeReview: (id) => request(`/reviews/${id}/analyze`, { method: 'POST' }),
  reanalyzeReview: (id) => request(`/reviews/${id}/reanalyze`, { method: 'POST' }),
  getReviewsAnalytics: (params = '') => request(`/reviews/analytics${params}`),
  getReviewsInsights: (params = '') => request(`/reviews/insights${params}`),
  generateReviewResponse: (id, payload) => request(`/reviews/${id}/generate-response`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  generateAIReply: (id, payload) => request(`/reviews/${id}/generate-reply`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  approveAndPublishReply: (id, payload) => request(`/reviews/${id}/approve`, { method: 'POST', body: JSON.stringify(payload || {}) }),

  // Campaigns
  listCampaigns: () => request('/campaigns'),
  getCampaignById: (id) => request(`/campaigns/${id}`),
  createCampaign: (payload) => request('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  duplicateCampaign: (id) => request(`/campaigns/${id}/duplicate`, { method: 'POST' }),
  updateCampaign: (id, payload) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateCampaignStatus: (id, status) => request(`/campaigns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
  getCampaignFeedbacks: (id) => request(`/campaigns/${id}/feedbacks`),
  getPublicCampaign: (slug) => request(`/campaigns/public/${slug}`),
  submitFeedback: (payload) => request('/campaigns/public/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  trackCampaignEvent: (campaignIdOrPayload, eventType, metadata) => {
    const body = typeof campaignIdOrPayload === 'object'
      ? campaignIdOrPayload
      : { campaignId: campaignIdOrPayload, eventType, metadata };
    return request('/campaigns/public/event', { method: 'POST', body: JSON.stringify(body) });
  },
  autoPostReview: (payload) => request('/campaigns/public/auto-post-review', { method: 'POST', body: JSON.stringify(payload) }),
  listQrCodes: () => request('/campaigns/qr-codes'),
  saveQrCode: (payload) => request('/campaigns/qr-codes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteQrCode: (id) => request(`/campaigns/qr-codes/${id}`, { method: 'DELETE' }),
  listCustomers: (params = '') => request(`/campaigns/customers${params}`),
  createCustomer: (payload) => request('/campaigns/customers', { method: 'POST', body: JSON.stringify(payload) }),
  importCustomers: (customers) => request('/campaigns/customers/import', { method: 'POST', body: JSON.stringify({ customers }) }),
  deleteCustomer: (id) => request(`/campaigns/customers/${id}`, { method: 'DELETE' }),
  getCampaignAnalyticsOverview: () => request('/campaigns/analytics/overview'),
  generateAiCampaignMessage: (payload) => request('/campaigns/ai-message', { method: 'POST', body: JSON.stringify(payload) }),

  // Keywords & Rank Tracking
  listKeywords: (params = '') => request(`/keywords${params}`),
  addKeyword: (payload) => request('/keywords', { method: 'POST', body: JSON.stringify(payload) }),
  approveKeywordSuggestion: (payload) => request('/keywords/approve-suggestion', { method: 'POST', body: JSON.stringify(payload) }),
  deleteKeyword: (id) => request(`/keywords/${id}`, { method: 'DELETE' }),
  updateKeyword: (id, payload) => request(`/keywords/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  togglePrimaryKeyword: (id) => request(`/keywords/${id}/primary`, { method: 'PUT' }),
  getKeywordHistory: (id) => request(`/keywords/${id}/history`),
  discoverKeywordSuggestions: () => request('/keywords/suggestions/discover'),

  // Geo-Grid
  getLatestGeoGrid: (params = '') => request(`/geo-grid/latest${params}`),
  runGeoGridScan: (payload) => request('/geo-grid/scan', { method: 'POST', body: JSON.stringify(payload) }),

  // Competitors
  listCompetitors: () => request('/competitors'),
  discoverCompetitors: () => request('/competitors/discover'),
  addCompetitor: (payload) => request('/competitors', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCompetitor: (id) => request(`/competitors/${id}`, { method: 'DELETE' }),
  getCompetitorComparison: () => request('/competitors/comparison'),

  // SEO Audit & Recommendations
  getSeoAudit: () => request('/seo/audit'),
  getLatestSeoAudit: () => request('/seo/audit'),
  runSeoAudit: () => request('/seo/audit/run', { method: 'POST' }),
  getReviewSeoIntelligence: () => request('/seo/review-intelligence'),
  listRecommendations: (params = '') => request(`/seo/recommendations${params}`),
  convertRecommendationToTask: (id, payload) => request(`/seo/recommendations/${id}/convert-to-task`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  createTaskFromAudit: (id, payload) => request('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  // Tasks
  listTasks: (params = '') => request(`/tasks${params}`),
  createTask: (payload) => request('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTaskStatus: (id, payload) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // AI Orchestrator & Approval
  getApprovalQueue: () => request('/ai/approval-queue'),
  approveAiAction: (id, payload) => request(`/ai/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  rejectAiAction: (id, payload) => request(`/ai/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  chatAssistant: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  listAiGenerations: () => request('/ai/generations'),

  // Analytics & Dashboard
  getAnalyticsOverview: () => request('/analytics/overview'),

  // Reports
  listReports: () => request('/reports'),
  generateReport: (payload) => request('/reports/generate', { method: 'POST', body: JSON.stringify(payload) }),
  getReportById: (id) => request(`/reports/${id}`),

  // Billing
  getSubscription: () => request('/billing'),
  upgradePlan: (payload) => request('/billing/upgrade', { method: 'POST', body: JSON.stringify(payload) }),
  listInvoices: () => request('/billing/invoices'),
  getInvoiceDownloadUrl: (id) => `/api/v1/billing/invoices/${id}/download?token=${localStorage.getItem('redes_token') || ''}`,
  listPaymentMethods: () => request('/billing/payment-methods'),
  addPaymentMethod: (payload) => request('/billing/payment-methods', { method: 'POST', body: JSON.stringify(payload) }),
  deletePaymentMethod: (id) => request(`/billing/payment-methods/${id}`, { method: 'DELETE' }),
  setDefaultPaymentMethod: (id) => request(`/billing/payment-methods/${id}/default`, { method: 'PATCH' }),
  getAdminBillingOverview: () => request('/billing/admin/overview'),
  adminUpdateSubscription: (workspaceId, payload) => request(`/billing/admin/subscriptions/${workspaceId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminCreateInvoice: (payload) => request('/billing/admin/invoices', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  listNotifications: (params = '') => request(`/notifications${params}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  dismissNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminHealth: () => request('/admin/health'),
  getAdminAuditLogs: () => request('/admin/audit-logs'),
  getAdminPrompts: () => request('/admin/prompts'),
  listAdminWorkspaces: () => request('/admin/workspaces'),
  toggleWorkspaceStatus: (id) => request(`/admin/workspaces/${id}/toggle-status`, { method: 'PUT' }),

  // Automation & Background Jobs (Section 15)
  getAutomationStatus: () => request('/automation/status'),
  getJobHistory: (params = '') => request(`/automation/history${params}`),
  triggerJobRun: (jobType, payload = {}) => request(`/automation/jobs/${jobType}/run`, { method: 'POST', body: JSON.stringify(payload) }),
  triggerAllJobs: (payload = {}) => request('/automation/run-all', { method: 'POST', body: JSON.stringify(payload) })
};
