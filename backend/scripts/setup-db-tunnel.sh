#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <database_id> [local_port] [remote_host]"
  exit 1
fi

DATABASE_ID=$1
LOCAL_PORT=${2:-5432}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

REMOTE_HOST=${3:-$(grep SSH_TUNNEL_HOST "$ENV_FILE" | cut -d '=' -f2)}
if [ -z "$REMOTE_HOST" ]; then
  echo "Error: SSH_TUNNEL_HOST not found in $ENV_FILE"
  exit 1
fi

# Get database connection info using the Ocean API
API_URL="http://localhost:3000/database/${DATABASE_ID}"
echo "Fetching database information from $API_URL"

if ! command -v curl &> /dev/null; then
  echo "Error: curl command not found. Please install curl."
  exit 1
fi

DB_INFO=$(curl -s "$API_URL")
if [ -z "$DB_INFO" ]; then
  echo "Error: Failed to fetch database information"
  exit 1
fi

# Extract database connection details
DB_NAME=$(echo "$DB_INFO" | grep -o '"name":"[^"]*"' | cut -d '"' -f4)
DB_PORT=$(echo "$DB_INFO" | grep -o '"port":[0-9]*' | cut -d ':' -f2)

if [ -z "$DB_NAME" ] || [ -z "$DB_PORT" ]; then
  echo "Error: Failed to extract database information"
  exit 1
fi

echo "Setting up SSH tunnel for database: $DB_NAME"

# Generate a unique remote port based on database ID
BASE_PORT=$(grep SSH_TUNNEL_BASE_PORT "$ENV_FILE" | cut -d '=' -f2 || echo "10000")
if [ -z "$BASE_PORT" ]; then
  BASE_PORT=10000
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
  PORT_OFFSET=$(echo -n "$DATABASE_ID" | md5 | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
else
  PORT_OFFSET=$(echo -n "$DATABASE_ID" | md5sum | cut -c 1-4 | xargs -I {} printf "%d" 0x{} | awk '{print $1 % 1000}')
fi

REMOTE_PORT=$((BASE_PORT + PORT_OFFSET))
MAX_PORT=$((BASE_PORT + 999))

# Check if port is already in use
while ssh tunneluser@${REMOTE_HOST} "netstat -tuln 2>/dev/null | grep -q :${REMOTE_PORT}"; do
  REMOTE_PORT=$((REMOTE_PORT + 1))
  if [ $REMOTE_PORT -gt $MAX_PORT ]; then
    echo "Error: No available ports in range $BASE_PORT to $MAX_PORT"
    exit 1
  fi
done

# Create a unique tunnel name
TUNNEL_NAME="ocean-db-${DATABASE_ID}"

# Kill any existing tunnel with the same name
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  echo "Stopping existing tunnel (PID: $PID)"
  kill $PID
  sleep 1
fi

# Start the SSH tunnel
echo "Starting SSH tunnel: localhost:$LOCAL_PORT -> $REMOTE_HOST:$REMOTE_PORT -> localhost:$DB_PORT"
ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
    -R ${REMOTE_PORT}:localhost:${DB_PORT} \
    -N -f -l tunneluser ${REMOTE_HOST} \
    -S ~/.ssh/control-${TUNNEL_NAME}.sock \
    -i ~/.ssh/id_rsa \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 &

sleep 2

# Check if tunnel is running
PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ -z "$PID" ]; then
  echo "Error: Failed to establish SSH tunnel"
  exit 1
fi

# Get the database username and password from the API
DB_USERNAME=$(echo "$DB_INFO" | grep -o '"username":"[^"]*"' | cut -d '"' -f4)
DB_PASSWORD=$(echo "$DB_INFO" | grep -o '"password":"[^"]*"' | cut -d '"' -f4)

# Update the database connection URL in the database
CONNECTION_STRING="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${REMOTE_HOST}:${REMOTE_PORT}/${DB_NAME}"
echo "SSH tunnel established successfully!"
echo "Remote database connection string: $CONNECTION_STRING"

# Store tunnel information for later use
echo "$DATABASE_ID $REMOTE_PORT $PID" > ~/.ssh/db-tunnel-${DATABASE_ID}.info

echo "Tunnel is running with PID: $PID"
echo "To stop the tunnel, run: ./stop-db-tunnel.sh $DATABASE_ID"