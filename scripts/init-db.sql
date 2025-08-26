-- Create databases for different services
CREATE DATABASE ai_video_interview_main;
CREATE DATABASE ai_video_interview_test;
CREATE DATABASE ai_video_interview_user;

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

\c ai_video_interview_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable extensions for user-service database
\c ai_video_interview_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
