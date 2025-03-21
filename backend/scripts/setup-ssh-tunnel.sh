#!/bin/bash

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <project_id> <local_port> [remote_port] [remote_host] [subdomain_name]"
  exit 1
fi

PROJECT_ID=$1
LOCAL_PORT=$2
REMOTE_PORT=$3
REMOTE_HOST=${4:-$(grep SSH_TUNNEL_HOST backend/.env | cut -d '=' -f2)}
SUBDOMAIN_NAME=${5:-$PROJECT_ID}
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

if [ -z "$REMOTE_PORT" ]; then
  BASE_PORT=$(grep SSH_TUNNEL_BASE_PORT backend/.env | cut -d '=' -f2)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5 | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  else
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5sum | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  fi
  REMOTE_PORT=$((BASE_PORT + PORT_OFFSET))
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