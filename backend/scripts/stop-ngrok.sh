#!/bin/bash

# Ocean Ngrok Tunnel Termination Script
# This script stops ngrok tunnels for deployed applications

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
PID=$(pgrep -f "ngrok.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  echo "Stopping ngrok tunnel for project $PROJECT_ID (PID: $PID)"
  kill $PID
  echo "Ngrok tunnel stopped successfully"
  exit 0
else
  echo "No active ngrok tunnel found for project $PROJECT_ID"
  exit 0
fi