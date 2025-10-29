#!/bin/bash

API_GATEWAY="http://localhost:8001"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🗑️  STEP 5: DELETE USER${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f /tmp/test-user-id.txt ]; then
  echo -e "${RED}❌ User ID not found. Run 01-create-user.sh first${NC}"
  exit 1
fi

KEYCLOAK_ID=$(cat /tmp/test-user-id.txt)
echo "Using Keycloak ID: $KEYCLOAK_ID"
echo ""

DELETE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}")

echo "$DELETE_RESPONSE" | jq .

echo ""
echo -e "${GREEN}✅ User deleted${NC}"
echo ""
echo "⏳ Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.deleted event"
echo "2. User Service logs - INBOX processing + DeleteUserCommand"
echo "3. PostgreSQL:"
echo "   SELECT * FROM inbox WHERE event_type = 'user.deleted' ORDER BY created_at DESC LIMIT 1;"
echo "   SELECT email, status, deleted_at, updated_at FROM users WHERE email = 'testuser@example.com';"
echo "   SELECT * FROM outbox WHERE event_type = 'user.deleted' ORDER BY created_at DESC LIMIT 1;"
echo ""
echo -e "${BLUE}🎯 EXPECTED: status='deleted', deleted_at IS NOT NULL${NC}"
