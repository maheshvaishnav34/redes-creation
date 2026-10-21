/**
 * Redes Creation — Google Analytics 4 Report Export Service
 * 
 * Generates client-ready CSV and structured executive summary data for PDF/print export.
 */

export class GoogleAnalyticsExportService {
  /**
   * Generates a clean CSV export for traffic acquisition and channels
   */
  generateAcquisitionCsv(acquisitionData, propertyName, dateRange) {
    const headers = ['Channel Group', 'Sessions', 'Users', 'Engaged Sessions', 'Engagement Rate (%)', 'Avg Duration', 'Total Events', 'Key Events', 'Top Source'];
    const rows = (acquisitionData.channels || []).map(c => [
      `"${c.channel}"`,
      c.sessions,
      c.users,
      c.engagedSessions,
      `${c.engagementRate}%`,
      `"${c.avgDuration}"`,
      c.eventCount,
      c.keyEvents,
      `"${c.topSource}"`
    ]);

    const csvLines = [
      `# Redes Creation Website Analytics Report`,
      `# Property: ${propertyName || 'All Properties'}`,
      `# Date Range: ${dateRange}`,
      `# Exported At: ${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Generates a clean CSV export for landing pages
   */
  generateLandingPagesCsv(pagesData, propertyName, dateRange) {
    const headers = ['Page Path', 'Page Title', 'Sessions', 'Active Users', 'Page Views', 'Engagement Rate (%)', 'Avg Duration', 'Key Events', 'Bounce Rate (%)'];
    const rows = (pagesData.pages || []).map(p => [
      `"${p.pagePath}"`,
      `"${(p.pageTitle || '').replace(/"/g, '""')}"`,
      p.sessions,
      p.activeUsers,
      p.screenPageViews,
      `${p.engagementRate}%`,
      `"${p.avgDuration}"`,
      p.keyEvents,
      `${p.bounceRate}%`
    ]);

    const csvLines = [
      `# Redes Creation Website Landing Pages Report`,
      `# Property: ${propertyName || 'All Properties'}`,
      `# Date Range: ${dateRange}`,
      `# Exported At: ${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Generates structured executive report object
   */
  buildExecutiveSummary({ property, overview, acquisition, landingPages, leadAnalytics, insights, localSeoSynergy }) {
    return {
      reportTitle: `Website Intelligence & Local SEO Executive Summary`,
      property: property || {},
      generatedAt: new Date().toISOString(),
      reportingPeriod: overview?.dateRange?.range || '30d',
      executiveSummary: `During this period, the website logged ${overview?.kpis?.sessions?.current?.toLocaleString() || 0} sessions from ${overview?.kpis?.activeUsers?.current?.toLocaleString() || 0} active users, with an engagement rate of ${overview?.kpis?.engagementRate?.current || 0}%. A total of ${leadAnalytics?.totalLeads || 0} high-intent lead actions were recorded, led by click-to-call phone conversions.`,
      kpiSummary: overview?.kpis || {},
      topChannels: acquisition?.channels || [],
      topPages: (landingPages?.pages || []).slice(0, 5),
      leadBreakdown: leadAnalytics?.leadEvents || [],
      keyInsights: insights || [],
      localSeoSynergy: localSeoSynergy || {}
    };
  }
}

export const ga4ExportService = new GoogleAnalyticsExportService();
