-- Create databases for different services
CREATE DATABASE ai_video_interview_main;
CREATE DATABASE ai_video_interview_test;
CREATE DATABASE ai_video_interview_user;
CREATE DATABASE ai_video_interview_interview;

-- Create users for services (optional, for production)
-- CREATE USER api_gateway_user WITH PASSWORD 'api_gateway_pass';
-- CREATE USER user_service_user WITH PASSWORD 'user_service_pass';
-- CREATE USER interview_service_user WITH PASSWORD 'interview_service_pass';

-- Grant permissions (optional, for production)
-- GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_main TO api_gateway_user;
-- GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_main TO user_service_user;
-- GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_main TO interview_service_user;

-- Enable UUID extension
\c ai_video_interview_main;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_interview;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create processed_events table in each service database
\c ai_video_interview_user;
CREATE TABLE IF NOT EXISTS processed_events (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payload_hash VARCHAR(64),
    CONSTRAINT unique_event_per_service UNIQUE (event_id, service_name)
);
CREATE INDEX idx_processed_events_event_id ON processed_events (event_id);
CREATE INDEX idx_processed_events_service_name ON processed_events (service_name);
CREATE INDEX idx_processed_events_processed_at ON processed_events (processed_at);

\c ai_video_interview_interview;
CREATE TABLE IF NOT EXISTS processed_events (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payload_hash VARCHAR(64),
    CONSTRAINT unique_event_per_service UNIQUE (event_id, service_name)
);
CREATE INDEX idx_processed_events_event_id ON processed_events (event_id);
CREATE INDEX idx_processed_events_service_name ON processed_events (service_name);
CREATE INDEX idx_processed_events_processed_at ON processed_events (processed_at);
