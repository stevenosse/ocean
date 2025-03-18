#!/bin/bash

# Test script to verify that environment variables trigger redeployment
# This script creates a test project, adds an environment variable, and verifies that a deployment is triggered

# Set API URL
API_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing environment variables redeployment...${NC}"

# Step 1: Create a test project
echo -e "${BLUE}Creating test project...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST "${API_URL}/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Env Project",
    "description": "Project to test environment variables redeployment",
    "repositoryUrl": "https://github.com/user/test-repo",
    "branch": "main"
  }')

# Extract project ID
PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Failed to create test project${NC}"
  exit 1
fi

echo -e "${GREEN}Created test project with ID: $PROJECT_ID${NC}"

# Step 2: Get initial deployment count
echo -e "${BLUE}Getting initial deployment count...${NC}"
INITIAL_DEPLOYMENTS=$(curl -s "${API_URL}/deployments/project/${PROJECT_ID}")
INITIAL_COUNT=$(echo $INITIAL_DEPLOYMENTS | grep -o '"id"' | wc -l)

echo -e "${GREEN}Initial deployment count: $INITIAL_COUNT${NC}"

# Step 3: Create an environment variable
echo -e "${BLUE}Creating environment variable...${NC}"
ENV_RESPONSE=$(curl -s -X POST "${API_URL}/environments" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"key\": \"TEST_VAR\",
    \"value\": \"test_value\",
    \"isSecret\": false
  }")

# Extract environment variable ID
ENV_ID=$(echo $ENV_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$ENV_ID" ]; then
  echo -e "${RED}Failed to create environment variable${NC}"
  exit 1
fi

echo -e "${GREEN}Created environment variable with ID: $ENV_ID${NC}"

# Step 4: Wait a moment for the deployment to be triggered
echo -e "${BLUE}Waiting for deployment to be triggered...${NC}"
sleep 2

# Step 5: Get final deployment count
echo -e "${BLUE}Getting final deployment count...${NC}"
FINAL_DEPLOYMENTS=$(curl -s "${API_URL}/deployments/project/${PROJECT_ID}")
FINAL_COUNT=$(echo $FINAL_DEPLOYMENTS | grep -o '"id"' | wc -l)

echo -e "${GREEN}Final deployment count: $FINAL_COUNT${NC}"

# Step 6: Verify that a new deployment was created
if [ $FINAL_COUNT -gt $INITIAL_COUNT ]; then
  echo -e "${GREEN}SUCCESS: Environment variable creation triggered a new deployment!${NC}"
else
  echo -e "${RED}FAILURE: No new deployment was triggered after creating an environment variable${NC}"
  exit 1
fi

# Step 7: Clean up (optional)
echo -e "${BLUE}Cleaning up...${NC}"
curl -s -X DELETE "${API_URL}/environments/${ENV_ID}"
# Note: We're not deleting the project to avoid cascading deletion issues

echo -e "${GREEN}Test completed successfully!${NC}"
