#!/bin/bash

# =============================================================================
# AI Video Interview Platform - Port Cleanup Script
# Kills processes running on all service ports
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Port Cleanup for AI Video Interview services"

kill_port() {
  local port=$1
  local service_name=$2

  # lsof can return multiple PIDs (parent + child processes), one per line
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)

  if [ -z "$pids" ]; then
    log_success "Port $port is already free ($service_name)"
    return 0
  fi

  local pid_list
  pid_list=$(echo "$pids" | tr '\n' ' ')
  log_warn "Found process(es) ${pid_list}using port $port ($service_name)"

  # Send SIGTERM to all PIDs
  echo "$pids" | while read -r pid; do
    [ -z "$pid" ] && continue
    if kill -TERM "$pid" 2>/dev/null; then
      echo "   Sent SIGTERM to $pid"
    fi
  done

  # Wait up to 3 seconds for graceful shutdown
  local count=0
  while [ $count -lt 3 ]; do
    local still_alive=false
    echo "$pids" | while read -r pid; do
      [ -z "$pid" ] && continue
      kill -0 "$pid" 2>/dev/null && echo "alive"
    done | grep -q "alive" && still_alive=true

    if [ "$still_alive" = false ]; then
      break
    fi
    sleep 1
    ((count++))
  done

  # Force kill any remaining
  echo "$pids" | while read -r pid; do
    [ -z "$pid" ] && continue
    if kill -0 "$pid" 2>/dev/null; then
      echo "   Force killing $pid..."
      kill -KILL "$pid" 2>/dev/null || true
    fi
  done

  # Verify port is free
  sleep 0.5
  if lsof -ti tcp:"$port" &>/dev/null; then
    log_error "   Failed to free port $port"
    return 1
  else
    log_success "   Freed port $port"
  fi
}

for i in "${!SERVICE_PORTS[@]}"; do
  kill_port "${SERVICE_PORTS[$i]}" "${SERVICE_NAMES[$i]}"
done

separator
log_success "Port cleanup completed!"
echo ""
echo "You can now safely run:"
echo "  npm run dev:services"
echo "  npm run dev:all"
