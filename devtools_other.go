//go:build !darwin

package main

import "unsafe"

func toggleDevTools(nsWindow unsafe.Pointer) {}

func positionTrafficLights(nsWindow unsafe.Pointer, x, y float64) {}

func setupTopBorderDoubleClick(nsWindow unsafe.Pointer) {}

func installSystemMenuCleaner(menuTitle string) {}

func installDeveloperToolsShortcutDisplay(viewTitle, itemTitle, shortcut string) {}

func installCustomHelpMenu(helpTitle string) {}
