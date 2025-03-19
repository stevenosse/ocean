#!/bin/bash

# Ocean Ngrok Setup Script
# This script manages ngrok tunnels for deployed applications

set -e

# Check if required arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <project_id> <port> [domain]"
  exit 1
fi

PROJECT_ID=$1
PORT=$2
DOMAIN=${3:-""}

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo "Error: ngrok is not installed. Please install it first."
  exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
  echo "Error: ngrok is not authenticated. Please run 'ngrok config add-authtoken YOUR_TOKEN' first."
  exit 1
fi

# Create a unique tunnel name based on project ID
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

# Kill existing tunnel if it exists
PID=$(pgrep -f "ngrok.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
fi

# Start ngrok tunnel
if [ -z "$DOMAIN" ]; then
  # Start without custom domain
  ngrok http --log=stdout --log-level=info --name="$TUNNEL_NAME" $PORT > /dev/null 2>&1 &
else
  # Start with custom domain
  ngrok http --log=stdout --log-level=info --name="$TUNNEL_NAME" --domain="$DOMAIN" $PORT > /dev/null 2>&1 &
fi

# Wait for tunnel to be established
sleep 2

# Get tunnel URL using ngrok API
TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*')

if [ -z "$TUNNEL_URL" ]; then
  echo "Error: Failed to get tunnel URL"
  exit 1
fi

echo "Tunnel established for project $PROJECT_ID"
echo "URL: $TUNNEL_URL"