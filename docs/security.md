# MCP Server Security Guide

This guide addresses the key security vulnerabilities identified in MCP (Model Context Protocol) implementations and how this boilerplate mitigates them.

## Security Vulnerabilities & Mitigations

### Command Injection (Impact: Moderate 🟡)

**The Risk:** Attackers can embed dangerous commands inside everyday content. If your MCP server processes this, it might unknowingly execute system-level tasks.

**Our Mitigations:**
- **Input Sanitization**: All tool arguments are validated and sanitized using `sanitizeInput()`
- **Pattern Detection**: Dangerous shell metacharacters and command patterns are blocked
- **Length Limits**: Input length is restricted to prevent buffer overflow attacks
- **Safe Execution**: No direct system command execution in tool implementations

**Example of protected input:**
```typescript
// This input would be rejected:
const maliciousInput = "rm -rf /; cat /etc/passwd";
// Error: "Input contains potentially dangerous characters or commands"

// This is accepted:
const safeInput = "Hello World"; // ✅ Safe
```

### Tool Poisoning (Impact: Severe 🔴)

**The Risk:** Malicious actors can sneak in compromised tools that access sensitive resources and exfiltrate data.

**Our Mitigations:**
- **Static Tool Registration**: Tools are statically defined in code, not dynamically loaded
- **Input Validation**: All tool inputs use JSON schema validation + additional security checks
- **Error Boundaries**: Tool execution errors are contained and logged
- **Security Auditing**: All tool calls are logged with security events

**Secure Tool Implementation Pattern:**
```typescript
case "your_tool": {
  try {
    // 1. Validate and sanitize inputs
    const param = sanitizeInput(args?.param as string, 100);
    
    // 2. Perform safe operations only
    const result = await safeOperation(param);
    
    // 3. Return structured response
    return {
      content: [{ type: "text", text: result }]
    };
  } catch (error) {
    // 4. Log security events
    logSecurityEvent({
      event: "tool_execution_failed",
      identifier: "your_tool",
      details: { error: error.message },
      severity: "medium"
    });
    
    return {
      content: [{ type: "text", text: "Error: Operation failed" }],
      isError: true
    };
  }
}
```

### Open Connections via SSE (Impact: Moderate 🟠)

**The Risk:** Long-lived connections can be exploited for data manipulation or DoS attacks.

**Our Mitigations:**
- **Connection Timeouts**: Connections are automatically closed after inactivity
- **Rate Limiting**: Prevents connection flooding
- **Resource Monitoring**: Memory and connection tracking via health endpoint
- **Graceful Shutdown**: Proper cleanup of all connections

### Privilege Escalation (Impact: Severe 🔴)

**The Risk:** One infected tool can override another's permissions or gain elevated access.

**Our Mitigations:**
- **Isolated Tool Execution**: Each tool runs in isolation without shared state
- **No Dynamic Privileges**: Tools cannot modify their own or other tools' permissions
- **Audit Trail**: All tool interactions are logged
- **Principle of Least Privilege**: Tools only have access to their required resources

### Persistent Context Misuse (Impact: Low but risky 🟡)

**The Risk:** MCP keeps context active across workflows, potentially executing tasks without approval.

**Our Mitigations:**
- **Stateless Design**: The server is stateless by default (`stateful: false`)
- **Explicit Requests**: All tool calls require explicit client requests
- **Context Isolation**: No persistent context between tool calls
- **Audit Logging**: All context usage is logged

### Server Data Takeover/Spoofing (Impact: Severe 🔴)

**The Risk:** Attackers can intercept data and credentials using compromised tools or MITM attacks.

**Our Mitigations:**
- **Authentication**: Bearer token authentication for API access
- **HTTPS Enforcement**: Use reverse proxy with TLS termination
- **Origin Validation**: CORS protection with trusted origins list
- **Security Headers**: CSP, X-Frame-Options, and other protective headers
- **Request Validation**: All requests are validated and logged

## Security Configuration

### Environment Variables

```bash
# Authentication
ENABLE_AUTH=true                    # Enable API key authentication
API_KEY=your-secret-api-key        # Strong API key (if auth enabled)

# Rate Limiting  
ENABLE_RATE_LIMIT=true             # Enable rate limiting
MAX_REQUESTS_PER_MINUTE=100        # Requests per minute per IP

# Monitoring
ENABLE_REQUEST_LOGGING=true        # Log all requests
LOG_LEVEL=info                     # Logging level

# CORS Security
TRUSTED_ORIGINS=http://localhost:3000,https://myapp.com
```

