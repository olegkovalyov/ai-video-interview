#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}🔄 RESET ALL: Database + Keycloak${NC}"
echo -e "${YELLOW}========================================${NC}"

# Keycloak Admin credentials
KEYCLOAK_URL="http://localhost:8090"
KEYCLOAK_REALM="ai-video-interview"
KEYCLOAK_CLIENT_ID="admin-cli"
KEYCLOAK_ADMIN_USER="admin"
KEYCLOAK_ADMIN_PASSWORD="admin123"

echo -e "\n${YELLOW}Step 1: Getting Keycloak admin token...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN_USER}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=${KEYCLOAK_CLIENT_ID}" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo -e "${RED}❌ Failed to get Keycloak admin token${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin token obtained${NC}"

echo -e "\n${YELLOW}Step 2: Deleting all users from Keycloak...${NC}"
# Get all users
USERS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

USER_COUNT=$(echo "$USERS" | jq 'length')
echo -e "Found ${USER_COUNT} users in Keycloak"

if [ "$USER_COUNT" -gt 0 ]; then
  echo "$USERS" | jq -r '.[].id' | while read USER_ID; do
    curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${USER_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"
    echo -e "${GREEN}✓ Deleted user: ${USER_ID}${NC}"
  done
else
  echo -e "${GREEN}✓ No users to delete${NC}"
fi

echo -e "\n${YELLOW}Step 3: Clearing User Service database...${NC}"

# Clear user_roles first (foreign key constraint)
docker exec -i ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "DELETE FROM user_roles;" 2>&1
echo -e "${GREEN}✓ Cleared user_roles table${NC}"

# Clear users
docker exec -i ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "DELETE FROM users;" 2>&1
echo -e "${GREEN}✓ Cleared users table${NC}"

# Clear outbox
docker exec -i ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "DELETE FROM outbox;" 2>&1
echo -e "${GREEN}✓ Cleared outbox table${NC}"

echo -e "\n${YELLOW}Step 4: Verifying cleanup...${NC}"

# Count users in Keycloak
USERS_AFTER=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq 'length')

# Count users in database
USERS_DB=$(docker exec -i ai-interview-postgres psql -U postgres -d ai_video_interview_user -t -c "SELECT COUNT(*) FROM users;" 2>&1 | tr -d ' ')

echo -e "Keycloak users: ${USERS_AFTER}"
echo -e "Database users: ${USERS_DB}"

if [ "$USERS_AFTER" -eq 0 ] && [ "$USERS_DB" -eq 0 ]; then
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ RESET COMPLETED SUCCESSFULLY!${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "\n${RED}========================================${NC}"
  echo -e "${RED}⚠️  WARNING: Some data may remain${NC}"
  echo -e "${RED}========================================${NC}"
fi
