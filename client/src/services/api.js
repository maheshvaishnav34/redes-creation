export const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
  let res;
  try {
    res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  } catch (netErr) {
    throw new Error('Network error: Unable to reach backend server. Please check your connection.');
  }
  
  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    localStorage.removeItem('redes_token');
    window.location.href = '/login';
    throw new Error('Session expired, please login again.');
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status}). Backend may be restarting, please try again.`);
    }
    throw new Error('Invalid response received from server.');
  }

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
  updateMember: (id, payload) => request(`/workspaces/members/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetMemberPassword: (id, newPassword) => request(`/workspaces/members/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  deactivateMember: (id) => request(`/workspaces/members/${id}/deactivate`, { method: 'PATCH' }),
  reactivateMember: (id) => request(`/workspaces/members/${id}/reactivate`, { method: 'PATCH' }),
  deleteMember: (id) => request(`/workspaces/members/${id}`, { method: 'DELETE' }),
  getClients: () => request('/workspaces/clients'),
  createClient: (payload) => request('/workspaces/clients', { method: 'POST', body: JSON.stringify(payload) }),

  // Business & Onboarding
  getIndustries: () => request('/industries'),
  listBusinesses: () => request('/businesses/list'),
  getBusinessProfile: (id) => request(`/businesses/${id || 'current/profile'}`),
  updateBusinessProfile: (id, payload) => request(`/businesses/${id}/profile`, { method: 'PUT', body: JSON.stringify(payload) }),
  submitOnboarding: (payload) => request('/businesses/onboarding', { method: 'POST', body: JSON.stringify(payload) }),
  aiEnrichBusiness: (payload) => request('/business/ai-enrich', { method: 'POST', body: JSON.stringify(payload) }),


  // Multi-Location Architecture (Section 14 & 19)
  listLocations: () => request('/locations'),
  getLocationById: (id) => request(`/locations/${id}`),
  createLocation: (payload) => request('/locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocation: (id, payload) => request(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getLocationPerformance: (id) => request(`/locations/${id}/performance`),
  deleteLocation: (id) => request(`/locations/${id}`, { method: 'DELETE' }),

  // Multi-Tenant Hotel Management & Dual Connection (OAuth + Maps Link / Place ID)
  listHotels: () => request('/hotels'),
  createHotel: (payload) => request('/hotels', { method: 'POST', body: JSON.stringify(payload) }),
  connectHotelOAuth: (id) => request(`/hotels/${id}/connect-google`, { method: 'POST' }),
  addHotelPlace: (id, payload) => request(`/hotels/${id}/add-place`, { method: 'POST', body: JSON.stringify(payload) }),
  getHotelReviews: (id, params = '') => request(`/hotels/${id}/reviews${params ? (params.startsWith('?') ? params : '?' + params) : ''}`),
  syncHotelReviews: (id) => request(`/hotels/${id}/sync`, { method: 'POST' }),
  disconnectHotelConnection: (id) => request(`/hotels/${id}/connection`, { method: 'DELETE' }),

  // Google Business Profile
  getGoogleStatus: () => request('/google/status'),
  getGoogleAuthUrl: () => request('/google/auth-url'),
  connectGoogle: (payload) => request('/google/connect', { method: 'POST', body: JSON.stringify(payload || {}) }),
  syncGoogleNow: () => request('/google/sync', { method: 'POST' }),
  disconnectGoogle: () => request('/google/disconnect', { method: 'POST' }),
  getGooglePerformance: () => request('/google/performance'),
  discoverGoogleLocations: () => request('/google/discover-locations'),
  mapGoogleLocation: (payload) => request('/google/map-location', { method: 'POST', body: JSON.stringify(payload) }),
  listGooglePosts: () => request('/google/posts'),
  createGooglePost: (payload) => request('/google/posts', { method: 'POST', body: JSON.stringify(payload) }),
  getBusinessGoogleReviewUrl: (businessId) => request(businessId ? `/google/review-url/${businessId}` : '/google/review-url'),
  updateBusinessGoogleReviewUrl: (businessId, payload) => request(businessId ? `/google/review-url/${businessId}` : '/google/review-url', { method: 'PUT', body: JSON.stringify(payload) }),
  getGoogleReviewQr: (businessId, format = 'json') => request(businessId ? `/google/review-qr/${businessId}?format=${format}` : `/google/review-qr?format=${format}`),
  getGoogleSyncHistory: (businessId) => request(businessId ? `/google/sync-history/${businessId}` : '/google/sync-history'),
  getPublicBusinessReviewUrl: (businessId) => request(businessId ? `/campaigns/public/review-url/${businessId}` : '/campaigns/public/review-url'),

  // Reviews & AI Replies
  getGoogleLiveReviews: (params = '') => request(`/reviews/google-live${params ? (params.startsWith('?') ? params : '?' + params) : ''}`),
  searchGooglePlaces: (q) => request(`/reviews/search-places?q=${encodeURIComponent(q)}`),
  syncRealGoogleReviews: (payload = {}) => request('/reviews/sync-real', { method: 'POST', body: JSON.stringify(payload) }),
  syncGoogleNow: (payload = {}) => request('/reviews/sync-real', { method: 'POST', body: JSON.stringify(payload) }),
  getGoogleSyncTelemetry: (businessId) => request(businessId ? `/reviews/sync-telemetry?businessId=${businessId}` : '/reviews/sync-telemetry'),
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
  addTrackedKeyword: (payload) => request('/keywords', { method: 'POST', body: JSON.stringify(payload) }),

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
  getLiveKeywordSuggestions: (q) => request(`/keywords/live-suggest?q=${encodeURIComponent(q)}`),
  autoSeedKeywords: (payload) => request('/keywords/auto-seed', { method: 'POST', body: JSON.stringify(payload || {}) }),
  getKeywordEvolutionStatus: () => request('/keywords/evolution-status'),
  triggerWeeklyKeywordEvolution: (payload) => request('/keywords/evolve-weekly', { method: 'POST', body: JSON.stringify(payload || {}) }),
  getFlywheelSummary: () => request('/keywords/flywheel'),

  // Geo-Grid
  getLatestGeoGrid: (params = '') => request(`/geo-grid/latest${params}`),
  runGeoGridScan: (payload) => request('/geo-grid/scan', { method: 'POST', body: JSON.stringify(payload) }),
  getGeoGridHistory: (params = '') => request(`/geo-grid/history${params}`),
  getGeoGridPointDetails: (pointId) => request(`/geo-grid/point/${pointId}`),
  getGeoGridProviders: () => request('/geo-grid/providers'),

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
  getMapsGrowthEngine: () => request('/seo/growth-engine'),
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
  generateAiCampaign: (payload) => request('/ai/generate-campaign', { method: 'POST', body: JSON.stringify(payload) }),

  // Analytics & Dashboard
  getAnalyticsOverview: () => request('/analytics/overview'),

  // Reports
  listReports: () => request('/reports'),
  generateReport: (payload) => request('/reports/generate', { method: 'POST', body: JSON.stringify(payload) }),
  getReportById: (id) => request(`/reports/${id}`),
  listReportSchedules: () => request('/reports/schedules'),
  createReportSchedule: (payload) => request('/reports/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  deleteReportSchedule: (id) => request(`/reports/schedules/${id}`, { method: 'DELETE' }),

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
  listAdminLocations: () => request('/admin/locations'),
  createAdminLocation: (payload) => request('/admin/locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminLocation: (id, payload) => request(`/admin/locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAdminLocation: (id) => request(`/admin/locations/${id}`, { method: 'DELETE' }),

  // Automation & Background Jobs (Section 15)
  getAutomationStatus: () => request('/automation/status'),
  getJobHistory: (params = '') => request(`/automation/history${params}`),
  triggerJobRun: (jobType, payload = {}) => request(`/automation/jobs/${jobType}/run`, { method: 'POST', body: JSON.stringify(payload) }),
  triggerAllJobs: (payload = {}) => request('/automation/run-all', { method: 'POST', body: JSON.stringify(payload) }),

  // Google Trends Intelligence Pro
  getTrendExplore: (params = '') => request(`/trends/explore${params}`),
  getTrendCompare: (params = '') => request(`/trends/compare${params}`),
  getEmergingTrends: (geo = 'IN') => request(`/trends/emerging?geo=${geo}`),
  getTrendRegions: (params = '') => request(`/trends/regions${params}`),
  getYouTubeTrends: (params = '') => request(`/trends/youtube${params}`),
  getTrendForecast: (params = '') => request(`/trends/forecast${params}`),
  generateTrendAiInsights: (payload) => request('/trends/ai-insights', { method: 'POST', body: JSON.stringify(payload) }),
  getTrendWatchlists: () => request('/trends/watchlists'),
  addTrendWatchlist: (payload) => request('/trends/watchlists', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTrendWatchlist: (id) => request(`/trends/watchlists/${id}`, { method: 'DELETE' }),
  getTrendContentIdeas: () => request('/trends/content-ideas'),
  createTrendContentIdea: (payload) => request('/trends/content-ideas', { method: 'POST', body: JSON.stringify(payload) }),

  // Google Analytics 4 (GA4) & Website Intelligence
  getAnalyticsOverview: () => request('/analytics/overview'),
  getGa4Connections: () => request('/analytics/connections'),
  getGa4ConnectUrl: (businessId) => request(`/analytics/connect${businessId ? `?businessId=${businessId}` : ''}`),
  handleGa4OAuthCallback: (code, state) => request(`/analytics/oauth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`),
  getGa4Accounts: (connectionId) => request(`/analytics/accounts${connectionId ? `?connectionId=${connectionId}` : ''}`),
  selectGa4Property: (payload) => request('/analytics/properties/select', { method: 'POST', body: JSON.stringify(payload) }),
  getGa4Properties: () => request('/analytics/properties'),
  getGa4OverviewReport: (propertyId, dateRange = '30d', refresh = false) => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    if (refresh) params.append('refresh', 'true');
    return request(`/analytics/report/overview?${params.toString()}`);
  },
  getGa4Acquisition: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/acquisition?${params.toString()}`);
  },
  getGa4LandingPages: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/landing-pages?${params.toString()}`);
  },
  getGa4LeadAnalytics: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/leads?${params.toString()}`);
  },
  getGa4GeographyDevices: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/geography-devices?${params.toString()}`);
  },
  getGa4Insights: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/insights?${params.toString()}`);
  },
  getGa4LocalSeoSynergy: (propertyId, businessId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (businessId) params.append('businessId', businessId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/local-seo-synergy?${params.toString()}`);
  },
  syncGa4Now: (propertyId, dateRange = '30d') => request('/analytics/sync', { method: 'POST', body: JSON.stringify({ propertyId, dateRange }) }),
  exportGa4Report: (payload) => request('/analytics/export', { method: 'POST', body: JSON.stringify(payload) }),
  disconnectGa4Connection: (id) => request(`/analytics/connections/${id}`, { method: 'DELETE' }),

  // Real-Time, Campaigns, Custom Events, & Alerts
  getGa4Realtime: (propertyId) => request(`/analytics/report/realtime${propertyId ? `?propertyId=${propertyId}` : ''}`),
  getGa4Campaigns: (propertyId, dateRange = '30d') => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (dateRange) params.append('dateRange', dateRange);
    return request(`/analytics/report/campaigns?${params.toString()}`);
  },
  getGa4EventConfigs: (propertyId) => request(`/analytics/events/configs${propertyId ? `?propertyId=${propertyId}` : ''}`),
  saveGa4EventConfig: (payload) => request('/analytics/events/configs', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGa4EventConfig: (id) => request(`/analytics/events/configs/${id}`, { method: 'DELETE' }),
  getGa4AlertRules: (propertyId) => request(`/analytics/alerts${propertyId ? `?propertyId=${propertyId}` : ''}`),
  createGa4AlertRule: (payload) => request('/analytics/alerts', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGa4AlertRule: (id) => request(`/analytics/alerts/${id}`, { method: 'DELETE' }),

  // Multi-Tenant Hotel Property Management & Live Review Endpoints
  listHotels: () => request('/hotels'),
  createHotel: (payload) => request('/hotels', { method: 'POST', body: JSON.stringify(payload) }),
  connectHotelOAuth: (id) => request(`/hotels/${id}/connect-oauth`),
  addHotelPlace: (id, payload) => request(`/hotels/${id}/places`, { method: 'POST', body: JSON.stringify(payload) }),
  getHotelReviews: (id, query = '') => request(`/hotels/${id}/reviews${query ? `?${query}` : ''}`),
  syncHotelReviews: (id) => request(`/hotels/${id}/sync`, { method: 'POST' }),
  disconnectHotelConnection: (id) => request(`/hotels/${id}/disconnect`, { method: 'DELETE' })
};
