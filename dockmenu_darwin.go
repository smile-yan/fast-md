//go:build darwin

package main

/*
#include <stdlib.h>
extern void setupDockMenu(void);
extern void updateDockRecentFiles(const char **paths, int count);
*/
import "C"
import (
	"strings"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

var (
	recentFiles   []string
	recentFilesMu sync.Mutex
	maxRecent     = 10
)

//export dockMenuNewWindow
func dockMenuNewWindow() {
	if svc == nil || svc.app == nil {
		return
	}
	go newEditorWindow(svc.app)
}

//export dockMenuOpenFile
func dockMenuOpenFile() {
	if svc == nil || svc.app == nil {
		return
	}
	go func() {
		if w := svc.app.Window.Current(); w != nil {
			w.EmitEvent("menu:open")
		} else {
			ww := newEditorWindow(svc.app)
			ww.OnWindowEvent(events.Common.WindowRuntimeReady, func(_ *application.WindowEvent) {
				ww.EmitEvent("menu:open")
			})
		}
	}()
}

//export dockMenuOpenRecent
func dockMenuOpenRecent(cpath *C.char) {
	path := C.GoString(cpath)
	if path == "" || svc == nil || svc.app == nil {
		return
	}
	go func() {
		if w := svc.app.Window.Current(); w != nil {
			w.EmitEvent("file:open", path)
		} else {
			newEditorWindowWithFile(svc.app, path)
		}
	}()
	trackRecentFile(path)
}

func trackRecentFile(path string) {
	lower := strings.ToLower(path)
	if !strings.HasSuffix(lower, ".md") && !strings.HasSuffix(lower, ".markdown") {
		return
	}

	recentFilesMu.Lock()
	for i, p := range recentFiles {
		if p == path {
			recentFiles = append(recentFiles[:i], recentFiles[i+1:]...)
			break
		}
	}
	recentFiles = append([]string{path}, recentFiles...)
	if len(recentFiles) > maxRecent {
		recentFiles = recentFiles[:maxRecent]
	}
	recentFilesMu.Unlock()

	updateDockRecentMenu()
}

func updateDockRecentMenu() {
	recentFilesMu.Lock()
	paths := make([]*C.char, len(recentFiles))
	for i, p := range recentFiles {
		paths[i] = C.CString(p)
	}
	count := C.int(len(recentFiles))
	recentFilesMu.Unlock()

	if len(paths) > 0 {
		C.updateDockRecentFiles(&paths[0], count)
	} else {
		C.updateDockRecentFiles(nil, 0)
	}
	// C strings are freed by updateDockRecentFiles after copying
}

func setupDockMenu() {
	C.setupDockMenu()
	updateDockRecentMenu()
}
