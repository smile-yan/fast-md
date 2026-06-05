#!/usr/bin/env python3
"""Convert a Typora CSS theme to fast-md compatible CSS."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "frontend" / "public" / "themes"
INDEX_FILE = OUT_DIR / "index.json"

STRUCTURAL_PATCH = """\
/* structural patch: elements Milkdown doesn't style by default */
.milkdown .ProseMirror table { border-collapse: collapse; width: 100%; }
.milkdown .ProseMirror table th,
.milkdown .ProseMirror table td { border: 1px solid; padding: 6px 13px; }
.milkdown .ProseMirror table tr:nth-child(2n) { background-color: rgba(0,0,0,.04); }

"""

# Selectors/at-rules to drop entirely
DROP_PATTERNS = re.compile(
    r'\.ty-|#typora-|\.md-toc|\.md-diagram|\.md-math|'
    r'#write-info-panel|@font-face|@import|\.md-focus|'
    r'\.md-end-block|\.md-line|\.md-expand|\.md-rawblock|'
    r'\.md-image|\.on-focus-mode|\.sidebar-|\.file-|\.megamenu-|'
    r'\.footer-|\.toolbar-|\.ty-preferences|\.ty-input|\.ty-table-edit'
)


def title_case(name: str) -> str:
    return name.replace('-', ' ').replace('_', ' ').title()


def rewrite_selector(sel: str) -> str | None:
    """Return rewritten selector or None to drop the rule."""
    sel = sel.strip()
    if DROP_PATTERNS.search(sel):
        return None
    # Drop bare html rule
    if re.fullmatch(r'html\s*', sel):
        return None
    # #write → .milkdown .ProseMirror
    sel = re.sub(r'#write\b', '.milkdown .ProseMirror', sel)
    # .md-fences → pre
    sel = sel.replace('.md-fences', 'pre')
    # bare body → .milkdown .ProseMirror
    sel = re.sub(r'\bbody\b', '.milkdown .ProseMirror', sel)
    # drop remaining .md-* selectors
    if re.search(r'\.md-', sel):
        return None
    return sel


def extract_border_left_color(decls: str) -> str | None:
    m = re.search(r'border-left\s*:[^;]*?(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)\s*(?:;|$)', decls)
    return m.group(1) if m else None


def convert(css: str) -> str:
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    # Split into rules by finding balanced braces
    output_rules: list[str] = [STRUCTURAL_PATCH]
    i = 0
    n = len(css)

    while i < n:
        # Find next '{'
        brace = css.find('{', i)
        if brace == -1:
            break

        selector_text = css[i:brace].strip()
        # Find matching closing brace
        depth = 1
        j = brace + 1
        while j < n and depth > 0:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        body = css[brace+1:j-1]
        i = j

        # Skip @media/@keyframes blocks (keep :root)
        if selector_text.startswith('@') and not selector_text.startswith(':root'):
            continue

        # Handle comma-separated selectors
        selectors = [s.strip() for s in selector_text.split(',')]
        rewritten = []
        for sel in selectors:
            r = rewrite_selector(sel)
            if r:
                rewritten.append(r)

        if not rewritten:
            continue

        # Blockquote structural fix
        joined = ', '.join(rewritten)
        if 'blockquote' in joined and 'border-left' in body:
            color = extract_border_left_color(body) or '#dfe2e5'
            body_clean = re.sub(r'border-left\s*:[^;]+;?', '', body)
            output_rules.append(f"{joined} {{\n{body_clean}\n  padding-left: 1em;\n}}\n")
            output_rules.append(
                f".milkdown .ProseMirror blockquote::before {{\n"
                f"  background: {color};\n}}\n"
            )
        else:
            output_rules.append(f"{joined} {{\n{body}\n}}\n")

    return '\n'.join(output_rules)


def update_index(name: str, label: str) -> None:
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    entries: list[dict] = []
    if INDEX_FILE.exists():
        entries = json.loads(INDEX_FILE.read_text())
    if not any(e['name'] == name for e in entries):
        entries.append({'name': name, 'label': label})
        INDEX_FILE.write_text(json.dumps(entries, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description='Convert Typora CSS theme for fast-md')
    parser.add_argument('input', help='Path to Typora .css file')
    parser.add_argument('--name', help='Theme name (default: stem of input filename)')
    args = parser.parse_args()

    src = Path(args.input)
    if not src.exists():
        print(f'Error: {src} not found', file=sys.stderr)
        sys.exit(1)

    name = args.name or src.stem
    label = title_case(name)
    css = src.read_text(encoding='utf-8', errors='replace')

    result = convert(css)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f'{name}.css'
    out.write_text(result, encoding='utf-8')
    print(f'Written: {out}')

    update_index(name, label)
    print(f'Updated: {INDEX_FILE}')


if __name__ == '__main__':
    main()
