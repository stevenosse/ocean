#!/bin/bash

set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project_id>"
  exit 1
fi

PROJECT_ID=$1
TUNNEL_NAME="ocean-project-${PROJECT_ID}"

PID=$(pgrep -f "ssh.*${TUNNEL_NAME}" || true)
if [ ! -z "$PID" ]; then
  kill $PID
  sleep 1
fi

if [ -S ~/.ssh/control-${TUNNEL_NAME}.sock ]; then
  ssh -S ~/.ssh/control-${TUNNEL_NAME}.sock -O exit tunneluser@64.226.86.82 || true
  rm -f ~/.ssh/control-${TUNNEL_NAME}.sock
fi

echo "Tunnel stopped for project $PROJECT_ID"