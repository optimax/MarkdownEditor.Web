---
Title: TO-DO
---

# TO-DO MarkdownEditor.Web

> **IMPORTANT**: Follow the instructions found in [`TO-DO-INSTRUCTIONS.md`](TO-DO-INSTRUCTIONS.md).
>
---

## Read-Only Mode Reveals Syntax

In read-only mode, entering a syntax-rich span with the caret should NOT reveal the syntax like in the edit mode. Right now, in read-only mode, clicking on a header, reveals the leading `#`.

## Styling Inside Editor

The content inside the editor seems to be styled with the styles applied directly to elements. Change it so that `mde-content-xxx` classes are used and the paragraph styles are applied consistently through a stylesheet that the host supplies.

## Custom Toolbar Buttons

Make it possible for the host page/app to add custom buttons with SVG glyphs to the editor's toolbar, so that they appear seamlessly integrated with the editor, but clicking them allows the host app to react. 

Demonstrate that by having the demo page add Dark mode toggle and Read-Only toggle to the toolbar (remove the corresponding checkboxes from the top).

Also remove the "Show the Markdown" checkbox at the top of the demo since the editor has its own button to do that.

Make it possible for the host application to choose which of the editor's toolbar buttons/controls appear. 

## Paragraph Folding

MaxPad has triangles in the gutter that open/close paragraphs (fold their content). Implement them in the Web editor.

## Scaling Editor Content

Ctrl+Scroll Wheel changes the zoom like in MaxPad (nice!) but there are no corresponding controls in the toolbar: `+`, `-`, and the current zoom that would reset to 100% when clicked.


## Editor Document Alignment

When the document is narrower than the editor, it currently is centered (via `margin: 0 auto` on the `vtv-page`  element). Presumably, when styling inside the editor (above) is accomplished, it will be possible to change the margin of the page via the stylesheet.

# END-OF-TO-DO

