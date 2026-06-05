#!/bin/bash
set -e

APP_NAME="fast-md"
BUNDLE_ID="com.fastmd.app"
APP_PATH="/Applications/$APP_NAME.app"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

# Kill running instance
pkill -x "$APP_NAME" 2>/dev/null || true

# Unregister ALL registered paths for this app (including bin/ and DMG volumes)
"$LSREGISTER" -dump 2>/dev/null | grep "${APP_NAME}.app" | awk -F'[()]' '{print $1}' | sed 's/^path:[[:space:]]*//' | sed 's/[[:space:]]*$//' | while read -r p; do
  [ -n "$p" ] && "$LSREGISTER" -u "$p" 2>/dev/null || true
done

# Remove app bundle
if [ -d "$APP_PATH" ]; then
  rm -rf "$APP_PATH"
  echo "Removed $APP_PATH"
else
  echo "App not found at $APP_PATH"
fi

# Remove preferences and support files
rm -rf "$HOME/Library/Application Support/$APP_NAME"
rm -f "$HOME/Library/Preferences/$BUNDLE_ID.plist"
rm -rf "$HOME/Library/Caches/$BUNDLE_ID"
rm -rf "$HOME/Library/Saved Application State/$BUNDLE_ID.savedState"

# Rebuild Launch Services database
"$LSREGISTER" -r -domain local -domain system -domain user

echo "Uninstall complete."
