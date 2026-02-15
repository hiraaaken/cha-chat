#!/bin/bash

# PostToolUse hook: Dart analyze on edited/written files
# Reads JSON input from stdin to get the file path

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only target Dart files
if [[ ! "$FILE_PATH" =~ \.dart$ ]]; then
  exit 0
fi

# Only target files within frontend/mobile
if [[ ! "$FILE_PATH" =~ "$CLAUDE_PROJECT_DIR"/frontend/mobile/ ]]; then
  exit 0
fi

# Run dart analyze
cd "$CLAUDE_PROJECT_DIR/frontend/mobile"
dart analyze 2>&1

exit 0
