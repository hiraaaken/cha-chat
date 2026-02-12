#!/bin/bash
# Backend Project Setup Tests

set -e

echo "Testing backend project setup..."

# Test 1: Directory structure
echo "Checking directory structure..."
required_dirs=(
  "backend/src"
  "backend/src/domain"
  "backend/src/domain/entities"
  "backend/src/domain/types"
  "backend/src/domain/events"
  "backend/src/application"
  "backend/src/application/services"
  "backend/src/application/interfaces"
  "backend/src/infrastructure"
  "backend/src/infrastructure/http"
  "backend/src/infrastructure/websocket"
  "backend/src/infrastructure/database"
  "backend/src/infrastructure/cache"
  "backend/src/db"
)

for dir in "${required_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ FAIL: Directory $dir not found"
    exit 1
  fi
done
echo "✓ All required directories exist"

# Test 2: package.json exists and is valid
if [ ! -f "backend/package.json" ]; then
  echo "❌ FAIL: backend/package.json not found"
  exit 1
fi

if ! node -e "JSON.parse(require('fs').readFileSync('backend/package.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: backend/package.json is not valid JSON"
  exit 1
fi
echo "✓ backend/package.json exists and is valid"

# Test 3: Check required dependencies
required_deps=("hono" "neverthrow" "zod" "drizzle-orm" "ioredis")
for dep in "${required_deps[@]}"; do
  if ! grep -q "\"$dep\"" backend/package.json; then
    echo "❌ FAIL: Missing dependency: $dep"
    exit 1
  fi
done
echo "✓ All required dependencies present"

# Test 4: tsconfig.json exists and is valid
if [ ! -f "backend/tsconfig.json" ]; then
  echo "❌ FAIL: backend/tsconfig.json not found"
  exit 1
fi

if ! node -e "JSON.parse(require('fs').readFileSync('backend/tsconfig.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: backend/tsconfig.json is not valid JSON"
  exit 1
fi
echo "✓ backend/tsconfig.json exists and is valid"

# Test 5: biome.json exists and is valid
if [ ! -f "backend/biome.json" ]; then
  echo "❌ FAIL: backend/biome.json not found"
  exit 1
fi

if ! node -e "JSON.parse(require('fs').readFileSync('backend/biome.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: backend/biome.json is not valid JSON"
  exit 1
fi
echo "✓ backend/biome.json exists and is valid"

# Test 6: index.ts exists
if [ ! -f "backend/src/index.ts" ]; then
  echo "❌ FAIL: backend/src/index.ts not found"
  exit 1
fi
echo "✓ backend/src/index.ts exists"

# Test 7: honoServer.ts exists
if [ ! -f "backend/src/infrastructure/http/honoServer.ts" ]; then
  echo "❌ FAIL: backend/src/infrastructure/http/honoServer.ts not found"
  exit 1
fi
echo "✓ honoServer.ts exists"

# Test 8: Check for Hono import in honoServer.ts
if ! grep -q "hono" backend/src/infrastructure/http/honoServer.ts; then
  echo "❌ FAIL: honoServer.ts does not import Hono"
  exit 1
fi
echo "✓ honoServer.ts imports Hono"

# Test 9: Check for /health endpoint
if ! grep -q "/health" backend/src/infrastructure/http/honoServer.ts; then
  echo "❌ FAIL: /health endpoint not found in honoServer.ts"
  exit 1
fi
echo "✓ /health endpoint defined"

# Test 10: Check package.json scripts
required_scripts=("dev" "build")
for script in "${required_scripts[@]}"; do
  if ! grep -q "\"$script\"" backend/package.json; then
    echo "❌ FAIL: Missing script: $script"
    exit 1
  fi
done
echo "✓ Required scripts present"

echo ""
echo "✅ All backend setup tests passed!"
