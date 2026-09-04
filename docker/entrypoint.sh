#!/bin/sh
set -eu

SEED_DIR="/app/docker/support-seed"
TARGET_DIR="/app/public/support"

mkdir -p "$TARGET_DIR"

if [ ! -f "$TARGET_DIR/resources.json" ]; then
  echo "Seeding support content into volume..."
  cp -a "$SEED_DIR/." "$TARGET_DIR/"
fi

exec node server/index.js
