# Multi-stage build for optimal production image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage
FROM base AS production

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=app:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=app:nodejs /app/dist ./dist

# Copy package.json for version info
COPY --from=build --chown=app:nodejs /app/package.json ./

# Switch to app user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 8080, path: '/health', timeout: 2000 }; const request = http.request(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }); request.on('error', () => process.exit(1)); request.end();"

# Start the application
CMD ["node", "dist/index.js"] 