#!/bin/sh
# Wrapper for the `fastmd` CLI entry point. This file is bundled into
# fastmd.app/Contents/Resources/fastmd by build/darwin/Taskfile.yml and
# exposed on $PATH by scripts/install-cli.sh.
#
# Directly exec the Go binary with any passed arguments, bypassing
# Launch Services to avoid duplicate windows when opening files.
exec "$(dirname "$0")/../../MacOS/fastmd" "$@"
