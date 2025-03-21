#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

REMOTE_HOST=$(grep SSH_TUNNEL_HOST "$ENV_FILE" | cut -d '=' -f2)
if [ -z "$REMOTE_HOST" ]; then
  echo "Error: SSH_TUNNEL_HOST not found in $ENV_FILE"
  exit 1
fi

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
  sleep 1
fi

if [ -S ~/.ssh/control-${TUNNEL_NAME}.sock ]; then
  ssh -S ~/.ssh/control-${TUNNEL_NAME}.sock -O exit tunneluser@${REMOTE_HOST} || true
  rm -f ~/.ssh/control-${TUNNEL_NAME}.sock
fi

ssh tunneluser@${REMOTE_HOST} "sudo sed -i '/^${PROJECT_ID} [0-9]\+;$/d' /etc/nginx/project-ports.conf && sudo nginx -s reload"

echo "Tunnel stopped for project $PROJECT_ID"