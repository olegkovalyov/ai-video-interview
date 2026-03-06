#!/bin/bash

# =============================================================================
# STEP 3: Assign admin role to test user
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 3: ASSIGN ROLE"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

ASSIGN_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "admin"}')

echo "$ASSIGN_RESPONSE" | jq .

log_success "Role 'admin' assigned"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.role_assigned event"
echo "2. User Service logs - INBOX processing + AssignRoleCommand"
echo "3. Run: ./00-check-db.sh"
echo "4. Get roles: curl ${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles | jq"
