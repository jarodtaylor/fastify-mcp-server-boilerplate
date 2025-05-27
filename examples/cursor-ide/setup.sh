#!/bin/bash

# Quick setup script for Cursor IDE MCP integration
# This script helps you configure Cursor IDE to use your MCP server

set -e

echo "🚀 Cursor IDE MCP Setup"
echo "======================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ""
print_info "Setting up Cursor IDE MCP integration..."
print_info "Project root: $PROJECT_ROOT"

# Ask user for configuration type
echo ""
echo "Choose your configuration type:"
echo "1) SSE Transport (HTTP) - Recommended"
echo "2) SSE Transport with Authentication"
echo "3) stdio Transport (Process)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        CONFIG_FILE="mcp-config-sse.json"
        print_info "Using SSE transport without authentication"
        ;;
    2)
        CONFIG_FILE="mcp-config-sse-auth.json"
        print_info "Using SSE transport with authentication"
        print_warning "You'll need to set ENABLE_AUTH=true and API_KEY environment variables"
        ;;
    3)
        CONFIG_FILE="mcp-config-stdio.json"
        print_info "Using stdio transport"
        print_warning "You'll need to build the project first with 'npm run build:prod'"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Ask for installation scope
echo ""
echo "Choose installation scope:"
echo "1) Project-specific (.cursor/mcp.json) - Recommended for testing"
echo "2) Global (~/.cursor/mcp.json) - Available in all projects"
echo ""
read -p "Enter your choice (1-2): " scope

case $scope in
    1)
        TARGET_DIR="$PROJECT_ROOT/.cursor"
        TARGET_FILE="$TARGET_DIR/mcp.json"
        print_info "Installing project-specific configuration"
        ;;
    2)
        TARGET_DIR="$HOME/.cursor"
        TARGET_FILE="$TARGET_DIR/mcp.json"
        print_info "Installing global configuration"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    mkdir -p "$TARGET_DIR"
    print_success "Created directory: $TARGET_DIR"
fi

# Copy configuration file
SOURCE_FILE="$SCRIPT_DIR/$CONFIG_FILE"
if [ -f "$SOURCE_FILE" ]; then
    # If stdio transport, update the cwd path
    if [ "$CONFIG_FILE" = "mcp-config-stdio.json" ]; then
        # Replace placeholder path with actual project root
        sed "s|/absolute/path/to/your/mcp-server|$PROJECT_ROOT|g" "$SOURCE_FILE" > "$TARGET_FILE"
    else
        cp "$SOURCE_FILE" "$TARGET_FILE"
    fi
    print_success "Configuration installed: $TARGET_FILE"
else
    echo "Error: Source configuration file not found: $SOURCE_FILE"
    exit 1
fi

# Show next steps
echo ""
print_success "Setup complete!"
echo ""
echo "Next steps:"

if [ "$CONFIG_FILE" = "mcp-config-sse.json" ] || [ "$CONFIG_FILE" = "mcp-config-sse-auth.json" ]; then
    echo "1. Start your MCP server:"
    echo "   cd $PROJECT_ROOT"
    echo "   npm run dev"
    echo ""
    
    if [ "$CONFIG_FILE" = "mcp-config-sse-auth.json" ]; then
        echo "   For authentication, set environment variables:"
        echo "   export ENABLE_AUTH=true"
        echo "   export API_KEY=your-secret-key-here"
        echo "   npm run dev"
        echo ""
    fi
elif [ "$CONFIG_FILE" = "mcp-config-stdio.json" ]; then
    echo "1. Build your MCP server:"
    echo "   cd $PROJECT_ROOT"
    echo "   npm run build:prod"
    echo ""
fi

echo "2. Restart Cursor IDE completely"
echo ""
echo "3. Check Cursor settings:"
echo "   - Open Cursor IDE settings (⌘,)"
echo "   - Navigate to Features → Model Context Protocol"
echo "   - Verify 'fastify-mcp-boilerplate' appears under Available Tools"
echo ""
echo "4. Test the integration:"
echo "   - Open Cursor chat"
echo "   - Ask: 'Can you use the hello_world tool to greet me?'"
echo ""
echo "5. Run integration tests:"
echo "   cd $PROJECT_ROOT"
echo "   ./examples/cursor-ide/test-integration.sh"
echo ""

if [ "$scope" = "1" ]; then
    print_info "Configuration file location: $TARGET_FILE"
else
    print_info "Global configuration file location: $TARGET_FILE"
fi

echo ""
print_warning "Remember to restart Cursor IDE after configuration changes!" 