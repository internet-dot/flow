#!/usr/bin/env bash
# Build script for flow-think-mcp
# Supports both Bun and Node.js environments

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==> Building flow-think-mcp..."
echo ""

# Clean previous build
echo "    Cleaning dist/"
rm -rf dist/

# Detect runtime
RUNTIME="node"
if command -v bun &> /dev/null; then
    RUNTIME="bun"
    echo "    Using Bun runtime"
else
    echo "    Using Node.js runtime (Bun not available)"
fi

# Run TypeScript compiler
echo "    Compiling TypeScript..."
if [[ "$RUNTIME" == "bun" ]]; then
    bun run tsc
else
    npx tsc
fi

# Make entry point executable
echo "    Making dist/index.js executable..."
chmod +x dist/index.js

# Verify build
if [[ -f "dist/index.js" ]]; then
    echo ""
    echo -e "${GREEN}==> Build successful!${NC}"
    echo "    Output: dist/index.js"

    # Show size
    SIZE=$(ls -lh dist/index.js | awk '{print $5}')
    echo "    Size: $SIZE"

    # Count files
    FILE_COUNT=$(find dist -name "*.js" | wc -l)
    echo "    Files: $FILE_COUNT JavaScript files"
else
    echo -e "${RED}==> Build failed: dist/index.js not found${NC}"
    exit 1
fi

echo ""
echo "Run with:"
echo "  $RUNTIME dist/index.js"
if [[ "$RUNTIME" == "bun" ]]; then
    echo "  node dist/index.js    # Node.js fallback"
fi
