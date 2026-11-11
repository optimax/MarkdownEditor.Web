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

