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
echo -e "${BLUE}🔐 STEP 6: TEST JWT TOKEN CONTAINS ROLES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# User credentials (from test-01)
USER_EMAIL="testuser@example.com"
USER_PASSWORD="password123"

echo -e "${YELLOW}→ Logging in as ${USER_EMAIL}...${NC}"

# Get token from Keycloak
TOKEN_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "username=${USER_EMAIL}" \
  -d "password=${USER_PASSWORD}" \
  -d "grant_type=password")

# Extract access token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get access token${NC}"
  echo "Response:"
  echo "$TOKEN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Access token obtained${NC}"
echo ""

# Decode JWT payload (2nd part of token) using jq
echo -e "${YELLOW}→ Decoding JWT token...${NC}"

# Use nodejs/python if available, otherwise fallback to manual decode
if command -v node >/dev/null 2>&1; then
  JWT_PAYLOAD=$(node -e "
    const token = process.argv[1];
    const parts = token.split('.');
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    console.log(payload);
  " "$ACCESS_TOKEN")
else
  # Fallback to manual decode with proper padding
  JWT_PART2=$(echo -n "$ACCESS_TOKEN" | cut -d. -f2)
  # Add base64 padding
  while [ $((${#JWT_PART2} % 4)) -ne 0 ]; do
    JWT_PART2="${JWT_PART2}="
  done
  JWT_PAYLOAD=$(echo "$JWT_PART2" | base64 -D 2>/dev/null || echo "$JWT_PART2" | base64 -d 2>/dev/null)
fi

if [ -z "$JWT_PAYLOAD" ]; then
  echo -e "${RED}❌ Failed to decode JWT payload${NC}"
  exit 1
fi

echo "JWT Payload:"
echo "$JWT_PAYLOAD" | jq .
echo ""

# Extract roles from realm_access.roles
echo -e "${YELLOW}→ Extracting roles from JWT...${NC}"
ROLES=$(echo "$JWT_PAYLOAD" | jq -r '.realm_access.roles[]' 2>/dev/null | grep -E '^(admin|hr|candidate)$')

echo "Roles in JWT:"
echo "$ROLES"
echo ""

# Check if admin and hr roles are present
HAS_ADMIN=$(echo "$ROLES" | grep -c "^admin$")
HAS_HR=$(echo "$ROLES" | grep -c "^hr$")

if [ "$HAS_ADMIN" == "1" ] && [ "$HAS_HR" == "1" ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ SUCCESS! JWT contains both 'admin' and 'hr' roles${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ FAILED! Missing roles in JWT${NC}"
  echo -e "${RED}   Has admin: ${HAS_ADMIN}${NC}"
  echo -e "${RED}   Has hr: ${HAS_HR}${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi

# Save token for next tests
echo "$ACCESS_TOKEN" > /tmp/test-access-token.txt
echo ""
echo "Access token saved to: /tmp/test-access-token.txt"
echo ""
echo "Next: Implement RolesGuard"
echo ""
