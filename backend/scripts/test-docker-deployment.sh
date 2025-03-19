#!/bin/bash

# Test script to verify Docker deployment with subdirectories
# This script tests the deployment process for a project with a package.json in a subdirectory

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Docker deployment with subdirectory structure...${NC}"

# Get the project ID from the database
PROJECT_ID=$(cd /Users/steve/Projets/ocean && npx prisma query "SELECT id FROM Project LIMIT 1" | grep -o '[0-9]*')

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}No project found in the database.${NC}"
  exit 1
fi

echo -e "${BLUE}Using project ID: $PROJECT_ID${NC}"

# Check if package.json exists in the subdirectory
REPO_DIR="/Users/steve/Projets/ocean/repos/project-$PROJECT_ID"
SUBDIRECTORY="scene7-backend"
PACKAGE_JSON_PATH="$REPO_DIR/$SUBDIRECTORY/package.json"

if [ -f "$PACKAGE_JSON_PATH" ]; then
  echo -e "${GREEN}Found package.json at: $PACKAGE_JSON_PATH${NC}"
else
  echo -e "${RED}No package.json found at: $PACKAGE_JSON_PATH${NC}"
  exit 1
fi

# Update the project's root folder in the database
echo -e "${BLUE}Updating project root folder to: /$SUBDIRECTORY${NC}"
cd /Users/steve/Projets/ocean && npx prisma query "UPDATE Project SET rootFolder = '/$SUBDIRECTORY' WHERE id = $PROJECT_ID"

# Trigger a deployment
echo -e "${BLUE}Triggering a deployment...${NC}"
DEPLOYMENT_ID=$(cd /Users/steve/Projets/ocean && npx prisma query "INSERT INTO Deployment (projectId, status, message) VALUES ($PROJECT_ID, 'pending', 'Test deployment') RETURNING id" | grep -o '[0-9]*')

if [ -z "$DEPLOYMENT_ID" ]; then
  echo -e "${RED}Failed to create deployment.${NC}"
  exit 1
fi

echo -e "${GREEN}Created deployment with ID: $DEPLOYMENT_ID${NC}"
echo -e "${BLUE}Waiting for deployment to complete...${NC}"

# Wait for the deployment to finish
MAX_WAIT=60
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
  STATUS=$(cd /Users/steve/Projets/ocean && npx prisma query "SELECT status FROM Deployment WHERE id = $DEPLOYMENT_ID" | grep -o 'success\|failed\|pending')
  
  if [ "$STATUS" = "success" ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}Deployment failed.${NC}"
    cd /Users/steve/Projets/ocean && npx prisma query "SELECT logs FROM Deployment WHERE id = $DEPLOYMENT_ID"
    exit 1
  fi
  
  echo -e "${BLUE}Deployment status: $STATUS - waiting...${NC}"
  WAIT_TIME=$((WAIT_TIME + 5))
  sleep 5
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
  echo -e "${RED}Timed out waiting for deployment to complete.${NC}"
  exit 1
fi

# Check if the Docker container is running
CONTAINER_NAME="ocean-project-$PROJECT_ID"
CONTAINER_RUNNING=$(docker ps | grep $CONTAINER_NAME | wc -l)

if [ $CONTAINER_RUNNING -gt 0 ]; then
  echo -e "${GREEN}Docker container $CONTAINER_NAME is running!${NC}"
  echo -e "${GREEN}Deployment test passed!${NC}"
else
  echo -e "${RED}Docker container $CONTAINER_NAME is not running.${NC}"
  echo -e "${RED}Deployment test failed.${NC}"
  exit 1
fi

echo -e "${BLUE}Test completed.${NC}"
