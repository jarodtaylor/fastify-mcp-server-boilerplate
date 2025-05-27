#!/bin/bash

# Test script for MCP server integration with Cursor IDE
# This script tests the MCP server endpoints to ensure they work correctly

set -e

echo "🧪 Testing MCP Server Integration with Cursor IDE"
echo "================================================"

# Configuration
SERVER_URL="http://localhost:8080"
MCP_ENDPOINT="$SERVER_URL/mcp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Test 1: Check if server is running
echo ""
print_info "Test 1: Checking if MCP server is running..."
if curl -s "$SERVER_URL/health" > /dev/null; then
    print_success "Server is running at $SERVER_URL"
else
    print_error "Server is not running. Please start it with 'npm run dev'"
    exit 1
fi

# Test 2: Check health endpoint
echo ""
print_info "Test 2: Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "$SERVER_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    print_success "Health endpoint is working"
    echo "   Status: $(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"')"
else
    print_error "Health endpoint is not working properly"
    exit 1
fi

# Test 3: Test MCP tools/list endpoint
echo ""
print_info "Test 3: Testing MCP tools/list endpoint..."
TOOLS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    }')

if echo "$TOOLS_RESPONSE" | grep -q '"hello_world"'; then
    print_success "MCP tools/list endpoint is working"
    echo "   Available tools: $(echo "$TOOLS_RESPONSE" | grep -o '"name":"[^"]*"')"
else
    print_error "MCP tools/list endpoint is not working"
    echo "Response: $TOOLS_RESPONSE"
    exit 1
fi

# Test 4: Test MCP tools/call endpoint
echo ""
print_info "Test 4: Testing MCP tools/call endpoint..."
CALL_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "hello_world",
            "arguments": {
                "name": "Cursor IDE"
            }
        }
    }')

if echo "$CALL_RESPONSE" | grep -q "Hello, Cursor IDE"; then
    print_success "MCP tools/call endpoint is working"
    echo "   Response: $(echo "$CALL_RESPONSE" | grep -o '"text":"[^"]*"' | head -1)"
else
    print_error "MCP tools/call endpoint is not working"
    echo "Response: $CALL_RESPONSE"
    exit 1
fi

# Test 5: Test MCP resources/list endpoint
echo ""
print_info "Test 5: Testing MCP resources/list endpoint..."
RESOURCES_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
        "jsonrpc": "2.0",
        "id": 3,
        "method": "resources/list",
        "params": {}
    }')

if echo "$RESOURCES_RESPONSE" | grep -q "boilerplate://info"; then
    print_success "MCP resources/list endpoint is working"
    echo "   Available resources: $(echo "$RESOURCES_RESPONSE" | grep -o '"uri":"[^"]*"')"
else
    print_error "MCP resources/list endpoint is not working"
    echo "Response: $RESOURCES_RESPONSE"
    exit 1
fi

# Test 6: Test MCP resources/read endpoint
echo ""
print_info "Test 6: Testing MCP resources/read endpoint..."
READ_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
        "jsonrpc": "2.0",
        "id": 4,
        "method": "resources/read",
        "params": {
            "uri": "boilerplate://info"
        }
    }')

if echo "$READ_RESPONSE" | grep -q "production-ready"; then
    print_success "MCP resources/read endpoint is working"
else
    print_error "MCP resources/read endpoint is not working"
    echo "Response: $READ_RESPONSE"
    exit 1
fi

# Test 7: Check if Cursor config exists
echo ""
print_info "Test 7: Checking for Cursor IDE configuration..."
if [ -f ".cursor/mcp.json" ]; then
    print_success "Found project-specific Cursor config at .cursor/mcp.json"
elif [ -f "$HOME/.cursor/mcp.json" ]; then
    print_success "Found global Cursor config at ~/.cursor/mcp.json"
else
    print_warning "No Cursor MCP configuration found"
    print_info "Create .cursor/mcp.json or ~/.cursor/mcp.json to configure Cursor IDE"
    print_info "Example configs are available in examples/cursor-ide/"
fi

# Summary
echo ""
echo "🎉 All tests passed! Your MCP server is ready for Cursor IDE integration."
echo ""
echo "Next steps:"
echo "1. Copy one of the config files from examples/cursor-ide/ to .cursor/mcp.json"
echo "2. Restart Cursor IDE"
echo "3. Check Cursor settings → Features → Model Context Protocol"
echo "4. Test the integration by asking Cursor to use the hello_world tool"
echo ""
echo "For detailed setup instructions, see examples/cursor-ide/README.md" 