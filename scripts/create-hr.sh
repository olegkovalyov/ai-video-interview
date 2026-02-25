#!/bin/bash

API_GATEWAY="http://localhost:8001"
USER_SERVICE="http://localhost:8002"
INTERVIEW_SERVICE="http://localhost:8003"
INTERNAL_TOKEN="internal-secret-token-change-in-production"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fixed HR credentials
HR_EMAIL="hr@test.com"
HR_USERNAME="hr"
HR_PASSWORD="123456"
HR_FIRST_NAME="HR"
HR_LAST_NAME="Manager"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}👔 Creating HR User with Companies & Templates${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clear previous credentials
rm -f /tmp/hr-users.txt /tmp/hr-credentials.txt

# ═══════════════════════════════════════════════════════════
# STEP 1: Create HR User
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/5] Creating HR user...${NC}"

CREATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${HR_EMAIL}\",
    \"username\": \"${HR_USERNAME}\",
    \"firstName\": \"${HR_FIRST_NAME}\",
    \"lastName\": \"${HR_LAST_NAME}\",
    \"password\": \"${HR_PASSWORD}\"
  }")

KEYCLOAK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.keycloakId')
USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.userId')

if [ "$KEYCLOAK_ID" == "null" ] || [ -z "$KEYCLOAK_ID" ]; then
  echo -e "${RED}  ❌ Failed to create HR user${NC}"
  echo "$CREATE_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}  ✅ HR user created (userId: ${USER_ID})${NC}"

# ═══════════════════════════════════════════════════════════
# STEP 2: Assign HR Role
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/5] Assigning HR role...${NC}"

ROLE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/roles" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "hr"}')

if [ "$(echo "$ROLE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo -e "${RED}  ❌ Failed to assign HR role${NC}"
  exit 1
fi

echo -e "${GREEN}  ✅ HR role assigned${NC}"

# ═══════════════════════════════════════════════════════════
# STEP 3: Create 3 Companies (via User Service directly)
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/4] Creating companies...${NC}"

# Create companies one by one with proper JSON
create_company() {
  local name="$1"
  local industry="$2"
  local size="$3"
  local desc="$4"
  local location="$5"
  
  COMPANY_RESPONSE=$(curl -s -X POST "${USER_SERVICE}/companies" \
    -H "Content-Type: application/json" \
    -H "x-internal-token: ${INTERNAL_TOKEN}" \
    -d "{\"name\":\"${name}\",\"industry\":\"${industry}\",\"size\":\"${size}\",\"description\":\"${desc}\",\"location\":\"${location}\",\"createdBy\":\"${USER_ID}\"}")
  
  COMPANY_ID=$(echo "$COMPANY_RESPONSE" | jq -r '.data.companyId // .id')
  
  if [ "$COMPANY_ID" == "null" ] || [ -z "$COMPANY_ID" ]; then
    echo -e "${RED}  ❌ Failed: ${name}${NC}"
    echo "$COMPANY_RESPONSE" | head -1
  else
    echo -e "${GREEN}  ✅ Created: ${name}${NC}"
  fi
}

create_company "TechCorp Solutions" "Software Development" "51-200" "Leading software development company" "San Francisco, CA"
create_company "CloudScale Systems" "Cloud Computing" "11-50" "Cloud infrastructure and DevOps consulting" "Seattle, WA"
create_company "DataFlow Analytics" "Data Science" "11-50" "AI and ML solutions for business intelligence" "Austin, TX"

# Companies created above via create_company function

# ═══════════════════════════════════════════════════════════
# STEP 4: Create Interview Templates (via Interview Service directly)
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/4] Creating interview templates...${NC}"

# Function to create template with questions
create_template() {
  local title="$1"
  local description="$2"
  shift 2
  local questions=("$@")
  
  # Create template via Interview Service
  TEMPLATE_RESPONSE=$(curl -s -X POST "${INTERVIEW_SERVICE}/api/templates" \
    -H "Content-Type: application/json" \
    -H "x-internal-token: ${INTERNAL_TOKEN}" \
    -H "x-user-id: ${USER_ID}" \
    -H "x-user-role: hr" \
    -d "{\"title\":\"${title}\",\"description\":\"${description}\"}")
  
  TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.id')
  
  if [ "$TEMPLATE_ID" == "null" ] || [ -z "$TEMPLATE_ID" ]; then
    echo -e "${RED}  ❌ Failed to create template: ${title}${NC}"
    return 1
  fi
  
  # Add questions
  for question in "${questions[@]}"; do
    curl -s -X POST "${INTERVIEW_SERVICE}/api/templates/${TEMPLATE_ID}/questions" \
      -H "Content-Type: application/json" \
      -H "x-internal-token: ${INTERNAL_TOKEN}" \
      -H "x-user-id: ${USER_ID}" \
      -H "x-user-role: hr" \
      -d "$question" > /dev/null
  done
  
  # Publish template
  curl -s -X PUT "${INTERVIEW_SERVICE}/api/templates/${TEMPLATE_ID}/publish" \
    -H "x-internal-token: ${INTERNAL_TOKEN}" \
    -H "x-user-id: ${USER_ID}" \
    -H "x-user-role: hr" > /dev/null
  
  echo -e "${GREEN}  ✅ Created & published: ${title} (10 questions)${NC}"
}

