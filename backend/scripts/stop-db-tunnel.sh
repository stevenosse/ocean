#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <database_id>"
  exit 1
fi

DATABASE_ID=$1
TUNNEL_NAME="ocean-db-${DATABASE_ID}"
INFO_FILE="~/.ssh/db-tunnel-${DATABASE_ID}.info"

# Check if tunnel info file exists
if [ -f "$INFO_FILE" ]; then
  # Read tunnel information
  read -r DB_ID REMOTE_PORT PID < "$INFO_FILE"
  
  # Kill the tunnel process
  if [ ! -z "$PID" ] && ps -p "$PID" > /dev/null; then
    echo "Stopping SSH tunnel for database $DATABASE_ID (PID: $PID)"
    kill "$PID"
    rm "$INFO_FILE"
    echo "SSH tunnel stopped successfully"
  else
    echo "SSH tunnel process is not running"
    rm "$INFO_FILE"
  fi
else
  # Try to find the process by pattern
  PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
  if [ ! -z "$PID" ]; then
    echo "Stopping SSH tunnel for database $DATABASE_ID (PID: $PID)"
    kill "$PID"
    echo "SSH tunnel stopped successfully"
  else
    echo "No active SSH tunnel found for database $DATABASE_ID"
  fi
fi