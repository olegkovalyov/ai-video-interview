-- ============================================
-- INITIAL DATABASE SETUP
-- Создаём только необходимые базы данных
-- Runs automatically when PostgreSQL container starts for the first time
-- ============================================

-- Create databases only if they don't exist
SELECT 'CREATE DATABASE ai_video_interview_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_video_interview_user')\gexec

SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_user TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO postgres;

-- Log success
\echo ''
\echo '============================================'
\echo '✅ DATABASE INITIALIZATION COMPLETED!'
\echo '============================================'
\echo ''
\echo 'Created databases:'
\echo '  ✅ ai_video_interview_user - for User Service'
\echo '  ✅ keycloak - for Keycloak authentication'
\echo ''
\echo 'NOT created (will be added when needed):'
\echo '  ⏳ ai_video_interview_interview - Interview Service (Day 5+)'
\echo '  ⏳ ai_video_interview_notification - Notification Service (future)'
\echo ''
