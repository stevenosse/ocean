#!/bin/bash

# Ocean Deployment Script
# This script handles the deployment process for Ocean projects

set -e

# Check if required arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <repository_url> <project_id> [branch] [compose_file] [service_name]"
  exit 1
fi

REPO_URL=$1
PROJECT_ID=$2
BRANCH=${3:-main}
COMPOSE_FILE=${4:-docker-compose.yml}
SERVICE_NAME=$5

# Set up directories
BASE_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")" # Ocean root directory
REPO_DIR="$BASE_DIR/repos/project-$PROJECT_ID"
LOG_FILE="$BASE_DIR/logs/deployment-$(date +%Y%m%d%H%M%S).log"

# Create directories if they don't exist
mkdir -p "$BASE_DIR/repos"
mkdir -p "$BASE_DIR/logs"

echo "Starting deployment for project $PROJECT_ID from $REPO_URL" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"

# Clone or pull repository
if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repository..." | tee -a "$LOG_FILE"
  git clone "$REPO_URL" "$REPO_DIR" 2>&1 | tee -a "$LOG_FILE"
else
  echo "Pulling latest changes..." | tee -a "$LOG_FILE"
  cd "$REPO_DIR" && git pull 2>&1 | tee -a "$LOG_FILE"
fi

# Checkout specific branch if provided
echo "Checking out branch: $BRANCH" | tee -a "$LOG_FILE"
cd "$REPO_DIR" && git checkout "$BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Get latest commit information
COMMIT_HASH=$(cd "$REPO_DIR" && git rev-parse HEAD)
COMMIT_MESSAGE=$(cd "$REPO_DIR" && git log -1 --pretty=%B)

echo "Commit: $COMMIT_HASH" | tee -a "$LOG_FILE"

# Get container port from docker-compose or default to 3000
if [ -f "$REPO_DIR/$COMPOSE_FILE" ]; then
  PORT=$(grep -o 'ports:.*".*:.*"' "$REPO_DIR/$COMPOSE_FILE" | grep -o '[0-9]\+:[0-9]\+' | cut -d':' -f2 || echo "3000")
else
  PORT="3000"
fi

# Set up ngrok tunnel
echo "Setting up ngrok tunnel for port $PORT..." | tee -a "$LOG_FILE"
NGROK_OUTPUT=$($BASE_DIR/scripts/setup-ngrok.sh "$PROJECT_ID" "$PORT" 2>&1)
echo "$NGROK_OUTPUT" | tee -a "$LOG_FILE"

# Extract and store the tunnel URL
TUNNEL_URL=$(echo "$NGROK_OUTPUT" | grep "URL:" | cut -d' ' -f2)
if [ ! -z "$TUNNEL_URL" ]; then
    echo "Application URL: $TUNNEL_URL" | tee -a "$LOG_FILE"
    echo "Updating application URL in database..." | tee -a "$LOG_FILE"
    cd "$BASE_DIR" && npx prisma query "UPDATE Project SET application_url = '$TUNNEL_URL', updated_at = NOW() WHERE id = $PROJECT_ID" | tee -a "$LOG_FILE"
    echo "Successfully updated application URL in database" | tee -a "$LOG_FILE"
else
    echo "Warning: No tunnel URL was obtained from ngrok" | tee -a "$LOG_FILE"
fi
echo "Message: $COMMIT_MESSAGE" | tee -a "$LOG_FILE"

# Deploy using Docker Compose
echo "Deploying with Docker Compose..." | tee -a "$LOG_FILE"
if [ -f "$REPO_DIR/$COMPOSE_FILE" ]; then
  cd "$REPO_DIR" && docker-compose -f "$COMPOSE_FILE" up -d $SERVICE_NAME 2>&1 | tee -a "$LOG_FILE"
  DEPLOY_STATUS=$?
  
  if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "Deployment successful!" | tee -a "$LOG_FILE"
  else
    echo "Deployment failed with status $DEPLOY_STATUS" | tee -a "$LOG_FILE"
    exit $DEPLOY_STATUS
  fi
else
  echo "Error: Docker Compose file not found at $REPO_DIR/$COMPOSE_FILE" | tee -a "$LOG_FILE"
  exit 1
fi

echo "Deployment completed at $(date)" | tee -a "$LOG_FILE"