-- Create databases for different services
CREATE DATABASE ai_video_interview_user;
CREATE DATABASE ai_video_interview_user_test;
CREATE DATABASE ai_video_interview_interview;
CREATE DATABASE ai_video_interview_interview_test;

-- Enable UUID extension

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
