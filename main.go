// Command fast-md is the entry point for the fast-md Markdown editor.
// All real logic lives in the core package; this file just embeds the
// frontend assets and the help documents, then hands them to core.Run.
//
// The two //go:embed directives target "all:frontend/dist docs/help" so
// the same embed.FS serves both purposes: the bundled frontend (loaded by
// the Wails asset handler) and the markdown help docs (read by core).
package main

import (
	"embed"
	"log"

	"changeme/core"
)

//go:embed all:frontend/dist docs/help
var assets embed.FS

func main() {
	if err := core.Run(assets); err != nil {
		log.Fatal(err)
	}
}