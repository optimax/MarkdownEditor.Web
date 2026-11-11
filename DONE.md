# DONE MarkdownTools

## Read-Only Mode Reveals Syntax [DONE]

In read-only mode, entering a syntax-rich span with the caret should NOT reveal the syntax like in the edit mode. Right now, in read-only mode, clicking on a header, reveals the leading `#`.

## Styling Inside Editor [DONE]

The content inside the editor seems to be styled with the styles applied directly to elements. Change it so that `mde-content-xxx` classes are used and the paragraph styles are applied consistently through a stylesheet that the host supplies.

Q1 (default stylesheet): I propose the editor ships its own default stylesheet (today's look,
as `mde-content-h1`, `mde-content-p`, `mde-content-code`, ... for paragraphs and runs) inside a
CSS cascade layer, so that any rule of the host's stylesheet wins over it without fighting
specificity, and a host may restyle only what it wants. Or must the host always supply the
whole stylesheet?

A: As proposed. Host only restyles what it wants.

Q2 (zoom): Ctrl+wheel zoom now multiplies every size in script. With a stylesheet, I propose
the content's base font size is scaled (a `--mde-zoom` variable) and the default stylesheet
gives sizes, margins and paddings in `em`, so they scale with it; a host rule in `px` would
then not zoom. The alternative is the CSS `zoom` property on the page, which scales anything
but changes the coordinates the caret and the selection are drawn with (riskier). Use em?

A: Yes, use em.

Q3 (themes): the `theme` option (light, dark, or an object of colors and sizes) would set
CSS variables (`--mde-heading-color`, ...) that the default stylesheet uses, and "dark" a
class (`mde-dark`) the stylesheet restyles. Keep the `theme` option this way, or drop it in
favour of the stylesheet alone?

A: Keep the theme.

## Custom Toolbar Buttons [DONE]

Make it possible for the host page/app to add custom buttons with SVG glyphs to the editor's toolbar, so that they appear seamlessly integrated with the editor, but clicking them allows the host app to react. 

Demonstrate that by having the demo page add Dark mode toggle and Read-Only toggle to the toolbar (remove the corresponding checkboxes from the top).

Also remove the "Show the Markdown" checkbox at the top of the demo since the editor has its own button to do that.

Make it possible for the host application to choose which of the editor's toolbar buttons/controls appear. 

## Paragraph Folding [DONE]

MaxPad has triangles in the gutter that open/close paragraphs (fold their content). Implement them in the Web editor.

## Scaling Editor Content [DONE]

Ctrl+Scroll Wheel changes the zoom like in MaxPad (nice!) but there are no corresponding controls in the toolbar: `+`, `-`, and the current zoom that would reset to 100% when clicked.

## Editor Document Alignment [DONE]

When the document is narrower than the editor, it currently is centered (via `margin: 0 auto` on the `vtv-page`  element). Presumably, when styling inside the editor (above) is accomplished, it will be possible to change the margin of the page via the stylesheet.

<!-- The tasks below are the findings of the review of 2026-11-11 that were not fixed with it
(the four bugs it fixed are on main, commit 4c41574). Highest priority first. -->

## Dropping a File Leaves the Page [DONE]

Nothing handles `dragover` or `drop` (the comment at `VirtualTextView.js` `_onBeforeInput`
says the clipboard events handle `insertFromDrop`, but there is no drop handler). A file
dropped onto the editor is opened by the browser in place of the page, and unsaved work is
lost. At least cancel the browser's own handling of a drop on the editor; dropping text and
pictures in is the separate, larger feature listed as not done.

## Backspace or Delete Before a Cell's Pipe Breaks the Table [DONE]

