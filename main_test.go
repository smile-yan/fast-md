package main

import (
	"os"
	"reflect"
	"strings"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type fakeOpenedFileWindow struct {
	eventName string
	eventData []any
}

func (w *fakeOpenedFileWindow) EmitEvent(name string, data ...any) bool {
	w.eventName = name
	w.eventData = data
	return true
}

type fakeFullscreenWindow struct {
	toggleCount int
}

func (w *fakeFullscreenWindow) ToggleFullscreen() {
	w.toggleCount++
}

func TestToggleFocusedFullscreenUsesNativeWindowFullscreen(t *testing.T) {
	window := &fakeFullscreenWindow{}

	toggleFocusedFullscreen(window)

	if window.toggleCount != 1 {
		t.Fatalf("expected native fullscreen toggle to be called once, got %d", window.toggleCount)
	}
}

func TestToggleFocusedFullscreenIgnoresMissingWindow(t *testing.T) {
	toggleFocusedFullscreen(nil)
}

func TestShortcutAcceleratorsMatchTyporaMacOS(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	menu := app.Menu.GetApplicationMenu()
	assertMenuAccelerator(t, menu, "New File", "Cmd+N")
	assertMenuAccelerator(t, menu, "New Window", "Cmd+Shift+N")
	assertMenuAccelerator(t, menu, "Toggle Sidebar", "Cmd+Shift+L")
	assertMenuAccelerator(t, menu, "Enter Full Screen", "Cmd+Ctrl+F")
	assertMenuAccelerator(t, menu, "Developer Tools", "")
}

func TestDeveloperToolsShortcutRegisteredAsGlobalKeyBinding(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	registerDeveloperToolsShortcut(app)

	assertKeyBindingRegistered(t, app, "F12")
}

func TestViewMenuFullscreenItemStaysCustomAction(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	menu := app.Menu.GetApplicationMenu()
	if item := menu.FindByRole(application.ToggleFullscreen); item != nil {
		t.Fatalf("expected View fullscreen item to stay custom, got native role item %q", item.Label())
	}
}

func TestSystemMenuCleanerInstalledForEditorAndView(t *testing.T) {
	var got []string
	previous := systemMenuCleanerInstaller
	systemMenuCleanerInstaller = func(menuTitle string) {
		got = append(got, menuTitle)
	}
	defer func() {
		systemMenuCleanerInstaller = previous
	}()

	installConfiguredSystemMenuCleaners("Editor", "View")

	want := []string{"Editor", "View"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected system menu cleaners %#v, got %#v", want, got)
	}
}

func TestBuildMenuI18nInstallsSystemMenuCleanersForCurrentLocale(t *testing.T) {
	var got []string
	previous := systemMenuCleanerInstaller
	systemMenuCleanerInstaller = func(menuTitle string) {
		got = append(got, menuTitle)
	}
	defer func() {
		systemMenuCleanerInstaller = previous
	}()

	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("zh")
	buildMenuI18n(app)

	want := []string{"编辑", "视图"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected localized system menu cleaners %#v, got %#v", want, got)
	}
}

func TestViewMenuItemsHaveIcons(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	viewItem := app.Menu.GetApplicationMenu().FindByLabel("View")
	if viewItem == nil {
		t.Fatal("expected View menu to exist")
	}
	assertMenuItemsHaveIcons(t, viewItem.GetSubmenu())
}

func TestViewThemeMenuOnlyContainsPackagedThemes(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	themeItem := app.Menu.GetApplicationMenu().FindByLabel("Theme")
	if themeItem == nil {
		t.Fatal("expected Theme menu to exist")
	}

	got := menuLabels(themeItem.GetSubmenu())
	want := []string{"Github"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected Theme menu labels %#v, got %#v", want, got)
	}
}

func TestFileMenuItemsHaveIcons(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	fileItem := app.Menu.GetApplicationMenu().FindByLabel("File")
	if fileItem == nil {
		t.Fatal("expected File menu to exist")
	}
	assertMenuItemsHaveIcons(t, fileItem.GetSubmenu())
}

func TestHelpMenuItemsHaveIcons(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("en")
	buildMenuI18n(app)

	helpItem := app.Menu.GetApplicationMenu().FindByLabel("Help")
	if helpItem == nil {
		t.Fatal("expected Help menu to exist")
	}
	assertMenuItemsHaveIcons(t, helpItem.GetSubmenu())
}

func TestHelpMenuContainsOnlyDocumentationItems(t *testing.T) {
	app := application.New(application.Options{Name: "fast-md-test"})
	SetLocale("zh")
	buildMenuI18n(app)

	helpItem := app.Menu.GetApplicationMenu().FindByLabel("帮助")
	if helpItem == nil {
		t.Fatal("expected Help menu to exist")
	}

	got := menuLabels(helpItem.GetSubmenu())
	want := []string{"快速开始", "快捷键说明", "markdown入门", "数学公式入门"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected Help menu labels %#v, got %#v", want, got)
	}
}

func TestHelpDocumentsMaterializeMarkdownFiles(t *testing.T) {
	dir := t.TempDir()

	for _, doc := range helpDocumentEntries(getMenuStrings()) {
		path, err := materializeHelpDocument(doc.filename, dir)
		if err != nil {
			t.Fatalf("expected %s to materialize: %v", doc.filename, err)
		}
		if !strings.HasSuffix(path, doc.filename) {
			t.Fatalf("expected materialized path to end with %q, got %q", doc.filename, path)
		}
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("expected to read materialized help document %q: %v", path, err)
		}
		if !strings.HasPrefix(string(content), "# ") {
			t.Fatalf("expected %q to be a markdown document with a heading", doc.filename)
		}
	}
}

