# Getting Started Guide

This guide will walk you through customizing the MCP server boilerplate for common use cases.

## 🎯 Common Use Cases

### 1. **File System Tools**
Perfect for tools that help AI assistants work with files and directories.

### 2. **API Integrations** 
Connect AI assistants to external services and APIs.

### 3. **Database Operations**
Provide AI assistants with database query capabilities.

### 4. **Development Tools**
Build developer productivity tools for IDEs like Cursor.

### 5. **Content Processing**
Tools for processing text, images, or other content.

## 🚀 Step-by-Step Examples

### Example 1: File Reader Tool

Let's build a tool that can read files from the filesystem:

```typescript
// 1. Add to tools array in src/mcp-server.ts
{
  name: "read_file",
  description: "Read the contents of a file",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read"
      }
    },
    required: ["path"]
  }
}

// 2. Add to tool handler switch statement
case "read_file": {
  const filePath = args?.path as string;
  
  try {
    const fs = await import("node:fs/promises");
    const content = await fs.readFile(filePath, "utf-8");
    
    return {
      content: [{
        type: "text",
        text: content
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`
      }],
      isError: true
    };
  }
}
```

### Example 2: API Integration Tool

Connect to an external weather API:

```typescript
// 1. Add environment variable to src/config.ts
export interface Config {
  // ... existing config
  weatherApiKey: string;
}

export function createConfig(): Config {
  return {
    // ... existing config
    weatherApiKey: getEnvVar("WEATHER_API_KEY"),
  };
}

// 2. Add tool definition
{
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name or coordinates"
      }
    },
    required: ["location"]
  }
}

// 3. Add tool implementation
case "get_weather": {
  const location = args?.location as string;
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${config.weatherApiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: [{
        type: "text",
        text: `Weather in ${data.name}: ${data.weather[0].description}, ${data.main.temp}°C`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error fetching weather: ${error instanceof Error ? error.message : "Unknown error"}`
      }],
      isError: true
    };
  }
}
```

### Example 3: Database Query Tool

Add PostgreSQL database support:

```bash
# Install database client
npm install pg
npm install --save-dev @types/pg
```

```typescript
// 1. Update config for database
export interface Config {
  // ... existing config
  databaseUrl: string;
}

// 2. Add database tool
{
  name: "query_database",
  description: "Execute a SQL query on the database",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "SQL query to execute"
      }
    },
    required: ["query"]
  }
}

// 3. Implement database tool
case "query_database": {
  const query = args?.query as string;
  
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: config.databaseUrl
    });
    
    const result = await pool.query(query);
    await pool.end();
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result.rows, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Database error: ${error instanceof Error ? error.message : "Unknown error"}`
      }],
      isError: true
    };
  }
}
```

### Example 4: Dynamic Resource

Create a resource that lists directory contents:

```typescript
// 1. Add dynamic resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const fs = await import("node:fs/promises");
  
  try {
    // List files in current directory as resources
    const files = await fs.readdir("./src");
    const fileResources = files
      .filter(file => file.endsWith(".ts"))
      .map(file => ({
        uri: `file://src/${file}`,
        name: file,
        description: `Source file: ${file}`,
        mimeType: "text/plain"
      }));

    return {
      resources: [
        {
          uri: "boilerplate://info",
          name: "Boilerplate Information",
          description: "Information about this MCP server boilerplate",
          mimeType: "text/plain",
        },
        ...fileResources
      ],
    };
  } catch (error) {
    // Fallback to static resources if directory read fails
    return {
      resources: [
        {
          uri: "boilerplate://info",
          name: "Boilerplate Information", 
          description: "Information about this MCP server boilerplate",
          mimeType: "text/plain",
        },
      ],
    };
  }
});

// 2. Handle dynamic resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith("file://src/")) {
    const filename = uri.replace("file://src/", "");
    try {
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(`./src/${filename}`, "utf-8");
      
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: content
        }]
      };
    } catch (error) {
      throw new Error(`Could not read file: ${filename}`);
    }
  }

  // ... handle other resources
});
```

## 🔧 Advanced Configuration

### Adding Authentication

```typescript
// 1. Add auth config
export interface Config {
  // ... existing config
  apiKey: string;
}

// 2. Add auth middleware to Fastify
app.addHook('preHandler', async (request, reply) => {
  if (request.url.startsWith('/mcp')) {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    const token = authHeader.slice(7);
    if (token !== config.apiKey) {
      reply.status(403).send({ error: 'Invalid API key' });
      return;
    }
  }
});
```

### Adding Rate Limiting

```bash
npm install @fastify/rate-limit
```

```typescript
// In src/index.ts
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  max: 100, // 100 requests
  timeWindow: '1 minute' // per minute
});
```

### Adding Request Logging

```typescript
// Add request logging hook
app.addHook('onRequest', async (request) => {
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    requestId: request.id
  }, 'Incoming request');
});

app.addHook('onResponse', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime(),
    requestId: request.id
  }, 'Request completed');
});
```

## 🧪 Testing Your Tools

### Manual Testing with curl

```bash
# Test tool call
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "hello_world",
      "arguments": {
        "name": "Developer"
      }
    }
  }'
```

### Testing with Node.js Script

```javascript
// test-mcp.js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport('http://localhost:8080/mcp');
const client = new Client({
  name: "test-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Test tool call
const result = await client.callTool({
  name: "hello_world",
  arguments: { name: "Test" }
});

console.log('Tool result:', result);
```

## 📦 Publishing Your MCP Server

### 1. **Prepare for Distribution**

```bash
# Update package.json with your details
{
  "name": "my-awesome-mcp-server",
  "description": "Description of what your server does",
  "keywords": ["mcp", "ai", "tools"],
  "repository": "https://github.com/username/my-awesome-mcp-server",
  "author": "Your Name <email@example.com>",
  "license": "MIT"
}
```

### 2. **Build and Test**

```bash
# Full validation
npm run ci

# Test Docker build
docker build -t my-mcp-server .
```

### 3. **Documentation**

Update your README.md with:
- Clear description of what your server does
- Installation and setup instructions
- List of available tools and resources
- Configuration options
- Usage examples

### 4. **Release**

```bash
# Tag a release
git tag v1.0.0
git push origin v1.0.0

# Publish to npm (optional)
npm publish
```

## 🎯 Next Steps

1. **Choose your use case** from the examples above
2. **Implement your first tool** following the patterns
3. **Test thoroughly** with your MCP client
4. **Add proper error handling** and validation
5. **Document your tools** for other users
6. **Deploy to production** using the Docker setup

Remember: Start simple with one tool, then expand from there. The boilerplate provides all the infrastructure - focus on your unique functionality! 