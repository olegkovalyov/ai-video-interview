#!/bin/bash

# =============================================================================
# Creates an admin user via API Gateway and assigns admin role
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Creating Admin User"

ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="123456"

log_info "Creating admin user via API Gateway..."
echo "Email: ${ADMIN_EMAIL}"
echo "Password: ${ADMIN_PASSWORD}"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

echo "$CREATE_RESPONSE" | jq .

KEYCLOAK_ID=$(check_response_field "$CREATE_RESPONSE" '.data.keycloakId') || {
  log_error "Failed to create admin user"
  exit 1
}
USER_ID=$(check_response_field "$CREATE_RESPONSE" '.data.userId') || {
  log_error "Failed to get userId from response"
  exit 1
}

log_success "Admin user created"
echo "  Keycloak ID: ${KEYCLOAK_ID}"
echo "  User ID: ${USER_ID}"
separator

log_info "Assigning admin role via API Gateway..."
ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "admin"}')

echo "$ROLE_RESPONSE" | jq .

if [ "$(echo "$ROLE_RESPONSE" | jq -r '.success')" != "true" ]; then
  log_error "Failed to assign admin role"
  exit 1
fi

log_success "Admin role assigned"
separator

# Save credentials
echo "$ADMIN_EMAIL" > "${SCRIPT_TMP_DIR}/admin-email.txt"
echo "$ADMIN_PASSWORD" > "${SCRIPT_TMP_DIR}/admin-password.txt"
echo "$KEYCLOAK_ID" > "${SCRIPT_TMP_DIR}/admin-id.txt"

log_success "Admin user created successfully!"
echo ""
echo "Credentials:"
echo "  Email: ${ADMIN_EMAIL}"
echo "  Password: ${ADMIN_PASSWORD}"
echo ""
echo "Login: http://localhost:3000/login"
