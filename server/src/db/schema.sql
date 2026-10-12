-- Redes Creation SaaS Database Schema
-- PostgreSQL 14+ compatible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    default_language VARCHAR(50) DEFAULT 'en',
    plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, agency, enterprise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'owner', -- owner, admin, manager, staff, client
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLIENTS (Agency / Client Portal support)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. INDUSTRIES TAXONOMY
CREATE TABLE IF NOT EXISTS industries (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    default_topics JSONB DEFAULT '[]'::jsonb,
    default_tone VARCHAR(50) DEFAULT 'Professional',
    compliance_rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS industry_subcategories (
    id VARCHAR(100) PRIMARY KEY,
    industry_id VARCHAR(100) REFERENCES industries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    suggested_services JSONB DEFAULT '[]'::jsonb,
    suggested_keywords JSONB DEFAULT '[]'::jsonb
);

-- 5. BUSINESS LOCATIONS
CREATE TABLE IF NOT EXISTS business_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    industry_id VARCHAR(100) REFERENCES industries(id) ON DELETE SET NULL,
    subcategory_id VARCHAR(100),
    business_model VARCHAR(50) DEFAULT 'storefront', -- storefront, service_area, multi_location, chain, hybrid
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(50),
    latitude NUMERIC(10, 7) DEFAULT 23.0225,
    longitude NUMERIC(10, 7) DEFAULT 72.5714,
    phone VARCHAR(50),
    website TEXT,
    service_areas JSONB DEFAULT '[]'::jsonb,
    is_primary BOOLEAN DEFAULT FALSE,
    health_score NUMERIC(5, 2) DEFAULT 85.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BUSINESS INTELLIGENCE PROFILE
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE REFERENCES business_locations(id) ON DELETE CASCADE,
    identity VARCHAR(255),
    description TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    customer_personas JSONB DEFAULT '[]'::jsonb,
    brand_voice VARCHAR(50) DEFAULT 'Professional', -- Professional, Friendly, Premium, Warm, Concise, Custom
    languages JSONB DEFAULT '["en"]'::jsonb, -- en, hi, hinglish
    approved_claims JSONB DEFAULT '[]'::jsonb,
    restricted_claims JSONB DEFAULT '[]'::jsonb,
    target_keywords JSONB DEFAULT '[]'::jsonb,
    excluded_keywords JSONB DEFAULT '[]'::jsonb,
    reply_rules JSONB DEFAULT '{"auto_reply_5_star": true, "auto_reply_4_star": true, "draft_3_star": true, "manual_approval_1_2_star": true}'::jsonb,
    escalation_rules JSONB DEFAULT '{"notify_manager_on_1_star": true, "require_approval_sensitive": true}'::jsonb,
    compliance_rules JSONB DEFAULT '[]'::jsonb,
    knowledge_base JSONB DEFAULT '[]'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. GOOGLE BUSINESS PROFILE CONNECTIONS
CREATE TABLE IF NOT EXISTS google_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    account_email VARCHAR(255),
    account_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'connected', -- connected, expired, disconnected, error
    sync_frequency VARCHAR(50) DEFAULT 'daily', -- hourly, daily, manual
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. GOOGLE LOCATIONS MAPPINGS
CREATE TABLE IF NOT EXISTS google_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_connection_id UUID REFERENCES google_connections(id) ON DELETE CASCADE,
    business_id UUID UNIQUE REFERENCES business_locations(id) ON DELETE SET NULL,
    gbp_location_id VARCHAR(255) NOT NULL,
    gbp_place_id VARCHAR(255),
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    primary_category VARCHAR(255),
    secondary_categories JSONB DEFAULT '[]'::jsonb,
    phone VARCHAR(50),
    website TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    sync_status VARCHAR(50) DEFAULT 'synced',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8B. GOOGLE BUSINESS PROFILE LOCAL POSTS & UPDATES
CREATE TABLE IF NOT EXISTS google_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    google_location_id UUID REFERENCES google_locations(id) ON DELETE SET NULL,
    gbp_post_id VARCHAR(255),
    topic_type VARCHAR(50) DEFAULT 'STANDARD', -- STANDARD, EVENT, OFFER, ALERT
    summary TEXT NOT NULL,
    action_type VARCHAR(50), -- BOOK, ORDER, SHOP, LEARN_MORE, SIGN_UP, CALL
    action_url TEXT,
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'published', -- draft, scheduled, published, failed
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. REVIEWS & REVIEW INTELLIGENCE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    google_location_id UUID REFERENCES google_locations(id) ON DELETE SET NULL,
    gbp_review_id VARCHAR(255) UNIQUE,
    author_name VARCHAR(255) NOT NULL,
    author_photo_url TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sentiment VARCHAR(50) DEFAULT 'neutral', -- positive, neutral, negative
    sentiment_score NUMERIC(5, 2) DEFAULT 0.0,
    detected_topics JSONB DEFAULT '[]'::jsonb,
    detected_keywords JSONB DEFAULT '[]'::jsonb,
    priority VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
    reply_status VARCHAR(50) DEFAULT 'unanswered', -- unanswered, draft, pending_approval, replied, auto_replied
    is_sensitive BOOLEAN DEFAULT FALSE,
    recurring_complaint VARCHAR(255),
    recurring_praise VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. REVIEW RESPONSES & AI APPROVAL QUEUE
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    response_options JSONB DEFAULT '[]'::jsonb,
    tone VARCHAR(50) DEFAULT 'Professional',
    generated_by_ai BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    safety_check_status VARCHAR(50) DEFAULT 'pass', -- pass, warning, block
    safety_check_details JSONB DEFAULT '{"fact_check": "passed", "tone_check": "passed", "repetition_check": "passed", "sensitive_data_check": "passed", "unsupported_claims_check": "passed"}'::jsonb,
    audit_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. REVIEW CAMPAIGNS & FEEDBACK (Defined in sections 28 & 29 below with full schema)

-- 13. KEYWORD GROUPS & KEYWORDS
CREATE TABLE IF NOT EXISTS keyword_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT '#6366f1',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    group_id UUID REFERENCES keyword_groups(id) ON DELETE SET NULL,
    keyword VARCHAR(255) NOT NULL,
    intent VARCHAR(50) DEFAULT 'local', -- local, commercial, service, informational, brand, competitor, near_me
    relevance INTEGER DEFAULT 90,
    difficulty INTEGER DEFAULT 35,
    search_volume INTEGER DEFAULT 1200,
    current_rank INTEGER,
    previous_rank INTEGER,
    best_rank INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'approved', -- approved, suggested, rejected
    opportunity_score INTEGER DEFAULT 80,
    opportunity_reason TEXT,
    last_tracked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keyword_rank_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    visibility_score NUMERIC(5, 2) DEFAULT 0.0,
    competitor_ranks JSONB DEFAULT '[]'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. GEO-GRID RANK TRACKING
CREATE TABLE IF NOT EXISTS geo_grids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
    keyword VARCHAR(255) NOT NULL,
    grid_size INTEGER DEFAULT 5, -- 3x3, 5x5, 7x7
    radius_km NUMERIC(5, 2) DEFAULT 5.0,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    visibility_percentage NUMERIC(5, 2) DEFAULT 72.5,
    average_rank NUMERIC(5, 2) DEFAULT 3.4,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geo_grid_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geo_grid_id UUID REFERENCES geo_grids(id) ON DELETE CASCADE,
    row_idx INTEGER NOT NULL,
    col_idx INTEGER NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    rank INTEGER NOT NULL,
    top_competitors JSONB DEFAULT '[]'::jsonb,
    is_ranking BOOLEAN DEFAULT TRUE
);

