import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('Typora macOS shortcuts', () => {
  it('registers Typora-compatible Markdown editing key bindings', () => {
    const source = readFileSync(join(currentDir, 'components/Editor.vue'), 'utf8');

    [
      'Mod-0',
      'Mod-1',
      'Mod-2',
      'Mod-3',
      'Mod-4',
      'Mod-5',
      'Mod-6',
      'Mod-Alt-q',
      'Mod-Alt-t',
      'Ctrl-Mod-i',
      'Mod-Alt-b',
      'Mod-Alt-o',
      'Mod-Alt-u',
      'Mod-l',
      'Mod-e',
      'Mod-a',
      'Mod-Shift-Backspace',
      'Mod-b',
      'Mod-i',
      "Shift-Mod-`",
      "Shift-Ctrl-`",
      'Mod-Alt-c',
      'Mod-k',
      'Mod-\\',
      'Mod-=',
      'Mod--',
      'Mod-[',
      'Mod-]',
      'Mod-Alt-0',
      'Mod-Alt-1',
      'Mod-Alt-2',
      'Mod-Alt-3',
      'Mod-Alt-4',
      'Mod-Alt-5',
      'Mod-Alt-6',
      'Mod-Alt-7',
      'Mod-Alt-8',
      'Mod-Alt-x',
      'Mod-Shift-b',
      "selectRowCommand",
      "selectColCommand",
      "deleteCurrentTableRowCommand",
      "sinkListItemCommand",
      "liftListItemCommand",
    ].forEach((shortcut) => {
      expect(source).toContain(shortcut)
    })
  })

  it('overrides Milkdown defaults that conflict with Typora macOS', () => {
    const source = readFileSync(join(currentDir, 'components/Editor.vue'), 'utf8');

    expect(source).toContain('handledNoopCommand')
    ;[
      'Mod-Alt-0',
      'Mod-Alt-1',
      'Mod-Alt-2',
      'Mod-Alt-3',
      'Mod-Alt-4',
      'Mod-Alt-5',
      'Mod-Alt-6',
      'Mod-Alt-7',
      'Mod-Alt-8',
      'Mod-Alt-x',
      'Mod-Shift-b',
      'Mod-[',
      'Mod-]',
    ].forEach((shortcut) => {
      if (shortcut === 'Mod-[') {
        expect(source).toContain(`'${shortcut}': { key: '${shortcut}', onRun: runCommand(sinkListItemCommand.key)`)
      } else if (shortcut === 'Mod-]') {
        expect(source).toContain(`'${shortcut}': { key: '${shortcut}', onRun: runCommand(liftListItemCommand.key)`)
      } else {
        expect(source).toContain(`'${shortcut}': { key: '${shortcut}', onRun: handledNoopCommand`)
      }
    })
  })
})
