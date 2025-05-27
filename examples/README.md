# MCP Server Examples

This directory contains practical examples and integrations for your Fastify MCP server boilerplate.

## Available Examples

### 🎯 [Cursor IDE Integration](./cursor-ide/)

Complete integration guide for using your MCP server with Cursor IDE, including:

- **SSE Transport** (HTTP) - Recommended approach
- **stdio Transport** - Process-based approach  
- **Authentication** - Secure configurations
- **Testing Scripts** - Automated integration testing
- **Setup Scripts** - One-command configuration

**Quick Start:**
```bash
# Run the setup script
./examples/cursor-ide/setup.sh

# Or test manually
npm run dev
./examples/cursor-ide/test-integration.sh
```

## Features Demonstrated

### 🔧 **Tools Integration**
- `hello_world` tool with input validation
- Error handling and security logging
- Rate limiting and authentication

### 📚 **Resources Integration**  
- `boilerplate://info` resource
- MIME type handling
- Content delivery

### 🛡️ **Security Features**
- Bearer token authentication
- Input sanitization and validation
- Rate limiting and monitoring
- Security event logging

### 🚀 **Transport Methods**
- **SSE (Server-Sent Events)**: HTTP-based, full-featured
- **stdio**: Process-based, simpler setup

## Testing Your Integration

Each example includes comprehensive testing:

```bash
# Test the basic server
curl http://localhost:8080/health

# Test MCP endpoints
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Run automated tests
./examples/cursor-ide/test-integration.sh
```

## Adding New Examples

To add a new integration example:

1. Create a new directory: `examples/your-client/`
2. Add a comprehensive README.md
3. Include configuration files
4. Add test scripts
5. Update this main README

### Example Structure
```
examples/your-client/
├── README.md              # Detailed setup guide
├── config-example.json    # Configuration files
├── test-integration.sh    # Test script
└── setup.sh              # Setup automation
```

## Common Integration Patterns

### Authentication
```json
{
  "headers": {
    "Authorization": "Bearer your-api-key"
  }
}
```

### Environment Variables
```bash
export ENABLE_AUTH=true
export API_KEY=your-secret-key
export ENABLE_RATE_LIMIT=true
```

### Error Handling
All examples include proper error handling for:
- Connection failures
- Authentication errors
- Rate limiting
- Invalid requests

## Contributing

When adding new examples:

1. **Follow the established patterns** in existing examples
2. **Include comprehensive documentation** with setup steps
3. **Add automated testing** where possible
4. **Consider security implications** and document them
5. **Test thoroughly** before submitting

## Support

For issues with specific integrations:

1. Check the individual example's README
2. Run the provided test scripts
3. Review the main [Security Guide](../docs/security.md)
4. Check server logs for detailed error information

## Related Documentation

- [Security Guide](../docs/security.md) - Comprehensive security features
- [Getting Started](../docs/getting-started.md) - Basic server usage
- [Production Deployment](../docs/production.md) - Production considerations
- [Tooling](../docs/tooling.md) - Development workflow 