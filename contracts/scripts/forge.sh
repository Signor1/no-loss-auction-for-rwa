#!/bin/bash
# Helper script to use the correct forge binary
FORGE_PATH="/home/labidev/.foundry/bin/forge"

if [ ! -f "$FORGE_PATH" ]; then
  echo "Error: Forge not found at $FORGE_PATH"
  exit 1
fi

exec "$FORGE_PATH" "$@"
