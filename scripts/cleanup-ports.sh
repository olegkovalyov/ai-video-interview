#!/bin/bash

# AI Video Interview Platform - Port Cleanup Script
# This script kills processes running on default service ports

set -e

# Define the ports used by services
PORTS=(8000 8001 8002 8003)
SERVICE_NAMES=("API Gateway" "User Service" "Interview Service" "Web App")

echo "🧹 Cleaning up ports for AI Video Interview services..."

# Function to kill process on a specific port
kill_port() {
  local port=$1
  local service_name=$2
  
  # Find process ID using the port
  local pid=$(lsof -ti tcp:$port 2>/dev/null || echo "")
  
  if [ -n "$pid" ]; then
    echo "⚠️ Found process $pid using port $port ($service_name)"
    
    # Try graceful termination first
    if kill -TERM $pid 2>/dev/null; then
      echo "   Sent SIGTERM to process $pid"
      
      # Wait up to 3 seconds for graceful shutdown
      local count=0
      while [ $count -lt 3 ] && kill -0 $pid 2>/dev/null; do
        sleep 1
        ((count++))
      done
      
      # Force kill if still running
      if kill -0 $pid 2>/dev/null; then
        echo "   Process still running, force killing..."
        kill -KILL $pid 2>/dev/null || true
      fi
    else
      echo "   Could not send SIGTERM, trying SIGKILL..."
      kill -KILL $pid 2>/dev/null || true
    fi
    
    # Verify the process is gone
    if kill -0 $pid 2>/dev/null; then
      echo "   ❌ Failed to kill process $pid on port $port"
      return 1
    else
      echo "   ✅ Successfully freed port $port"
    fi
  else
    echo "✅ Port $port is already free ($service_name)"
  fi
}

# Clean up each port
for i in "${!PORTS[@]}"; do
  kill_port "${PORTS[$i]}" "${SERVICE_NAMES[$i]}"
done

echo ""
echo "🎉 Port cleanup completed!"
echo ""
echo "You can now safely run:"
echo "  npm run dev:services"
echo "  npm run dev:all"
