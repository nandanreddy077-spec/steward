#!/bin/sh
set -e

echo "=== Building Steward Backend ==="

# Install dependencies
if command -v npm >/dev/null 2>&1; then
  echo "Using npm to install dependencies..."
  npm install --legacy-peer-deps --include=dev
else
  echo "npm not found, trying bun..."
  bun install --no-save
fi

# Build TypeScript
echo "Building TypeScript..."
if command -v npx >/dev/null 2>&1; then
  npx tsc
elif command -v npm >/dev/null 2>&1; then
  npm run build
else
  echo "ERROR: No build tool found (npm/npx)"
  exit 1
fi

# Verify build output
if [ ! -f dist/server.js ]; then
  echo "ERROR: dist/server.js not found after build!"
  echo "Contents of dist/:"
  ls -la dist/ || echo "dist/ directory does not exist"
  exit 1
fi

echo "=== Build successful! ==="
ls -la dist/server.js