In `|x\\|y|` (the cell shows `x\`), Backspace after the `\` leaves `|x\|y|`: the backslash
left escapes the cell's own pipe, the header row has one cell fewer than the delimiter row,
and the whole table becomes a paragraph. Typing and pasting into a cell keep the cell's pipes
now (`cellText` in `commands.js`); taking text out of a cell (`backspace`, `deleteForward`,
`deleteSelection`, a cut) needs the same care: a backslash left in front of the cell's pipe
must not escape it.

## Cut, Copy and Paste on Right-Click [DONE]

A right-click shows the browser's menu for the page, with no Cut, Copy or Paste: the hidden
text area that has the keyboard takes no pointer events (`.vtv-input`), and the view draws its
own selection, so the browser has nothing to cut or copy. Editors usually move their hidden
text area under the pointer on `contextmenu`, holding the selected text.

## Mac Keys [DONE]

On a Mac, Cmd+Left and Cmd+Right go to the start and end of the line, Cmd+Up and Cmd+Down to
the start and end of the document, and Cmd+Backspace takes out the line before the caret.
None of these is handled: `_onKeyDown` in `VirtualTextView.js` moves by a character for
Cmd+Arrow, and Cmd+Backspace takes out one character.

## Clipboard Failures Not Told [DONE]

`_writeClipboard` in `VirtualTextView.js` wraps `navigator.clipboard.writeText` in a
`try/catch`, but it returns a promise: a refusal is an unhandled rejection, and
`clipboardunavailable` is never raised. (`paste()` awaits `readText` inside its `try`, so a
refused read is caught there.)

## The Element's Events When a Script Sets Its Value [DONE]

`<markdown-editor>` raises `input` and `change` when a script sets its `value` (and on a
form's reset), as the editor's `change` does. A native field raises neither when a script
sets its value; a page that saves on `change` saves what it has just loaded. Decide whether
the element should follow the native fields.

Decided (commit e679db5): it follows the native fields. `input` and `change` are the user's
changes only, not a value a script sets, a form's reset or a `src` file; `element.editor`'s
own `change` is still raised for every change. Say so if it should be the other way.

## Emphasis Parsing Slows Down on Long Paragraphs [DONE]

`processEmphasis` in `inlines.js` looks back over every opener for each closer: in one
paragraph of `*a_ ` repeated, 6 ms at 2,000 times, 21 ms at 4,000, 72 ms at 8,000 (each
doubling three to four times as slow). commonmark.js keeps an "openers bottom" per delimiter
kind so that a search is never done twice. Only very long pasted paragraphs are hit.

## Dark Toolbar for Any Way of Writing a Color [DONE]

`isDark` in `MarkdownEditor.js` understands only `#rrggbb`: a theme object whose background
is `#111`, `rgb(...)` or a color name gets the light toolbar and frame.

## A Picture's Description Shown With Its Escapes [DONE]

The projection gives a picture's `alt` as its source between the brackets
(`projection.js`, `Builder.inline`, `image`): `![a \] b](x)` has the alt `a \] b`, and
`![**b**](x)` has `**b**`. The alt (and the box drawn for a picture that cannot be loaded)
should be the description's plain text, its escapes taken off.

## Tests for Paste and the Clipboard [DONE]

No test covers pasting, copying or cutting (the clipboard events, `copiedText`, a paste into
a cell), nor `<markdown-editor>` beyond its `<template>` and a form's reset
(`test/element.test.js`).

## The Development Server's Folder Check [DONE]

`tools/serve.ps1` serves a path if it starts with the project's folder, so
`/../MarkdownEditor.Web2/...` would be served from a sibling folder of that name. It serves
only this machine; check against the folder with a path separator after it.

## Screen Readers and the Keyboard in the Toolbar [DONE]

A screen reader reads nothing of the document: the focused text area holds only `''` or a
non-breaking space (`_syncInput`), and the paragraphs drawn are not tied to it. The text at
and around the caret, and its changes, should reach assistive technology. The toolbar
(`role="toolbar"`) makes each of its about 28 buttons a Tab stop; a toolbar is one Tab stop
with the arrow keys moving between its buttons.

Done (commit b843518): the toolbar is one Tab stop, Left and Right (Home, End) go from button
to button, Escape goes back to the text, and Alt+F10 in the text goes to the toolbar; Escape
and then Tab leave the text (Tab alone indents, so the keyboard could not leave it); hidden
syntax is `aria-hidden`, so the paragraphs drawn read as the text they show.

Q (screen readers at the caret): the way editors such as Monaco reach a screen reader is to
keep the caret's text in the hidden text area -- the caret's paragraph (or a few around it),
as it is shown, the text area's own caret and selection where the view's are -- and to keep
it current at every move and edit, so that a screen reader reads the character, word or line
the caret goes over and what is typed. The risk is the keyboards of phones: they read that
text too, and may correct a word by replacing a stretch of it, which the editor does not
handle yet (it types at its own caret). A browser cannot tell that a screen reader runs. I
propose an option, `screenReader: 'auto' | 'on' | 'off'` ('auto', the default: on where there
is a mouse and a keyboard, off on touch screens), and a key to switch it. Or always on, or off
unless the page turns it on?

A: As proposed, with the default `auto`.

## AGENTS.md and the Other Files Copied From MarkdownTools [DONE]

`AGENTS.md`, `.gitignore` and `TO-DO-INSTRUCTIONS.md` are MarkdownTools' (WPF, .NET, xUnit,
`publish-locally.bat`, building in Release after each task). Which of their rules hold here
is the user's decision (`handoff.md`): say which, and they are adapted.

Q: I propose this. (1) `AGENTS.md` made this project's own: kept as they are, the source
being the authority and an unedited file round-tripping byte for byte (its section 3),
CommonMark with Markdig's reading as the reference (4), line endings (5), regression
discipline (8), the source rules -- line lengths, minimal changes, not clobbering others'
changes (9) -- and sessions, the handoff, git and authority (13 to 17); rewritten for the
web: the environment (plain ES modules, no build step, no dependencies, Chrome tried), the
tests (`tools/serve.ps1`, then `test/index.html`, `?suites=` and `?steps=`, every suite
passing), "build and verify" (no build: the test page, and the browser for what a user
sees), the things not to change without asking (no framework, build step or dependency;
the source-is-authority design; the keys); dropped, what is WPF's alone (STA tests, the
NuGet packages, tooltips through `MenuToolTips`, the ZIP's MarkdownTools root, the
third-party notices while nothing is redistributed). (2) `.gitignore` made a web one (editor
and OS files, `node_modules/`), with `.claude/` in it or not: your choice, since
`.claude/launch.json` is what starts the server for Claude's browser. (3)
`TO-DO-INSTRUCTIONS.md` without its "build in Release, run `publish-locally.bat`" step (this
time it was skipped: there is nothing to build), which becomes "run the test page, every
test passing". Do it this way?

A: Yes, and `.claude/` in it.

