#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔍 DATABASE CHECK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if user exists
if [ ! -f /tmp/test-user-id.txt ]; then
  echo -e "${YELLOW}⚠️  No active test user. Run 01-create-user.sh first${NC}"
  KEYCLOAK_ID=""
else
  KEYCLOAK_ID=$(cat /tmp/test-user-id.txt)
  echo -e "${GREEN}Active test user: $KEYCLOAK_ID${NC}"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 USERS TABLE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📥 INBOX TABLE (last 5)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
SELECT 
  message_id, 
  event_type, 
  status, 
  created_at,
  processed_at
FROM inbox 
ORDER BY created_at DESC 
LIMIT 5;"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📤 OUTBOX TABLE (last 5)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
SELECT 
  event_id, 
  event_type, 
  status, 
  created_at,
  published_at
FROM outbox 
ORDER BY created_at DESC 
LIMIT 5;"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 STATISTICS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
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