-- 15. COMPETITOR INTELLIGENCE
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    place_id VARCHAR(255),
    website TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.3,
    review_count INTEGER DEFAULT 180,
    review_velocity NUMERIC(5, 2) DEFAULT 6.5, -- reviews per month
    categories JSONB DEFAULT '[]'::jsonb,
    visibility_score NUMERIC(5, 2) DEFAULT 65.0,
    review_themes JSONB DEFAULT '[]'::jsonb,
    keyword_overlap JSONB DEFAULT '[]'::jsonb,
    keyword_gaps JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. LOCAL SEO AUDIT & CHECKS
CREATE TABLE IF NOT EXISTS seo_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 82,
    gbp_score INTEGER DEFAULT 88,
    local_signals_score INTEGER DEFAULT 75,
    content_score INTEGER DEFAULT 80,
    review_score INTEGER DEFAULT 85,
    status VARCHAR(50) DEFAULT 'completed', -- running, completed, failed
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seo_audit_id UUID REFERENCES seo_audits(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- gbp, categories, services, description, photos, posts, reviews, nap
    check_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'passed', -- passed, warning, failed
    severity VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
    evidence TEXT,
    why_it_matters TEXT,
    recommendation TEXT,
    is_task_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. AI RECOMMENDATIONS & OPPORTUNITIES
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'seo_audit', -- seo_audit, reviews, keywords, competitors, geo_grid
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence TEXT,
    why_it_matters TEXT,
    expected_impact VARCHAR(255),
    confidence_score INTEGER DEFAULT 92,
    priority VARCHAR(50) DEFAULT 'high', -- critical, high, medium, low
    suggested_action TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, dismissed, converted_to_task
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. TASKS & ACTION MANAGEMENT
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'manual', -- reviews, seo_audit, recommendations, competitors, keywords, manual
    priority VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, completed
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. NOTIFICATIONS & ALERTS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 1_star_review, 2_star_review, negative_sentiment, unanswered_review, google_error, rating_drop, ranking_drop, competitor_change, recurring_complaint, seo_issue
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'executive', -- executive, seo, reviews, competitors, campaign, custom
    date_range_start DATE,
    date_range_end DATE,
    summary_data JSONB DEFAULT '{}'::jsonb,
    ai_executive_summary TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. SUBSCRIPTIONS (defined in section 25 below)

-- 22. AI PROMPT VERSIONS & GENERATIONS
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(100) NOT NULL,
    industry_id VARCHAR(100) DEFAULT 'all',
    version VARCHAR(50) NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    safety_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) DEFAULT 'v1.0',
    input_context JSONB DEFAULT '{}'::jsonb,
    output_content TEXT,
    model_name VARCHAR(100) DEFAULT 'gemini-1.5-pro',
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC(8, 6) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. SYSTEM JOBS MONITOR
CREATE TABLE IF NOT EXISTS system_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL, -- review_sync, rank_tracking, geo_grid_scan, seo_audit, ai_auto_reply, alert_dispatch
    status VARCHAR(50) DEFAULT 'completed', -- pending, running, completed, failed
    items_processed INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_businesses_workspace ON business_locations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_reply_status ON reviews(reply_status);
