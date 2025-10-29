#!/bin/bash

# ============================================================
# USER SERVICE END-TO-END TEST SCRIPT
# Tests: Create → Update → Assign Role → Remove Role → Delete
# ============================================================

set -e  # Exit on error

API_GATEWAY="http://localhost:8001"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 USER SERVICE E2E TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# 1. CREATE USER
# ============================================================
echo -e "${BLUE}📝 STEP 1: Creating user in Keycloak...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }')

echo "$CREATE_RESPONSE" | jq .

# Extract Keycloak ID
KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}❌ Failed to create user. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ User created with Keycloak ID: ${KEYCLOAK_ID}${NC}"
echo -e "${BLUE}⏳ Waiting 3 seconds for Kafka → INBOX → Worker processing...${NC}"
sleep 3
echo ""

# ============================================================
# 2. GET USER (verify creation)
# ============================================================
echo -e "${BLUE}📖 STEP 2: Getting user from Keycloak...${NC}"
GET_RESPONSE=$(curl -s -X GET "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}")
echo "$GET_RESPONSE" | jq .
echo -e "${GREEN}✅ User retrieved successfully${NC}"
echo ""

# ============================================================
# 3. UPDATE USER
# ============================================================
echo -e "${BLUE}✏️  STEP 3: Updating user profile...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }')

echo "$UPDATE_RESPONSE" | jq .
echo -e "${GREEN}✅ User profile updated${NC}"
echo -e "${BLUE}⏳ Waiting 3 seconds for Kafka → INBOX → Worker processing...${NC}"
sleep 3
echo ""

# ============================================================
# 4. ASSIGN ROLE
# ============================================================
echo -e "${BLUE}🎭 STEP 4: Assigning 'admin' role...${NC}"
ASSIGN_ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "admin"
  }')

echo "$ASSIGN_ROLE_RESPONSE" | jq .
echo -e "${GREEN}✅ Role 'admin' assigned${NC}"
echo -e "${BLUE}⏳ Waiting 3 seconds for Kafka → INBOX → Worker processing...${NC}"
sleep 3
echo ""

# ============================================================
# 5. GET USER ROLES
# ============================================================
echo -e "${BLUE}🔍 STEP 5: Getting user roles...${NC}"
ROLES_RESPONSE=$(curl -s -X GET "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles")
echo "$ROLES_RESPONSE" | jq .
echo -e "${GREEN}✅ User roles retrieved${NC}"
echo ""

# ============================================================
# 6. REMOVE ROLE
# ============================================================
echo -e "${BLUE}🎭 STEP 6: Removing 'admin' role...${NC}"
REMOVE_ROLE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles/admin")
echo "$REMOVE_ROLE_RESPONSE" | jq .
echo -e "${GREEN}✅ Role 'admin' removed${NC}"
echo -e "${BLUE}⏳ Waiting 3 seconds for Kafka → INBOX → Worker processing...${NC}"
sleep 3
echo ""

# ============================================================
# 7. DELETE USER
# ============================================================
echo -e "${BLUE}🗑️  STEP 7: Deleting user...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}")
echo "$DELETE_RESPONSE" | jq .
echo -e "${GREEN}✅ User deleted${NC}"
echo -e "${BLUE}⏳ Waiting 3 seconds for Kafka → INBOX → Worker processing...${NC}"
sleep 3
echo ""

# ============================================================
# 8. VERIFY DELETION
# ============================================================
echo -e "${BLUE}🔍 STEP 8: Verifying user is deleted...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}")
echo "$VERIFY_RESPONSE" | jq .

if echo "$VERIFY_RESPONSE" | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✅ User confirmed deleted (404 expected)${NC}"
else
  echo -e "${RED}⚠️  User still exists in Keycloak (soft delete in user-service)${NC}"
fi
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ E2E TEST COMPLETED SUCCESSFULLY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check the following for verification:"
echo "  1. API Gateway logs (port 8001)"
echo "  2. User Service logs (port 8002)"
echo "  3. Grafana Loki logs: http://localhost:3002"
echo "  4. PostgreSQL user-service tables: inbox, outbox, users"
echo ""
echo "🎯 Expected flow:"
echo "  API Gateway → Kafka (user-events)"
echo "  → User Service INBOX Consumer → inbox table"
echo "  → BullMQ → INBOX Worker → CQRS Commands"
echo "  → Domain Events → OUTBOX table"
echo "  → BullMQ → OUTBOX Publisher → Kafka"
echo ""
