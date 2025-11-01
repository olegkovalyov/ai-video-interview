#!/bin/bash

API_GATEWAY="http://localhost:8001"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}👔 Creating HR User${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Random name generator
FIRST_NAMES=("John" "Jane" "Michael" "Sarah" "David" "Emily" "Robert" "Lisa" "James" "Maria")
LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez")

RANDOM_FIRST=${FIRST_NAMES[$RANDOM % ${#FIRST_NAMES[@]}]}
RANDOM_LAST=${LAST_NAMES[$RANDOM % ${#LAST_NAMES[@]}]}
RANDOM_SUFFIX=$(date +%s | tail -c 4)

# Generate credentials (using tr for macOS bash 3.2 compatibility)
HR_EMAIL="hr-$(echo "${RANDOM_FIRST}" | tr '[:upper:]' '[:lower:]')-$(echo "${RANDOM_LAST}" | tr '[:upper:]' '[:lower:]')-${RANDOM_SUFFIX}@test.com"
HR_PASSWORD="password123"
HR_FIRST_NAME="${RANDOM_FIRST}"
HR_LAST_NAME="${RANDOM_LAST}"

echo -e "${YELLOW}→ Creating HR user via API Gateway...${NC}"
echo "Email: ${HR_EMAIL}"
echo "Name: ${HR_FIRST_NAME} ${HR_LAST_NAME}"
echo "Password: ${HR_PASSWORD}"
echo ""

# Create user via API Gateway
CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${HR_EMAIL}\",
    \"firstName\": \"${HR_FIRST_NAME}\",
    \"lastName\": \"${HR_LAST_NAME}\",
    \"password\": \"${HR_PASSWORD}\"
  }")

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}❌ Failed to create HR user${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ HR user created with Keycloak ID: ${KEYCLOAK_ID}${NC}"
echo ""

# Wait for processing
echo -e "${YELLOW}→ Waiting for processing...${NC}"
sleep 3

# Assign HR role
echo -e "${YELLOW}→ Assigning HR role...${NC}"

ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "hr"}')

echo "$ROLE_RESPONSE" | jq .

echo -e "${GREEN}✅ HR role assigned${NC}"
echo ""

# Save credentials
echo "$HR_EMAIL" >> /tmp/hr-users.txt
echo "${HR_EMAIL}:${HR_PASSWORD}:${KEYCLOAK_ID}" >> /tmp/hr-credentials.txt

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ HR user created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Credentials:"
echo "  Email: ${HR_EMAIL}"
echo "  Password: ${HR_PASSWORD}"
echo "  Name: ${HR_FIRST_NAME} ${HR_LAST_NAME}"
echo ""
echo "Login:"
echo "  http://localhost:3000/login"
echo ""
echo "Saved to: /tmp/hr-credentials.txt"
echo ""
