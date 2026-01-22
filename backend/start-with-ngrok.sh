#!/bin/bash

# Script to start backend with ngrok tunnel
# Usage: ./start-with-ngrok.sh

echo "🚀 Starting Steward backend with ngrok tunnel..."
echo ""

# Check if backend is running
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "⚠️  Backend is already running on port 3001"
  echo "   Kill it first with: lsof -ti:3001 | xargs kill -9"
  exit 1
fi

# Start backend in background
echo "📦 Starting backend server..."
npm run dev > /tmp/steward-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "❌ Backend failed to start. Check /tmp/steward-backend.log"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

echo "✅ Backend is running on port 3001"
echo ""
echo "🌐 Starting ngrok tunnel..."
echo "   (This will create a public URL for OAuth)"
echo ""

# Start ngrok
ngrok http 3001

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM





