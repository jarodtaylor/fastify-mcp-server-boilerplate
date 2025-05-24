# Fastify MCP Server Boilerplate

> 🚀 Production-ready Model Context Protocol (MCP) server boilerplate: **Fastify + TypeScript + Biome + tsup (esbuild) + Docker**

Skip ESLint/Prettier setup pain. Modern tooling that just works. Build MCP servers for Cursor IDE, Claude Desktop, and other AI clients in minutes, not hours.

## 🔧 **What You Get**

| Tool | Purpose | Why Not Alternatives? |
|------|---------|----------------------|
| **Biome** | Linting + Formatting | Replaces ESLint + Prettier + import sorting. 10-100x faster, zero config |
| **tsup** | Bundling | esbuild-powered. 10x faster than webpack/rollup, handles ESM perfectly |
| **Fastify** | HTTP Server | 3x faster than Express, built-in TypeScript support, plugin ecosystem |
| **pino** | Logging | Fastest JSON logger, pretty dev mode, production-ready structured logs |
| **Docker** | Deployment | Multi-stage builds, security hardened, production optimized |

## ✨ Features

### ⚡ **Modern Tech Stack**
- **tsup (esbuild)** - 10x faster builds than webpack/rollup (~40ms builds)
- **Biome** - All-in-one toolchain (replaces ESLint + Prettier + import sorting)
- **TypeScript 5.7** with strict mode and perfect ESM support
- **Fastify 5.x** - High-performance HTTP server (3x faster than Express)
- **Pino logging** - Structured JSON logs with pretty dev mode
- **No `.js` extensions needed** - bundler handles all module resolution

### 🛠️ **Zero-Config Developer Experience**  
- **Hot reload** in <50ms with watch mode
- **No tool conflicts** - Biome + TypeScript work perfectly together
- **One command setup** - `npm install && npm run dev`
- **Pre-configured VSCode** - Extensions + settings included
- **Comprehensive scripts** - dev, build, lint, format, validate, deploy

### 🐳 **Deployment Ready**
- **Multi-stage Docker builds** for optimal production images
- **Docker Compose** configurations for development and production
- **Health checks** with detailed system metrics
- **Environment-based configuration** (development/production)
- **Non-root container** user for security

### 📊 **Observability**
- **Request tracing** with unique request IDs
- **Health endpoint** with memory usage and uptime metrics
- **Structured logging** ready for log aggregation (ELK, etc.)
- **Error handling** with proper HTTP status codes

## 🚀 Quick Start

### 1. **Clone and Setup**

```bash
# Clone this boilerplate (replace with your repo name)
git clone https://github.com/your-username/fastify-mcp-server-boilerplate.git my-mcp-server
cd my-mcp-server

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 2. **Start Development**

```bash
# Start development server with hot reload
npm run dev

# Your server is now running at http://localhost:8080
# Health check: http://localhost:8080/health
# MCP endpoint: http://localhost:8080/mcp
```

### 3. **Test with MCP Client**

**Using Cursor IDE:**
1. Open Cursor IDE settings
2. Add MCP server configuration:
   - Transport: HTTP (Streamable)
   - URL: `http://localhost:8080/mcp`

**Using Claude Desktop:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/your/mcp-server",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🔧 Customization

### Adding Your First Tool

Edit `src/mcp-server.ts` and add your tool:

```typescript
// In the tools array
{
  name: "my_awesome_tool",
  description: "Does something awesome",
  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "Your input parameter"
      }
    },
    required: ["input"]
  }
}

// In the tool handler switch statement
case "my_awesome_tool": {
  const input = args?.input as string;
  
  // Your tool logic here
  const result = processInput(input);
  
  return {
    content: [{
      type: "text",
      text: `Processed: ${result}`
    }]
  };
}
```

### Adding Resources

```typescript
// In the resources array
{
  uri: "my-app://data",
  name: "My Data",
  description: "Application data resource",
  mimeType: "application/json"
}

// In the resource handler switch statement  
case "my-app://data": {
  const data = await fetchMyData();
  
  return {
    contents: [{
      uri,
      mimeType: "application/json", 
      text: JSON.stringify(data, null, 2)
    }]
  };
}
```

