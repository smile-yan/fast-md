//go:build !darwin

package core

import "path/filepath"

// ShowCloseSheet returns "cancel", "discard", or "save:<absolute-path>" for
// an unsaved new document.
func (s *AppService) ShowCloseSheet(filename, lastDir string) string {
	result := s.ShowSaveDialog(filename)
	if result != "save" {
		return result
	}

	defaultPath := filepath.Join(lastDir, filename)
	if filename == "" {
		defaultPath = ""
	}
	path, err := s.SaveFileDialog(defaultPath)
	if err != nil || path == "" {
		return "cancel"
	}
	return "save:" + path
}
