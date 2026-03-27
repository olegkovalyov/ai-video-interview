-- =============================================================================
-- AI Video Interview Platform - Database Initialization
-- Creates all service databases with required extensions
-- Usage: psql -U postgres -f init-db.sql
-- =============================================================================

-- User Service databases
CREATE DATABASE ai_video_interview_user;
CREATE DATABASE ai_video_interview_user_test;

-- Interview Service databases
CREATE DATABASE ai_video_interview_interview;
CREATE DATABASE ai_video_interview_interview_test;

-- AI Analysis Service databases
CREATE DATABASE ai_video_interview_analysis;
CREATE DATABASE ai_video_interview_analysis_test;

-- Enable extensions for each database

\c ai_video_interview_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_user_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_interview;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_interview_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_analysis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c ai_video_interview_analysis_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
