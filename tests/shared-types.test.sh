#!/bin/bash
# Shared Types Package Tests

set -e

echo "Testing shared-types package..."

# Test 1: packages/shared-types/ directory exists
if [ ! -d "packages/shared-types" ]; then
  echo "❌ FAIL: packages/shared-types/ directory not found"
  exit 1
fi
echo "✓ packages/shared-types/ directory exists"

# Test 2: package.json exists
if [ ! -f "packages/shared-types/package.json" ]; then
  echo "❌ FAIL: packages/shared-types/package.json not found"
  exit 1
fi
echo "✓ packages/shared-types/package.json exists"

# Test 3: package.json is valid JSON
if ! node -e "JSON.parse(require('fs').readFileSync('packages/shared-types/package.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: package.json is not valid JSON"
  exit 1
fi
echo "✓ package.json is valid JSON"

# Test 4: package.json has correct name
pkg_name=$(node -e "console.log(JSON.parse(require('fs').readFileSync('packages/shared-types/package.json', 'utf8')).name)" 2>/dev/null)
if [ "$pkg_name" != "@cha-chat/shared-types" ]; then
  echo "❌ FAIL: package name should be '@cha-chat/shared-types', got '$pkg_name'"
  exit 1
fi
echo "✓ package.json has correct name '@cha-chat/shared-types'"

# Test 5: tsconfig.json exists
if [ ! -f "packages/shared-types/tsconfig.json" ]; then
  echo "❌ FAIL: packages/shared-types/tsconfig.json not found"
  exit 1
fi
echo "✓ tsconfig.json exists"

# Test 6: tsconfig.json is valid JSON
if ! node -e "JSON.parse(require('fs').readFileSync('packages/shared-types/tsconfig.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: tsconfig.json is not valid JSON"
  exit 1
fi
echo "✓ tsconfig.json is valid JSON"

# Test 7: src/ directory exists
if [ ! -d "packages/shared-types/src" ]; then
  echo "❌ FAIL: packages/shared-types/src/ directory not found"
  exit 1
fi
echo "✓ src/ directory exists"

# Test 8: src/index.ts exists
if [ ! -f "packages/shared-types/src/index.ts" ]; then
  echo "❌ FAIL: packages/shared-types/src/index.ts not found"
  exit 1
fi
echo "✓ src/index.ts exists"

# Test 9: src/events.ts exists (WebSocket event types)
if [ ! -f "packages/shared-types/src/events.ts" ]; then
  echo "❌ FAIL: packages/shared-types/src/events.ts not found"
  exit 1
fi
echo "✓ src/events.ts exists"

# Test 10: index.ts exports events
if ! grep -q "events" packages/shared-types/src/index.ts; then
  echo "❌ FAIL: src/index.ts does not export from events"
  exit 1
fi
echo "✓ index.ts exports from events"

echo ""
echo "✅ All shared-types package tests passed!"
