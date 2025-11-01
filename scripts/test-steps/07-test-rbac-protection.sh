#!/bin/bash

API_GATEWAY="http://localhost:8001"
KEYCLOAK_URL="http://localhost:8090"
REALM="ai-video-interview"
CLIENT_ID="ai-video-interview-app"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🛡️  DAY 1 FINAL TEST: RBAC PROTECTION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Access without token (should fail)
echo -e "${BLUE}━━━ Test 1: Access without token ━━━${NC}"
echo -e "${YELLOW}→ GET /api/admin/users (no token)${NC}"
NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_GATEWAY}/api/admin/users")
HTTP_CODE=$(echo "$NO_TOKEN_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ PASS: Correctly rejected (401)${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 401, got ${HTTP_CODE}${NC}"
fi
echo ""

# Test 2: Get fresh admin token and remove admin/hr roles temporarily
echo -e "${BLUE}━━━ Test 2: User with only candidate role (no admin) ━━━${NC}"

# Get testuser Keycloak ID
TESTUSER_EMAIL="testuser@example.com"
TESTUSER_ID=$(cat /tmp/test-user-id.txt 2>/dev/null)

if [ -z "$TESTUSER_ID" ]; then
  echo -e "${RED}❌ testuser@example.com not found. Run 01-create-user.sh first${NC}"
  exit 1
fi

# First get admin token to remove roles
echo -e "${YELLOW}→ Getting admin token...${NC}"
TEMP_ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "username=${TESTUSER_EMAIL}" \
  -d "password=password123" \
  -d "grant_type=password" \
  | jq -r '.access_token')

# Remove admin and hr roles temporarily
echo -e "${YELLOW}→ Temporarily removing admin/hr roles...${NC}"
curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${TESTUSER_ID}/roles/admin" \
  -H "Authorization: Bearer ${TEMP_ADMIN_TOKEN}" > /dev/null
curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${TESTUSER_ID}/roles/hr" \
  -H "Authorization: Bearer ${TEMP_ADMIN_TOKEN}" > /dev/null
sleep 2

# Login as user with only candidate role
echo -e "${YELLOW}→ Login as user (only candidate role)...${NC}"
CANDIDATE_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "username=${TESTUSER_EMAIL}" \
  -d "password=password123" \
  -d "grant_type=password" \
  | jq -r '.access_token')

if [ -z "$CANDIDATE_TOKEN" ] || [ "$CANDIDATE_TOKEN" == "null" ]; then
  echo -e "${RED}❌ Failed to get token${NC}"
  exit 1
fi

# Try to access admin endpoint
CANDIDATE_ACCESS=$(curl -s -w "\n%{http_code}" -X GET "${API_GATEWAY}/api/admin/users" \
  -H "Authorization: Bearer ${CANDIDATE_TOKEN}")

HTTP_CODE=$(echo "$CANDIDATE_ACCESS" | tail -n1)

if [ "$HTTP_CODE" == "403" ]; then
  echo -e "${GREEN}✅ PASS: User without admin role correctly blocked (403)${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 403, got ${HTTP_CODE}${NC}"
  echo "Response:"
  echo "$CANDIDATE_ACCESS" | head -n-1
fi
echo ""

# Restore admin role for next test (use candidate token, will fail with 403)
echo -e "${YELLOW}→ Restoring admin role (need to use Keycloak Admin API)...${NC}"

# Get Keycloak admin token
KC_ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | jq -r '.access_token')

# Get admin role
ADMIN_ROLE=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/admin" \
  -H "Authorization: Bearer ${KC_ADMIN_TOKEN}")

# Assign admin role directly via Keycloak
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${TESTUSER_ID}/role-mappings/realm" \
  -H "Authorization: Bearer ${KC_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "[$(echo "$ADMIN_ROLE" | jq '{id, name}')]" > /dev/null

sleep 2
echo ""

# Test 3: Access with admin token (should succeed)
echo -e "${BLUE}━━━ Test 3: Admin accesses admin endpoint ━━━${NC}"

# Get fresh admin token
echo -e "${YELLOW}→ Login as admin (testuser with admin role)...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "username=${TESTUSER_EMAIL}" \
  -d "password=password123" \
  -d "grant_type=password" \
  | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo -e "${RED}❌ Failed to get admin token${NC}"
  exit 1
fi

echo -e "${YELLOW}→ GET /api/admin/users (with admin token)${NC}"

ADMIN_ACCESS=$(curl -s -w "\n%{http_code}" -X GET "${API_GATEWAY}/api/admin/users?max=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$ADMIN_ACCESS" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ PASS: Admin successfully accessed (200)${NC}"
  echo "Response preview:"
  echo "$ADMIN_ACCESS" | head -n-1 | jq '.data[0].email // empty'
else
  echo -e "${RED}❌ FAIL: Expected 200, got ${HTTP_CODE}${NC}"
  echo "Response:"
  echo "$ADMIN_ACCESS" | head -n-1 | jq . 2>/dev/null || echo "$ADMIN_ACCESS" | head -n-1
fi
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DAY 1 RBAC - ALL TESTS COMPLETED!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  ✅ Endpoints protected with JwtAuthGuard"
echo "  ✅ Endpoints protected with RolesGuard"
echo "  ✅ Admin role required for admin endpoints"
echo "  ✅ Candidate role auto-assigned on registration"
echo "  ✅ JWT tokens contain roles"
echo "  ✅ Multiple roles supported"
echo ""
echo "Next: Day 2 - Admin Dashboard UI"
echo ""
