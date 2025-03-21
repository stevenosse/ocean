#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1
TUNNEL_NAME="ocean-project-${PROJECT_ID}"
REMOTE_HOST=$(grep SSH_TUNNEL_HOST backend/.env | cut -d '=' -f2)

# Try to find and kill the SSH process
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  # Send SIGTERM first
  kill $PID 2>/dev/null || true
  
  # Wait up to 5 seconds for process to terminate
  for i in {1..5}; do
    if ! ps -p $PID > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  
  # Force kill if still running
  if ps -p $PID > /dev/null 2>&1; then
    kill -9 $PID 2>/dev/null || true
  fi
fi

# Clean up control socket
if [ -S ~/.ssh/control-${TUNNEL_NAME}.sock ]; then
  timeout 5s ssh -S ~/.ssh/control-${TUNNEL_NAME}.sock -O exit tunneluser@${REMOTE_HOST} 2>/dev/null || true
  rm -f ~/.ssh/control-${TUNNEL_NAME}.sock 2>/dev/null || true
fi

ssh tunneluser@${REMOTE_HOST} "sudo sed -i '/^${PROJECT_ID} [0-9]\+;$/d' /etc/nginx/project-ports.conf && sudo nginx -s reload"

echo "Tunnel stopped for project $PROJECT_ID"