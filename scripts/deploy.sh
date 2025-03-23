#!/bin/bash

# deploy.sh
# Script to deploy the backend (NestJS with Prisma) and frontend (NuxtJS) with ngrok on macOS

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
  echo -e "${GREEN}[INFO] $1${NC}"
}

print_error() {
  echo -e "${RED}[ERROR] $1${NC}"
  exit 1
}

# Step 1: Check and install Homebrew if not present (macOS package manager)
if ! command -v brew &> /dev/null; then
  print_status "Homebrew not found. Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || print_error "Failed to install Homebrew."
  # Add Homebrew to PATH (this might vary depending on the shell, assuming bash/zsh)
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  print_status "Homebrew is already installed."
fi

# Step 2: Check SSH key and setup if not present
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
  print_status "SSH key not found. Generating new SSH key..."
  ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/id_rsa" -N "" || print_error "Failed to generate SSH key."
else
  print_status "SSH key found."
fi

# Step 3: Check and install git if not present
if ! command -v git &> /dev/null; then
  print_status "git not found. Installing git..."
  brew install git || print_error "Failed to install git."
else
  print_status "git is already installed."
fi

# Step 4: Check and install Docker if not present
if ! command -v docker &> /dev/null; then
  print_status "Docker not found. Installing Docker..."
  brew install --cask docker || print_error "Failed to install Docker."
  print_status "Starting Docker Desktop (you may need to manually open Docker Desktop if it doesn't start)..."
  open /Applications/Docker.app || print_status "Please manually start Docker Desktop."
  # Wait for Docker to start (this might take a moment, adjust sleep time if needed)
  sleep 10
else
  print_status "Docker is already installed."
fi

# Step 4.5: Check for PostgreSQL (needed for managed database feature)
if ! command -v psql &> /dev/null; then
  print_status "PostgreSQL not found. If you plan to use the managed database feature, you should install PostgreSQL."
  read -p "Do you want to install PostgreSQL? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing PostgreSQL..."
    brew install postgresql || print_error "Failed to install PostgreSQL."
    print_status "Starting PostgreSQL service..."
    brew services start postgresql || print_error "Failed to start PostgreSQL service."
    print_status "Adding PostgreSQL bin directory to PATH..."
    echo 'export PATH="/usr/local/opt/postgresql/bin:$PATH"' >> ~/.zshrc
    export PATH="/usr/local/opt/postgresql/bin:$PATH"
  else
    print_status "Skipping PostgreSQL installation. Note that the managed database feature will not work."
  fi
else
  print_status "PostgreSQL is already installed."
  # Ensure PostgreSQL service is running
  if ! brew services list | grep postgresql | grep started &> /dev/null; then
    print_status "Starting PostgreSQL service..."
    brew services start postgresql || print_status "Failed to start PostgreSQL service. You may need to start it manually."
  fi
fi

# Step 5: Install backend dependencies (NestJS with Prisma)
print_status "Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
  print_error "package.json not found in backend directory."
fi
npm install || print_error "Failed to install backend dependencies."

# Step 6: Grant execute permissions to scripts in backend/scripts/
print_status "Granting execute permissions to scripts in backend/scripts/..."
if [ -d "scripts" ]; then
  find scripts -type f -exec chmod +x {} \; || print_error "Failed to grant execute permissions to scripts in backend/scripts/."
else
  print_status "No scripts directory found in backend. Skipping permission step."
fi

# Step 7: Build the backend (generate Prisma client and build NestJS)
print_status "Generating Prisma client..."
npx prisma generate || print_error "Failed to generate Prisma client."
print_status "Building the backend..."
npm run build || print_error "Failed to build the backend."

# Step 7.5: Create backup directory for managed databases
if command -v psql &> /dev/null; then
  print_status "Creating backup directory for managed databases..."
  # Create backup directory if specified in environment or use default
  BACKUP_DIR=${DATABASE_BACKUP_DIR:-/var/backups/ocean}
  sudo mkdir -p $BACKUP_DIR
  sudo chmod 777 $BACKUP_DIR
