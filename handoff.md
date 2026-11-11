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

**What it does is in [`documents/user-manual.md`](documents/user-manual.md)** (2026-11-04,
the user: "Write a comprehensive user manual, with lots of examples, including a getting
started section"): getting started, Part I for writers, Part II for the pages that embed it,
appendices. A change to what a user sees or a page uses updates it too; its chapter 38
lists the known limits, and a fix takes its entry off.

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

Incremental parsing (2026-11-04, the user: "Implement incremental parsing to support long
documents"): an edit reads again only the blocks it can have changed, and projects only
their paragraphs (`MarkdownState.edited`, `reparseMarkdown`, `reproject`); about 3 to 4
times faster a key at 170 KB. `test/incremental.test.js` compares it with a whole reading
after every random change. See the document's sections 7.6 and 14.

Paragraph folding (2026-11-03, TO-DO "Paragraph Folding"): the control's outline, MaxPad's
outline marks (`showOutline`) and Collapse All and Expand All; off by default, the host's to
offer (2026-11-04; the demo with a button of its own). See the document's section 4.11.

Paragraph types in the gutter (2026-11-03, the user: "Add paragraph types to the gutter as
another option"): the control's `StyleNames`, MaxPad's View > Paragraph Types, left of the
numbers; `showParagraphTypes` on the editor, off by default; in the raw view each line is
named by the block it begins in the formatted view. See the document's sections 4.10 and 9.

Three bugs found while writing the manual, fixed (2026-11-04, the user: "Yes, fix them"):
Tab on a numbered item wrote `1  2. b` (in `indentItem`, the renumbering and the indentation
at one offset were applied in the wrong order); Ctrl+K in a link nested a new link in it
(now MaxPad's `SetLink`: the link's address changed, an empty one takes the link away;
`blocks.insertLink`, `linkAt`); Ctrl+Z, Ctrl+Y and the browser's Edit menu undid in a
read-only editor. See the document's sections 7.4 and 11.

A review of the project (2026-11-11, the user: "Fix the four confirmed bugs on a claude/
branch here AND add all your other findings as tasks in TO-DO.md"), fixed on main (commit
`4c41574`): a `<template>` in `<markdown-editor>` was read by its `innerHTML`, a
quote's `>` coming back as `&gt;` (now `templateText`, node by node); a form's reset emptied
the element (now the Markdown it was given); `a||b` pasted into a table cell left the second
pipe bare, a cell more in its row (now `cellText`: every pipe not escaped already);
`insertImage` wrote a `]` of the description and an address's `<` and `>` as they were (now
escaped, the address written as a link's: `writtenDestination`). `test/element.test.js` is
new. See the document's sections 7.2, 7.4, 12 and 13.

The review's other findings, as `TO-DO.md` tasks (2026-11-11, the user: "Process the
TO-DO"), each on its own `claude/` branch merged into main, not pushed:
- A file dropped on the editor is refused, not opened in place of the page (`refuseDrops`;
  section 4.7).
- A table cell's pipes stay what they were whatever is typed or taken out (`cellEdit`: a
  space before the cell's own pipe, which a backslash would escape; section 7.2). This
  replaces the doubled backslash of the first fix.
- Right-click: the browser's menu is the text area's, for Cut, Copy and Paste
  (`_onContextMenu`; section 4.7). Checked by a test, not seen in a real menu.
- The toolbar from the keyboard: one Tab stop, the arrows, Home, End, Escape, Alt+F10;
  Escape then Tab leaves the text; hidden syntax `aria-hidden` (sections 4.7 and 11). What a
  screen reader reads at the caret is a question in `TO-DO.md`.
- A Mac's Cmd with the arrows, Backspace and Delete (the view's `mac`; section 4.8). Not
  tried on a Mac.
- Clipboard failures raise `clipboardunavailable`, which the editor passes on, and a refused
  cut takes nothing out (section 4.7).
- The element's `input` and `change` are the user's changes only, as a native field's
  (decided by Claude, noted in `TO-DO.md` for the user to overrule; section 12).
- Emphasis keeps commonmark.js's openers' bottom: linear, 480 KB in 70 ms where it took
  4.4 s (section 5.2).
- `isDark` tells any CSS color (section 11); a picture's alt is its description's plain
  text (section 6.1); tests for the clipboard's events and the element's attributes;
  `serve.ps1` serves only inside its folder (section 13).
- Two tasks wait on the user's answer (`[QUESTION]` in `TO-DO.md`): screen readers at the
  caret, and adapting `AGENTS.md`, `.gitignore` and `TO-DO-INSTRUCTIONS.md`.

## Design decisions

The decisions are in `documents/implementation.md`; the ones a new session needs first:

- The source is the authority, and the view's text is the source of each block's lines with
  the syntax hidden: the map between view and source is offset arithmetic.
- Each edit reads and projects again only the blocks it can have changed (sections 7.6 and
  14 of the document).
- An editor without the focus shows no syntax (`revealUnfocused: true` keeps MaxPad's way).
- Keys are MaxPad's (2026-11-03, the user: "Ctrl+Number keys don't work"); see the
  document's section 11.
- The file tools turn an escape such as backslash, u, 2028 into the character itself: write
  invisible characters with `String.fromCharCode`, or with a script that writes the
  backslash as `\x5C`, never by typing the escape into a tool's text.
- Git rewrites the working files with CRLF line endings on checkout: a scripted edit has to
  allow `\r\n`.

## Verification

- `test/index.html`: 87 passed, 0 failed (Chrome, in the Claude desktop app's browser,
  2026-11-11). `?steps=150` ran the random test clean as well.
- The browser pane was out of sight for the work of 2026-11-11: the browser's own context
  menu was not seen, and the timings there (the emphasis's) are of a background page.
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

1. The two `[QUESTION]` tasks in `TO-DO.md`, once the user has answered: screen readers at
   the caret; `AGENTS.md`, `.gitignore` and `TO-DO-INSTRUCTIONS.md` made this project's.
2. Firefox and Safari, mobile keyboards and input methods, a right-click's menu and a Mac's
   keys, tried by hand.
3. Table commands, code highlighting, find and replace; the raw view's own stylesheet
   (MaxPad's).