CREATE INDEX IF NOT EXISTS idx_keywords_business ON keywords(business_id);
CREATE INDEX IF NOT EXISTS idx_keywords_rank ON keywords(current_rank);
CREATE INDEX IF NOT EXISTS idx_geogrids_business ON geo_grids(business_id);
CREATE INDEX IF NOT EXISTS idx_competitors_business ON competitors(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);

-- 25. SUBSCRIPTIONS (Billing Plans)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'starter',
    status VARCHAR(50) DEFAULT 'active',
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    locations_limit INTEGER DEFAULT 1,
    reviews_limit INTEGER DEFAULT 100,
    ai_generations_limit INTEGER DEFAULT 50,
    keywords_limit INTEGER DEFAULT 10,
    geo_grids_limit INTEGER DEFAULT 5,
    current_locations INTEGER DEFAULT 0,
    current_reviews INTEGER DEFAULT 0,
    current_ai_generations INTEGER DEFAULT 0,
    current_keywords INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. PAYMENT METHODS
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    last4 VARCHAR(100),
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    billing_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'Paid',
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    billing_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days')::date,
    payment_method VARCHAR(100) DEFAULT 'UPI / Card',
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. REVIEW CAMPAIGNS (QR & Feedback Funnels)
CREATE TABLE IF NOT EXISTS review_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    website VARCHAR(500),
    phone VARCHAR(100),
    services JSONB DEFAULT '[]'::jsonb,
    channel VARCHAR(50) DEFAULT 'qr',
    message_template TEXT,
    target_audience TEXT,
    review_link TEXT,
    qr_code_data TEXT,
    google_review_url TEXT,
    post_review_enabled BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active',
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    feedback_started_count INTEGER DEFAULT 0,
    destination_clicked_count INTEGER DEFAULT 0,
    attributed_reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. REVIEW FEEDBACK (Customer Submissions)
CREATE TABLE IF NOT EXISTS review_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES review_campaigns(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(100),
    rating INTEGER DEFAULT 5,
    service_experienced VARCHAR(255),
    feedback_text TEXT,
    themes_selected JSONB DEFAULT '[]'::jsonb,
    proceeded_to_google BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. BUSINESS SERVICES CATALOG (Section 13)
CREATE TABLE IF NOT EXISTS business_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price_estimate VARCHAR(100),
    is_gbp_synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. COMPETITOR SNAPSHOTS (Section 13)
CREATE TABLE IF NOT EXISTS competitor_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    rating NUMERIC(3, 2),
    review_count INTEGER,
    visibility_score NUMERIC(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. PERFORMANCE DAILY AGGREGATES (Section 13)
CREATE TABLE IF NOT EXISTS performance_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reviews_count INTEGER DEFAULT 0,
    avg_rating NUMERIC(3, 2) DEFAULT 0.0,
    sentiment_positive INTEGER DEFAULT 0,
    sentiment_negative INTEGER DEFAULT 0,
    searches_impressions INTEGER DEFAULT 0,
    maps_directions INTEGER DEFAULT 0,
    phone_calls INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, date)
);

-- 33. REPORT SCHEDULES (Section 13)
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE CASCADE,
    frequency VARCHAR(50) DEFAULT 'monthly', -- weekly, monthly, quarterly
    recipients JSONB DEFAULT '[]'::jsonb,
    report_type VARCHAR(50) DEFAULT 'executive',
    last_sent_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34. USAGE RECORDS (Section 13)
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    metric VARCHAR(100) NOT NULL, -- ai_generations, geo_scans, reviews_processed, reports_exported
    quantity INTEGER DEFAULT 1,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. API LOGS & TELEMETRY (Section 13 & 18)
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_locations(id) ON DELETE SET NULL,
    service VARCHAR(100) NOT NULL, -- google_gbp, openai, gemini, razorpay
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) DEFAULT 'POST',
    status_code INTEGER DEFAULT 200,
    duration_ms INTEGER DEFAULT 0,
    request_payload JSONB,
    response_payload JSONB,
    tokens_used INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_logs_workspace ON api_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_service ON api_logs(service);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);

