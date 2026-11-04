# MarkdownEditor.Web — Handoff

## Objective

A WYSIWYG Markdown editor for web pages, as a plain JavaScript component (no framework, no
build step, no dependencies), analogous to MaxPad in MarkdownTools and built on a browser
version of its `VirtualTextView`. The user's request, 2026-11-03: "create an analogous
WYSIWYG markdown editor but for the Web, as a pure JavaScript plug-in component. It needs to
have the basic functionality of the VirtualTextView and be pluggable into web pages."

**How it works is in [`documents/implementation.md`](documents/implementation.md).** The
user, 2026-11-03: "Keep this document in sync as changes are implemented." Every change to
how the editor works updates that document in the same commit.

## State (2026-11-03)

In the repository (GitHub: optimax/MarkdownEditor.Web):

- `src/view/`: `VirtualTextView` (virtualized layout, caret, selection, keys, mouse, IME,
  clipboard, its own editing with `TextEdit` records, `editcommand`, `replaceParagraphs`,
  `restyleParagraph`, highlights, formatting marks, zoom, read-only, tables, pictures,
  list markers), with `model.js`, `styles.js` and `text.js`.
- `src/markdown/`: the parser (CommonMark blocks and inlines with source offsets, and
  MaxPad's extensions), the projection, the commands (Enter, Shift+Enter, Backspace,
  Delete and Tab by block, as `Documents/maxpad-editing.md` in MarkdownTools says), the
  inline formats, the paragraph types and heading levels, the history, the controller,
  the style provider, and the raw Markdown view (`rawView.js`).
- `src/MarkdownEditor.js` (the component, its toolbar and keys) and `src/element.js`
  (`<markdown-editor>`, a form-associated element).
- `demo/` (the editor, the element in a form, TinyPad), `test/` (a browser test runner and
  its tests, one of them random commands with undo and redo checked), `tools/serve.ps1`.
- `documents/implementation.md`: how all of it works.

The raw Markdown view (2026-11-03, the user: "Unlike MaxPad, the Web editor does not show and
edit source in place", of the demo's "Show the Markdown", which was a read-only panel beside
the editor): MaxPad's View > Raw Markdown, in the model of MaxPad's `RawModeService`; the
demo's "Show the Markdown" is it now. See the document's section 9.

Paragraph numbers in a gutter (2026-11-03, the user: "Optionally display paragraph numbers in
the gutter"): the control's left gutter with its `ParagraphNumbers`, MaxPad's View >
Paragraph Numbers; `showParagraphNumbers` on the editor, off by default. See the document's
section 4.10.

The content styled by a stylesheet (2026-11-03, TO-DO "Styling Inside Editor", with the
user's answers there): classes `mde-content-...` of a default stylesheet in the CSS layer
`mde` that a page restyles where it wants; sizes in em, zoomed by `--mde-zoom`; the theme as
custom properties and `mde-dark`. The view still takes style objects (TinyPad). See the
document's sections 4.2 and 10.

Paragraph folding (2026-11-03, TO-DO "Paragraph Folding"): the control's outline, MaxPad's
outline marks (`showOutline`, on by default) and Collapse All and Expand All; see the
document's section 4.11.

Paragraph types in the gutter (2026-11-03, the user: "Add paragraph types to the gutter as
another option"): the control's `StyleNames`, MaxPad's View > Paragraph Types, left of the
numbers; `showParagraphTypes` on the editor, off by default; in the raw view each line is
named by the block it begins in the formatted view. See the document's sections 4.10 and 9.

## Design decisions

The decisions are in `documents/implementation.md`; the ones a new session needs first:

- The source is the authority, and the view's text is the source of each block's lines with
  the syntax hidden: the map between view and source is offset arithmetic.
- Each edit parses and projects the whole document again (section 14 of the document).
- An editor without the focus shows no syntax (`revealUnfocused: true` keeps MaxPad's way).
- Keys are MaxPad's (2026-11-03, the user: "Ctrl+Number keys don't work"); see the
  document's section 11.
- The file tools turn an escape such as backslash, u, 2028 into the character itself: write
  invisible characters with `String.fromCharCode`, or with a script that writes the
  backslash as `\x5C`, never by typing the escape into a tool's text.
- Git rewrites the working files with CRLF line endings on checkout: a scripted edit has to
  allow `\r\n`.

## Verification

- `test/index.html`: 62 passed, 0 failed (Chrome, in the Claude desktop app's browser).
  `?steps=150` ran the random test clean as well.
- Tried by hand in the browser: typing, the syntax at the caret, Enter in a list and a
  quote, a task's box clicked, a word double-clicked and made bold from the toolbar, the
  code fences shown together, copy, cut and paste, the dark theme, the element in a form,
  Ctrl+0 to Ctrl+6, Ctrl+= and Ctrl+-; the raw view by Ctrl+Shift+R (the page not
  reloaded), the source edited in it and made the document on leaving, one undo back, the
  dark theme in it; the paragraph numbers from the toolbar, beside headings, items, code, a
  table and a rule, and the same in the raw view. The paragraph types with the numbers, in
  both views, from the toolbar.
- Timings are only good with the browser pane in sight: a pane out of sight runs the page as
  a background page, several times slower (2026-11-03: 112 ms a key where 22 ms had been
  measured on the same document).
- Not tried: Firefox and Safari, a touch keyboard, an input method (the code is there:
  composition events), right-to-left text, Ctrl and a real mouse wheel (only a dispatched
  wheel event).

## Next steps

1. Incremental parsing (the document's section 14): the main cost of a key in a long
   document.
2. Firefox and Safari, mobile keyboards and input methods, tried by hand.
3. Table commands, code highlighting, find and replace; the raw view's own stylesheet
   (MaxPad's).
4. Adapt `AGENTS.md`, now a copy of MarkdownTools' (WPF and .NET rules), to this project:
   the user's decision.
