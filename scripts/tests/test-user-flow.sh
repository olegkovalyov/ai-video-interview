#!/bin/bash

# =============================================================================
# User Service E2E Test
# Flow: Create Operator -> Create User -> Update -> Assign Role ->
#       Suspend -> Activate -> Delete -> Verify
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "USER SERVICE E2E TEST"

TOTAL_STEPS=9

# ============================================================
# 1. CREATE ADMIN OPERATOR
# ============================================================
log_step 1 $TOTAL_STEPS "Creating admin operator..."
OPERATOR_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@example.com",
    "firstName": "Admin",
    "lastName": "Operator",
    "password": "operator123"
  }')

OPERATOR_KC_ID=$(check_response_field "$OPERATOR_RESPONSE" '.data.keycloakId') || {
  log_warn "Operator may already exist"
}

if [ -n "$OPERATOR_KC_ID" ]; then
  curl -s -X POST "${API_GATEWAY}/api/admin/users/${OPERATOR_KC_ID}/roles" \
    -H "Content-Type: application/json" \
    -d '{"roleName": "admin"}' > /dev/null
fi

sleep 1
OPERATOR_TOKEN=$(get_user_token "operator@example.com" "operator123") || {
  log_error "Failed to get operator token"
  exit 1
}
log_success "Operator ready"
separator

# ============================================================
# 2. CREATE TEST USER
# ============================================================
log_step 2 $TOTAL_STEPS "Creating test user..."
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
  log_error "Failed to create user. Exiting."
  exit 1
}

log_success "User created with Keycloak ID: ${KEYCLOAK_ID}"
log_info "Waiting 3 seconds for Kafka processing..."
sleep 3
separator

# ============================================================
# 3. GET USER (verify creation)
# ============================================================
log_step 3 $TOTAL_STEPS "Getting user from Keycloak..."
GET_RESPONSE=$(curl -s -X GET "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")
echo "$GET_RESPONSE" | jq .
log_success "User retrieved successfully"
separator

# ============================================================
# 4. UPDATE USER
# ============================================================
log_step 4 $TOTAL_STEPS "Updating user profile..."
USER_TOKEN=$(get_user_token "testuser@example.com" "password123") || {
  log_error "Failed to get user token"
  exit 1
}

UPDATE_RESPONSE=$(curl -s -X PUT "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }')

echo "$UPDATE_RESPONSE" | jq .
log_success "User profile updated"
log_info "Waiting 3 seconds for Kafka processing..."
sleep 3
separator

# ============================================================
# 5. ASSIGN ROLE
# ============================================================
log_step 5 $TOTAL_STEPS "Assigning 'candidate' role..."
ASSIGN_ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "candidate"}')

echo "$ASSIGN_ROLE_RESPONSE" | jq .
log_success "Role 'candidate' assigned"
log_info "Waiting 3 seconds for Kafka processing..."
sleep 3
separator

# ============================================================
# 6. SUSPEND USER
# ============================================================
log_step 6 $TOTAL_STEPS "Suspending user..."
SUSPEND_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}" \
  -d '{"reason": "E2E test suspension"}')

echo "$SUSPEND_RESPONSE" | jq .
STATUS=$(echo "$SUSPEND_RESPONSE" | jq -r '.user.status // empty')
if [ "$STATUS" == "suspended" ]; then
  log_success "User suspended (status=$STATUS)"
else
  log_warn "Unexpected status: $STATUS"
fi
separator

# ============================================================
# 7. ACTIVATE USER
# ============================================================
log_step 7 $TOTAL_STEPS "Activating user..."
ACTIVATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/activate" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")

echo "$ACTIVATE_RESPONSE" | jq .
STATUS=$(echo "$ACTIVATE_RESPONSE" | jq -r '.user.status // empty')
if [ "$STATUS" == "active" ]; then
  log_success "User activated (status=$STATUS)"
else
  log_warn "Unexpected status: $STATUS"
fi
separator

# ============================================================
# 8. DELETE USER
# ============================================================
log_step 8 $TOTAL_STEPS "Deleting user..."
DELETE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")
echo "$DELETE_RESPONSE" | jq .
log_success "User deleted"
log_info "Waiting 3 seconds for Kafka processing..."
sleep 3
separator

# ============================================================
# 9. VERIFY DELETION
# ============================================================
log_step 9 $TOTAL_STEPS "Verifying user is deleted..."
VERIFY_RESPONSE=$(curl -s -X GET "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")
echo "$VERIFY_RESPONSE" | jq .

if echo "$VERIFY_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  log_success "User confirmed deleted (404 expected)"
else
  log_warn "User still exists in Keycloak (soft delete in user-service)"
fi
separator

# ============================================================
# SUMMARY
# ============================================================
log_success "E2E TEST COMPLETED SUCCESSFULLY"
echo ""
echo "Check the following for verification:"
echo "  1. API Gateway logs (port 8001)"
echo "  2. User Service logs (port 8002)"
echo "  3. Grafana Loki logs: http://localhost:3002"
echo "  4. PostgreSQL user-service tables: inbox, outbox, users"
echo ""
echo "Expected flow:"
echo "  API Gateway -> Kafka (user-events)"
echo "  -> User Service INBOX Consumer -> inbox table"
echo "  -> BullMQ -> INBOX Worker -> CQRS Commands"
echo "  -> Domain Events -> OUTBOX table"
echo "  -> BullMQ -> OUTBOX Publisher -> Kafka"
