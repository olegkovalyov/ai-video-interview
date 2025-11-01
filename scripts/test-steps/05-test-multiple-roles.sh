#!/bin/bash

API_GATEWAY="http://localhost:8001"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}👥 STEP 5: TEST MULTIPLE ROLES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f /tmp/test-user-id.txt ]; then
  echo -e "${RED}❌ User ID not found. Run 01-create-user.sh first${NC}"
  exit 1
fi

KEYCLOAK_ID=$(cat /tmp/test-user-id.txt)
echo "Using Keycloak ID: $KEYCLOAK_ID"
echo ""

# 1. Assign admin role
echo -e "${YELLOW}→ Assigning 'admin' role...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName":"admin"}')

echo "$ADMIN_RESPONSE" | jq .
echo ""

# Wait for INBOX processing
echo "⏳ Waiting 3 seconds for INBOX processing..."
sleep 3
echo ""

# 2. Assign hr role
echo -e "${YELLOW}→ Assigning 'hr' role...${NC}"
HR_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName":"hr"}')

echo "$HR_RESPONSE" | jq .
echo ""

# Wait for INBOX processing
echo "⏳ Waiting 3 seconds for INBOX processing..."
sleep 3
echo ""

# 3. Check database
echo -e "${YELLOW}→ Checking database...${NC}"
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
  SELECT u.email, r.name as role_name, ur.assigned_at
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  ORDER BY ur.assigned_at;
"
echo ""

# 4. Get roles via API
echo -e "${YELLOW}→ Getting roles via API...${NC}"
ROLES_RESPONSE=$(curl -s "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles")
echo "$ROLES_RESPONSE" | jq .
echo ""

# 5. Count only our roles (exclude default-roles-*)
ROLES_COUNT=$(echo "$ROLES_RESPONSE" | jq '.data | map(select(.name | startswith("default-roles-") | not)) | length')

if [ "$ROLES_COUNT" == "2" ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ SUCCESS! User has 2 roles (admin + hr)${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ FAILED! Expected 2 roles, got ${ROLES_COUNT}${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi

echo ""
echo "Next: Test JWT token contains roles"
echo "./scripts/test-steps/06-test-jwt-roles.sh"
echo ""
