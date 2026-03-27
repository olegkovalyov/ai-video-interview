#!/bin/bash

# =============================================================================
# AI Video Interview Platform - Common Shell Library
# Source this file in all scripts: source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
# =============================================================================

set -e

# -- Colors -------------------------------------------------------------------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -- Service URLs (overridable via env) ---------------------------------------
API_GATEWAY="${API_GATEWAY:-http://localhost:8001}"
USER_SERVICE="${USER_SERVICE:-http://localhost:8002}"
INTERVIEW_SERVICE="${INTERVIEW_SERVICE:-http://localhost:8003}"
MEDIA_SERVICE="${MEDIA_SERVICE:-http://localhost:8004}"
AI_ANALYSIS_SERVICE="${AI_ANALYSIS_SERVICE:-http://localhost:8005}"
WEB_APP="${WEB_APP:-http://localhost:3000}"

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-ai-video-interview}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin123}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-ai-video-interview-app}"

INTERNAL_TOKEN="${INTERNAL_TOKEN:-internal-secret-token-change-in-production}"

# -- Docker container names ---------------------------------------------------
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ai-interview-postgres}"
KAFKA_CONTAINER="${KAFKA_CONTAINER:-ai-interview-kafka}"

# -- Service ports (for cleanup) ----------------------------------------------
SERVICE_PORTS=(3000 8001 8002 8003 8004 8005)
SERVICE_NAMES=("Web App" "API Gateway" "User Service" "Interview Service" "Media Service" "AI Analysis Service")

# -- Temp file directory ------------------------------------------------------
SCRIPT_TMP_DIR="/tmp/ai-video-interview"
mkdir -p "$SCRIPT_TMP_DIR"

# -- Resolve SCRIPT_DIR for the calling script --------------------------------
# Usage: SCRIPT_DIR is set to the directory of the script that sourced common.sh
if [ -z "$SCRIPT_DIR" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
fi

# -- Helper functions ---------------------------------------------------------

log_info() {
  echo -e "${BLUE}$1${NC}"
}

log_success() {
  echo -e "${GREEN}$1${NC}"
}

log_warn() {
  echo -e "${YELLOW}$1${NC}"
}

log_error() {
  echo -e "${RED}$1${NC}"
}

log_step() {
  local current=$1
  local total=$2
  local message=$3
  echo -e "${YELLOW}[${current}/${total}] ${message}${NC}"
}

header() {
  echo ""
  echo -e "${BLUE}$1${NC}"
  echo ""
}

separator() {
  echo ""
}

# Check that a command exists
require_cmd() {
  local cmd=$1
  if ! command -v "$cmd" &> /dev/null; then
    log_error "Required command '$cmd' not found. Please install it."
    exit 1
  fi
}

# Check that a Docker container is running
require_container() {
  local container=$1
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    log_error "Docker container '${container}' is not running."
    echo "Start infrastructure first: npm run infra:up / npm run kafka:up"
    exit 1
  fi
}

# Check that a service is reachable (via /health or just TCP)
require_service() {
  local name=$1
  local url=$2
  if ! curl -s --max-time 3 "${url}/health" > /dev/null 2>&1; then
    log_error "Service '${name}' is not reachable at ${url}"
    exit 1
  fi
}

# Get Keycloak admin token
get_keycloak_admin_token() {
  local token
  token=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN_USER}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

  if [ -z "$token" ] || [ "$token" == "null" ]; then
    log_error "Failed to get Keycloak admin token"
    exit 1
  fi
  echo "$token"
}

# Get user JWT token via Keycloak direct grant (password flow)
# Usage: TOKEN=$(get_user_token "email@example.com" "password123")
get_user_token() {
  local email=$1
  local password=$2
  local response
  response=$(curl -s -X POST "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${email}" \
    -d "password=${password}" \
    -d "grant_type=password" \
    -d "client_id=${KEYCLOAK_CLIENT_ID}")

  local token
  token=$(echo "$response" | jq -r '.access_token')

  if [ -z "$token" ] || [ "$token" == "null" ]; then
    local error_desc
    error_desc=$(echo "$response" | jq -r '.error_description // .error // "Unknown error"')
    log_error "Failed to get user token: ${error_desc}"
    return 1
  fi
  echo "$token"
}

# Get a fresh admin operator token (creates operator if needed in step 01)
# Usage: TOKEN=$(get_operator_token)
get_operator_token() {
  get_user_token "operator@example.com" "operator123"
}

# Run SQL against a specific service database via Docker
run_sql() {
  local database=$1
  local sql=$2
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d "$database" -t -c "$sql" 2>/dev/null
}

# Run SQL (formatted output, for display)
run_sql_display() {
  local database=$1
  local sql=$2
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d "$database" -c "$sql" 2>/dev/null
}

# Check JSON response for success
check_response_field() {
  local response=$1
  local field=$2
  local value
  value=$(echo "$response" | jq -r "$field")
  if [ "$value" == "null" ] || [ -z "$value" ]; then
    return 1
  fi
  echo "$value"
}

# Prerequisite checks
require_cmd curl
require_cmd jq
require_cmd docker
