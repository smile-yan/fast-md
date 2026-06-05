#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "scripts/build-dmg.sh is kept for compatibility."
echo "Use scripts/build-macos.sh for the primary macOS packaging entrypoint."

exec "$SCRIPT_DIR/build-macos.sh" "$@"
