#!/bin/bash

# =============================================================================
# STEP 4: Remove admin role from test user
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 4: REMOVE ROLE"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

# Get admin operator token
log_info "Getting admin operator token..."
OPERATOR_TOKEN=$(get_operator_token) || exit 1
log_success "Operator token obtained"
separator

REMOVE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles/admin" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")

echo "$REMOVE_RESPONSE" | jq .

SUCCESS=$(echo "$REMOVE_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  log_success "Role 'admin' removed"
else
  log_warn "Role removal failed (may not be implemented yet)"
fi
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.role_removed event"
echo "2. User Service logs - RemoveRoleCommand"
echo "3. Run: ./00-check-db.sh"
echo "4. Get roles: curl ${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles | jq"
