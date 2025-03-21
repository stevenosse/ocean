#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1
TUNNEL_NAME="ocean-project-${PROJECT_ID}"
REMOTE_HOST=$(grep SSH_TUNNEL_HOST "$(dirname "$(dirname "$0")")/.env" | cut -d '=' -f2)

echo "Stopping tunnel for project $PROJECT_ID"

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  echo "Killing SSH tunnel process with PID $PID"
  kill $PID 2>/dev/null || true
  
  for i in {1..5}; do
    if ! ps -p $PID > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  
  if ps -p $PID > /dev/null 2>&1; then
    echo "Force killing SSH tunnel process with PID $PID"
    kill -9 $PID 2>/dev/null || true
  fi
fi

if [ -S ~/.ssh/control-${TUNNEL_NAME}.sock ]; then
  echo "Cleaning up control socket for $TUNNEL_NAME"
  timeout 5s ssh -S ~/.ssh/control-${TUNNEL_NAME}.sock -O exit tunneluser@${REMOTE_HOST} 2>/dev/null || true
  rm -f ~/.ssh/control-${TUNNEL_NAME}.sock 2>/dev/null || true
fi

timeout 10s ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 tunneluser@${REMOTE_HOST} \
  "sudo sed -i '/^${PROJECT_ID} [0-9]\+;$/d' /etc/nginx/project-ports.conf && sudo nginx -s reload"

if [ $? -ne 0 ]; then
  echo "Error: Failed to update Nginx configuration"
  exit 1
fi

echo "Tunnel stopped for project $PROJECT_ID"