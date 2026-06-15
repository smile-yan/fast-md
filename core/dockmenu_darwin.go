//go:build darwin

package core

/*
#include <stdlib.h>
extern void setupDockMenu(void);
extern void updateDockRecentFiles(const char **paths, int count);
*/
import "C"
import (
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//export dockMenuNewWindow
func dockMenuNewWindow() {
	if Service == nil || Service.app == nil {
		return
	}
	go NewEditorWindow(Service.app)
}

//export dockMenuOpenFile
func dockMenuOpenFile() {
	if Service == nil || Service.app == nil {
		return
	}
	go func() {
		if w := Service.app.Window.Current(); w != nil {
			w.EmitEvent("menu:open")
		} else {
			ww := NewEditorWindow(Service.app)
			ww.OnWindowEvent(events.Common.WindowRuntimeReady, func(_ *application.WindowEvent) {
				ww.EmitEvent("menu:open")
			})
		}
	}()
}

//export dockMenuOpenRecent
func dockMenuOpenRecent(cpath *C.char) {
	path := C.GoString(cpath)
	if path == "" || Service == nil || Service.app == nil {
		return
	}
	// Recent files are paths the user has previously opened in this app,
	// so re-opening one is implicit consent to access its directory again.
	// Best-effort; a failure means the file just won't open, not a crash.
	_ = Service.trustDir(filepath.Dir(path))
	go func() {
		if w := Service.app.Window.Current(); w != nil {
			w.EmitEvent("file:open", path)
		} else {
			NewEditorWindowWithFile(Service.app, path)
		}
	}()
	// Do NOT call trackRecentFile here. The file:open / ReadFile path
	// already records the path on a successful open, so calling it
	// upfront would add ghost entries for files that no longer exist,
	// were moved, or have their permissions revoked.
}

// trackRecentFile is the public hook AppService.ReadFile calls after a
// successful read. It updates the persisted store and refreshes the
// dock menu in one shot.
func trackRecentFile(path string) {
	if Service == nil || Service.recent == nil {
		return
	}
	snapshot, err := Service.recent.Add(path)
	if err != nil {
		// Persistence failure shouldn't break the read — the in-memory
		// list is still consistent and the next save will retry.
		// (Stderr is the best we can do without bringing in a logger.)
		_ = err
	}
	updateDockRecentMenu(snapshot)
}

// updateDockRecentMenu pushes the given snapshot to the native dock
// menu. Passing the snapshot as a parameter (rather than reading from
// a package-level global) means the call site is the only place that
// decides which list to display, and the C interop works from a stable
// slice without any lock held.
func updateDockRecentMenu(paths []string) {
	if len(paths) == 0 {
		C.updateDockRecentFiles(nil, 0)
		return
	}
	// C.CString allocates with malloc; the Obj-C side frees each entry
	// after copying it into NSString. The Go slice itself stays alive
	// for the duration of the C call (cgo pins it), so passing
	// &cstrings[0] is safe.
	cstrings := make([]*C.char, len(paths))
	for i, p := range paths {
		cstrings[i] = C.CString(p)
	}
	C.updateDockRecentFiles(&cstrings[0], C.int(len(cstrings)))
}

func setupDockMenu() {
	C.setupDockMenu()
	// Populate the dock menu from the persisted store. Service.recent
	// is initialized in Run() before this is called, so the user's
	// history from the previous session is on screen immediately.
	if Service != nil && Service.recent != nil {
		updateDockRecentMenu(Service.recent.Snapshot())
	}
}