# ─────────────────────────────────────────────────────────────
# FRONTEND TEMPLATE (5 multiple_choice + 5 text)
# ─────────────────────────────────────────────────────────────
FRONTEND_QUESTIONS=(
  '{"text":"Which of the following is NOT a JavaScript framework?","type":"multiple_choice","order":1,"timeLimit":60,"required":true,"options":[{"text":"React","isCorrect":false},{"text":"Angular","isCorrect":false},{"text":"Django","isCorrect":true},{"text":"Vue.js","isCorrect":false}]}'
  '{"text":"What does CSS stand for?","type":"multiple_choice","order":2,"timeLimit":60,"required":true,"options":[{"text":"Cascading Style Sheets","isCorrect":true},{"text":"Computer Style Sheets","isCorrect":false},{"text":"Creative Style System","isCorrect":false},{"text":"Colorful Style Sheets","isCorrect":false}]}'
  '{"text":"Which hook is used for side effects in React?","type":"multiple_choice","order":3,"timeLimit":60,"required":true,"options":[{"text":"useState","isCorrect":false},{"text":"useEffect","isCorrect":true},{"text":"useContext","isCorrect":false},{"text":"useReducer","isCorrect":false}]}'
  '{"text":"What is the virtual DOM?","type":"multiple_choice","order":4,"timeLimit":60,"required":true,"options":[{"text":"A lightweight copy of the real DOM","isCorrect":true},{"text":"A browser extension","isCorrect":false},{"text":"A CSS framework","isCorrect":false},{"text":"A database technology","isCorrect":false}]}'
  '{"text":"Which method is used to add an element to the end of an array?","type":"multiple_choice","order":5,"timeLimit":60,"required":true,"options":[{"text":"push()","isCorrect":true},{"text":"pop()","isCorrect":false},{"text":"shift()","isCorrect":false},{"text":"unshift()","isCorrect":false}]}'
  '{"text":"Explain the difference between var, let, and const in JavaScript.","type":"text","order":6,"timeLimit":120,"required":true}'
  '{"text":"What are React Hooks and why were they introduced?","type":"text","order":7,"timeLimit":120,"required":true}'
  '{"text":"Describe the concept of responsive design and how you implement it.","type":"text","order":8,"timeLimit":120,"required":true}'
  '{"text":"What is the difference between CSS Flexbox and Grid? When would you use each?","type":"text","order":9,"timeLimit":120,"required":true}'
  '{"text":"Explain how you would optimize the performance of a React application.","type":"text","order":10,"timeLimit":180,"required":true}'
)

create_template "Frontend Developer Interview" "Technical assessment for frontend developers covering React, JavaScript, CSS, and modern web development practices" "${FRONTEND_QUESTIONS[@]}"

# ─────────────────────────────────────────────────────────────
# BACKEND TEMPLATE (5 multiple_choice + 5 text)
# ─────────────────────────────────────────────────────────────
BACKEND_QUESTIONS=(
  '{"text":"Which HTTP method is idempotent?","type":"multiple_choice","order":1,"timeLimit":60,"required":true,"options":[{"text":"POST","isCorrect":false},{"text":"PUT","isCorrect":true},{"text":"PATCH","isCorrect":false},{"text":"None of the above","isCorrect":false}]}'
  '{"text":"What does ACID stand for in databases?","type":"multiple_choice","order":2,"timeLimit":60,"required":true,"options":[{"text":"Atomicity, Consistency, Isolation, Durability","isCorrect":true},{"text":"Advanced, Consistent, Integrated, Dynamic","isCorrect":false},{"text":"Automated, Controlled, Indexed, Distributed","isCorrect":false},{"text":"Atomic, Cached, Isolated, Durable","isCorrect":false}]}'
  '{"text":"Which design pattern involves a single instance of a class?","type":"multiple_choice","order":3,"timeLimit":60,"required":true,"options":[{"text":"Factory","isCorrect":false},{"text":"Observer","isCorrect":false},{"text":"Singleton","isCorrect":true},{"text":"Strategy","isCorrect":false}]}'
  '{"text":"What is the default port for PostgreSQL?","type":"multiple_choice","order":4,"timeLimit":60,"required":true,"options":[{"text":"3306","isCorrect":false},{"text":"5432","isCorrect":true},{"text":"27017","isCorrect":false},{"text":"6379","isCorrect":false}]}'
  '{"text":"Which of the following is a NoSQL database?","type":"multiple_choice","order":5,"timeLimit":60,"required":true,"options":[{"text":"PostgreSQL","isCorrect":false},{"text":"MySQL","isCorrect":false},{"text":"MongoDB","isCorrect":true},{"text":"Oracle","isCorrect":false}]}'
  '{"text":"Explain the difference between SQL and NoSQL databases. When would you choose one over the other?","type":"text","order":6,"timeLimit":120,"required":true}'
  '{"text":"What is RESTful API design? List the key principles.","type":"text","order":7,"timeLimit":120,"required":true}'
  '{"text":"Describe how you would implement authentication and authorization in a web application.","type":"text","order":8,"timeLimit":180,"required":true}'
  '{"text":"What are microservices? Explain their advantages and disadvantages.","type":"text","order":9,"timeLimit":180,"required":true}'
  '{"text":"How would you handle database migrations in a production environment?","type":"text","order":10,"timeLimit":120,"required":true}'
)

