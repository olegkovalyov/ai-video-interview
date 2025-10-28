-- ============================================
-- DATABASE CLEANUP SCRIPT
-- Удаляем все ненужные базы данных
-- ============================================

-- Отключаем активные соединения к базам которые будем удалять
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname IN (
    'ai_video_interview',
    'ai_video_interview_interview',
    'ai_video_interview_main',
    'ai_video_interview_test'
)
AND pid <> pg_backend_pid();

-- Удаляем ненужные базы
DROP DATABASE IF EXISTS ai_video_interview;
DROP DATABASE IF EXISTS ai_video_interview_interview;
DROP DATABASE IF EXISTS ai_video_interview_main;
DROP DATABASE IF EXISTS ai_video_interview_test;

-- Показываем что осталось
\echo '============================================'
\echo 'CLEANUP COMPLETED!'
\echo '============================================'
\echo ''
\echo 'Remaining databases:'
\l

\echo ''
\echo '✅ Should keep:'
\echo '  - postgres (system)'
\echo '  - keycloak (for Keycloak auth)'
\echo '  - ai_video_interview_user (for user-service)'
\echo ''
\echo '⏳ Will create later:'
\echo '  - ai_video_interview_interview (when interview-service is ready)'
