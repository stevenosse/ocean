#!/bin/bash

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <project_id> <local_port> [remote_port] [remote_host] [subdomain_name]"
  exit 1
fi

PROJECT_ID=$1
LOCAL_PORT=$2
REMOTE_PORT=$3
REMOTE_HOST=${4:-$(grep SSH_TUNNEL_HOST "$(dirname "$(dirname "$0")")/.env" | cut -d '=' -f2)}
SUBDOMAIN_NAME=${5:-$PROJECT_ID}
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

if [ -z "$REMOTE_PORT" ]; then
  BASE_PORT=$(grep SSH_TUNNEL_BASE_PORT "$(dirname "$(dirname "$0")")/.env" | cut -d '=' -f2)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5 | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  else
    PORT_OFFSET=$(echo -n "$PROJECT_ID" | md5sum | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
  fi
  REMOTE_PORT=$((BASE_PORT + PORT_OFFSET))
fi

echo "Starting tunnel setup for project $PROJECT_ID on port $REMOTE_PORT"

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  echo "Killing existing tunnel with PID $PID"
  kill $PID
  sleep 1
fi

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
else
  echo "Warning: Neither timeout nor gtimeout found. Proceeding without timeout."
fi

if [ -n "$TIMEOUT_CMD" ]; then
  $TIMEOUT_CMD 15s ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
      -o BatchMode=yes \
      -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
      -N -f -l tunneluser ${REMOTE_HOST} \
      -S ~/.ssh/control-${TUNNEL_NAME}.sock \
      -i ~/.ssh/id_rsa \
      -o ServerAliveInterval=60 \
      -o ServerAliveCountMax=3 \
      -o ConnectTimeout=5 &
else
  ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
      -o BatchMode=yes \
      -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
      -N -f -l tunneluser ${REMOTE_HOST} \
      -S ~/.ssh/control-${TUNNEL_NAME}.sock \
      -i ~/.ssh/id_rsa \
      -o ServerAliveInterval=60 \
      -o ServerAliveCountMax=3 \
      -o ConnectTimeout=5 &
fi

if [ $? -ne 0 ]; then
  echo "Error: SSH tunnel command failed"
  exit 1
fi

for i in {1..5}; do
  sleep 1
  PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
  if [ ! -z "$PID" ]; then
    echo "SSH tunnel process started with PID $PID"
    break
  fi
  if [ $i -eq 5 ]; then
    echo "Error: Timed out waiting for SSH tunnel to establish"
    exit 1
  fi
done

if [ -z "$PID" ]; then
  echo "Error: Failed to establish SSH tunnel"
  exit 1
fi

if [ -n "$TIMEOUT_CMD" ]; then
  $TIMEOUT_CMD 10s ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 tunneluser@${REMOTE_HOST} \
    "sudo sed -i '/^${SUBDOMAIN_NAME} /d' /etc/nginx/project-ports.conf && echo '$SUBDOMAIN_NAME $REMOTE_PORT;' | sudo tee -a /etc/nginx/project-ports.conf && sudo nginx -s reload"
else
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 tunneluser@${REMOTE_HOST} \
    "sudo sed -i '/^${SUBDOMAIN_NAME} /d' /etc/nginx/project-ports.conf && echo '$SUBDOMAIN_NAME $REMOTE_PORT;' | sudo tee -a /etc/nginx/project-ports.conf && sudo nginx -s reload"
fi

if [ $? -ne 0 ]; then
  echo "Error: Failed to update Nginx configuration"
  exit 1
fi

PUBLIC_URL="http://${REMOTE_HOST}:${REMOTE_PORT}"

echo "Tunnel established for project $PROJECT_ID"
echo "Remote port: $REMOTE_PORT"
echo "URL: $PUBLIC_URL"