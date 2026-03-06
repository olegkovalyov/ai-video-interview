#!/bin/bash

# =============================================================================
# Database Check: Show current state of users, inbox, outbox tables
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "DATABASE CHECK"

# Check if user exists
if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_warn "No active test user. Run 01-create-user.sh first"
else
  KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
  log_success "Active test user: $KEYCLOAK_ID"
fi

header "USERS TABLE"
run_sql_display "ai_video_interview_user" "
SELECT
  email,
  first_name,
  last_name,
  status,
  deleted_at,
  created_at,
  updated_at
FROM users
WHERE email = 'testuser@example.com';"

header "INBOX TABLE (last 5)"
run_sql_display "ai_video_interview_user" "
SELECT
  message_id,
  event_type,
  status,
  created_at,
  processed_at
FROM inbox
ORDER BY created_at DESC
LIMIT 5;"

header "OUTBOX TABLE (last 5)"
run_sql_display "ai_video_interview_user" "
SELECT
  event_id,
  event_type,
  status,
  created_at,
  published_at
FROM outbox
ORDER BY created_at DESC
LIMIT 5;"

header "STATISTICS"
run_sql_display "ai_video_interview_user" "
SELECT
  'INBOX' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM inbox
UNION ALL
SELECT
  'OUTBOX' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as processed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM outbox;"
