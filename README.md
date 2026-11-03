# MarkdownEditor.Web

A WYSIWYG Markdown editor for web pages, as a plain JavaScript component: no framework, no
build step and no dependencies. You edit formatted text; the document stays Markdown. It is
the web counterpart of MaxPad in MarkdownTools: the same layers, the same rules for what each
key does, and a browser version of the `VirtualTextView` control it is built on.

- **Pluggable.** `new MarkdownEditor(element, { markdown })` from a script, or a
  `<markdown-editor>` element in plain HTML. The element is a form field: a form submits its
  Markdown, like a `<textarea>`.
- **WYSIWYG, with the Markdown kept.** The syntax is hidden; with the caret in a construct
  (bold text, a link, a heading's line), its syntax shows, ready to edit, and hides again when
  the caret leaves. An unedited document round-trips byte for byte, line endings included.
- **CommonMark**, plus the extensions MaxPad uses: pipe tables, task lists, YAML front
  matter, `==underline==`, `~~strikethrough~~`, `~subscript~` and `^superscript^`.
- **Virtualized.** Only the paragraphs near the viewport are laid out, so long documents
  scroll as fast as short ones.

## Quick start

Serve the folder (ES modules are not loaded from `file://` pages), then:

```html
<div id="editor" style="height: 480px"></div>
<script type="module">
  import { MarkdownEditor } from './src/index.js';

  const editor = new MarkdownEditor('#editor', {
    markdown: '# Hello\n\nSome **bold** text.',
  });
  editor.addEventListener('change', () => save(editor.value));
</script>
```

Or, with no script of your own:

```html
<script type="module" src="./src/index.js"></script>

<form>
  <markdown-editor name="body" style="height: 320px">
    <script type="text/markdown">
      ## What's new

      - **Faster** loading
      - [ ] Write the *documentation*
    </script>
  </markdown-editor>
</form>
```

The editor fills the element it is put in, so give that element a height.

To run the demos and the tests on Windows, with nothing installed but PowerShell:

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Then open:

- <http://localhost:8765/demo/index.html>: the editor, with its toolbar, the Markdown
  beside it, a dark theme and read-only mode.
- <http://localhost:8765/demo/element.html>: `<markdown-editor>` in a form.
- <http://localhost:8765/demo/tinypad.html>: TinyPad, the tutorial's small word processor,
  on the bare `VirtualTextView`.
- <http://localhost:8765/test/index.html>: the tests (add `?steps=150` for a longer random
  run, or `?suites=parser,commands` for some of them).

## The editor: `MarkdownEditor`

`new MarkdownEditor(target, options)` puts an editor into `target` (an element, or a selector
of one). The options, all optional:

| Option | Meaning |
| --- | --- |
| `markdown` | The document to start with. |
| `theme` | `'light'` (the default), `'dark'`, or a theme object (below). |
| `toolbar` | `true` (the default), `false`, or a list of `DEFAULT_TOOLBAR`'s items. |
| `readOnly` | The document can be read, selected and copied, not changed. |
| `revealSyntax` | Show the syntax at the caret (`true` by default). |
| `revealUnfocused` | Show it while the editor has no focus too (`false` by default). |
| `showFormattingMarks` | Show ¶ at the end of each paragraph and ↵ at a line break. |
| `imageBase` | The URL relative picture addresses are loaded from. |
| `openLinks` | Ctrl+click opens a link in a new tab (`true` by default). |
| `prompt` | `async (question, value) => answer`: asks for a link's address. |

What a page reads and calls:

| Member | What it is |
| --- | --- |
| `value` | The Markdown, in the document's own line endings; set it to load another. |
| `version` | Counts every change: compare it with the one saved to know if it is dirty. |
| `selection`, `select(a, c)` | The selection as offsets in the Markdown. |
| `undo()`, `redo()` | Unlimited, of the Markdown; a word typed is one step. |
| `toggleInline(f)` | `'strong'`, `'em'`, `'underline'`, `'strike'`, `'code'`, `'sub'`, `'sup'`. |
| `isInline(f)` | Whether the selection is in that format. |
| `setBlockType(t)` | `'paragraph'`, `'h1'`...`'h6'`, `'quote'`, `'bullet'`, `'number'`, |
| | `'task'` or `'code'`; again on the same type makes paragraphs again. |
| `blockType` | The type of the paragraph at the caret. |
| `insertTable()` | Also `insertRule()`, `insertCodeBlock()`, `insertLink(url)`, |
| | `insertImage(url, alt)`. |
| `execute(name)` | Any toolbar command by name (`'h2'`, `'bullet'`, `'link'`...). |
| `theme`, `zoom` | Change the look, or the scale, at any time. |
| `readOnly`, `focus()` | As their names say. |
| `destroy()` | Takes the editor out of the page. |

