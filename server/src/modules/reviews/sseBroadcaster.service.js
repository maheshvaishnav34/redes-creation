/**
 * Redes Creation — Real-Time Server-Sent Events (SSE) Broadcaster
 * Streams real-time sync status, review ingestion, and progress updates to connected dashboards.
 * Strict multi-tenant isolation: Events are scoped strictly by workspaceId and businessId.
 */

class SSEBroadcasterService {
  constructor() {
    // Map of key `${workspaceId}:${businessId}` -> Set of client response objects
    this.clients = new Map();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  /**
   * Start a keep-alive heartbeat ping every 25s to prevent timeouts through proxies/browsers
   */
  startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      this.broadcastAll('heartbeat', { timestamp: new Date().toISOString() });
    }, 25000);
  }

  /**
   * Register a new SSE client
   */
  addClient(workspaceId, businessId, res, req) {
    if (!workspaceId) return;
    const key = `${workspaceId}:${businessId || 'all'}`;

    if (!this.clients.has(key)) {
      this.clients.set(key, new Set());
    }

    const clientSet = this.clients.get(key);
    clientSet.add(res);

    // Initial connection acknowledgement
    res.write(`event: connected\ndata: ${JSON.stringify({
      connected: true,
      workspaceId,
      businessId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Clean up when client disconnects
    req.on('close', () => {
      clientSet.delete(res);
      if (clientSet.size === 0) {
        this.clients.delete(key);
      }
    });
  }

  /**
   * Broadcast an event strictly to clients of a specific workspace and business
   */
  broadcast(workspaceId, businessId, event, data) {
    if (!workspaceId) return;

    const specificKey = `${workspaceId}:${businessId}`;
    const allKey = `${workspaceId}:all`;

    const payload = `event: ${event}\ndata: ${JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    })}\n\n`;

    const recipients = new Set([
      ...(this.clients.get(specificKey) || []),
      ...(this.clients.get(allKey) || [])
    ]);

    recipients.forEach(res => {
      try {
        res.write(payload);
      } catch (err) {
        console.warn('[SSE_BROADCASTER] Failed to write to client:', err.message);
      }
    });
  }

  /**
   * Broadcast global heartbeat to all active connections
   */
  broadcastAll(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [_, clientSet] of this.clients.entries()) {
      clientSet.forEach(res => {
        try {
          res.write(payload);
        } catch {
          // ignore closed connections
        }
      });
    }
  }

  /**
   * Helper: Broadcast sync status change
   */
  broadcastSyncStatus(workspaceId, businessId, statusData) {
    this.broadcast(workspaceId, businessId, 'sync_status', statusData);
  }

  /**
   * Helper: Broadcast incremental progress during pagination
   */
  broadcastSyncProgress(workspaceId, businessId, progressData) {
    this.broadcast(workspaceId, businessId, 'sync_progress', progressData);
  }

  /**
   * Helper: Broadcast new review ingested
   */
  broadcastReviewIngested(workspaceId, businessId, reviewData) {
    this.broadcast(workspaceId, businessId, 'review_ingested', reviewData);
  }
}

export const sseBroadcaster = new SSEBroadcasterService();
export default sseBroadcaster;
