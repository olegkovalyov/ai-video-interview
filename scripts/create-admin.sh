#!/bin/bash

API_GATEWAY="http://localhost:8001"
KEYCLOAK_URL="http://localhost:8090"
REALM="ai-video-interview"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}👨‍💼 Creating Admin User${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Admin credentials
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="123456"

echo -e "${YELLOW}→ Creating admin user via API Gateway...${NC}"
echo "Email: ${ADMIN_EMAIL}"
echo "Password: ${ADMIN_PASSWORD}"
echo ""

# Create user via API Gateway (same as 01-create-user.sh)
CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}❌ Failed to create admin user${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Admin user created with Keycloak ID: ${KEYCLOAK_ID}${NC}"
echo ""

# Wait for processing
echo -e "${YELLOW}→ Waiting for processing...${NC}"
sleep 3

# Assign admin role
echo -e "${YELLOW}→ Assigning admin role...${NC}"

ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "admin"}')

echo "$ROLE_RESPONSE" | jq .

echo -e "${GREEN}✅ Admin role assigned${NC}"
echo ""

# Save credentials
echo "$ADMIN_EMAIL" > /tmp/admin-email.txt
echo "$ADMIN_PASSWORD" > /tmp/admin-password.txt
echo "$KEYCLOAK_ID" > /tmp/admin-id.txt

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Admin user created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Credentials:"
echo "  Email: ${ADMIN_EMAIL}"
echo "  Password: ${ADMIN_PASSWORD}"
echo ""
echo "Login:"
echo "  http://localhost:3000/login"
echo ""
