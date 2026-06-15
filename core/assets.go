package core

import (
	"encoding/json"
	"io/fs"
)

var (
	assetsFS        fs.FS
	helpDocumentFS  fs.FS
)

// SetAssets installs the embedded frontend assets FS so loadThemes and
// materializeHelpDocument can read packaged content. It expects the FS to
// contain both "frontend/dist/..." and "docs/help/...". Call before building
// any menu or opening help docs.
func SetAssets(assets fs.FS) {
	assetsFS = assets
	if sub, err := fs.Sub(assets, "docs/help"); err == nil {
		helpDocumentFS = sub
	}
}

type themeEntry struct {
	Name  string `json:"name"`
	Label string `json:"label"`
}

func loadThemes() []themeEntry {
	if assetsFS == nil {
		return nil
	}
	data, err := fs.ReadFile(assetsFS, "frontend/dist/themes/index.json")
	if err != nil {
		return nil
	}
	var entries []themeEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil
	}
	return entries
}