import { describe, expect, it } from 'vitest'
import { buildMarkdownExportHtml } from './exportHtml'

describe('markdown export html', () => {
  it('embeds Typora GitHub default theme styles', () => {
    const html = buildMarkdownExportHtml({
      title: 'note',
      bodyHtml: '<h1>Hello world</h1><p>Body</p>',
    })

    expect(html).toContain('.markdown-body h1')
    expect(html).toContain('@font-face')
    expect(html).toContain('open-sans-v17-latin-ext_latin-regular.woff2')
    expect(html).toContain('border-bottom: 1px solid #eee')
    expect(html).toContain('.markdown-body blockquote')
    expect(html).toContain('border-left: 4px solid #dfe2e5')
    expect(html).toContain('.markdown-body table tr:nth-child(2n), .markdown-body thead')
    expect(html).toContain('.markdown-body code, .markdown-body tt')
    expect(html).toContain('.markdown-body .md-task-list-item > input')
    expect(html).toContain('.markdown-body pre.md-meta-block')
    expect(html).toContain('<body><main class="markdown-body"><h1>Hello world</h1><p>Body</p></main></body>')
  })
})
