#!/bin/bash

API_GATEWAY="http://localhost:8001"
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📝 STEP 1: CREATE USER${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }')

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}❌ Failed to create user${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ User created with Keycloak ID: ${KEYCLOAK_ID}${NC}"
echo ""
echo "📊 SAVE THIS ID FOR NEXT STEPS:"
echo "$KEYCLOAK_ID" > /tmp/test-user-id.txt
echo -e "${BLUE}Saved to: /tmp/test-user-id.txt${NC}"
echo ""
echo "⏳ Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - event published"
echo "2. User Service logs - INBOX consumer + worker"
echo "3. PostgreSQL:"
echo "   SELECT * FROM inbox ORDER BY created_at DESC LIMIT 5;"
echo "   SELECT * FROM users WHERE email = 'testuser@example.com';"
echo "   SELECT * FROM outbox ORDER BY created_at DESC LIMIT 5;"
