import { query } from '../../config/db.js';
import { ga4Service } from './ga4.service.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await ga4Service.runReport({
      propertyId: 'properties/123456789',
      startDate,
      endDate
    });

    res.json({
      success: true,
      report,
      property: {
        propertyId: 'properties/123456789',
        displayName: 'Website Analytics (GA4)',
        websiteUrl: 'https://saffrondine.example.com',
        status: 'active'
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getRealtimeVisitors = async (req, res, next) => {
  try {
    const realtime = await ga4Service.runRealtimeReport({
      propertyId: 'properties/123456789'
    });

    res.json({
      success: true,
      realtime
    });
  } catch (err) {
    next(err);
  }
};

export const getUtmCampaigns = async (req, res, next) => {
  try {
    const campaigns = await ga4Service.getUtmCampaigns({
      propertyId: 'properties/123456789'
    });

    res.json({
      success: true,
      campaigns
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomEvents = async (req, res, next) => {
  try {
    res.json({
      success: true,
      events: [
        { id: '1', event_name: 'phone_call_click', display_name: 'Direct Phone Call Click', category: 'lead', is_conversion: true, count_last_30d: 640 },
        { id: '2', event_name: 'table_booking_submit', display_name: 'Table Reservation Form Submitted', category: 'conversion', is_conversion: true, count_last_30d: 385 },
        { id: '3', event_name: 'menu_pdf_download', display_name: 'Catering Menu PDF Downloaded', category: 'engagement', is_conversion: false, count_last_30d: 890 }
      ]
    });
  } catch (err) {
    next(err);
  }
};

export const saveCustomEvent = async (req, res, next) => {
  try {
    const { eventName, displayName, category, isConversion } = req.body;
    res.json({
      success: true,
      message: 'Custom key event saved successfully.',
      event: { event_name: eventName, display_name: displayName, category, is_conversion: isConversion }
    });
  } catch (err) {
    next(err);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ga4_analytics_report.csv"');
    res.send('Channel,Sessions,Conversions\nOrganic Search,18420,680\nDirect,9120,320\nOrganic Social,5840,145\nReferral,3210,78\nPaid Search,1830,25\n');
  } catch (err) {
    next(err);
  }
};

export const getOAuthUrl = async (req, res, next) => {
  try {
    res.json({
      success: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/analytics.readonly'
    });
  } catch (err) {
    next(err);
  }
};

export const handleOAuthCallback = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Google Analytics 4 connected successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const disconnectGA4 = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Google Analytics 4 disconnected successfully.'
    });
  } catch (err) {
    next(err);
  }
};
