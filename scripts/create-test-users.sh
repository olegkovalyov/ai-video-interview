#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYCLOAK_URL="http://localhost:8090"
REALM="ai-video-interview"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 Creating Test Users (Admin, HR, Candidate)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============ CLEANUP STEP ============
echo -e "${YELLOW}━━━ Cleanup: Deleting all existing users ━━━${NC}"
echo ""

# 1. Get Keycloak admin token
echo -e "${YELLOW}→ Getting Keycloak admin token...${NC}"
KC_ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | jq -r '.access_token')

if [ -z "$KC_ADMIN_TOKEN" ] || [ "$KC_ADMIN_TOKEN" == "null" ]; then
  echo -e "${RED}❌ Failed to get Keycloak admin token${NC}"
  exit 1
fi

# 2. Delete all users from Keycloak
echo -e "${YELLOW}→ Deleting all users from Keycloak...${NC}"
USERS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?max=1000" \
  -H "Authorization: Bearer ${KC_ADMIN_TOKEN}")

USER_COUNT=$(echo "$USERS" | jq '. | length')
echo "Found ${USER_COUNT} users to delete"

echo "$USERS" | jq -r '.[].id' | while read USER_ID; do
  curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}" \
    -H "Authorization: Bearer ${KC_ADMIN_TOKEN}" > /dev/null
  echo "  Deleted user: ${USER_ID}"
done

echo -e "${GREEN}✅ All Keycloak users deleted${NC}"
echo ""

# 3. Truncate database tables
echo -e "${YELLOW}→ Truncating database tables...${NC}"
docker exec ai-interview-postgres psql -U postgres -d ai_video_interview_user -c "
  TRUNCATE TABLE user_roles CASCADE;
  TRUNCATE TABLE users CASCADE;
  TRUNCATE TABLE inbox CASCADE;
  TRUNCATE TABLE outbox CASCADE;
"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database tables truncated${NC}"
else
  echo -e "${RED}❌ Failed to truncate tables${NC}"
  exit 1
fi
echo ""

# Clean up old temp files
rm -f /tmp/admin-*.txt /tmp/hr-*.txt /tmp/candidate-*.txt

echo -e "${GREEN}━━━ Cleanup completed! ━━━${NC}"
echo ""

# 1. Create Admin
echo -e "${BLUE}━━━ Step 1/3: Creating Admin ━━━${NC}"
bash "${SCRIPT_DIR}/create-admin.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to create admin${NC}"
  exit 1
fi
echo ""

# 2. Create HR users
echo -e "${BLUE}━━━ Step 2/3: Creating HR Users ━━━${NC}"
echo -e "${YELLOW}How many HR users to create? (default: 2)${NC}"
read -t 5 HR_COUNT
HR_COUNT=${HR_COUNT:-2}
echo "Creating ${HR_COUNT} HR users..."
echo ""

for i in $(seq 1 $HR_COUNT); do
  echo -e "${YELLOW}[${i}/${HR_COUNT}] Creating HR user...${NC}"
  bash "${SCRIPT_DIR}/create-hr.sh"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create HR user ${i}${NC}"
    exit 1
  fi
  echo ""
done

# 3. Create Candidate users
echo -e "${BLUE}━━━ Step 3/3: Creating Candidate Users ━━━${NC}"
echo -e "${YELLOW}How many Candidate users to create? (default: 3)${NC}"
read -t 5 CANDIDATE_COUNT
CANDIDATE_COUNT=${CANDIDATE_COUNT:-3}
echo "Creating ${CANDIDATE_COUNT} candidate users..."
echo ""

for i in $(seq 1 $CANDIDATE_COUNT); do
  echo -e "${YELLOW}[${i}/${CANDIDATE_COUNT}] Creating candidate user...${NC}"
  bash "${SCRIPT_DIR}/create-candidate.sh"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create candidate user ${i}${NC}"
    exit 1
  fi
  echo ""
done

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All test users created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  ✅ 1 Admin user"
echo "  ✅ ${HR_COUNT} HR users"
echo "  ✅ ${CANDIDATE_COUNT} Candidate users"
echo ""
echo "Credentials saved to:"
echo "  Admin: /tmp/admin-email.txt, /tmp/admin-password.txt"
echo "  HR: /tmp/hr-credentials.txt"
echo "  Candidates: /tmp/candidate-credentials.txt"
echo ""
echo "View all users:"
echo "  cat /tmp/hr-credentials.txt"
echo "  cat /tmp/candidate-credentials.txt"
echo ""
