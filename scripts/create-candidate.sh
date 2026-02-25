#!/bin/bash

API_GATEWAY="http://localhost:8001"
USER_SERVICE="http://localhost:8002"
INTERNAL_TOKEN="internal-secret-token-change-in-production"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎓 Creating 20 Candidate Users with Skills${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 20 unique candidate names
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

# Experience levels
EXPERIENCE_LEVELS=("junior" "mid" "senior" "lead")

# Skill slugs (from seeded data in migrations)
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

# Proficiency levels
PROFICIENCY_LEVELS=("beginner" "intermediate" "advanced" "expert")

# Function to get random element from array
get_random() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

# Function to get skill ID by slug
get_skill_id() {
  local slug=$1
  docker exec ai-interview-postgres psql -U postgres -d ai_video_interview_user -t -c \
    "SELECT id FROM skills WHERE slug = '${slug}'" 2>/dev/null | tr -d ' \n'
}

# Clear previous credentials
rm -f /tmp/candidate-users.txt /tmp/candidate-credentials.txt

CREATED_COUNT=0

for candidate in "${CANDIDATES[@]}"; do
  IFS=':' read -r email_name first_name last_name <<< "$candidate"
  
  CANDIDATE_EMAIL="${email_name}@test.com"
  CANDIDATE_PASSWORD="password123"
  
  echo -e "${YELLOW}[$(($CREATED_COUNT + 1))/20] Creating ${first_name} ${last_name}...${NC}"
  
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
    echo -e "${RED}  ❌ Failed to create user${NC}"
    continue
  fi
  
  # Assign candidate role
  ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
    -H "Content-Type: application/json" \
    -d '{"roleName": "candidate"}')
  
  if [ "$(echo "$ROLE_RESPONSE" | jq -r '.success')" != "true" ]; then
    echo -e "${RED}  ❌ Failed to assign role${NC}"
    continue
  fi
  
  # Set random experience level
  EXP_LEVEL=$(get_random "${EXPERIENCE_LEVELS[@]}")
  
  curl -s -X PUT "${USER_SERVICE}/candidates/${USER_ID}/experience-level" \
    -H "Content-Type: application/json" \
    -H "x-internal-token: ${INTERNAL_TOKEN}" \
    -d "{\"experienceLevel\": \"${EXP_LEVEL}\"}" > /dev/null
  
  # Add 3-5 random skills
  NUM_SKILLS=$((3 + RANDOM % 3))
  ADDED_SKILLS=""
  
  for ((s=0; s<NUM_SKILLS; s++)); do
    SKILL_SLUG=$(get_random "${SKILL_SLUGS[@]}")
    
    # Skip if already added
    if [[ "$ADDED_SKILLS" == *"$SKILL_SLUG"* ]]; then
      continue
    fi
    ADDED_SKILLS="${ADDED_SKILLS}${SKILL_SLUG},"
    
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
  done
  
  # Save credentials
  echo "$CANDIDATE_EMAIL" >> /tmp/candidate-users.txt
  echo "${CANDIDATE_EMAIL}:${CANDIDATE_PASSWORD}:${USER_ID}:${EXP_LEVEL}" >> /tmp/candidate-credentials.txt
  
  echo -e "${GREEN}  ✅ ${first_name} ${last_name} (${EXP_LEVEL}, ${NUM_SKILLS} skills)${NC}"
  
  CREATED_COUNT=$((CREATED_COUNT + 1))
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Created ${CREATED_COUNT}/20 candidates with skills!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "All candidates have password: password123"
echo "Credentials saved to: /tmp/candidate-credentials.txt"
echo ""
echo "Format: email:password:userId:experienceLevel"
echo ""
