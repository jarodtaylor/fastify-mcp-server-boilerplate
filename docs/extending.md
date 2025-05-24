# Extending Your MCP Server

This guide shows how to extend the boilerplate with custom tools and resources for your specific use case.

## Adding New Tools

Tools are functions that can be called by MCP clients. To add a new tool:

1. **Define the tool schema** in the `ListToolsRequestSchema` handler
2. **Implement the tool logic** in the `CallToolRequestSchema` handler

### Example: Adding a File Reader Tool

```typescript
// In src/mcp-server.ts, add to the tools array:
{
  name: "read_file",
  description: "Read contents of a file",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read",
      },
    },
    required: ["path"],
  },
}

// In the CallToolRequestSchema handler, add:
case "read_file": {
  const path = args?.path as string;
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(path, "utf-8");
    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
```

## Adding New Resources

Resources are data that can be read by MCP clients. To add a new resource:

1. **Define the resource** in the `ListResourcesRequestSchema` handler
2. **Implement the resource reader** in the `ReadResourceRequestSchema` handler

### Example: Adding a System Info Resource

```typescript
// In src/mcp-server.ts, add to the resources array:
{
  uri: "system://info",
  name: "System Information",
  description: "Current system information",
  mimeType: "application/json",
}

// In the ReadResourceRequestSchema handler, add:
case "system://info": {
  const os = await import("os");
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    uptime: os.uptime(),
  };

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(systemInfo, null, 2),
      },
    ],
  };
}
```

## Best Practices

### Tool Design

- **Keep tools focused**: Each tool should do one thing well
- **Validate inputs**: Always validate and sanitize tool arguments
- **Handle errors gracefully**: Return meaningful error messages
- **Use proper types**: Define clear input schemas

### Resource Design

- **Use meaningful URIs**: Choose descriptive URI schemes (e.g., `file://`, `api://`)
- **Set appropriate MIME types**: Help clients understand the content format
- **Consider caching**: For expensive resources, implement caching strategies
- **Handle missing resources**: Provide clear error messages for unavailable resources

### Security Considerations

- **Input validation**: Always validate and sanitize inputs
- **Path traversal**: Be careful with file system operations
- **Command injection**: Never execute user-provided commands directly
- **Rate limiting**: Consider implementing rate limiting for expensive operations

## Advanced Examples

### Tool with Complex Input Schema

```typescript
{
  name: "search_database",
  description: "Search database with filters",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
      filters: {
        type: "object",
        properties: {
          category: { type: "string" },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", format: "date" },
              end: { type: "string", format: "date" },
            },
          },
        },
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 10,
      },
    },
    required: ["query"],
  },
}
```

### Dynamic Resources

```typescript
// List all files in a directory as resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const fs = await import("fs/promises");
  const files = await fs.readdir("./data");

  const resources = files.map((file) => ({
    uri: `file://data/${file}`,
    name: file,
    description: `File: ${file}`,
    mimeType: "text/plain",
  }));

  return { resources };
});
```

## Testing Your Extensions

### Manual Testing

```bash
# Test with curl
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Integration Testing

Consider creating test scripts that verify your tools and resources work correctly with real MCP clients.