fi

# Step 8: Run the backend in the background on port 3000
print_status "Starting the backend on port 3000..."
export PORT=3000
npm run start:prod & || print_error "Failed to start the backend."
BACKEND_PID=$!
print_status "Backend is running with PID $BACKEND_PID on port 3000"

# Step 9: Set up SSH tunnel for the backend
print_status "Setting up SSH tunnel for backend..."
cd scripts
./setup-ssh-tunnel.sh "backend" 3000 > ssh_tunnel_backend.log 2>&1 || print_error "Failed to set up SSH tunnel for backend."

# Step 10: Extract the backend's SSH tunnel URL
print_status "Fetching backend SSH tunnel URL..."
BACKEND_SSH_URL=$(grep "Tunnel established" ssh_tunnel_backend.log | grep -o 'http://.*')
if [ -z "$BACKEND_SSH_URL" ]; then
  print_error "Failed to fetch backend SSH tunnel URL. Check ssh_tunnel_backend.log for errors."
fi

print_status "Backend SSH tunnel URL: $BACKEND_SSH_URL"

# Step 11: Install frontend dependencies (NuxtJS)
print_status "Installing frontend dependencies..."
cd ../frontend
if [ ! -f "package.json" ]; then
  print_error "package.json not found in frontend directory."
fi
npm install || print_error "Failed to install frontend dependencies."

# Step 12: Update the frontend's .env file with the backend's SSH tunnel URL
print_status "Updating frontend .env file with API_URL=$BACKEND_SSH_URL..."
if [ -f ".env" ]; then
  # Check if API_URL already exists in .env and update it
  if grep -q "^API_URL=" .env; then
    # macOS sed requires a backup file extension (e.g., .bak), even if we don't need the backup
    sed -i '' "s|^API_URL=.*|API_URL=$BACKEND_SSH_URL|" .env || print_error "Failed to update API_URL in .env."
  else
    echo "API_URL=$BACKEND_SSH_URL" >> .env || print_error "Failed to append API_URL to .env."
  fi
else
  # If .env doesn't exist, create it
  echo "API_URL=$BACKEND_SSH_URL" > .env || print_error "Failed to create .env file."
fi

# Step 13: Run the frontend on port 3001
print_status "Starting the frontend with NuxtJS on port 3001..."
export PORT=3001
npm run dev & || print_error "Failed to start the frontend."
FRONTEND_PID=$!

# Wait a bit for Nuxt to start
sleep 5

# Set up SSH tunnel for the frontend
print_status "Setting up SSH tunnel for frontend..."
cd ../backend/scripts
./setup-ssh-tunnel.sh "frontend" 3001 > ssh_tunnel_frontend.log 2>&1 || print_error "Failed to set up SSH tunnel for frontend."

# Extract the frontend's SSH tunnel URL
FRONTEND_SSH_URL=$(grep "Tunnel established" ssh_tunnel_frontend.log | grep -o 'http://.*')
if [ -z "$FRONTEND_SSH_URL" ]; then
  print_error "Failed to fetch frontend SSH tunnel URL. Check ssh_tunnel_frontend.log for errors."
fi

# Step 14: Print final status
print_status "Deployment complete!"
print_status "Backend is running (PID: $BACKEND_PID) on port 3000"
print_status "Backend is exposed at $BACKEND_SSH_URL"
print_status "Frontend is running (PID: $FRONTEND_PID) on port 3001"
print_status "Frontend is exposed at $FRONTEND_SSH_URL"

# Trap to clean up on script exit
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; ./stop-ssh-tunnel.sh "backend"; ./stop-ssh-tunnel.sh "frontend"; print_status "Stopped all processes."' EXIT

# Keep the script running to keep the processes alive
wait