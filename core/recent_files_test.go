package core

import (
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func newTestStore(t *testing.T) *recentFilesStore {
	t.Helper()
	dir := t.TempDir()
	store, err := newRecentFilesStore(filepath.Join(dir, "recent.json"))
	if err != nil {
		t.Fatalf("newRecentFilesStore: %v", err)
	}
	return store
}

func TestRecentFilesStoreAddPrependsAndDedupes(t *testing.T) {
	store := newTestStore(t)
	if _, err := store.Add("/tmp/a.md"); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Add("/tmp/b.md"); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Add("/tmp/a.md"); err != nil {
		t.Fatal(err)
	}

	got := store.Snapshot()
	want := []string{"/tmp/a.md", "/tmp/b.md"}
	if !equalSlices(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestRecentFilesStoreCapsAtMaxRecentFiles(t *testing.T) {
	store := newTestStore(t)
	// Add maxRecentFiles + 5 distinct paths; the oldest 5 should fall off.
	for i := 0; i < maxRecentFiles+5; i++ {
		path := filepath.Join("/tmp", string(rune('a'+i))+"file.md")
		if _, err := store.Add(path); err != nil {
			t.Fatalf("Add %s: %v", path, err)
		}
	}

	got := store.Snapshot()
	if len(got) != maxRecentFiles {
		t.Fatalf("expected %d entries, got %d", maxRecentFiles, len(got))
	}
	// The most recent add (rune 'a'+maxRecentFiles+4) should be at the head.
	wantHead := filepath.Join("/tmp", string(rune('a'+maxRecentFiles+4))+"file.md")
	if got[0] != wantHead {
		t.Fatalf("expected head %q, got %q", wantHead, got[0])
	}
}

func TestRecentFilesStoreRejectsNonMarkdownPaths(t *testing.T) {
	store := newTestStore(t)
	store.Add("/tmp/foo.txt")
	store.Add("/tmp/no-extension")
	store.Add("/tmp/bar.md")

	got := store.Snapshot()
	if !equalSlices(got, []string{"/tmp/bar.md"}) {
		t.Fatalf("expected only bar.md, got %v", got)
	}
}

func TestRecentFilesStoreAcceptsMarkdownExtensionCaseInsensitive(t *testing.T) {
	store := newTestStore(t)
	store.Add("/tmp/note.MD")
	store.Add("/tmp/spec.Markdown")

	got := store.Snapshot()
	if len(got) != 2 {
		t.Fatalf("expected 2 entries, got %v", got)
	}
}

func TestRecentFilesStoreSnapshotIsIndependent(t *testing.T) {
	store := newTestStore(t)
	store.Add("/tmp/a.md")
	snap := store.Snapshot()
	snap[0] = "/tmp/MUTATED.md"

	if got := store.Snapshot(); got[0] != "/tmp/a.md" {
		t.Fatalf("Snapshot should be independent of caller mutation, got %v", got)
	}
}

func TestRecentFilesStorePersistsAcrossInstances(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "recent.json")

	first, err := newRecentFilesStore(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := first.Add("/tmp/a.md"); err != nil {
		t.Fatal(err)
	}
	if _, err := first.Add("/tmp/b.md"); err != nil {
		t.Fatal(err)
	}

	// Simulate a relaunch: construct a fresh store from the same file.
	second, err := newRecentFilesStore(path)
	if err != nil {
		t.Fatal(err)
	}
	if got := second.Snapshot(); !equalSlices(got, []string{"/tmp/b.md", "/tmp/a.md"}) {
		t.Fatalf("expected persisted order [/tmp/b.md, /tmp/a.md], got %v", got)
	}
}

func TestRecentFilesStoreLoadOnMissingFileYieldsEmptyList(t *testing.T) {
	dir := t.TempDir()
	store, err := newRecentFilesStore(filepath.Join(dir, "does-not-exist.json"))
	if err != nil {
		t.Fatalf("newRecentFilesStore: %v", err)
	}
	if got := store.Snapshot(); len(got) != 0 {
		t.Fatalf("expected empty list, got %v", got)
	}
}

func TestRecentFilesStoreLoadOnCorruptFileYieldsEmptyList(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "recent.json")
	if err := os.WriteFile(path, []byte("{not valid json"), 0644); err != nil {
		t.Fatal(err)
	}
	store, err := newRecentFilesStore(path)
	if err != nil {
		t.Fatalf("newRecentFilesStore should not propagate JSON error: %v", err)
	}
	if got := store.Snapshot(); len(got) != 0 {
		t.Fatalf("expected empty list after corrupt file, got %v", got)
	}
}

func TestRecentFilesStoreLoadDeduplicatesAndTrims(t *testing.T) {
	// Mimic a list written by an older/buggy version with duplicates and
	// empties. load() should clean it up.
	dir := t.TempDir()
	path := filepath.Join(dir, "recent.json")
	if err := os.WriteFile(path, []byte(`["/tmp/a.md","/tmp/a.md","","/tmp/b.md","/tmp/a.md"]`), 0644); err != nil {
		t.Fatal(err)
	}
	store, err := newRecentFilesStore(path)
	if err != nil {
		t.Fatal(err)
	}
	got := store.Snapshot()
	want := []string{"/tmp/a.md", "/tmp/b.md"}
	if !equalSlices(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestRecentFilesStoreAddIgnoresDuplicateWithoutReorderingFailure(t *testing.T) {
	// Re-adding a path that already exists should move it to the head
	// and dedupe, NOT duplicate. The same path twice in a row must
	// produce a single entry.
	store := newTestStore(t)
	store.Add("/tmp/a.md")
	store.Add("/tmp/b.md")
	store.Add("/tmp/a.md") // moves a.md to head
	store.Add("/tmp/a.md") // still just one a.md

	got := store.Snapshot()
	want := []string{"/tmp/a.md", "/tmp/b.md"}
	if !equalSlices(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestRecentFilesStoreSaveCreatesParentDir(t *testing.T) {
	// The persistence file's parent directory may not exist on a fresh
	// install. Save should mkdir-p it.
	dir := t.TempDir()
	path := filepath.Join(dir, "nested", "subdir", "recent.json")
	store, err := newRecentFilesStore(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.Add("/tmp/a.md"); err != nil {
		t.Fatalf("Add should create parent dir: %v", err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("persistence file not written: %v", err)
	}
}

func TestRecentFilesStoreIsConcurrencySafe(t *testing.T) {
	// Race-detector run would catch a missing lock; this also checks
	// that the final state is consistent (one entry per unique path).
	store := newTestStore(t)
	const goroutines = 8
	const perGoroutine = 25
	var wg sync.WaitGroup
	for g := 0; g < goroutines; g++ {
		wg.Add(1)
		go func(g int) {
			defer wg.Done()
			for i := 0; i < perGoroutine; i++ {
				// Cycle through a small set so dedupe is exercised.
				path := filepath.Join("/tmp", "file-"+string(rune('a'+i%5))+".md")
				_, _ = store.Add(path)
			}
		}(g)
	}
	wg.Wait()

	got := store.Snapshot()
	if len(got) > maxRecentFiles {
		t.Fatalf("expected at most %d entries, got %d", maxRecentFiles, len(got))
	}
	// Dedupe must hold.
	seen := make(map[string]bool)
	for _, p := range got {
		if seen[p] {
			t.Fatalf("duplicate in final snapshot: %q", p)
		}
		seen[p] = true
	}
}

func equalSlices(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
