#!/bin/bash

API_GATEWAY="http://localhost:8001"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎓 Creating Candidate User${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Random name generator
FIRST_NAMES=("Alex" "Taylor" "Jordan" "Morgan" "Casey" "Riley" "Jamie" "Quinn" "Avery" "Cameron")
LAST_NAMES=("Anderson" "Thompson" "White" "Harris" "Martin" "Jackson" "Lee" "Walker" "Hall" "Allen")

RANDOM_FIRST=${FIRST_NAMES[$RANDOM % ${#FIRST_NAMES[@]}]}
RANDOM_LAST=${LAST_NAMES[$RANDOM % ${#LAST_NAMES[@]}]}
RANDOM_SUFFIX=$(date +%s | tail -c 4)

# Generate credentials (using tr for macOS bash 3.2 compatibility)
CANDIDATE_EMAIL="candidate-$(echo "${RANDOM_FIRST}" | tr '[:upper:]' '[:lower:]')-$(echo "${RANDOM_LAST}" | tr '[:upper:]' '[:lower:]')-${RANDOM_SUFFIX}@test.com"
CANDIDATE_PASSWORD="password123"
CANDIDATE_FIRST_NAME="${RANDOM_FIRST}"
CANDIDATE_LAST_NAME="${RANDOM_LAST}"

echo -e "${YELLOW}→ Creating candidate user via API Gateway...${NC}"
echo "Email: ${CANDIDATE_EMAIL}"
echo "Name: ${CANDIDATE_FIRST_NAME} ${CANDIDATE_LAST_NAME}"
echo "Password: ${CANDIDATE_PASSWORD}"
echo ""

# Create user via API Gateway
CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${CANDIDATE_EMAIL}\",
    \"firstName\": \"${CANDIDATE_FIRST_NAME}\",
    \"lastName\": \"${CANDIDATE_LAST_NAME}\",
    \"password\": \"${CANDIDATE_PASSWORD}\"
  }")

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')
USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.userId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}❌ Failed to create candidate user${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Candidate user created${NC}"
echo "  Keycloak ID: ${KEYCLOAK_ID}"
echo "  User ID: ${USER_ID}"
echo ""

# Assign candidate role via API Gateway
echo -e "${YELLOW}→ Assigning candidate role via API Gateway...${NC}"

ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "candidate"}')

echo "$ROLE_RESPONSE" | jq .

if [ "$(echo "$ROLE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo -e "${RED}❌ Failed to assign candidate role${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Candidate role assigned${NC}"
echo ""

# Save credentials
echo "$CANDIDATE_EMAIL" >> /tmp/candidate-users.txt
echo "${CANDIDATE_EMAIL}:${CANDIDATE_PASSWORD}:${KEYCLOAK_ID}" >> /tmp/candidate-credentials.txt

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Candidate user created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Credentials:"
echo "  Email: ${CANDIDATE_EMAIL}"
echo "  Password: ${CANDIDATE_PASSWORD}"
echo "  Name: ${CANDIDATE_FIRST_NAME} ${CANDIDATE_LAST_NAME}"
echo ""
echo "Login:"
echo "  http://localhost:3000/login"
echo ""
echo "Saved to: /tmp/candidate-credentials.txt"
echo ""
