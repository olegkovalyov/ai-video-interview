#!/bin/bash

API_GATEWAY="http://localhost:8001"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}▶️  STEP 4B: ACTIVATE USER${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f /tmp/test-user-id.txt ]; then
  echo -e "${RED}❌ User ID not found. Run 01-create-user.sh first${NC}"
  exit 1
fi

KEYCLOAK_ID=$(cat /tmp/test-user-id.txt)
echo "Using Keycloak ID: $KEYCLOAK_ID"
echo ""

ACTIVATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/activate")

echo "$ACTIVATE_RESPONSE" | jq .

echo ""
echo -e "${GREEN}✅ User activated${NC}"
echo ""
echo "⏳ Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.activated event"
echo "2. User Service logs - INBOX processing + ActivateUserCommand"
echo "3. PostgreSQL:"
echo "   SELECT * FROM inbox WHERE event_type = 'user.activated' ORDER BY created_at DESC LIMIT 1;"
echo "   SELECT email, status, updated_at FROM users WHERE email = 'testuser@example.com';"
echo "   SELECT * FROM outbox WHERE event_type = 'user.activated' ORDER BY created_at DESC LIMIT 1;"
echo ""
echo -e "${BLUE}🎯 EXPECTED: status='active'${NC}"
