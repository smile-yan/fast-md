package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/url"
	"runtime"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

var svc *AppService

var (
	allowedClose     = make(map[uint]bool)
	allowedCloseLock sync.Mutex
)

func allowWindowClose(windowID uint) {
	allowedCloseLock.Lock()
	allowedClose[windowID] = true
	allowedCloseLock.Unlock()
}

//go:embed all:frontend/dist
var assets embed.FS

type themeEntry struct {
	Name  string `json:"name"`
	Label string `json:"label"`
}

func loadThemes() []themeEntry {
	data, err := fs.ReadFile(assets, "frontend/dist/themes/index.json")
	if err != nil {
		return nil
	}
	var entries []themeEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil
	}
	return entries
}

func newEditorWindow(app *application.App) *application.WebviewWindow {
	return newEditorWindowWithFile(app, "")
}

func newEditorWindowWithFile(app *application.App, filePath string) *application.WebviewWindow {
	windowURL := "/"
	if filePath != "" {
		windowURL = "/?file=" + url.QueryEscape(filePath)
	}
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:          "fast-md",
		Width:          1280,
		Height:         800,
		MinWidth:       600,
		MinHeight:      400,
		URL:            windowURL,
		EnableFileDrop: true,
		Mac: application.MacWindow{
			Backdrop:                application.MacBackdropNormal,
			TitleBar:                application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight: 28,
		},
	})

	window.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		files := event.Context().DroppedFiles()
		for _, f := range files {
			lower := strings.ToLower(f)
			if strings.HasSuffix(lower, ".md") || strings.HasSuffix(lower, ".markdown") {
				window.EmitEvent("file:open", f)
				break
			}
		}
	})

	window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
		allowedCloseLock.Lock()
		ok := allowedClose[window.ID()]
		allowedCloseLock.Unlock()
		if !ok {
			event.Cancel()
			window.ExecJS("window.dispatchEvent(new CustomEvent('window:closeRequested'))")
		} else {
			allowedCloseLock.Lock()
			delete(allowedClose, window.ID())
			allowedCloseLock.Unlock()
		}
	})

	window.RegisterHook(events.Mac.WindowShow, func(_ *application.WindowEvent) {
		setupTopBorderDoubleClick(window.NativeWindow())
	})

	return window
}

func emitToFocused(app *application.App, name string, data ...any) {
	if w := app.Window.Current(); w != nil {
		w.EmitEvent(name, data...)
	}
}

type fullscreenToggler interface {
	ToggleFullscreen()
}

func toggleFocusedFullscreen(window fullscreenToggler) {
	if window != nil {
		window.ToggleFullscreen()
	}
}

func requestAppQuit() {
	if svc != nil {
		svc.RequestQuit()
	}
}

const developerToolsShortcut = "F12"

func openDeveloperTools(window application.Window) {
	if window != nil {
		window.OpenDevTools()
	}
}

func openFocusedDeveloperTools(app *application.App) {
	openDeveloperTools(app.Window.Current())
}

func registerDeveloperToolsShortcut(app *application.App) {
	app.KeyBinding.Add(developerToolsShortcut, openDeveloperTools)
}

type openedFileTarget interface {
	EmitEvent(name string, data ...any) bool
}

func routeOpenedFile(filePath string, current openedFileTarget, openNewWindow func(string)) {
	if filePath == "" {
		return
	}
	if current != nil {
		current.EmitEvent("file:open", filePath)
		return
	}
	openNewWindow(filePath)
}