func assertMenuItemsHaveIcons(t *testing.T, menu *application.Menu) {
	t.Helper()
	if menu == nil {
		t.Fatal("expected submenu to exist")
	}
	for i := 0; ; i++ {
		item := menu.ItemAt(i)
		if item == nil {
			return
		}
		if item.IsSeparator() {
			continue
		}
		if !menuItemHasBitmap(item) {
			t.Fatalf("expected View menu item %q to have an icon", item.Label())
		}
		if submenu := item.GetSubmenu(); submenu != nil {
			assertMenuItemsHaveIcons(t, submenu)
		}
	}
}

func menuLabels(menu *application.Menu) []string {
	var labels []string
	for i := 0; ; i++ {
		item := menu.ItemAt(i)
		if item == nil {
			return labels
		}
		if item.IsSeparator() {
			continue
		}
		labels = append(labels, item.Label())
	}
}

func menuItemHasBitmap(item *application.MenuItem) bool {
	value := reflect.ValueOf(item).Elem().FieldByName("bitmap")
	return value.IsValid() && value.Kind() == reflect.Slice && value.Len() > 0
}

func assertMenuAccelerator(t *testing.T, menu *application.Menu, label string, want string) {
	t.Helper()
	item := menu.FindByLabel(label)
	if item == nil {
		t.Fatalf("expected menu item %q to exist", label)
	}
	if got := item.GetAccelerator(); got != want {
		t.Fatalf("expected %q accelerator %q, got %q", label, want, got)
	}
}

func assertKeyBindingRegistered(t *testing.T, app *application.App, accelerator string) {
	t.Helper()
	for _, binding := range app.KeyBinding.GetAll() {
		if binding.Accelerator == accelerator {
			return
		}
	}
	t.Fatalf("expected key binding %q to be registered", accelerator)
}

func TestRouteOpenedFileEmitsFileOpenToCurrentWindow(t *testing.T) {
	window := &fakeOpenedFileWindow{}
	openedNew := false

	routeOpenedFile("/tmp/new.md", window, func(string) {
		openedNew = true
	})

	if openedNew {
		t.Fatal("expected existing window to receive file:open instead of opening a new window")
	}
	if window.eventName != "file:open" {
		t.Fatalf("expected file:open event, got %q", window.eventName)
	}
	if len(window.eventData) != 1 || window.eventData[0] != "/tmp/new.md" {
		t.Fatalf("expected opened path payload, got %#v", window.eventData)
	}
}

func TestRouteOpenedFileCreatesWindowWhenNoCurrentWindow(t *testing.T) {
	var openedPath string

	routeOpenedFile("/tmp/new.md", nil, func(path string) {
		openedPath = path
	})

	if openedPath != "/tmp/new.md" {
		t.Fatalf("expected new window path %q, got %q", "/tmp/new.md", openedPath)
	}
}

func TestRouteOpenedFileIgnoresEmptyPath(t *testing.T) {
	window := &fakeOpenedFileWindow{}
	openedNew := false

	routeOpenedFile("", window, func(string) {
		openedNew = true
	})

	if openedNew || window.eventName != "" {
		t.Fatalf("expected empty path to do nothing, event=%q openedNew=%v", window.eventName, openedNew)
	}
}
