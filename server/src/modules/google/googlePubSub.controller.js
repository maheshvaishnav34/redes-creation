import { query } from '../../config/db.js';
import { reviewSyncQueue } from '../reviews/reviewSync.queue.js';
import { sseBroadcaster } from '../reviews/sseBroadcaster.service.js';

/**
 * Google Cloud Pub/Sub Webhook Receiver for Google Business Profile Review Notifications
 * 
 * Endpoint: POST /api/webhooks/google-pubsub
 * 
 * Protocol:
 * 1. Google Cloud Pub/Sub pushes JSON: { message: { data: "base64...", messageId: "..." }, subscription: "..." }
 * 2. Decodes base64 payload: { eventType: "NEW_REVIEW"|"UPDATED_REVIEW", account: "...", location: "..." }
 * 3. Maps location to authorized tenant & hotel business in DB.
 * 4. Enqueues a synchronization job with the background worker to fetch authoritative data.
 * 5. Returns 200/204 to acknowledge Pub/Sub delivery.
 */
export const handleGooglePubSubNotification = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !message.data) {
      // Return 200 to acknowledge invalid push so Pub/Sub does not spam retries indefinitely
      return res.status(200).json({ received: true, ignored: true, reason: 'Empty or malformed Pub/Sub payload' });
    }

    let decodedPayload = {};
    try {
      const rawString = Buffer.from(message.data, 'base64').toString('utf-8');
      decodedPayload = JSON.parse(rawString);
    } catch {
      return res.status(200).json({ received: true, ignored: true, reason: 'Failed to parse JSON payload' });
    }

    console.log('📬 [GOOGLE_PUB_SUB] Received notification event:', decodedPayload);

    const { eventType, location, account, reviewId } = decodedPayload;
    const cleanLocation = location ? location.replace(/^locations\//, '') : null;

    if (!cleanLocation) {
      return res.status(200).json({ received: true, ignored: true, reason: 'No location identifier found in event' });
    }

    // Map location to workspace and business_location
    const locRes = await query(
      `SELECT gl.id, gl.business_id, bl.workspace_id, bl.name as hotel_name
       FROM google_locations gl
       JOIN business_locations bl ON gl.business_id = bl.id
       WHERE gl.gbp_location_id = $1 OR gl.gbp_location_id = $2 OR gl.gbp_place_id = $1
       LIMIT 1`,
      [cleanLocation, `locations/${cleanLocation}`]
    );

    if (locRes.rows.length === 0) {
      console.warn(`[GOOGLE_PUB_SUB] Location ${cleanLocation} not associated with any active tenant hotel.`);
      return res.status(200).json({ received: true, unmapped: true, location: cleanLocation });
    }

    const { business_id, workspace_id, hotel_name } = locRes.rows[0];

    // Trigger SSE Notification to connected dashboard clients
    sseBroadcaster.broadcast(workspace_id, 'google_pubsub_event', {
      eventType: eventType || 'REVIEW_UPDATE',
      hotelId: business_id,
      hotelName: hotel_name,
      message: `Google review update received for ${hotel_name}. Queueing authoritative fetch...`,
      timestamp: new Date().toISOString()
    });

    // Queue authoritative review synchronization job
    const jobResult = await reviewSyncQueue.addSyncJob({
      businessId: business_id,
      workspaceId: workspace_id,
      syncType: 'webhook',
      priority: 'high'
    });

    console.log(`✅ [GOOGLE_PUB_SUB] Queued authoritative sync job ${jobResult.jobId} for ${hotel_name}`);

    // Google Cloud Pub/Sub expects 200 or 204 to confirm receipt
    return res.status(200).json({
      received: true,
      acknowledged: true,
      jobId: jobResult.jobId,
      hotelId: business_id
    });
  } catch (err) {
    console.error('❌ [GOOGLE_PUB_SUB] Error processing notification:', err);
    // Acknowledge with 200 to prevent message redelivery cascades, log error
    return res.status(200).json({ received: true, error: err.message });
  }
};
