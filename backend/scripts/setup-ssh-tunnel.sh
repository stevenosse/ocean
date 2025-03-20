#!/bin/bash

# Ocean SSH Tunnel Setup Script
# This script manages SSH tunnels for deployed applications

set -e

# Check if required arguments are provided
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <project_id> <local_port> <remote_port> [remote_host]"
  exit 1
fi

PROJECT_ID=$1
LOCAL_PORT=$2
REMOTE_PORT=$3
REMOTE_HOST=${4:-"tunnel.example.com"}

# Create a unique tunnel name based on project ID
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

# Kill existing tunnel if it exists
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
  sleep 1
fi

# Start SSH tunnel in the background
ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
    -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
    -N -f -l tunnel ${REMOTE_HOST} \
    -S ~/.ssh/control-${TUNNEL_NAME}.sock \
    -i ~/.ssh/tunnel_key \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 &

# Wait for tunnel to be established
sleep 2

# Check if tunnel is active
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ -z "$PID" ]; then
  echo "Error: Failed to establish SSH tunnel"
  exit 1
fi

# Generate the public URL
PUBLIC_URL="https://${PROJECT_ID}.${REMOTE_HOST}"

echo "Tunnel established for project $PROJECT_ID"
echo "URL: $PUBLIC_URL"