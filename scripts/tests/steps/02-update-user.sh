#!/bin/bash

# =============================================================================
# STEP 2: Update user profile
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 2: UPDATE USER"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

# Get JWT token for the test user
log_info "Getting JWT token for testuser@example.com..."
USER_TOKEN=$(get_user_token "testuser@example.com" "password123") || exit 1
log_success "Token obtained"
separator

UPDATE_RESPONSE=$(curl -s -X PUT "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }')

echo "$UPDATE_RESPONSE" | jq .

log_success "User profile updated"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.profile_updated event"
echo "2. User Service logs - INBOX processing"
echo "3. Run: ./00-check-db.sh"
