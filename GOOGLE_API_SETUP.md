# Google Cloud Platform & Business Profile API Setup Guide

This guide details the step-by-step procedure required by the project owner to obtain Google API credentials, enable required Business Profile APIs, configure OAuth 2.0 consent, set up Google Cloud Pub/Sub, and ensure compliance with Google's third-party policies.

---

## 1. Architectural Distinction: Business Profile API vs Places API

| Dimension | Google Business Profile API (OAuth 2.0) | Google Places API (API Key) |
| :--- | :--- | :--- |
| **Authentication** | OAuth 2.0 Authorization Code flow with user consent | API Key passed via header or query parameter |
| **Required Scope** | `https://www.googleapis.com/auth/business.manage` | None (server-to-server with API key restriction) |
| **Review Volume** | **Full Historical Review History** via cursor pagination (`pageSize=50`) | **Max 5 reviews** (publicly curated by Google algorithm) |
| **Owner Replies** | ✅ Can draft, post, edit, and delete owner replies | ❌ Read-only public preview; replies cannot be posted |
| **Notifications** | ✅ Real-time push via Google Cloud Pub/Sub | ❌ No webhook or push notifications supported |
| **Account Access** | Location manager or owner permission required on Google Account | Any public business searchable on Google Maps |
| **Compliance & Storage** | Transient streaming / 30-day cache; no perpetual raw redistribution | Caching restricted to 30 days; strict Google attribution required |

---

## 2. Google Cloud Console Setup (Step-by-Step)

### Step 1: Create or Select a Google Cloud Project
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and click **New Project**.
3. Name your project (e.g., `hotel-review-saas-prod`) and link your billing account.

### Step 2: Enable Required Google APIs
In the Google Cloud Console, navigate to **APIs & Services > Library** and enable each of the following:
1. **Google My Business API / Business Profile APIs**:
   - `My Business Account Management API` (`mybusinessaccountmanagement.googleapis.com`)
   - `My Business Business Information API` (`mybusinessbusinessinformation.googleapis.com`)
   - `My Business Q&A API` (`mybusinessqanda.googleapis.com`)
2. **Places API (New)** or **Places API**:
   - Used for Place ID resolution and Google Maps shortlinks.
3. **Cloud Pub/Sub API**:
   - `pubsub.googleapis.com` (for real-time review notification events).

> [!IMPORTANT]
> **Google Business Profile API Approval**:
> Unlike standard Google Cloud APIs, Google requires third-party SaaS applications to apply for access to the Business Profile API.
> Submit your application via the official [Google Business Profile API Access Request Form](https://developers.google.com/my-business/content/prereqs#request-access).
> Until approved, you can test with Google Accounts designated as **Test Users** on your OAuth consent screen.

### Step 3: Configure the OAuth 2.0 Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in required App Information:
   - **App name**: `Hotel Review SaaS`
   - **User support email**: Your support email
   - **Developer contact information**: Your technical email
4. **Scopes**: Add the following scope:
   - `https://www.googleapis.com/auth/business.manage`
5. **Test users**: While in "Testing" mode, add the Google email addresses of the hotel managers who will test the integration.

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
2. Select **Web application**.
3. Set **Name**: `Hotel Review SaaS Web Client`.
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (Development)
   - `https://yourdomain.com` (Production)
5. Add **Authorized redirect URIs**:
   - `http://localhost:5000/api/google/callback` (Local Development)
   - `https://yourdomain.com/api/google/callback` (Production)
6. Click **Create** and safely copy your `Client ID` and `Client Secret` into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
   ```

### Step 5: Generate Google Places API Key
1. Go to **APIs & Services > Credentials > Create Credentials > API key**.
2. Restrict the API key:
   - Under **API restrictions**, select **Restrict key** and check **Places API**.
   - Under **Application restrictions**, set IP addresses (for backend server) or HTTP referrers.
3. Save the key in your `.env`:
   ```env
   GOOGLE_PLACES_API_KEY=AIzaSy...
   ```

---

## 3. Real-Time Review Push Notifications (Google Cloud Pub/Sub)

If your Google Business Profile account has notifications enabled:
1. Go to **Cloud Pub/Sub > Topics > Create Topic**:
   - Topic ID: `gbp-review-notifications`
2. Grant publisher permissions to the Google Business Profile notification service account:
   - Principal: `mybusiness-api-pubsub@system.gserviceaccount.com`
   - Role: `Pub/Sub Publisher`
3. Create a **Push Subscription**:
   - Push endpoint: `https://yourdomain.com/api/webhooks/google-pubsub`
   - Delivery type: `Push`
4. When a guest leaves or updates a review on Google, Pub/Sub dispatches an HTTP POST payload to `/api/webhooks/google-pubsub`, which validates the location, enqueues an authoritative background fetch job, and dispatches an instant SSE update to all connected dashboard clients.

---

## 4. Google Policies & Attribution Compliance Checklist

- [x] **No HTML Scraping**: Uses exclusively official Google APIs (`googleapis`, REST endpoints).
- [x] **Attribution**: Displays required "Powered by Google" badges and links back to the original Google Maps review.
- [x] **Data Retention**: Employs `Cache-Control: no-store` on live endpoints and does not create an unauthorized permanent raw mirror of Google Maps data.
- [x] **SSRF Protection**: Strict host allowlisting (`search.google.com`, `maps.google.com`, `g.page`, `maps.app.goo.gl`) and rejection of private/loopback IP addresses.
- [x] **Token Security**: OAuth refresh tokens are encrypted at rest using AES-256-GCM and never exposed to browser clients.
