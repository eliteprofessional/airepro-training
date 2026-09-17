#!/bin/sh
set -eu

SEED_DIR="/app/docker/training-seed"
TARGET_DIR="/app/public/training"
DATA_DIR="/app/data"

mkdir -p "$TARGET_DIR" "$DATA_DIR"

if [ ! -f "$TARGET_DIR/resources.json" ]; then
  echo "Seeding legacy markdown training content into volume..."
  cp -a "$SEED_DIR/." "$TARGET_DIR/"
fi

exec node --experimental-sqlite server/index.js
