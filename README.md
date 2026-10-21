# Production Multi-Tenant Hotel Review SaaS Platform

A production-ready, multi-tenant Hotel Review SaaS platform built with Node.js, Express, PostgreSQL, Prisma ORM, BullMQ with Redis, Server-Sent Events (SSE), and a modern React dashboard inspired by Google Maps Reviews.

---

## 🚀 Key Architectural Capabilities

- **Strict Multi-Tenant Isolation**: Independent workspace scoping on 100% of hotel properties, reviews, connections, and background sync jobs. Verified with zero cross-tenant data leaks.
- **Official Google Business Profile OAuth 2.0**: Full historical review pagination (`pageSize=50`), cursor-based iterations (`nextPageToken`), AES-256 encrypted refresh token storage, and secure revocation.
- **Google Places API Integration**: Add hotels via Google Maps URLs or Place IDs, protected by bulletproof SSRF defenses (blocking private IPs and invalid hostnames) and clear disclosure of Places API 5-review limits.
- **Dedicated Sync Worker & Queue (Dual-Mode)**:
  - **BullMQ + Redis**: Distributed worker with exponential backoff (5 retries) and concurrency controls.
  - **In-Process Fallback**: Seamless, crash-free execution when developing locally without Redis.
- **Real-Time Dashboard Streaming (SSE)**: Per-tenant Server-Sent Events stream (`GET /api/events`) with 25-second keepalive heartbeats and live telemetry updates.
- **Google Cloud Pub/Sub Webhooks**: Webhook receiver (`POST /api/webhooks/google-pubsub`) for real-time review notification events.
- **Google Maps Styled Dashboard**:
  - Overall average rating & 5-star distribution bars.
  - Search by reviewer name and review text.
  - Filter by star ratings (5, 4, 3, 2, 1 stars).
  - Live sync telemetry monitor with manual "Sync Now" trigger.
  - AI-assisted review analysis and draft responses.
- **Containerization**: Complete Docker & Docker Compose setup (`postgres`, `redis`, `api`, `client`).

---

## 🛠️ Technology Stack

- **Backend**: Node.js 22 (ES Modules) with Express.js
- **Database**: PostgreSQL 16 with Prisma ORM & `pg` connection pool
- **Background Queue**: BullMQ with Redis (with in-process fallback)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Real-Time**: Server-Sent Events (SSE)
- **Security**: Helmet, rate limiting, AES-256-GCM token encryption, SSRF protection
- **Containerization**: Docker & Docker Compose

---

## 📋 REST API Endpoints (Section 11 Specification)

### Authentication
- `POST /api/auth/register` — Register new hotel owner/agency account & workspace.
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `POST /api/auth/logout` — Clear session cookies.
- `GET /api/auth/me` — Return authenticated user profile and active workspace.

### Google Business Profile OAuth
- `GET /api/google/connect` — Initiate Google OAuth 2.0 authorization code flow.
- `GET /api/google/callback` — OAuth redirect handler; securely stores encrypted refresh token.
- `GET /api/google/status` — Return Google connection status and quota health.
- `GET /api/google/accounts` — List authorized Google Business Profile accounts.
- `GET /api/google/accounts/:accountId/locations` — List locations under an authorized account.
- `POST /api/google/disconnect` — Revoke Google tokens and disconnect integration.

### Hotel Management (Tenant-Scoped)
- `GET /api/hotels` — List hotel properties in the authenticated workspace.
- `POST /api/hotels` — Create a new hotel property.
- `POST /api/hotels/maps-link` — Register hotel using Google Maps URL or Place ID.
- `GET /api/hotels/:id` — Retrieve hotel details and connection metadata.
- `DELETE /api/hotels/:id` — Delete hotel property and associated records.
- `POST /api/hotels/:id/sync` — Queue review synchronization job with worker.

### Reviews & Analytics
- `GET /api/hotels/:id/reviews` — Paginated reviews with search and star rating filter.
- `GET /api/hotels/:id/review-summary` — 5-star rating breakdown and fetched vs Google counts.
- `GET /api/hotels/:id/sync-status` — Real-time synchronization telemetry and error status.

### Real-Time & Webhooks
- `GET /api/events` — Server-Sent Events stream for live dashboard telemetry.
- `POST /api/webhooks/google-pubsub` — Google Cloud Pub/Sub webhook push receiver.

### Administration
- `GET /api/admin/tenants` — Super-admin listing of all system tenants.
- `GET /api/admin/sync-health` — System-wide sync health, error rates, and queue metrics.

---

## 🏃 Quickstart Guide

### Option A: Local Development (Bare Metal)

1. **Clone and Install**:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` in `server`:
   ```bash
   cp server/.env.example server/.env
   ```
   Fill in your PostgreSQL `DATABASE_URL` and `JWT_SECRET`.

3. **Run Database Migrations & Seeds**:
   ```bash
   cd server
   npm run migrate
   ```

4. **Start the Application**:
   ```bash
   # Terminal 1: Backend Server (Port 5000)
   cd server
   npm run dev

   # Terminal 2: Frontend Client (Port 5173)
   cd client
   npm run dev
   ```

---

### Option B: Docker Compose (Full Stack with PostgreSQL & Redis)

1. **Copy root configuration**:
   ```bash
   cp .env.example .env
   ```

2. **Build and Start Containers**:
   ```bash
   docker compose up --build -d
   ```

3. **Verify Container Health**:
   ```bash
   docker compose ps
   ```

4. Access the application:
   - **Frontend Dashboard**: `http://localhost` (Port 80)
   - **Backend API**: `http://localhost:5000/api`
   - **Health Endpoint**: `http://localhost:5000/health`

---

## 🧪 Automated Test Suite

Run the full automated compliance and security test suite:

```bash
cd server

# 1. Master SaaS Architectural Compliance Test Suite
node --test test/master_saas_compliance.test.js

# 2. Strict Multi-Client Isolation Verification
node test/verify_strict_isolation.js

# 3. Real-Time Review Sync & SSE Telemetry Test
node test/test_realtime_sync_sse.js

# 4. Standard API Regression Suite
npm test
```

---

## 🔒 Security & Compliance

- **No Unauthorized Scraping**: Strictly compliant with Google Terms of Service; uses official APIs.
- **Tenant Isolation**: Row-level query parameterization and middleware verification ensure complete isolation.
- **SSRF Immunity**: Prohibits private subnets (`127.0.0.1`, `10.*`, `172.16.*`, `192.168.*`, `169.254.*`, `::1`).
- **Token Protection**: Refresh tokens encrypted with AES-256-GCM at rest; never transmitted to frontend clients.
- **Policy Attribution**: Enforces "Powered by Google" badges and links back to official Google Maps locations.
