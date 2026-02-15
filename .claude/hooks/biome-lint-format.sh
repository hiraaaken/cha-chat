#!/bin/bash

# PostToolUse hook: Biome lint + format on edited/written files
# Reads JSON input from stdin to get the file path

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only target TypeScript/JavaScript files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  exit 0
fi

# Only target files within the project
if [[ ! "$FILE_PATH" =~ ^"$CLAUDE_PROJECT_DIR" ]]; then
  exit 0
fi

# Run Biome check with auto-fix
cd "$CLAUDE_PROJECT_DIR"
biome check --fix "$FILE_PATH" 2>&1

exit 0