create_template "Backend Developer Interview" "Technical assessment for backend developers covering APIs, databases, system design, and server-side programming" "${BACKEND_QUESTIONS[@]}"

# ─────────────────────────────────────────────────────────────
# DEVOPS TEMPLATE (5 multiple_choice + 5 text)
# ─────────────────────────────────────────────────────────────
DEVOPS_QUESTIONS=(
  '{"text":"Which command is used to list running Docker containers?","type":"multiple_choice","order":1,"timeLimit":60,"required":true,"options":[{"text":"docker images","isCorrect":false},{"text":"docker ps","isCorrect":true},{"text":"docker list","isCorrect":false},{"text":"docker containers","isCorrect":false}]}'
  '{"text":"What is the purpose of a Kubernetes Pod?","type":"multiple_choice","order":2,"timeLimit":60,"required":true,"options":[{"text":"A deployment strategy","isCorrect":false},{"text":"The smallest deployable unit containing one or more containers","isCorrect":true},{"text":"A type of service","isCorrect":false},{"text":"A storage volume","isCorrect":false}]}'
  '{"text":"Which tool is commonly used for Infrastructure as Code?","type":"multiple_choice","order":3,"timeLimit":60,"required":true,"options":[{"text":"Jenkins","isCorrect":false},{"text":"Terraform","isCorrect":true},{"text":"Grafana","isCorrect":false},{"text":"Prometheus","isCorrect":false}]}'
  '{"text":"What does CI/CD stand for?","type":"multiple_choice","order":4,"timeLimit":60,"required":true,"options":[{"text":"Continuous Integration/Continuous Deployment","isCorrect":true},{"text":"Code Integration/Code Deployment","isCorrect":false},{"text":"Container Integration/Container Deployment","isCorrect":false},{"text":"Cloud Integration/Cloud Delivery","isCorrect":false}]}'
  '{"text":"Which AWS service is used for serverless computing?","type":"multiple_choice","order":5,"timeLimit":60,"required":true,"options":[{"text":"EC2","isCorrect":false},{"text":"S3","isCorrect":false},{"text":"Lambda","isCorrect":true},{"text":"RDS","isCorrect":false}]}'
  '{"text":"Explain the concept of containerization and how Docker works.","type":"text","order":6,"timeLimit":120,"required":true}'
  '{"text":"What is Kubernetes and why is it used? Explain its main components.","type":"text","order":7,"timeLimit":180,"required":true}'
  '{"text":"Describe a CI/CD pipeline you have implemented. What tools did you use?","type":"text","order":8,"timeLimit":180,"required":true}'
  '{"text":"How would you monitor and troubleshoot a production system? What metrics would you track?","type":"text","order":9,"timeLimit":180,"required":true}'
  '{"text":"Explain blue-green deployment and canary releases. When would you use each strategy?","type":"text","order":10,"timeLimit":120,"required":true}'
)

create_template "DevOps Engineer Interview" "Technical assessment for DevOps engineers covering Docker, Kubernetes, CI/CD, cloud infrastructure, and monitoring" "${DEVOPS_QUESTIONS[@]}"

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

# Save credentials
echo "$HR_EMAIL" > /tmp/hr-users.txt
echo "${HR_EMAIL}:${HR_PASSWORD}:${USER_ID}" > /tmp/hr-credentials.txt

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ HR setup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "HR Credentials:"
echo "  Email: ${HR_EMAIL}"
echo "  Username: ${HR_USERNAME}"
echo "  Password: ${HR_PASSWORD}"
echo ""
echo "Created:"
echo "  ✅ 3 Companies"
echo "  ✅ 3 Interview Templates (30 questions total)"
echo "     - Frontend Developer Interview"
echo "     - Backend Developer Interview"
echo "     - DevOps Engineer Interview"
echo ""
echo "Login: http://localhost:3000/login"
echo ""
