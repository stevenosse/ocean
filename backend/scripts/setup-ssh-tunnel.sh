#!/bin/bash

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <id> <local_port> [remote_port] [remote_host] [subdomain_name]"
  echo "Note: <id> can be a project ID or a database ID (prefixed with 'db-')"
  exit 1
fi

ID=$1
LOCAL_PORT=$2
REMOTE_PORT=$3
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

REMOTE_HOST=${4:-$(grep SSH_TUNNEL_HOST "$ENV_FILE" | cut -d '=' -f2)}
if [ -z "$REMOTE_HOST" ]; then
  echo "Error: SSH_TUNNEL_HOST not found in $ENV_FILE"
  exit 1
fi

# Check if this is a database tunnel (ID starts with 'db-')
if [[ "$ID" == db-* ]]; then
  # This is a database tunnel
  DATABASE_ID=${ID#db-}
  SUBDOMAIN_NAME=${5:-"db-$DATABASE_ID"}
  TUNNEL_NAME="ocean-project-${ID}"
  echo "Setting up database tunnel for database ID: $DATABASE_ID"
else
  # This is a project tunnel
  SUBDOMAIN_NAME=${5:-$ID}
  TUNNEL_NAME="ocean-project-${ID}"
fi

if [ -z "$REMOTE_PORT" ]; then
  BASE_PORT=$(grep SSH_TUNNEL_BASE_PORT "$ENV_FILE" | cut -d '=' -f2)
  if [ -z "$BASE_PORT" ]; then
    echo "Error: SSH_TUNNEL_BASE_PORT not found in $ENV_FILE"
    exit 1
  fi
  if [[ "$OSTYPE" == "darwin"* ]]; then
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5 | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  else
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5sum | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  fi
  REMOTE_PORT=$((BASE_PORT + PORT_OFFSET))
  MAX_PORT=$((BASE_PORT + 999))
  while ssh tunneluser@${REMOTE_HOST} "netstat -tuln 2>/dev/null | grep -q :${REMOTE_PORT}"; do
    REMOTE_PORT=$((REMOTE_PORT + 1))
    if [ $REMOTE_PORT -gt $MAX_PORT ]; then
      echo "Error: No available ports in range $BASE_PORT to $MAX_PORT"
      exit 1
    fi
  done
fi

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
  sleep 1
fi

ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
    -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
    -N -f -l tunneluser ${REMOTE_HOST} \
    -S ~/.ssh/control-${TUNNEL_NAME}.sock \
    -i ~/.ssh/id_rsa \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 &

sleep 2

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ -z "$PID" ]; then
  echo "Error: Failed to establish SSH tunnel"
  exit 1
fi

ssh tunneluser@${REMOTE_HOST} "sudo sed -i '/^${SUBDOMAIN_NAME} /d' /etc/nginx/project-ports.conf && echo '$SUBDOMAIN_NAME $REMOTE_PORT;' | sudo tee -a /etc/nginx/project-ports.conf && sudo nginx -s reload"

PUBLIC_URL="http://${REMOTE_HOST}:${REMOTE_PORT}"

echo "Tunnel established for project $PROJECT_ID"
echo "Remote port: $REMOTE_PORT"
echo "URL: $PUBLIC_URL"