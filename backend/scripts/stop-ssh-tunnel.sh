#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1
TUNNEL_NAME="ocean-project-${PROJECT_ID}"
REMOTE_HOST=$(grep SSH_TUNNEL_HOST backend/.env | cut -d '=' -f2)

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
  sleep 1
fi

if [ -S ~/.ssh/control-${TUNNEL_NAME}.sock ]; then
  ssh -S ~/.ssh/control-${TUNNEL_NAME}.sock -O exit tunneluser@${REMOTE_HOST} || true
  rm -f ~/.ssh/control-${TUNNEL_NAME}.sock
fi

# No need to update nginx configuration when using direct IP:port

echo "Tunnel stopped for project $PROJECT_ID"