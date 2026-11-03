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

On `main` (pushed to GitHub, optimax/MarkdownEditor.Web):

- `src/view/`: `VirtualTextView` (virtualized layout, caret, selection, keys, mouse, IME,
  clipboard, its own editing with `TextEdit` records, `editcommand`, `replaceParagraphs`,
  `restyleParagraph`, highlights, formatting marks, zoom, read-only, tables, pictures,
  list markers), with `model.js`, `styles.js` and `text.js`.
- `src/markdown/`: the parser (CommonMark blocks and inlines with source offsets, and
  MaxPad's extensions), the projection, the commands (Enter, Shift+Enter, Backspace,
  Delete and Tab by block, as `Documents/maxpad-editing.md` in MarkdownTools says), the
  inline formats, the paragraph types and heading levels, the history, the controller and
  the style provider.
- `src/MarkdownEditor.js` (the component, its toolbar and keys) and `src/element.js`
  (`<markdown-editor>`, a form-associated element).
- `demo/` (the editor, the element in a form, TinyPad), `test/` (a browser test runner and
  its tests, one of them random commands with undo and redo checked), `tools/serve.ps1`.

On branch `claude/implementation-document` (not merged yet): `documents/implementation.md`,
and a fix it showed: what is typed after an undo or a redo is a step of its own (it could
join the step before the one undone).

## Design decisions

The decisions are in `documents/implementation.md`; the ones a new session needs first:

- The source is the authority, and the view's text is the source of each block's lines with
  the syntax hidden: the map between view and source is offset arithmetic.
- Each edit parses and projects the whole document again (section 13 of the document).
- An editor without the focus shows no syntax (`revealUnfocused: true` keeps MaxPad's way).
- Keys are MaxPad's (2026-11-03, the user: "Ctrl+Number keys don't work"); see the
  document's section 10.
- The file tools turn an escape such as backslash, u, 2028 into the character itself: write
  invisible characters with `String.fromCharCode`, or with a script that writes the
  backslash as `\x5C`, never by typing the escape into a tool's text.
- Git rewrites the working files with CRLF line endings on checkout: a scripted edit has to
  allow `\r\n`.

## Verification

- `test/index.html`: 47 passed, 0 failed (Chrome, in the Claude desktop app's browser).
  `?steps=150` ran the random test clean as well.
- Tried by hand in the browser: typing, the syntax at the caret, Enter in a list and a
  quote, a task's box clicked, a word double-clicked and made bold from the toolbar, the
  code fences shown together, copy, cut and paste, the dark theme, the element in a form,
  Ctrl+0 to Ctrl+6, Ctrl+= and Ctrl+-.
- Not tried: Firefox and Safari, a touch keyboard, an input method (the code is there:
  composition events), right-to-left text, Ctrl and a real mouse wheel (only a dispatched
  wheel event).

## Next steps

1. Incremental parsing (the document's section 13): the main cost of a key in a long
   document.
2. Firefox and Safari, mobile keyboards and input methods, tried by hand.
3. Table commands, code highlighting, raw Markdown mode, find and replace.
4. Adapt `AGENTS.md`, now a copy of MarkdownTools' (WPF and .NET rules), to this project:
   the user's decision.
