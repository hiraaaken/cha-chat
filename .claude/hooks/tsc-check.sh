#!/bin/bash

# PostToolUse hook: TypeScript type check on edited/written files
# Reads JSON input from stdin to get the file path

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only target TypeScript files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Determine which project the file belongs to and run tsc
if [[ "$FILE_PATH" =~ "$CLAUDE_PROJECT_DIR"/backend/ ]]; then
  cd "$CLAUDE_PROJECT_DIR/backend"
  pnpm exec tsc --noEmit 2>&1
elif [[ "$FILE_PATH" =~ "$CLAUDE_PROJECT_DIR"/frontend/web/ ]]; then
  cd "$CLAUDE_PROJECT_DIR/frontend/web"
  pnpm exec tsc --noEmit 2>&1
fi

exit 0
