#!/bin/bash

# Ocean SSH Tunnel Termination Script
# This script stops SSH tunnels for deployed applications

set -e

# Check if required arguments are provided
if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1

# Create a unique tunnel name based on project ID
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

# Kill existing tunnel if it exists
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  echo "Stopping SSH tunnel for project $PROJECT_ID (PID: $PID)"
  kill $PID
  
  # Also close the control socket if it exists
  if [ -e "~/.ssh/control-${TUNNEL_NAME}.sock" ]; then
    ssh -S "~/.ssh/control-${TUNNEL_NAME}.sock" -O exit tunnel@localhost
  fi
  
  echo "SSH tunnel stopped successfully"
  exit 0
else
  echo "No active SSH tunnel found for project $PROJECT_ID"
  exit 0
fi