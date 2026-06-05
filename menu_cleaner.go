package main

var systemMenuCleanerInstaller = installSystemMenuCleaner

func installConfiguredSystemMenuCleaners(editorTitle, viewTitle string) {
	systemMenuCleanerInstaller(editorTitle)
	systemMenuCleanerInstaller(viewTitle)
}
