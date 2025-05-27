# Using MCP Server with Cursor IDE

This example demonstrates how to integrate your Fastify MCP server with Cursor IDE to provide additional context and tools for AI assistance.

## Overview

This MCP server provides Cursor with:
- **Tools**: Interactive functions the AI can call (like `hello_world`)
- **Resources**: Data sources the AI can read (like boilerplate information)
- **Security**: Authentication, rate limiting, and input validation

## Setup Methods

Cursor supports two transport types for MCP servers:

### 🌐 SSE Transport (Recommended)
- Runs as HTTP server (local or remote)
- More flexible and feature-rich
- Supports authentication and monitoring
- Can be shared across machines

### 💻 stdio Transport
- Runs as local process managed by Cursor
- Simpler setup but limited features
- No authentication or monitoring

## Method 1: SSE Transport (HTTP Server)

### 1. Start Your MCP Server

```bash
# In your MCP server directory
npm run dev

# Server starts at http://localhost:8080
# MCP endpoint: http://localhost:8080/mcp
```

### 2. Configure Cursor IDE

Create or edit your MCP configuration file:

**For this project only** (recommended for testing):
```bash
# Create project-specific config
mkdir -p .cursor
```

**For all projects** (global):
```bash
# Use global config in home directory
# ~/.cursor/mcp.json
```

### 3. Add Configuration

Create `.cursor/mcp.json` (project-specific) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "fastify-mcp-boilerplate": {
      "transport": "sse",
      "url": "http://localhost:8080/mcp",
      "description": "Production-ready MCP server with security features"
    }
  }
}
```

### 4. With Authentication (Optional)

If you enable authentication on your server:

```bash
# Set environment variables
export ENABLE_AUTH=true
export API_KEY=your-secret-key-here
export ENABLE_RATE_LIMIT=true

# Restart server
npm run dev
```

Update your Cursor config:

```json
{
  "mcpServers": {
    "fastify-mcp-boilerplate": {
      "transport": "sse", 
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-key-here"
      },
      "description": "Secure MCP server with authentication"
    }
  }
}
```

## Method 2: stdio Transport (Process)

For a simpler setup that runs the server as a local process:

### 1. Build Your Server

```bash
npm run build:prod
```

### 2. Configure Cursor IDE

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "fastify-mcp-boilerplate": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/your/mcp-server",
      "env": {
        "NODE_ENV": "production",
        "PORT": "8080",
        "LOG_LEVEL": "info"
      },
      "description": "MCP server running as local process"
    }
  }
}
```

## Testing the Integration

### 1. Restart Cursor IDE

After adding the configuration, restart Cursor IDE to load the MCP server.

### 2. Check MCP Settings

1. Open Cursor IDE settings (⌘,)
2. Navigate to "Features" → "Model Context Protocol"
3. Verify your server appears under "Available Tools"
4. Ensure tools are enabled

### 3. Test in Chat

Open Cursor's chat and try these prompts:

```
Can you use the hello_world tool to greet me?
```

```
Please call the hello_world tool with my name "Developer"
```

```
What tools are available from the MCP server?
```

### 4. Monitor Server Activity

If using SSE transport, you can monitor your server:

```bash
# Check health
curl http://localhost:8080/health

# View security events (if auth enabled)
curl -H "Authorization: Bearer your-secret-key" \
     http://localhost:8080/security/events
```

## Available Tools & Resources

### Tools
- **hello_world**: Returns a personalized greeting message
  - Input: `name` (optional string)
  - Example: "Hello, Developer! Welcome to your MCP server."

### Resources  
- **boilerplate://info**: Information about the MCP server boilerplate
  - Type: text/plain
  - Contains: Description of the server's capabilities

## Troubleshooting

### Server Not Appearing in Cursor

1. **Check configuration syntax**: Ensure JSON is valid
2. **Verify server is running**: Visit http://localhost:8080/health
3. **Check Cursor logs**: Look for MCP-related errors
4. **Restart Cursor**: Configuration changes require restart

### Authentication Issues

1. **Verify API key**: Check environment variable is set
2. **Check headers**: Ensure Authorization header format is correct
3. **Monitor security events**: Check `/security/events` endpoint

### Connection Problems

1. **Port conflicts**: Ensure port 8080 is available
2. **Firewall**: Check local firewall settings
3. **Network**: Verify localhost connectivity

### Tool Not Working

1. **Check tool approval**: Cursor may ask for permission to run tools
2. **Enable auto-run**: Configure Yolo mode for automatic tool execution
3. **Verify tool arguments**: Check what arguments Cursor is sending

## Advanced Configuration

### Custom Port

```bash
# Use different port
export PORT=3000
npm run dev
```

Update Cursor config:
```json
{
  "mcpServers": {
    "fastify-mcp-boilerplate": {
      "transport": "sse",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Production Deployment

For production use with remote server:

```json
{
  "mcpServers": {
    "fastify-mcp-boilerplate": {
      "transport": "sse",
      "url": "https://your-domain.com/mcp",
      "headers": {
        "Authorization": "Bearer your-production-api-key"
      }
    }
  }
}
```

### Multiple Environments

```json
{
  "mcpServers": {
    "mcp-dev": {
      "transport": "sse",
      "url": "http://localhost:8080/mcp",
      "description": "Development MCP server"
    },
    "mcp-staging": {
      "transport": "sse", 
      "url": "https://staging.example.com/mcp",
      "headers": {
        "Authorization": "Bearer staging-key"
      },
      "description": "Staging MCP server"
    }
  }
}
```

## Next Steps

1. **Add custom tools**: Extend `src/mcp-server.ts` with your own tools
2. **Add resources**: Provide data sources for Cursor to read
3. **Enable security**: Use authentication and rate limiting in production
4. **Monitor usage**: Check security events and server health
5. **Scale up**: Deploy to production with proper infrastructure

## Security Considerations

- **Use authentication** in production environments
- **Enable rate limiting** to prevent abuse
- **Monitor security events** for suspicious activity
- **Use HTTPS** for remote deployments
- **Rotate API keys** regularly

For more details on security features, see the main [Security Guide](../../docs/security.md). 