func main() {
	svc = &AppService{}

	app := application.New(application.Options{
		Name:        "fast-md",
		Description: "A fast Markdown editor",
		Services: []application.Service{
			application.NewService(svc),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
	})
	registerDeveloperToolsShortcut(app)

	svc.app = app
	svc.quit = newQuitCoordinator(allowWindowClose, app.Quit)

	// Load config and apply saved language
	cfg := loadConfig()
	SetLocale(cfg.Language)

	newEditorWindow(app)

	app.Event.OnApplicationEvent(events.Mac.ApplicationShouldHandleReopen, func(event *application.ApplicationEvent) {
		if !event.Context().HasVisibleWindows() {
			newEditorWindow(app)
		}
	})

	// Opened via Finder "Open With" or double-click
	app.Event.OnApplicationEvent(events.Common.ApplicationOpenedWithFile, func(event *application.ApplicationEvent) {
		routeOpenedFile(event.Context().Filename(), app.Window.Current(), func(path string) {
			newEditorWindowWithFile(app, path)
		})
	})

	buildMenuI18n(app)
	setupDockMenu()

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

func buildMenu(app *application.App) {
	menu := app.NewMenu()

	if runtime.GOOS == "darwin" {
		appMenu := menu.AddSubmenu("fast-md")
		appMenu.Add("About fast-md").OnClick(func(_ *application.Context) {
			app.Event.Emit("app:aboutRequested")
		})
		appMenu.AddSeparator()
		appMenu.Add("Preferences...").SetAccelerator("Cmd+,").OnClick(func(_ *application.Context) {
			emitToFocused(app, "menu:settings")
		})
		appMenu.AddSeparator()
		appMenu.Add("Quit fast-md").SetAccelerator("Cmd+Q").OnClick(func(_ *application.Context) {
			requestAppQuit()
		})
	} else {
		helpMenu := menu.AddSubmenu("Help")
		addHelpDocumentMenuItems(app, helpMenu, helpDocumentEntries(getMenuStrings()))
	}

	fileMenu := menu.AddSubmenu("File")
	setMenuIcon(fileMenu.Add("New File").SetAccelerator("CmdOrCtrl+N").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:newFile")
	}), menuIconNewFile)
	setMenuIcon(fileMenu.Add("New Window").SetAccelerator("CmdOrCtrl+Shift+N").OnClick(func(_ *application.Context) {
		newEditorWindow(app)
	}), menuIconNewWindow)
	setMenuIcon(fileMenu.Add("Open...").SetAccelerator("CmdOrCtrl+O").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:open")
	}), menuIconOpen)
	fileMenu.AddSeparator()
	setMenuIcon(fileMenu.Add("Save").SetAccelerator("CmdOrCtrl+S").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:save")
	}), menuIconSave)
	setMenuIcon(fileMenu.Add("Save As...").SetAccelerator("CmdOrCtrl+Shift+S").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:saveAs")
	}), menuIconSaveAs)
	fileMenu.AddSeparator()
	setMenuIcon(fileMenu.Add("Export as HTML...").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:exportHTML")
	}), menuIconExportHTML)
	setMenuIcon(fileMenu.Add("Export as PDF (Print)...").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:exportPDF")
	}), menuIconExportPDF)
	fileMenu.AddSeparator()
	setMenuIcon(fileMenu.Add("Quit fast-md").SetAccelerator("CmdOrCtrl+Q").OnClick(func(_ *application.Context) {
		requestAppQuit()
	}), menuIconQuit)

	editorMenu := menu.AddSubmenu("Editor")
	editorMenu.AddRole(application.Undo)
	editorMenu.AddRole(application.Redo)
	editorMenu.AddSeparator()
	editorMenu.AddRole(application.Cut)
	editorMenu.AddRole(application.Copy)
	editorMenu.AddRole(application.Paste)
	editorMenu.AddSeparator()
	editorMenu.AddRole(application.SelectAll)

	viewMenu := menu.AddSubmenu("View")
	setMenuIcon(viewMenu.Add("Toggle Sidebar").SetAccelerator("CmdOrCtrl+Shift+L").OnClick(func(_ *application.Context) {
		emitToFocused(app, "menu:toggleSidebar")
	}), menuIconSidebar)
	viewMenu.AddSeparator()
	themeMenu := viewMenu.AddSubmenu("Theme")
	setMenuIcon(viewMenu.FindByLabel("Theme"), menuIconTheme)
	if themes := loadThemes(); len(themes) > 0 {
		for _, t := range themes {
			name := t.Name
			label := t.Label
			setMenuIcon(themeMenu.Add(label).OnClick(func(_ *application.Context) {
				emitToFocused(app, "menu:setTheme", name)
			}), menuIconTheme)
		}
	}
	viewMenu.AddSeparator()
	setMenuIcon(viewMenu.Add("Enter Full Screen").SetAccelerator("Ctrl+CmdOrCtrl+F").OnClick(func(_ *application.Context) {
		toggleFocusedFullscreen(app.Window.Current())
	}), menuIconFullscreen)
	viewMenu.AddSeparator()
	setMenuIcon(viewMenu.Add("Developer Tools").OnClick(func(_ *application.Context) {
		openFocusedDeveloperTools(app)
	}), menuIconDevTools)

	helpMenu := menu.AddSubmenu("Help")
	addHelpDocumentMenuItems(app, helpMenu, helpDocumentEntries(getMenuStrings()))

	app.Menu.Set(menu)
	installConfiguredSystemMenuCleaners("Editor", "View")
	installDeveloperToolsShortcutDisplay("View", "Developer Tools", developerToolsShortcut)
	installCustomHelpMenu("Help")
}