### Environment Configuration

Add your environment variables to `src/config.ts`:

```typescript
export interface Config {
  // ... existing config
  myApiKey: string;
  databaseUrl: string;
}

export function createConfig(): Config {
  return {
    // ... existing config
    myApiKey: getEnvVar("MY_API_KEY"),
    databaseUrl: getEnvVar("DATABASE_URL"),
  };
}
```

## 📋 Available Scripts

### Development
```bash
npm run dev              # Start with hot reload  
npm run dev:debug        # Start with Node.js inspector
npm run type-check       # TypeScript type checking only
```

### Building  
```bash
npm run build            # Build for development
npm run build:prod       # Build for production (minified)
npm run clean            # Clean build directory
```

### Code Quality
```bash
npm run lint             # Check linting rules
npm run lint:fix         # Fix auto-fixable linting issues  
npm run format           # Check code formatting
npm run format:fix       # Fix code formatting
npm run check            # Run both linting and formatting
npm run check:fix        # Fix all auto-fixable issues
```

### Production
```bash
npm run start            # Start built application
npm run validate         # Run type checking + linting
npm run ci               # Full validation + production build
```

## 🐳 Docker Deployment

### Development with Docker
```bash
# Start development environment
docker-compose --profile dev up

# Production deployment
docker-compose up -d
```

### Manual Docker Build
```bash
# Build production image
docker build -t my-mcp-server .

# Run container
docker run -d \
  --name my-mcp-server \
  -p 8080:8080 \
  -e NODE_ENV=production \
  my-mcp-server
```

## 📁 Project Structure

```
fastify-mcp-server-boilerplate/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── mcp-server.ts      # MCP server implementation  
│   └── config.ts          # Environment configuration
├── docs/                  # Documentation
│   ├── extending.md       # How to add tools/resources
│   ├── tooling.md         # TypeScript + Biome setup
│   └── production.md      # Production deployment guide
├── dist/                  # Compiled JavaScript (generated)
├── .vscode/               # VSCode configuration
├── Dockerfile             # Multi-stage production build
├── docker-compose.yml     # Container orchestration
├── tsup.config.ts         # Build configuration
├── tsconfig.json          # TypeScript configuration  
├── biome.json             # Linting and formatting
└── package.json           # Dependencies and scripts
```

## 🏥 Health Monitoring

The boilerplate includes a comprehensive health endpoint:

```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0", 
  "name": "fastify-mcp-server-boilerplate",
  "uptime": "123s",
  "memory": {
    "rss": "45MB",
    "heapUsed": "12MB",
    "heapTotal": "18MB"
  },
  "environment": "development"
}
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `HOST` | `localhost` | Server host |
| `NODE_ENV` | `development` | Environment: `development`/`production`/`test` |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Log level |
| `MCP_ENDPOINT` | `/mcp` | MCP server endpoint path |
| `HEALTH_ENDPOINT` | `/health` | Health check endpoint path |

## 📚 Documentation

- **[Getting Started Guide](docs/getting-started.md)** - Step-by-step examples for common use cases
- **[Extending the Server](docs/extending.md)** - Add custom tools and resources
- **[Tooling Configuration](docs/tooling.md)** - TypeScript and Biome setup
- **[Production Deployment](docs/production.md)** - Complete deployment guide

## 🛟 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3000 npm run dev
```

### Build Issues
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Docker Issues
```bash
# View container logs
docker logs mcp-server

# Rebuild image
docker build --no-cache -t my-mcp-server .
```

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run validation: `npm run ci`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - feel free to use this boilerplate for your projects!

## ⭐ Why This Boilerplate?

Building production-ready MCP servers requires setting up build tools, linting, containerization, logging, error handling, and more. This boilerplate gives you all of that out of the box, so you can focus on building your MCP tools and resources instead of configuring infrastructure.

**Perfect for:**
- 🤖 Building AI-powered developer tools
- 🔌 Creating integrations for Cursor IDE, Claude Desktop
- 🚀 Rapid prototyping of MCP servers
- 📦 Learning MCP development with best practices
- 🏢 Production MCP server deployments

---

**Happy building!** 🎉

If you find this boilerplate helpful, please ⭐ star the repository!
