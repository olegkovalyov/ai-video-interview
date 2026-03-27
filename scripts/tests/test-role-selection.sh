#!/bin/bash

# =============================================================================
# Test Role Selection Flow
# NOTE: This test requires a logged-in user session.
#       The endpoints expect authentication via the API Gateway.
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Testing Role Selection Flow"

# This test goes through the API Gateway, which handles auth
BASE_URL="${API_GATEWAY}"

# Step 1: Get current user (should have role: pending)
log_step 1 5 "Getting current user..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/users/me" \
  -H "Content-Type: application/json")

echo "Response: $RESPONSE"
USER_ID=$(echo "$RESPONSE" | jq -r '.id')
CURRENT_ROLE=$(echo "$RESPONSE" | jq -r '.role')

log_success "User ID: $USER_ID"
log_success "Current Role: $CURRENT_ROLE"
separator

# Step 2: Select Candidate Role
log_step 2 5 "Selecting CANDIDATE role..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/me/select-role" \
  -H "Content-Type: application/json" \
  -d '{"role": "candidate"}')

echo "Response: $RESPONSE"
separator

# Step 3: Verify role changed
log_step 3 5 "Verifying role changed..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/users/me" \
  -H "Content-Type: application/json")

NEW_ROLE=$(echo "$RESPONSE" | jq -r '.role')
log_success "New Role: $NEW_ROLE"
separator

# Step 4: Update Candidate Profile
log_step 4 5 "Updating candidate profile..."
RESPONSE=$(curl -s -X PUT "$BASE_URL/api/v1/users/me/candidate-profile" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
    "experienceLevel": "senior"
  }')

echo "Response: $RESPONSE"
separator

# Step 5: Try to select role again (should fail)
log_step 5 5 "Trying to select role again (should fail)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/me/select-role" \
  -H "Content-Type: application/json" \
  -d '{"role": "hr"}')

echo "Response: $RESPONSE"
separator

log_success "Role Selection Test Complete!"