### Production Security Checklist

**Basic Security:**
- [ ] Enable authentication with strong API key
- [ ] Configure rate limiting appropriate for your usage
- [ ] Set up HTTPS with valid SSL certificates
- [ ] Configure trusted origins for CORS
- [ ] Enable comprehensive request logging

**Advanced Security:**
- [ ] Use a reverse proxy (nginx/traefik) with additional security features
- [ ] Implement network segmentation
- [ ] Set up monitoring and alerting for security events
- [ ] Regular security audits of tool implementations
- [ ] Backup and rotation of API keys

**Deployment Security:**
- [ ] Run container as non-root user
- [ ] Use security scanners on container images
- [ ] Keep dependencies updated
- [ ] Monitor for known vulnerabilities
- [ ] Implement proper secrets management

## Security Monitoring

### Security Events Endpoint

Access security logs via the `/security/events` endpoint:

```bash
# View security events (requires authentication if enabled)
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:8080/security/events
```

**Response:**
```json
{
  "events": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "event": "authentication_failed",
      "identifier": "192.168.1.100",
      "details": {
        "url": "/mcp",
        "reason": "invalid_token"
      },
      "severity": "high"
    }
  ],
  "totalEvents": 1
}
```

### Event Types

| Event | Severity | Description |
|-------|----------|-------------|
| `authentication_failed` | High | Invalid API key or missing auth |
| `rate_limit_exceeded` | Medium | Too many requests from IP |
| `input_validation_failed` | Medium | Malicious input detected |
| `untrusted_origin_blocked` | Medium | Request from non-whitelisted origin |
| `tool_execution_failed` | Low-High | Tool failed to execute |
| `http_error` | Medium-High | HTTP 4xx/5xx responses |

## Best Practices for Tool Development

### 1. Input Validation

```typescript
import { sanitizeInput, validateFilePath, validateUrl } from "./security";

// Always validate inputs
const userInput = sanitizeInput(args?.input as string, 500);
const filePath = validateFilePath(args?.path as string);
const url = validateUrl(args?.url as string);
```

### 2. Error Handling

```typescript
try {
  // Tool logic here
} catch (error) {
  logSecurityEvent({
    event: "tool_error",
    identifier: toolName,
    details: { error: error.message },
    severity: "medium"
  });
  
  // Never expose internal errors to clients
  return {
    content: [{ type: "text", text: "Operation failed" }],
    isError: true
  };
}
```

### 3. Resource Access

```typescript
// ❌ Don't do this - unsafe file access
const content = fs.readFileSync(userPath);

// ✅ Do this - validated file access
const safePath = validateFilePath(userPath);
const content = fs.readFileSync(safePath);
```

### 4. External API Calls

```typescript
// ❌ Don't do this - unsafe URL
const response = await fetch(userUrl);

// ✅ Do this - validated URL
const safeUrl = validateUrl(userUrl, ["https"]); // Only HTTPS
const response = await fetch(safeUrl.toString());
```

## Security Testing

### Manual Testing

```bash
# Test authentication
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test rate limiting
for i in {1..150}; do
  curl -s http://localhost:8080/health > /dev/null
done

# Test input validation
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "hello_world",
      "arguments": {
        "name": "$(rm -rf /)"
      }
    }
  }'
```

### Automated Security Testing

Consider integrating these tools:

- **OWASP ZAP**: Web application security scanner
- **Snyk**: Dependency vulnerability scanning
- **Docker Scout**: Container image security scanning
- **Trivy**: Comprehensive security scanner

## Incident Response

### If You Detect a Security Issue:

1. **Immediate Actions:**
   - Check the security events log
   - Identify the source IP and affected tools
   - Temporarily block the source if needed

2. **Investigation:**
   - Review request logs for patterns
   - Check for data exfiltration attempts
   - Verify tool execution logs

3. **Mitigation:**
   - Update API keys if compromised
   - Patch any identified vulnerabilities
   - Update rate limits or blacklist IPs

4. **Prevention:**
   - Update monitoring rules
   - Enhance input validation
   - Review and update security configurations

## Regular Security Maintenance

- **Weekly**: Review security event logs
- **Monthly**: Update dependencies and scan for vulnerabilities
- **Quarterly**: Security audit of tool implementations
- **Annually**: Full penetration testing and security review 