#!/bin/bash

# =============================================================================
# Orchestrator: Clean all data + Create Admin, HR (with companies/templates),
# and 20 Candidate users
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Creating Test Users (Admin, HR, 20 Candidates)"

# ============ CLEANUP STEP ============
log_warn "--- Cleanup: Deleting all existing data ---"
separator

# 1. Get Keycloak admin token
log_info "Getting Keycloak admin token..."
KC_ADMIN_TOKEN=$(get_keycloak_admin_token)
log_success "Admin token obtained"

# 2. Delete all users from Keycloak
log_info "Deleting all users from Keycloak..."
USERS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000" \
  -H "Authorization: Bearer ${KC_ADMIN_TOKEN}")

USER_COUNT=$(echo "$USERS" | jq '. | length')
echo "Found ${USER_COUNT} users to delete"

echo "$USERS" | jq -r '.[].id' | while read KC_USER_ID; do
  curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${KC_USER_ID}" \
    -H "Authorization: Bearer ${KC_ADMIN_TOKEN}" > /dev/null
done

log_success "All Keycloak users deleted"
separator

# 3. Truncate User Service database tables
log_info "Truncating User Service database tables..."
run_sql "ai_video_interview_user" "
  TRUNCATE TABLE candidate_skills CASCADE;
  TRUNCATE TABLE candidate_profiles CASCADE;
  TRUNCATE TABLE user_companies CASCADE;
  TRUNCATE TABLE companies CASCADE;
  TRUNCATE TABLE users CASCADE;
  TRUNCATE TABLE inbox CASCADE;
  TRUNCATE TABLE outbox CASCADE;
"

if [ $? -eq 0 ]; then
  log_success "User Service tables truncated"
else
  log_error "Failed to truncate User Service tables"
  exit 1
fi

# 4. Truncate Interview Service database tables
log_info "Truncating Interview Service database tables..."
run_sql "ai_video_interview_interview" "
  TRUNCATE TABLE question_options CASCADE;
  TRUNCATE TABLE questions CASCADE;
  TRUNCATE TABLE interview_responses CASCADE;
  TRUNCATE TABLE invitations CASCADE;
  TRUNCATE TABLE templates CASCADE;
  TRUNCATE TABLE inbox CASCADE;
  TRUNCATE TABLE outbox CASCADE;
" 2>/dev/null || log_warn "Some interview tables may not exist yet (OK for fresh setup)"

log_success "Interview Service tables truncated"
separator

# Clean up old temp files
rm -f "${SCRIPT_TMP_DIR}"/admin-*.txt "${SCRIPT_TMP_DIR}"/hr-*.txt "${SCRIPT_TMP_DIR}"/candidate-*.txt

log_success "--- Cleanup completed! ---"
separator

# ============ CREATE USERS ============

# 1. Create Admin
header "Step 1/3: Creating Admin"
bash "${SCRIPT_DIR}/create-admin.sh"
if [ $? -ne 0 ]; then
  log_error "Failed to create admin"
  exit 1
fi
separator

# 2. Create HR user with companies and templates
header "Step 2/3: Creating HR User with Companies & Templates"
bash "${SCRIPT_DIR}/create-hr.sh"
if [ $? -ne 0 ]; then
  log_error "Failed to create HR user"
  exit 1
fi
separator

# 3. Create Candidate users
header "Step 3/3: Creating 20 Candidate Users with Skills"
bash "${SCRIPT_DIR}/create-candidate.sh"
if [ $? -ne 0 ]; then
  log_error "Failed to create candidate users"
  exit 1
fi
separator

# ============ SUMMARY ============
log_success "All test users created successfully!"
echo ""
echo "Summary:"
echo "  - 1 Admin user (admin@test.com / 123456)"
echo "  - 1 HR user (hr@test.com / 123456) with 3 companies & 3 templates"
echo "  - 20 Candidate users (password123) with skills & experience levels"
echo ""
echo "Credentials saved to:"
echo "  Admin:      ${SCRIPT_TMP_DIR}/admin-email.txt"
echo "  HR:         ${SCRIPT_TMP_DIR}/hr-credentials.txt"
echo "  Candidates: ${SCRIPT_TMP_DIR}/candidate-credentials.txt"
echo ""
echo "Login: http://localhost:3000/login"
