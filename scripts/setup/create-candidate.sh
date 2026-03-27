#!/bin/bash

# =============================================================================
# Creates 20 candidate users with random skills and experience levels
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Creating 20 Candidate Users with Skills"

# 20 unique candidate names (email_prefix:first:last)
CANDIDATES=(
  "alice:Alice:Johnson"
  "bob:Bob:Smith"
  "charlie:Charlie:Brown"
  "diana:Diana:Williams"
  "edward:Edward:Davis"
  "fiona:Fiona:Miller"
  "george:George:Wilson"
  "hannah:Hannah:Moore"
  "ivan:Ivan:Taylor"
  "julia:Julia:Anderson"
  "kevin:Kevin:Thomas"
  "laura:Laura:Jackson"
  "michael:Michael:White"
  "natalie:Natalie:Harris"
  "oliver:Oliver:Martin"
  "patricia:Patricia:Garcia"
  "quentin:Quentin:Martinez"
  "rachel:Rachel:Robinson"
  "samuel:Samuel:Clark"
  "tina:Tina:Rodriguez"
)

EXPERIENCE_LEVELS=("junior" "mid" "senior" "lead")

SKILL_SLUGS=(
  "javascript" "typescript" "python" "java" "go" "rust" "csharp" "php" "ruby" "cpp"
  "react" "vuejs" "angular" "nextjs" "svelte" "tailwindcss"
  "nodejs" "expressjs" "nestjs" "django" "fastapi" "spring-boot" "laravel"
  "postgresql" "mysql" "mongodb" "redis" "elasticsearch"
  "docker" "kubernetes" "aws" "azure" "gcp" "terraform"
  "react-native" "flutter" "swift" "kotlin"
  "jest" "cypress" "playwright" "selenium"
  "git" "vscode" "postman" "jira"
)

PROFICIENCY_LEVELS=("beginner" "intermediate" "advanced" "expert")

get_random() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

get_skill_id() {
  local slug=$1
  run_sql "ai_video_interview_user" "SELECT id FROM skills WHERE slug = '${slug}'" | tr -d ' \n'
}

# Clear previous credentials
rm -f "${SCRIPT_TMP_DIR}/candidate-users.txt" "${SCRIPT_TMP_DIR}/candidate-credentials.txt"

CREATED_COUNT=0

for candidate in "${CANDIDATES[@]}"; do
  IFS=':' read -r email_name first_name last_name <<< "$candidate"

  CANDIDATE_EMAIL="${email_name}@test.com"
  CANDIDATE_PASSWORD="password123"

  log_step $((CREATED_COUNT + 1)) 20 "Creating ${first_name} ${last_name}..."

  # Create user via API Gateway
  CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${CANDIDATE_EMAIL}\",
      \"username\": \"${email_name}\",
      \"firstName\": \"${first_name}\",
      \"lastName\": \"${last_name}\",
      \"password\": \"${CANDIDATE_PASSWORD}\"
    }")

  KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')
  USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.userId')

  if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
    log_error "  Failed to create user"
    continue
  fi

  # Assign candidate role
  ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
    -H "Content-Type: application/json" \
    -d '{"roleName": "candidate"}')

  if [ "$(echo "$ROLE_RESPONSE" | jq -r '.success')" != "true" ]; then
    log_error "  Failed to assign role"
    continue
  fi

  # Set random experience level
  EXP_LEVEL=$(get_random "${EXPERIENCE_LEVELS[@]}")

  curl -s -X PUT "${USER_SERVICE}/candidates/${USER_ID}/experience-level" \
    -H "Content-Type: application/json" \
    -H "x-internal-token: ${INTERNAL_TOKEN}" \
    -d "{\"experienceLevel\": \"${EXP_LEVEL}\"}" > /dev/null

  # Add 3-5 random skills (using associative array for dedup)
  NUM_SKILLS=$((3 + RANDOM % 3))
  declare -A SEEN_SKILLS=()
  ADDED_COUNT=0
  ATTEMPTS=0

  while [ $ADDED_COUNT -lt $NUM_SKILLS ] && [ $ATTEMPTS -lt 20 ]; do
    SKILL_SLUG=$(get_random "${SKILL_SLUGS[@]}")
    ((ATTEMPTS++))

    # Exact match dedup via associative array
    if [ -n "${SEEN_SKILLS[$SKILL_SLUG]+x}" ]; then
      continue
    fi
    SEEN_SKILLS[$SKILL_SLUG]=1

    SKILL_ID=$(get_skill_id "$SKILL_SLUG")
    if [ -z "$SKILL_ID" ]; then
      continue
    fi

    PROF_LEVEL=$(get_random "${PROFICIENCY_LEVELS[@]}")
    YEARS=$((1 + RANDOM % 10))

    curl -s -X POST "${USER_SERVICE}/candidates/${USER_ID}/skills" \
      -H "Content-Type: application/json" \
      -H "x-internal-token: ${INTERNAL_TOKEN}" \
      -d "{
        \"skillId\": \"${SKILL_ID}\",
        \"proficiencyLevel\": \"${PROF_LEVEL}\",
        \"yearsOfExperience\": ${YEARS}
      }" > /dev/null

    ((ADDED_COUNT++))
  done

  unset SEEN_SKILLS

  # Save credentials
  echo "$CANDIDATE_EMAIL" >> "${SCRIPT_TMP_DIR}/candidate-users.txt"
  echo "${CANDIDATE_EMAIL}:${CANDIDATE_PASSWORD}:${USER_ID}:${EXP_LEVEL}" >> "${SCRIPT_TMP_DIR}/candidate-credentials.txt"

  log_success "  ${first_name} ${last_name} (${EXP_LEVEL}, ${ADDED_COUNT} skills)"

  CREATED_COUNT=$((CREATED_COUNT + 1))
done

separator
log_success "Created ${CREATED_COUNT}/20 candidates with skills!"
echo ""
echo "All candidates have password: password123"
echo "Credentials saved to: ${SCRIPT_TMP_DIR}/candidate-credentials.txt"
echo "Format: email:password:userId:experienceLevel"
