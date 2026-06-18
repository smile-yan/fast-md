# fast-md-web

A browser-based Markdown editor extracted from fast-md.

It reuses the same Vue 3 + Milkdown + GitHub-style content theme, but runs as a standalone web app and uses the browser's File System Access API for opening and saving `.md` files.

## Features

- Typora-like WYSIWYG editing powered by Milkdown Crepe
- Light/dark UI theme and GitHub-style Markdown content theme
- Open / save `.md` files in place using `showOpenFilePicker` / `showSaveFilePicker`
- Auto-save to the currently opened file handle
- HTML export (self-contained document)
- Source mode editing
- Keyboard shortcuts: `Ctrl/Cmd+N`, `Ctrl/Cmd+O`, `Ctrl/Cmd+S`, `Ctrl/Cmd+Shift+S`, `Ctrl/Cmd+/`

## Browser support

The File System Access API requires a secure context (HTTPS or localhost) and a Chromium-based browser (Chrome, Edge, Arc, Brave, etc.). Firefox and Safari have limited or no support; in those browsers the open/save actions will fail gracefully with an error in the status bar.

## Development

```bash
cd web-editor
npm ci --include=dev
npm run dev
```

The dev server runs on `http://127.0.0.1:5173` by default.

## Build

```bash
npm run build
```

Static output is written to `web-editor/dist` and can be served by any static host.

## Tests

```bash
npm test
```

## Differences from fast-md desktop

- No Go / Wails runtime; everything runs in the browser.
- No native menus, dock menu, or PDF export.
- File access uses the File System Access API instead of the desktop file dialog.
- Settings and locale are persisted to `localStorage` instead of a config file.
- Folder browsing uses `showDirectoryPicker` and is read-only / shallow.
