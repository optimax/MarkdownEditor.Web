---
Title: TO-DO
---

# TO-DO MarkdownEditor.Web

> **IMPORTANT**: Follow the instructions found in [`TO-DO-INSTRUCTIONS.md`](TO-DO-INSTRUCTIONS.md).
>
---

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

# END-OF-TO-DO

