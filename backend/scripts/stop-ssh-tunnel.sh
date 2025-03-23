#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <id>"
  echo "Note: <id> can be a project ID or a database ID (prefixed with 'db-')"
  exit 1
fi

ID=$1
TUNNEL_NAME="ocean-project-${ID}"

# Check if this is a database tunnel (ID starts with 'db-')
if [[ "$ID" == db-* ]]; then
  # This is a database tunnel
  DATABASE_ID=${ID#db-}
  echo "Stopping database tunnel for database ID: $DATABASE_ID"
else
  # This is a project tunnel
  echo "Stopping project tunnel for project ID: $ID"
fi

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

# Only update nginx config for project tunnels, not database tunnels
if [[ "$ID" != db-* ]]; then
  ssh tunneluser@${REMOTE_HOST} "sudo sed -i '/^${ID} [0-9]\+;$/d' /etc/nginx/project-ports.conf && sudo nginx -s reload"
  echo "Tunnel stopped for project $ID"
else
  echo "Tunnel stopped for database ${ID#db-}"
fi