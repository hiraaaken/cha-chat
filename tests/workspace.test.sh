#!/bin/bash
# Workspace Configuration Tests

set -e

echo "Testing workspace configuration..."

# Test 1: pnpm-workspace.yaml exists
if [ ! -f "pnpm-workspace.yaml" ]; then
  echo "❌ FAIL: pnpm-workspace.yaml not found"
  exit 1
fi
echo "✓ pnpm-workspace.yaml exists"

# Test 2: pnpm-workspace.yaml contains required packages
required_packages=("backend" "frontend/web" "frontend/mobile" "packages/*")
for pkg in "${required_packages[@]}"; do
  if ! grep -q "$pkg" pnpm-workspace.yaml; then
    echo "❌ FAIL: pnpm-workspace.yaml does not contain '$pkg'"
    exit 1
  fi
done
echo "✓ pnpm-workspace.yaml contains all required packages"

# Test 3: Root package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ FAIL: Root package.json not found"
  exit 1
fi
echo "✓ Root package.json exists"

# Test 4: Root package.json is valid JSON
if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
  echo "❌ FAIL: package.json is not valid JSON"
  exit 1
fi
echo "✓ Root package.json is valid JSON"

# Test 5: Root package.json contains workspace scripts
if ! grep -q "\"scripts\"" package.json; then
  echo "❌ FAIL: package.json does not contain scripts section"
  exit 1
fi
echo "✓ Root package.json contains scripts"

echo ""
echo "✅ All workspace configuration tests passed!"
