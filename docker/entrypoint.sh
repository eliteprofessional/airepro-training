#!/bin/sh
set -eu

SEED_DIR="/app/docker/training-seed"
TARGET_DIR="/app/public/training"

mkdir -p "$TARGET_DIR"

if [ ! -f "$TARGET_DIR/resources.json" ]; then
  echo "Seeding training content into volume..."
  cp -a "$SEED_DIR/." "$TARGET_DIR/"
fi

exec node server/index.js
