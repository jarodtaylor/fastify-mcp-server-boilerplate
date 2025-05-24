# Production Deployment Guide

This guide covers deploying your MCP server to production environments with proper configuration, monitoring, and security.

## Production Readiness Checklist

### ✅ **Build & Performance**
- [x] **Modern bundling** with tsup (esbuild-based)
- [x] **Tree shaking** and minification in production
- [x] **Source maps** for debugging
- [x] **No .js extensions** required (bundler handles resolution)
- [x] **Fast builds** (~40ms) and small bundles (~3.6KB minified)

### ✅ **Configuration & Environment**
- [x] **Environment validation** with typed configuration
- [x] **Structured logging** with pino (JSON in production, pretty in dev)
- [x] **Graceful shutdown** handling
- [x] **Health checks** with detailed system metrics
- [x] **Request tracing** with unique request IDs

### ✅ **Containerization**
- [x] **Multi-stage Docker builds** for optimal image size
- [x] **Non-root user** for security
- [x] **Health checks** built into container
- [x] **Docker Compose** for easy deployment

### 🚧 **Still Needed** (Phase 3)
- [ ] **Unit & integration tests** 
- [ ] **Rate limiting** and security middleware
- [ ] **Metrics & monitoring** (Prometheus/OpenTelemetry)
- [ ] **CI/CD pipeline**

## Environment Configuration

### Required Environment Variables

```bash
# Server Configuration
PORT=8080                    # Server port (default: 8080)
HOST=localhost              # Server host (default: localhost)
NODE_ENV=production         # Environment: development|production|test

# Logging
LOG_LEVEL=info              # Log level: trace|debug|info|warn|error|fatal

# MCP Configuration  
MCP_ENDPOINT=/mcp           # MCP endpoint path (default: /mcp)
HEALTH_ENDPOINT=/health     # Health check endpoint (default: /health)
```

### Production Environment Example

```bash
# .env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
MCP_ENDPOINT=/mcp
HEALTH_ENDPOINT=/health
```

## Deployment Options

### Option 1: Docker (Recommended)

```bash
# Build production image
docker build -t mcp-server:latest .

# Run container
docker run -d \
  --name mcp-server \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  mcp-server:latest
```

### Option 2: Docker Compose

```bash
# Production deployment
docker-compose up -d mcp-server

# Development with hot reload  
docker-compose --profile dev up mcp-dev
```

### Option 3: Direct Node.js

```bash
# Build for production
npm run build:prod

# Start with production environment
NODE_ENV=production PORT=8080 node dist/index.js
```

## Health Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "name": "mcp-server",
  "uptime": "123s",
  "memory": {
    "rss": "45MB",
    "heapUsed": "12MB", 
    "heapTotal": "18MB"
  },
  "environment": "production"
}
```

### Container Health Checks

Docker automatically monitors container health:

```bash
# Check container health status
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' mcp-server
```

## Logging & Observability

### Structured Logging

Production logs are JSON-formatted for easy parsing:

```json
{
  "level": 30,
  "time": 1640995200000,
  "msg": "Server started successfully",
  "config": {
    "name": "mcp-server",
    "version": "1.0.0",
    "environment": "production",
    "port": 8080
  }
}
```

### Log Aggregation

**ELK Stack Example:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  mcp-server:
    # ... your service config
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        
  elasticsearch:
    image: elasticsearch:8.6.0
    # ... elasticsearch config
    
  kibana:
    image: kibana:8.6.0
    # ... kibana config
```

## Performance Optimization

### Build Optimization

```typescript
// tsup.config.ts - Production optimizations
export default defineConfig({
  minify: process.env.NODE_ENV === "production",
  treeshake: true,
  bundle: true,
  external: ["@modelcontextprotocol/sdk", "fastify"], // Don't bundle large deps
});
```

### Memory Management

Monitor memory usage via health endpoint:

```bash
# Check memory usage
curl -s http://localhost:8080/health | jq '.memory'
```

Set Node.js memory limits if needed:

```bash
# Limit to 512MB heap
node --max-old-space-size=512 dist/index.js
```

## Security Considerations

### Container Security

```dockerfile
# Dockerfile security features
RUN adduser --system --uid 1001 app  # Non-root user
USER app                             # Run as non-root
EXPOSE 8080                         # Only expose necessary ports
```

### Network Security

```yaml
# docker-compose.yml with network isolation
networks:
  mcp-network:
    driver: bridge

services:
  mcp-server:
    networks:
      - mcp-network
    # Only expose port 8080
```

### Environment Security

```bash
# Use secrets management instead of environment variables for sensitive data
docker secret create mcp-config config.json
```

## Scaling & Load Balancing

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  mcp-server:
    deploy:
      replicas: 3
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream mcp-servers {
    server mcp-server_1:8080;
    server mcp-server_2:8080;
    server mcp-server_3:8080;
}

server {
    listen 80;
    location / {
        proxy_pass http://mcp-servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring & Alerting

### Basic Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Simple health monitoring

HEALTH_URL="http://localhost:8080/health"
WEBHOOK_URL="your-slack-webhook-url"

if ! curl -sf "$HEALTH_URL" > /dev/null; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 MCP Server health check failed!"}' \
    "$WEBHOOK_URL"
fi
```

### Prometheus Metrics (Future Enhancement)

```typescript
// Example metrics endpoint (to be implemented)
app.get('/metrics', async () => {
  return {
    http_requests_total: requestCount,
    http_request_duration_ms: averageResponseTime,
    mcp_sessions_active: activeSessionCount,
    memory_usage_bytes: process.memoryUsage(),
  };
});
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs mcp-server

# Check health
docker inspect mcp-server
```

**Memory leaks:**
```bash
# Monitor memory over time
watch -n 5 'curl -s http://localhost:8080/health | jq .memory'
```

**Performance issues:**
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up mcp-server
```

### Debug Mode

```bash
# Run with Node.js inspector
npm run dev:debug

# Connect with Chrome DevTools
# chrome://inspect
```

## Backup & Recovery

### Configuration Backup

```bash
# Backup environment configuration
cp .env.production .env.production.backup.$(date +%Y%m%d)
```

### Container State

```bash
# Export container
docker export mcp-server > mcp-server-backup.tar

# Import container
docker import mcp-server-backup.tar mcp-server:backup
``` 