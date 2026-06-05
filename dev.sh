#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "→ 停止已有进程..."
pkill -f "fast-md" 2>/dev/null || true
pkill -f "wails3" 2>/dev/null || true
lsof -ti tcp:9245 | xargs kill -9 2>/dev/null || true
sleep 1

echo "→ 启动 wails3 dev..."
exec wails3 dev
