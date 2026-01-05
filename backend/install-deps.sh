#!/bin/bash
cd "$(dirname "$0")"

echo "Installing backend dependencies..."

npm install \
  @hono/node-server@^1.13.7 \
  @supabase/supabase-js@^2.39.0 \
  cors@^2.8.5 \
  dotenv@^16.3.1 \
  express@^4.18.2 \
  express-rate-limit@^7.4.1 \
  google-auth-library@^9.15.0 \
  googleapis@^126.0.1 \
  hono@^4.6.14 \
  openai@^4.20.1

npm install --save-dev \
  @types/cors@^2.8.17 \
  @types/express@^4.17.21 \
  @types/node@^20.10.5 \
  nodemon@^3.0.2 \
  ts-node@^10.9.2 \
  typescript@^5.3.3

echo "✅ Backend dependencies installed successfully!"
