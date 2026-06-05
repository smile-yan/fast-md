export const typoraGithubExportCss = `
@font-face {
  font-family: "Open Sans";
  font-style: normal;
  font-weight: normal;
  src: local("Open Sans Regular"), local("OpenSans-Regular"), url("./github/open-sans-v17-latin-ext_latin-regular.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

@font-face {
  font-family: "Open Sans";
  font-style: italic;
  font-weight: normal;
  src: local("Open Sans Italic"), local("OpenSans-Italic"), url("./github/open-sans-v17-latin-ext_latin-italic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

@font-face {
  font-family: "Open Sans";
  font-style: normal;
  font-weight: bold;
  src: local("Open Sans Bold"), local("OpenSans-Bold"), url("./github/open-sans-v17-latin-ext_latin-700.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

@font-face {
  font-family: "Open Sans";
  font-style: italic;
  font-weight: bold;
  src: local("Open Sans Bold Italic"), local("OpenSans-BoldItalic"), url("./github/open-sans-v17-latin-ext_latin-700italic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  background: #ffffff;
}

.markdown-body {
  max-width: 860px;
  margin: 0 auto;
  padding: 30px;
  padding-bottom: 100px;
  font-family: "Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, "Segoe UI Emoji", sans-serif;
  color: rgb(51, 51, 51);
  line-height: 1.6;
}

.markdown-body > ul:first-child,
.markdown-body > ol:first-child {
  margin-top: 30px;
}

.markdown-body a {
  color: #4183c4;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  position: relative;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0;
  font-family: inherit;
  font-weight: bold;
  line-height: 1.4;
}

.markdown-body h1 {
  font-size: 2.25em;
  line-height: 1.2;
  border-bottom: 1px solid #eee;
}

.markdown-body h2 {
  font-size: 1.75em;
  line-height: 1.225;
  border-bottom: 1px solid #eee;
}

.markdown-body h3 {
  font-size: 1.5em;
  line-height: 1.43;
}

.markdown-body h4 {
  font-size: 1.25em;
}

.markdown-body h5 {
  font-size: 1em;
}

.markdown-body h6 {
  font-size: 1em;
  color: #777;
}

.markdown-body h1 tt,
.markdown-body h1 code,
.markdown-body h2 tt,
.markdown-body h2 code,
.markdown-body h3 tt,
.markdown-body h3 code,
.markdown-body h4 tt,
.markdown-body h4 code,
.markdown-body h5 tt,
.markdown-body h5 code,
.markdown-body h6 tt,
.markdown-body h6 code {
  font-size: inherit;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table {
  margin: 0.8em 0;
}

.markdown-body li > ol,
.markdown-body li > ul {
  margin: 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 30px;
}

.markdown-body ul:first-child,
.markdown-body ol:first-child {
  margin-top: 0;
}

.markdown-body ul:last-child,
.markdown-body ol:last-child {
  margin-bottom: 0;
}

.markdown-body li p.first {
  display: inline-block;
}

.markdown-body hr {
  height: 2px;
  padding: 0;
  margin: 16px 0;
  background-color: #e7e7e7;
  border: 0 none;
  overflow: hidden;
  box-sizing: content-box;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  padding: 0 15px;
  color: #777777;
}

.markdown-body blockquote blockquote {
  padding-right: 0;
}

.markdown-body table {
  width: 100%;
  padding: 0;
  border-collapse: collapse;
  word-break: initial;
}

.markdown-body table tr {
  border: 1px solid #dfe2e5;
  margin: 0;
  padding: 0;
}

.markdown-body table tr:nth-child(2n), .markdown-body thead {
  background-color: #f8f8f8;
}

.markdown-body table th {
  font-weight: bold;
  border: 1px solid #dfe2e5;
  border-bottom: 0;
  margin: 0;
  padding: 6px 13px;
}

.markdown-body table td {
  border: 1px solid #dfe2e5;
  margin: 0;
  padding: 6px 13px;
}

.markdown-body table th:first-child,
.markdown-body table td:first-child {
  margin-top: 0;
}

.markdown-body table th:last-child,
.markdown-body table td:last-child {
  margin-bottom: 0;
}

.markdown-body code, .markdown-body tt, .markdown-body pre {
  border: 1px solid #e7eaed;
  background-color: #f8f8f8;
  border-radius: 3px;
  padding: 2px 4px 0 4px;
  color: inherit;
  font-size: 0.9em;
}

.markdown-body code {
  background-color: #f3f4f4;
  padding: 0 2px;
}

.markdown-body pre {
  margin-top: 15px;
  margin-bottom: 15px;
  padding-top: 8px;
  padding-bottom: 6px;
  background-color: #f8f8f8;
  overflow-x: auto;
}

.markdown-body pre code {
  border: 0;
  background: transparent;
  padding: 0;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
}

.markdown-body .md-task-list-item > input {
  margin-left: -1.3em;
}

.markdown-body pre.md-meta-block {
  padding: 1rem;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f7f7f7;
  border: 0;
  border-radius: 3px;
  color: #777777;
  margin-top: 0;
}

.markdown-body .md-mathjax-midline {
  background: #fafafa;
}

.markdown-body .md-image > .md-meta {
  border-radius: 3px;
  padding: 2px 0 0 4px;
  font-size: 0.9em;
  color: inherit;
}

.markdown-body .md-tag {
  color: #a7a7a7;
  opacity: 1;
}

.markdown-body .md-lang {
  color: #b4654d;
}

@media print {
  html {
    font-size: 13px;
  }

  pre {
    page-break-inside: avoid;
    word-wrap: break-word;
  }
}
`.trim()

export function buildMarkdownExportHtml({ title, bodyHtml }: { title: string, bodyHtml: string }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${typoraGithubExportCss}</style>
</head><body><main class="markdown-body">${bodyHtml}</main></body></html>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
