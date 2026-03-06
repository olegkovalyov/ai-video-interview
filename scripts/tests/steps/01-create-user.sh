#!/bin/bash

# =============================================================================
# STEP 1: Create test users via API Gateway
#   - admin-operator (for admin actions in later steps)
#   - testuser (the user we'll test CRUD on)
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 1: CREATE USERS"

# --- 1A: Create admin operator (used for authenticated admin calls) ----------
log_info "Step 1A: Creating admin operator..."

OPERATOR_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@example.com",
    "firstName": "Admin",
    "lastName": "Operator",
    "password": "operator123"
  }')

OPERATOR_KC_ID=$(check_response_field "$OPERATOR_RESPONSE" '.data.keycloakId') || {
  log_warn "Operator may already exist, trying to get token..."
}

if [ -n "$OPERATOR_KC_ID" ]; then
  log_success "Operator created: ${OPERATOR_KC_ID}"
  echo "$OPERATOR_KC_ID" > "${SCRIPT_TMP_DIR}/operator-kc-id.txt"

  # Assign admin role to operator
  log_info "Assigning admin role to operator..."
  curl -s -X POST "${API_GATEWAY}/api/admin/users/${OPERATOR_KC_ID}/roles" \
    -H "Content-Type: application/json" \
    -d '{"roleName": "admin"}' | jq .
fi

# Verify operator can authenticate
sleep 1
OPERATOR_TOKEN=$(get_user_token "operator@example.com" "operator123") || {
  log_error "Failed to get operator token. Cannot proceed."
  exit 1
}
log_success "Operator token obtained"
echo "$OPERATOR_TOKEN" > "${SCRIPT_TMP_DIR}/operator-token.txt"
separator

# --- 1B: Create test user ---------------------------------------------------
log_info "Step 1B: Creating test user..."

CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }')

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(check_response_field "$CREATE_RESPONSE" '.data.keycloakId') || {
  log_error "Failed to create test user"
  exit 1
}

log_success "Test user created with Keycloak ID: ${KEYCLOAK_ID}"
echo "$KEYCLOAK_ID" > "${SCRIPT_TMP_DIR}/test-user-id.txt"
log_info "Saved to: ${SCRIPT_TMP_DIR}/test-user-id.txt"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - event published"
echo "2. User Service logs - INBOX consumer + worker"
echo "3. Run: ./00-check-db.sh"
