#!/bin/bash

# =============================================================================
# Reset All: Delete all users from Keycloak + Clear database tables
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "RESET ALL: Database + Keycloak"

# Step 1: Get Keycloak admin token
log_info "Step 1: Getting Keycloak admin token..."
ADMIN_TOKEN=$(get_keycloak_admin_token)
log_success "Admin token obtained"

# Step 2: Delete all users from Keycloak
log_info "Step 2: Deleting all users from Keycloak..."
USERS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

USER_COUNT=$(echo "$USERS" | jq 'length')
echo "Found ${USER_COUNT} users in Keycloak"

if [ "$USER_COUNT" -gt 0 ]; then
  echo "$USERS" | jq -r '.[].id' | while read KC_USER_ID; do
    curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${KC_USER_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" > /dev/null
    log_success "  Deleted user: ${KC_USER_ID}"
  done
else
  log_success "No users to delete"
fi

# Step 3: Clear database
log_info "Step 3: Clearing User Service database..."

run_sql "ai_video_interview_user" "DELETE FROM candidate_skills;" 2>&1 || true
run_sql "ai_video_interview_user" "DELETE FROM candidate_profiles;" 2>&1 || true
run_sql "ai_video_interview_user" "DELETE FROM user_companies;" 2>&1 || true
run_sql "ai_video_interview_user" "DELETE FROM users;" 2>&1 || true
run_sql "ai_video_interview_user" "DELETE FROM inbox;" 2>&1 || true
run_sql "ai_video_interview_user" "DELETE FROM outbox;" 2>&1 || true

log_success "Database tables cleared"

# Step 4: Verify
log_info "Step 4: Verifying cleanup..."

USERS_AFTER=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq 'length')

USERS_DB=$(run_sql "ai_video_interview_user" "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")

echo "Keycloak users: ${USERS_AFTER}"
echo "Database users: ${USERS_DB}"

if [ "${USERS_AFTER:-1}" -eq 0 ] && [ "${USERS_DB:-1}" -eq 0 ]; then
  log_success "RESET COMPLETED SUCCESSFULLY!"
else
  log_warn "WARNING: Some data may remain"
fi

# Clean temp files
rm -f "${SCRIPT_TMP_DIR}/test-user-id.txt"
rm -f "${SCRIPT_TMP_DIR}/operator-kc-id.txt"
rm -f "${SCRIPT_TMP_DIR}/operator-token.txt"
