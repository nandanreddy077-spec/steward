FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
# Note: This Dockerfile assumes build context is the backend/ directory
# For Railway: Use backend/ prefix in COPY commands
# For Render: Set Root Directory to 'backend' and use paths without prefix
COPY package*.json .npmrc ./

# Install dependencies including devDependencies (needed for TypeScript)
RUN npm install --legacy-peer-deps --include=dev

# Copy source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to dist/
RUN npm run build

# Verify build output exists
RUN ls -la dist/ && test -f dist/server.js || (echo "Build failed: dist/server.js not found" && exit 1)

# Expose port (Render uses PORT env var, defaults to 10000)
EXPOSE 10000

# Start the application
CMD ["node", "dist/server.js"]