Events (`addEventListener`): `change` after each change of the Markdown, `selectionchange`,
and `linkclick` (`detail.href`; call `preventDefault()` to handle it yourself).

A theme object overrides any of `LIGHT_THEME`'s values: `fontFamily`, `fontSize`,
`codeFontFamily`, `color`, `background`, `headingColor`, `linkColor`, `syntaxColor`,
`codeBackground`, `quoteBarColor`, `documentWidth`, `centered`, `listIndent` and the rest
(see `src/markdown/styleProvider.js`). Give `base: 'dark'` to start from the dark theme.

## Keys

| Keys | What they do |
| --- | --- |
| Enter | A new paragraph; in a list, a new item; on an empty item, out of the list |
| Shift+Enter | A line break inside the paragraph (a backslash hard break) |
| Backspace, Delete | At a block's edge: join, take off a list's marker or a quote level |
| Tab, Shift+Tab | At an item's start: in or out a level; at a heading's: its level |
| Ctrl+B, Ctrl+I, Ctrl+U | Bold, italic, underline |
| Ctrl+\`, Ctrl+Shift+X | Inline code, strikethrough |
| Ctrl+K | A link |
| Ctrl+1 to Ctrl+6, Ctrl+0 | Heading 1 to 6, paragraph (Ctrl+Alt+1 to 6 and 0 too) |
| Ctrl+=, Ctrl+- | One heading level deeper (a paragraph becomes Heading 1), shallower |
| Ctrl+Shift+7, 8, 9 | Numbered list, bullet list, task list |
| Ctrl+Alt+Q, C, L | Quote, code block, horizontal line |
| Ctrl+Z, Ctrl+Y | Undo, redo |
| Ctrl and the mouse wheel | Zoom (about 2% a notch) |

The keys are MaxPad's. A browser gives the page Ctrl+1 to Ctrl+6 before it switches tabs with
them, and switches none when the page takes them; Ctrl+Alt+1 to 6 are there as well for a
browser that keeps them. MaxPad's Ctrl+Shift+T, Q, C, \[ and \] are the browser's own, so
the lists are on Google Docs' keys and the quote, the code block and the line on Ctrl+Alt.

## How it is built

[`documents/implementation.md`](documents/implementation.md) describes how it works, module
by module. In short, the layers are MaxPad's, one module each:

| Here | In MarkdownTools | What it does |
| --- | --- | --- |
| `markdown/parser.js`, `inlines.js` | `MaxPad.Dom` | Markdown to a tree with source offsets |
| `markdown/projection.js` | `MaxPad.Projection` | The tree as the view's paragraphs |
| `markdown/commands.js`, `formatting.js`, `blocks.js` | `MaxPad.Editing` | The keys as edits |
| `markdown/controller.js`, `history.js` | `MarkdownViewController` | The loop, undo |
| `markdown/styleProvider.js` | `MarkdownStyleProvider` | The default look |
| `view/VirtualTextView.js` | `OptimaxTools.RichText` | The rich text view |
| `MarkdownEditor.js`, `element.js` | `MaxPad` (the window) | The component |

**The source is the authority.** The view shows a projection of the Markdown: each paragraph
of the view is the source of its block's lines, with the syntax in it as hidden runs, so a
position in the view is a position in the source plus an offset. Every key the user presses
reaches the controller as an edit command; it works out the new Markdown (each rule is a
pure function of the source and the selection, in `commands.js`), reads it again, and gives
the view just the paragraphs that changed. The view's own editing never runs for Markdown.

**The view is a component of its own**, as `VirtualTextView` is: a list of paragraphs of
runs, styles from a style provider, its own caret, selection, keyboard, mouse, IME and
clipboard handling, and its own editing for a host that wants it (TinyPad). Before it changes
anything it raises a cancelable `editcommand` event; it tells an `editRecorder` of each edit
it makes, as a `TextEdit` that `applyEdit` replays and `inverse()` undoes; `replaceParagraphs`
and `restyleParagraph` change what it shows without an undo step. It draws text with the
browser's own layout, one element per paragraph near the viewport, and its own caret and
selection over it; a hidden text area takes the keyboard, the input method and the
clipboard.

## Not done yet

- **Incremental parsing.** Each edit reads the whole document again. Typing a character took
  4 ms in an 11 KB document, 11 ms at 50 KB and 22 ms at 167 KB (Chrome, on the development
  machine, 2026-11-03). MaxPad reads again only the blocks an edit touched, which is what
  very long documents need here.
- MaxPad's features beyond the editor itself: raw Markdown mode, the outline, find and
  replace, the paragraph annotations, the stylesheet files, spelling, export.
- Code highlighting by language, drag and drop of text, and pasting pictures.
- Table commands beyond typing in cells, Tab and Enter (rows and columns added or deleted,
  alignment).
- A line ending is normalized to the document's own on load: a file whose line endings are a
  mixture is saved with one kind.
