# MarkdownEditor.Web — Handoff

## Objective

A WYSIWYG Markdown editor for web pages, as a plain JavaScript component (no framework, no
build step, no dependencies), analogous to MaxPad in MarkdownTools and built on a browser
version of its `VirtualTextView`. The user's request, 2026-11-03: "create an analogous
WYSIWYG markdown editor but for the Web, as a pure JavaScript plug-in component. It needs to
have the basic functionality of the VirtualTextView and be pluggable into web pages."

## State (2026-11-03)

Done, on branch `claude/web-markdown-editor` (not merged into `main`):

- `src/view/`: `VirtualTextView` (virtualized layout, caret, selection, keys, mouse, IME,
  clipboard, its own editing with `TextEdit` records, `editcommand`, `replaceParagraphs`,
  `restyleParagraph`, highlights, formatting marks, zoom, read-only, tables, pictures,
  list markers), with `model.js`, `styles.js` and `text.js`.
- `src/markdown/`: the parser (CommonMark blocks and inlines with source offsets, and
  MaxPad's extensions), the projection, the commands (Enter, Shift+Enter, Backspace,
  Delete and Tab by block, as `Documents/maxpad-editing.md` in MarkdownTools says), the
  inline formats, the paragraph types, the history, the controller and the style provider.
- `src/MarkdownEditor.js` (the component, its toolbar and keys) and `src/element.js`
  (`<markdown-editor>`, a form-associated element).
- `demo/` (the editor, the element in a form, TinyPad), `test/` (a browser test runner and
  44 tests, one of them random commands with undo and redo checked), `tools/serve.ps1`.

## Design decisions

- The source is the authority, and the view's text is the source of each block's lines with
  the syntax hidden: the map between view and source is offset arithmetic. A picture is drawn
  after its `!`, never as a character of its own.
- Line endings are made "\n" on load and the document's own again on save.
- Each edit parses and projects the whole document again; the view is given only the
  paragraphs whose projection changed (a table is replaced whole).
- An editor without the focus shows no syntax (MaxPad shows it at the caret always; a page
  may have several editors). `revealUnfocused: true` keeps MaxPad's way.
- Keys: MaxPad's (2026-11-03, the user: "Ctrl+Number keys don't work"): Ctrl+1 to 6
  headings and Ctrl+0 a paragraph, set and never toggled; Ctrl+= and Ctrl+- the level one
  deeper or shallower; zoom on Ctrl and the mouse wheel only. Ctrl+Alt+0 to 6 as well; the
  lists on Ctrl+Shift+7, 8, 9 (as Google Docs), since the browser keeps MaxPad's
  Ctrl+Shift+T, Q, C, [ and ]. See README.md, "Keys".
- The file tools turn ` ` and the like into the characters themselves: invisible
  characters are written with `String.fromCharCode` or a `\x5C`-escaped edit, never typed.

## Verification

- `test/index.html`: 44 passed, 0 failed (Chrome, in the Claude desktop app's browser).
  `?steps=150` ran the random test clean as well.
- Tried by hand in the browser: typing, the syntax at the caret, Enter in a list and a
  quote, a task's box clicked, a word double-clicked and made bold from the toolbar, the
  code fences shown together, copy, cut and paste, the dark theme, the element in a form.
- Not tried: Firefox and Safari, a touch keyboard, an input method (the code is there:
  composition events), right-to-left text.

## Next steps

1. Incremental parsing (see README.md, "Not done yet"): the main cost of a key in a long
   document.
2. Firefox and Safari, mobile keyboards and input methods, tried by hand.
3. Table commands, code highlighting, raw Markdown mode, find and replace.
4. Adapt `AGENTS.md`, now a copy of MarkdownTools' (WPF and .NET rules), to this project:
   the user's decision.
