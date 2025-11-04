#!/bin/bash

# Test Role Selection Flow
# Requires: user-service running on port 3001

BASE_URL="http://localhost:3001"
USER_ID=""

echo "======================================"
echo "🧪 Testing Role Selection Flow"
echo "======================================"
echo ""

# Step 1: Get current user (should have role: pending)
echo "1️⃣ Getting current user..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/users/me" \
  -H "Content-Type: application/json")
  
echo "Response: $RESPONSE"
USER_ID=$(echo $RESPONSE | jq -r '.id')
CURRENT_ROLE=$(echo $RESPONSE | jq -r '.role')

echo "✅ User ID: $USER_ID"
echo "✅ Current Role: $CURRENT_ROLE"
echo ""

# Step 2: Select Candidate Role
echo "2️⃣ Selecting CANDIDATE role..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/me/select-role" \
  -H "Content-Type: application/json" \
  -d '{"role": "candidate"}')
  
echo "Response: $RESPONSE"
echo ""

# Step 3: Verify role changed
echo "3️⃣ Verifying role changed..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/users/me" \
  -H "Content-Type: application/json")
  
NEW_ROLE=$(echo $RESPONSE | jq -r '.role')
echo "✅ New Role: $NEW_ROLE"
echo ""

# Step 4: Update Candidate Profile
echo "4️⃣ Updating candidate profile..."
RESPONSE=$(curl -s -X PUT "$BASE_URL/api/v1/users/me/candidate-profile" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
    "experienceLevel": "senior"
  }')
  
echo "Response: $RESPONSE"
echo ""

# Step 5: Try to select role again (should fail)
echo "5️⃣ Trying to select role again (should fail)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/me/select-role" \
  -H "Content-Type: application/json" \
  -d '{"role": "hr"}')
  
echo "Response: $RESPONSE"
echo ""

echo "======================================"
echo "✅ Role Selection Test Complete!"
echo "======================================"
