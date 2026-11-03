# MarkdownEditor.Web: How It Works

This document describes how the web version of the Markdown editor is built: its layers, what
each module does, the rules it follows, and why. It describes the source as it is; when the
source changes, this document changes with it (see the last section).

The editor is the web counterpart of MaxPad in MarkdownTools. Its layers are MaxPad's, its
editing rules are the ones `Documents/maxpad-editing.md` and `Documents/maxpad-projection.md`
in MarkdownTools give, and its view is a browser version of `OptimaxTools.RichText`'s
`VirtualTextView`. Where it differs from them, this document says so and why.

------

## 1. What it is

A WYSIWYG Markdown editor for web pages, written as plain JavaScript modules: no framework,
no build step, no dependencies. A page plugs it in with `new MarkdownEditor(element,
options)` or with a `<markdown-editor>` element. The user edits formatted text; the document
is Markdown, and is never anything else.

The source is the authority. The view shows a projection of the Markdown source, every key
the user presses becomes an edit of that source, and the view is then told what changed.
An unedited document is given back byte for byte.

------

## 2. The modules

```text
src/
  index.js              what a page imports (and <markdown-editor> defined)
  MarkdownEditor.js     the component: view, controller, toolbar, keys
  element.js            <markdown-editor>, a form-associated element
  view/
    VirtualTextView.js  the rich text view
    model.js            paragraphs, runs, positions, TextEdit
    styles.js           style objects resolved to CSS
    text.js             character and word boundaries
  markdown/
    parser.js           the block structure, with source offsets
    inlines.js          the inlines of a block's text
    projection.js       the parsed document as the view's paragraphs
    state.js            a source read and projected, and questions on it
    commands.js         Enter, Backspace, Delete, Tab... as source edits
    formatting.js       the inline formats as source edits
    blocks.js           the paragraph types and inserted blocks
    history.js          undo and redo of the source
    controller.js       the loop between source, projection and view
    styleProvider.js    the default look, and its themes
demo/                   the editor, the element in a form, TinyPad
test/                   a browser test runner and the tests
tools/serve.ps1         a local web server for the demos and tests
```

How they map to MarkdownTools:

| Here | MarkdownTools |
| --- | --- |
| `view/` | `OptimaxTools.RichText` (`VirtualTextView`, `VirtualParagraph`, `TextEdit`, styles) |
| `markdown/parser.js`, `inlines.js` | `MaxPad.Dom` (Markdig's tree there) |
| `markdown/projection.js` | `MaxPad.Projection` (`MarkdownProjection`, `InlineWalker`) |
| `markdown/commands.js`, `formatting.js`, `history.js`, `controller.js` | `MaxPad.Editing` |
| `markdown/styleProvider.js` | `MaxPad.Projection`'s `MarkdownStyleProvider` |
| `markdown/blocks.js` | `MaxPad`'s `ParagraphService` |
| `MarkdownEditor.js`, `element.js` | `MaxPad` (the window) |

------

## 3. The loop

```text
key, typing, clipboard
   |
   v
VirtualTextView --'editcommand'--> MarkdownController
                                      |  commands.js: (source, selection)
                                      |               -> new source, caret
                                      v
                                   MarkdownState(new source)
                                      |  parse, project
                                      v
view <-- replaceParagraphs <-- the paragraphs that changed
view <-- restyleParagraph  <-- the syntax at the caret shown
```

1. The view raises a cancelable `editcommand` event for everything that would change the
   document: typing, Enter, Shift+Enter, Backspace, Delete (and their word forms), Tab,
   Shift+Tab, cut, paste, and copy (to ask what to copy).
2. The controller cancels it (the view's own editing never runs for Markdown), works out the
   new source with a pure function of the source and the selection, and gives it to `apply`.
3. `apply` records the change in the history, reads the new source (`MarkdownState`: parse
   and project), compares the new paragraphs with the old, and replaces only those that
   differ in the view, in one layout pass.
4. The caret is put where the command left it, and the paragraph it is in shows its syntax.

------

## 4. The view: `VirtualTextView`

`src/view/VirtualTextView.js`. A view of many independent paragraphs that lays out only those
near the viewport, and draws its own caret and selection. It knows nothing of Markdown: the
same division of work as the WPF control's (the tutorial in MarkdownTools,
`Documents/virtual-text-view-control-tutorial.md`):

- **The document is a list of paragraphs.** A paragraph is `{ runs, styleId, listMarker,
  markerTextLength, cell }`; a run is `{ text, bold, italic, hidden, styleId, link, image }`.
  A position is `{ paragraph, index }` (`model.js`).
- **The styles are the host's.** A style provider says what a paragraph's and a run's style
  IDs look like; the view asks once per ID.
- **The undo history is the host's.** The view tells its `editRecorder` of each edit it makes
  as a `TextEdit`, and replays one given to `applyEdit`.
- **The commands are the host's.** The view handles the caret, the selection, typing and the
  edit keys; a host takes any edit over through `editcommand`, and binds its own keys in
  `keymap`.
- **It scrolls itself.** It fills its host element, which must have a height.

### 4.1 The model (`model.js`)

- A line break inside a paragraph (Shift+Enter) is the character U+2028 (`SOFT_BREAK`), as
  in the control; a paragraph's end is "\n" in a `TextEdit` and in `getText()`.
- A run with `image` draws the picture after its text. A run with `link` is part of a link:
  neighbouring runs with an equal link are one link.
- A table is consecutive paragraphs whose `cell.table` is the same object (which has
  `columns`), row by row; `cell` also has `row`, `column`, `align` and `header`.
- `listMarker` is drawn left of the first line (a bullet, "3."); it is no text of the
  paragraph. `markerTextLength` is how many characters at the start of the text are the
  marker written out, which hang left of the text where the drawn marker goes.
- `TextEdit` is a structural edit: `first`, the paragraphs that were there (`before`, copies)
  and the ones there now (`after`), the caret and the selection's other end before and
  after, and the text removed and inserted for a host that wants them. `inverse()` swaps
  them. (The WPF `TextEdit` describes most edits as flat text with format spans; a snapshot of
  the paragraphs is simpler here and replays any edit, formatting and styles included.)
- `formatAt(paragraph, index)` is the format typed text takes: the visible run before the
  index (at a paragraph's start, the first one); typing at the end of a link does not
  extend it.

### 4.2 Styles (`styles.js`)

A style provider is an object with any of `getParagraphStyle(id)`,
`getCharacterStyle(id)`, `getHyperlinkStyle()`, `getTableStyle(table)` and
`getDocumentStyle()`. The styles are plain objects:

- **Paragraph style:** font, size, bold, italic, color, background, decorations, line height
  (a multiple of the size), alignment, `margin`, `padding`, `borderWidth`, `borderColor`,
  `borderStyle`, `borderRadius` (a number or `[top, right, bottom, left]`), first-line
  indent, `nextStyleId` (the style Enter at a paragraph's end gives the next one), `hidden`,
  and `css` (more CSS for the paragraph's box).
- **Character style:** only what it overrides: font, size, bold, italic, color, background,
  decorations, `script` (`'sub'` or `'super'`), and `css`.
- **Document style:** `maxWidth` and `placement` (the text held to a width, centered or not;
  the scroll bar stays at the edge), background, color, and the colors of the selection, the
  caret and the highlights.

`ResolvedParagraphStyle` turns a paragraph style into two strings of CSS, one for the outer
element and one for the box, and the numbers that height estimates use. **The margin is the
outer element's padding**, never a CSS margin, so that margins add as in the control and never
collapse, and a paragraph's height is its outer element's height. The view caches a resolved
style per ID, and the CSS of a character style per ID, until `invalidateStyles()`.

### 4.3 The page

```text
host (.vtv)                       the host's element
  .vtv-scroller                   overflow: auto, fills the host
    .vtv-page                     its height is the document's
      .vtv-content                absolute, at the top of the first
                                  paragraph laid out
        .vtv-para                 a paragraph: the margins as padding
          .vtv-box                font, border, padding, background
            .vtv-marker           the drawn list marker
            span.vtv-run ...      a run (a break is a span of its own)
            img.vtv-image         a picture, after its run
            span.vtv-eol          a zero-width space: the paragraph's end
        .vtv-para.vtv-table-wrap  a whole table, in a <table>
      .vtv-overlay                highlights, selection, caret
      textarea.vtv-input          the keyboard, input methods, clipboard
```

The view's CSS is put into the page once, from a string in the module.

### 4.4 Laying out only what is in view

- Every paragraph has a height: measured if it has been laid out at the current width, else
  estimated (`_estimateHeight`: its visible characters, the width, the style's line height
  and its margins). The tops of the paragraphs are their running sum (`tops`), rebuilt from
  the first paragraph whose height changed.
- `_layout()` finds the paragraphs from 600 px above the viewport to 600 px below it (whole
  tables), makes their elements, puts them in `.vtv-content` at the top of the first, and
  measures those not measured yet. A measured height that differs from the estimate moves
  everything below it, so the view keeps the paragraph at the top of the viewport where it
  was (it scrolls by the difference); this is done up to four times, until nothing changes.
- An element is kept per paragraph object (and per table), and made again only when the
  paragraph was restyled (`_stamp`) or the styles changed. Paragraphs replaced by an edit are
  new objects, so only they are built again; the others keep their elements and heights.
- A new width (a `ResizeObserver` on the host) makes every height an estimate again. A
  picture that loads lays the view out again.
- A table is one block: its first cell carries the table's height and its other cells none,
  and it is drawn as an HTML table of the cells' boxes.

### 4.5 Drawing a paragraph

- Each run is a span with its CSS (the character style's, a link's, and its own bold or
  italic). A line break that is shown is a span holding "\n" (the box is `white-space:
  pre-wrap`, so it ends the line); one that is hidden is a space.
- **Hidden text** is drawn at font size 0: it is there, the caret goes through it, and it
  takes no room. This is the WPF control's own way (a near-zero size).
- A paragraph whose every run is hidden (a code fence out of sight) is **collapsed**: line
  height 0, so that it takes only its border and padding.
- Every box ends with a zero-width space, so that an empty paragraph has a line and the
  caret a place at the end.
- A picture is an `<img>` after its run, as wide as its line at most; one that cannot be
  loaded is a dashed box with its description, so that a missing file never breaks the
  document.
- The drawn list marker is absolutely placed left of the first line. Marker text that hangs
  (`markerTextLength`) is done with a negative `text-indent` as wide as those characters,
  measured once the paragraph is laid out, and never wider than the room left of the text.
- With formatting marks on, a CSS `::before` draws ¶ at a paragraph's end and ↵ at a break:
  no characters of the text.

### 4.6 Where the caret is, and what is under the mouse

The browser lays the text out; the view reads the geometry back with DOM ranges.

- **The caret's rectangle** (`_caretRect`): the nearest visible character on either side of
  the position, past any hidden text, gives the place: the left edge of the one after it, or
  the right edge of the one before it. `affinity` says which to prefer where a line wraps:
  forward (the start of the next line) by default, backward after End or a click past a
  wrapped line's end. Next to a break, or in an empty or collapsed paragraph, the end marker
  (the zero-width space) gives the place, or the box's own corner.
- **Hit testing** (`_hit`): the box under the point (the one containing it, or the nearest),
  then the rectangles of its visible characters, then the line nearest the point, then the
  character on that line whose middle is nearest. Past the end of a wrapped line the
  position is its end with backward affinity; past a break, the position before the break.
  A picture counts as one more place on its line. It also says whether a link is under the
  point.
- **The selection and the highlights** are rectangles in `.vtv-overlay`, over the text,
  translucent: one per line of each paragraph laid out (merged per line), and a little more
  at the end of a paragraph the selection goes past. The caret is a 2 px element there, made
  to blink by CSS (the animation starts again at every move).

### 4.7 Input

- **The keyboard** goes to a hidden text area that follows the caret (so that an input
  method's window opens there). `keydown` first raises a cancelable `key` event (with the key
  as a chord, "Ctrl+Shift+Z", from `keyChord`, which names letters and digits by where they
  are on the keyboard), then looks in `keymap`; then the view's own keys: the arrows, Home,
  End, Page Up and Down (with Shift to extend, Ctrl for words and the document's ends),
  Enter, Shift+Enter, Backspace, Delete, Tab with `acceptsTab`, Escape, Ctrl+A.
- **Typing** arrives as `beforeinput` (`insertText`), which the view cancels and turns into
  the `insertText` command; deleting from a phone's keyboard arrives the same way.
  `historyUndo` and `historyRedo` (the browser's Edit menu) become `undo` and `redo` events.
- **Input methods:** while composing, the text area holds the composition and the view
  draws it at the caret, underlined; `compositionend` types the result.
- **The clipboard:** the browser's `copy`, `cut` and `paste` events on the text area. While
  something is selected, the text area holds a selected character, so that the browser
  offers Copy and Cut. Copy asks the host first (`editcommand` with `copy`: a host puts its
  text in `detail.result`). `copy()`, `cut()` and `paste()` called by a page use the
  asynchronous clipboard (or a `clipboard` object given to the view).
- **The mouse:** a click puts the caret, Shift extends, a double click selects a word, a
  triple click a paragraph, and dragging extends (by whole words or paragraphs after a double
  or triple click), scrolling when the pointer leaves the view. Ctrl+click on a link raises
  `hyperlinkclick`; any other click first raises a cancelable `runclick`.

### 4.8 Caret moves

- One character is one grapheme cluster (`Intl.Segmenter`): a letter and its accent, an emoji
  and its modifiers. Backspace takes a code point, so an accent goes by itself (as in the
  control). A word is a run of letters and digits, of spaces, or of punctuation.
- Home and End go to the ends of the line the caret is on, a wrapped line's own.
- Up and Down go to the line above or below at the column the caret had (`preferredX`). From
  a paragraph's first or last line they go to the next paragraph's nearest line, one by one,
  so that a collapsed paragraph (a hidden fence) is reached too. In a table they go to the
  cell above or below; into a table, to the cell under the caret.
- Page Up and Page Down scroll a page and put the caret where it was on screen.
- A move that is not typing drops the typing format.

### 4.9 Editing

`_command(name, text)` raises `editcommand` (`detail`: `command`, `text`, `start`, `end`,
`hasSelection`). If nobody cancels it, the view does it itself (`_edit`): the paragraphs from
the start's to the end's are replaced by the text (each "\n" a new paragraph), in the format
`formatAt` gives (or the typing format), and Enter at a paragraph's end gives the new one the
style's `nextStyleId`. Each edit is one `TextEdit` to `editRecorder`. No edit reaches across
a table's cells or makes a cell two.

What a host calls:

| Member | What it does |
| --- | --- |
| `setParagraphs(list)` | A new document (paragraphs, or strings), with no caret. |
| `replaceParagraphs(first, count, list, options)` | Replaces paragraphs without an undo step; the caret moves with them (`mapPosition` for one inside them). |
| `restyleParagraph(i, runs, marker, length)` | Other runs of the same text; nothing recorded, no change of `version`. |
| `batch(fn)` | The layout held back until `fn` is done. |
| `applyEdit(edit)` | Replays a `TextEdit` (`edit.inverse()` to undo it). |
| `setCaret`, `select`, `selectAll` | The caret and the selection, scrolled into view. |
| `insertText`, `typeOver`, `deleteSelection` | Edits as the user would make them. |
| `mapCharacterStyles`, `setCharacterStyle`, `setHyperlink`, `setParagraphStyles` | Formatting, one `TextEdit` each. |
| `setTypingFormat(fn)` | The format of what is typed next (dropped when the caret moves). |
| `setHighlights(list)` | Ranges shaded behind the text (`{ start, end, color }`). |
| `getText`, `getParagraph`, `getTextRange`, `getCaretRect`, `positionFromPoint` | Reading it back. |
| `copy`, `cut`, `paste`, `focus`, `destroy` | As their names say. |

Properties: `readOnly`, `acceptsTab`, `wordWrap`, `showFormattingMarks`, `zoom` (every size
scaled), `padding`, `styleProvider`, `editRecorder`, `keymap`, `imageResolver` (an image's
address to the URL it is loaded from), `version` (counts every change). Events:
`documentchange` and `selectionchange` (each once per burst, a microtask later),
`editcommand`, `key`, `hyperlinkclick`, `runclick`, `focus`, `blur`, `undo`, `redo`,
`clipboardunavailable`.

`static backspaceStart`, `deleteEnd`, `wordStart`, `wordEnd` are the view's rules of what a
delete takes, for a host that does its own deleting (as in the control).

------

## 5. The Markdown DOM: `parser.js` and `inlines.js`

MaxPad's DOM is Markdig's tree; here it is a parser of its own that keeps the place in the
source of every part. It follows CommonMark's algorithm (the one of the reference
implementation, commonmark.js), with the extensions MaxPad uses: pipe tables, task lists,
YAML front matter, `==underline==`, `~~strikethrough~~`, `~subscript~` and `^superscript^`.

### 5.1 Lines and blocks

The source has "\n" line endings (the controller makes them so). `lines[i]` is `{ start,
end }`. The parser reads the source line by line:

1. Each open container is asked whether the line goes on in it (`continueBlock`): a quote
   needs its `>`, an item its indentation (or a blank line, if it has content), a fenced code
   block takes every line until its closing fence, a paragraph or a table any line but a
   blank one.
2. Then the block starts are tried on the rest of the line, in this order: a table's
   delimiter row (under a one-line paragraph with as many cells), a quote, an ATX heading, a
   code fence, an HTML block, a setext underline, a thematic break, a list item, indented
   code. A container start goes on looking; a leaf start ends the search.
3. A line no block starts on is a lazy continuation of an open paragraph, or a line of the
   block that takes it, or a new paragraph.

What each container puts at the start of a line is recorded in `lineMarks[i]`: `{ kind:
'quote' | 'item' | 'indent', start, end, block }`, absolute offsets. The projection hides it
and the commands read it (what a new line in the same containers starts with).

A block is `{ type, parent, children, firstLine, lastLine, lines }`, `lines` being `{ line,
contentStart }` for each line of a leaf (where its own text starts on that line). Types and
what they keep:

| Type | Kept |
| --- | --- |
| `heading` | `level`; ATX: `markerStart`, `markerEnd`, `contentStart`, `contentEnd` (no closing #s); setext: `setext`, `underlineLine` |
| `code_block` | `fenced`; fenced: `fenceChar`, `fenceLength`, `fenceOffset`, `info`, `openLine`, `closeLine`, `fenceLines` |
| `list`, `item` | `ordered`, `bulletChar`, `delimiter`, `start`; an item: `markerStart`, `markerEnd`, `markerOffset`, `padding`, `contentStart` |
| `table` | `rows` (each `{ line, cells, header?, delimiter? }`; a cell `{ left, right, start, end }`), `columns`, `alignments` |
| `html_block` | `htmlType` (CommonMark's seven) |
| `front_matter` | `fenceLines` (the two `---` lines) |
| `definitions` | the lines of link reference definitions (a paragraph that was only those) |

Link reference definitions are taken out of the start of a paragraph when it is finalized
(and before a setext underline makes a heading of it); `definitions` maps a normalized label
to `{ destination, title }`.

A leaf's text is parsed for inlines once the whole document is read (the definitions are
known then): a paragraph's lines joined by "\n", each without its leading white space; a
heading's text; each table cell's.

**Where this differs from CommonMark** (and why): a tab that a container's indentation takes
part of is taken whole (the columns it leaves over are lost; it never changes what is
syntax); a pipe inside a code span in a table cell does not end the cell, which GFM's tables
would split there unless the pipe is escaped (a code span is kept whole).

### 5.2 Inlines

`parseInlines(text, definitions)` is CommonMark's algorithm: a linked list of nodes, a stack
of delimiter runs for emphasis (the rule of three for `*` and `_`), a stack of brackets for
links and images. The extras: `~~` makes strikethrough and one `~` subscript, `^`
superscript, `==` underline (one `=` is text). Every node is `[start, end)` of the text, its
syntax included:

| Node | Its parts |
| --- | --- |
| `text`, `html` | (entities are text, shown as written, as in MaxPad) |
| `code` | `contentStart`, `contentEnd` (the backticks outside them) |
| `escape` | the backslash and the character |
| `autolink` | `contentStart`, `contentEnd`, `destination` |
| `softbreak` | the line ending |
| `hardbreak` | the backslash or the spaces, and the line ending |
| `em`, `strong`, `underline`, `strike`, `sub`, `sup` | `delimiter` (its length), `children` |
| `link`, `image` | `textStart`, `textEnd`, `destination`, `title`, `children` |

The parser keeps, for each character of the text it read, its offset in the source, and
turns every node's places into source offsets (`absolute`), so that from then on everything
speaks in offsets of the source.

------

## 6. The projection: `projection.js`

`project(doc)` makes the paragraphs the view shows. Its rules are MaxPad's
(`Documents/maxpad-projection.md`):

### 6.1 The rule

**A paragraph's text is the source of the lines of its block, with the syntax in it as
hidden runs.** A line ending inside a paragraph is one character of the view (a space for a
soft break, U+2028 for a hard one), so a view paragraph is exactly as long as its stretch of
the source, and a position in it is `start + index` in the source. A picture is drawn after
the run of its `!`, never as a character of its own, which keeps the map one to one.

Every character of the block's lines that no inline covers is syntax: hashes, delimiters, a
link's brackets and address, a quote's `> `, an item's marker, indentation, a setext
underline. Each stretch of syntax has an **owner**:

| Owner | Shown when the caret is |
| --- | --- |
| an inline node (emphasis, a link, a code span...) | in it, or at either end of it |
| `{ kind: 'line', line }` | on that line |
| `{ kind: 'fence', block }` | on either fence of the block |
| `{ kind: 'rule', line }` | on the rule's line (shown at the body's size) |

### 6.2 What each block becomes

| Block | Paragraphs |
| --- | --- |
| paragraph, heading | one; the first paragraph of an item has its `listMarker` (the number, or a bullet by depth); a task's box is its text, drawn as a check box |
| thematic break | one, all hidden; its style draws the rule |
| fenced code | one per line: the fences (`fence`, `fence-close`) all hidden, the code shown |
| indented code | one per line, the indentation hidden |
| HTML, definitions | one per line, as written |
| front matter | as fenced code |
| table | one per cell, row by row, with a shared table object; pipes and the delimiter row are in no paragraph; an empty cell sits after one space of its padding; a cell the row lacks is empty, at the row's end |

**Blank lines:** the first blank line after a block only separates it from what follows and
is in no paragraph; each further one is an empty paragraph (kind `blank`). Blank lines before
the first block are all paragraphs, and so is the one line of an empty document. Inside a
quote the same, the empty paragraph being the quote's (in its style, its `>` concealed). An
item with nothing on its line is a paragraph of its own. Text no block has is a paragraph
of kind `other`.

**Keeping a line:** a paragraph whose text is all syntax (an empty item, an empty heading, an
empty quote line, a blank line) has its syntax **concealed**, not hidden: drawn in no ink, at
full size, so that the line keeps its height.

**Spaces typed at the end of a table cell** are padding to Markdown; the projection made with
the caret after them shows them, so that a space typed there can be seen (MaxPad's
`ShownPadding`).

### 6.3 Style IDs

A paragraph's style ID is its kind and where it sits: `kind[.q<quotes>][.l<lists>]`, as
MaxPad's `StyleIds` (`p`, `h2`, `bullet.l2`, `p.q1`, `code`, `code-fence`,
`code-fence-close`, `code-indented`, `hr`, `html`, `definition`, `table-header`,
`table-cell`, `image`, `blank`, `check`, `list`, `front-matter`, `front-matter-fence`,
`other`). A paragraph of an item takes the item's kind (`bullet`, `list`, `check`).

A run's character style ID is the names of its formats joined by `+`: `code`, `underline`,
`strike`, `sub`, `sup`, `html`, `task`, `task-done`, and `syntax`, `rule-syntax` or
`concealed` for shown or concealed syntax. Bold and italic are the run's own flags.

### 6.4 The objects

- `ProjectedParagraph`: `start`, `end`, `kind`, `styleId`, `block`, `firstLine`, `lastLine`,
  `contentStart` (where the text of the first line starts, after what its block puts in front
  of it), `listMarker`, `itemLine` (the item whose marker is on its first line), `emptyItem`,
  `task`, `cell`, `keepsLine`, and `runs`: `{ text, start, owner, format, link, image }`.
  Its `key` says what it looks like, to tell a changed paragraph from an unchanged one.
- `Projection`: `paragraphs`, `toSource({ paragraph, index })`, `toView(offset)` and
  `paragraphAt(offset)`. A place in the source that no paragraph has (a separating blank line,
  a table's pipe) goes to the start of the next paragraph.
- `viewRunsOf(paragraph, caret, doc)` makes the view's runs: syntax hidden, concealed, or
  shown in the `syntax` style when its owner is revealed at the caret; neighbouring runs that
  look the same made one. With the caret on an item's first line, the drawn marker is taken
  away and the item's own marker text hangs where it was (`markerTextLength`).

------

## 7. Editing the source

### 7.1 `state.js`

`MarkdownState` is a source read (`doc`) and projected (`projection`), never changed: a
command makes a new source, and a new state is read from it. What the commands ask of it:
`lineAt`, `lineStart`, `lineEnd`, `marks`, `marksEnd`, `leafOn`, `isBlankLine`,
`continuationPrefix(line)` (what a new line in the same containers starts with: a quote's
marker as written, an item marker's room as spaces), `blankPrefix(line)` (what a blank line
in them is written with: the quotes' markers, trimmed), `isBlankLineOf(line, prefix)`,
`paragraphAt`, `replaced(start, end, text)`.

### 7.2 Commands (`commands.js`)

Each command is a pure function `(state, selection, ...)` where `selection` is `{ anchor,
caret }` in source offsets, giving `{ source, caret, anchor }` or null (nothing to do there).
The rules are MaxPad's (`maxpad-editing.md`, section 2); `¦` is the caret:

| Command | Where | Does |
| --- | --- | --- |
| typing | anywhere | inserts, over the selection; in a cell a pipe is escaped and a line ending made a space |
| typing | an empty paragraph | the text is a block of its own: the blank line after it is kept |
| Enter | the end of a paragraph or heading | one more empty paragraph after it, the caret in it (`abc¦` gives `abc`, blank, `¦`) |
| Enter | the middle | splits it (`ab¦cd`: `ab`, blank, `¦cd`), in the same containers |
| Enter | the start of a paragraph or a heading's text | an empty paragraph before it |
| Enter | a list item | a new item after the caret (a number one more, a task unchecked) |
| Enter | an empty item | out of the list: an empty paragraph where it was |
| Enter | a quote, at its end / in the middle | `> a`, `>`, `>¦` / `> a`, `>`, `> ¦b` |
| Enter | an empty paragraph of a quote | out of the quote |
| Enter | an empty paragraph | one more |
| Enter | code, HTML | a new line, indented as this one |
| Enter | the end of an opening fence nothing closes | the block made: a line for the code and the closing fence |
| Enter | the end of a closing fence | a new paragraph after the block |
| Enter | a table cell | a row of empty cells under the caret's row (under the delimiter row, from the header), the caret in its first cell |
| Shift+Enter | a paragraph | a hard break: a backslash and a line ending, the next line in the same containers |
| Shift+Enter | code, HTML | as Enter; a heading, a rule, a cell, an empty paragraph: nothing |
| Backspace | text, or syntax shown at the caret | the character before (Ctrl: the word) |
| Backspace | the start of an item's text | its marker (and a task's box) comes off; after another item a blank line goes before it |
| Backspace | the start of a quote's paragraph | one level of quote comes off its lines |
| Backspace | an empty heading | its hashes go, one empty paragraph left |
| Backspace | the start of a paragraph | it joins the one before (what its block puts in front of it going); an empty paragraph before it goes; a rule before it goes; code, a table or a fence is not joined into (the caret goes to its end) |
| Backspace | an empty paragraph | it goes; the caret to the end of the one before |
| Backspace | the start of a line of code | the line joins the one above it in the block |
| Backspace, Delete | the last character of a one-line paragraph | the line left blank, and the line ending after it taken when a blank line and more follow (one empty paragraph left, not two) |
| Delete | text | the character after (Ctrl: the word); a line ending inside a paragraph goes with the next line's prefix |
| Delete | the end of a paragraph | the next joins it; an empty paragraph after it goes |
| Tab, Shift+Tab | the start of an item's text | the item into the item above (indented by its marker), or out of its parent, with all its lines; an ordered item starting a nested list is numbered 1 |
| Tab, Shift+Tab | the start of a heading's text | one level deeper or shallower |
| Tab | the last cell of a table | a row after the last |
| Tab, Shift+Tab | elsewhere | a tab character; Shift+Tab takes one before the caret |

A selection is deleted, cut or copied as `selectedRange` says: a construct whose whole text
the selection takes is taken with its delimiters (selecting "bold" in `**bold**` copies
`**bold**`, and deleting it leaves no empty `****`), and a selection from the start of a
paragraph's text takes what its block puts in front of it (`# `). Enter or Shift+Enter over a
selection deletes it first, then does its work on the result.

A click on a task's box checks or unchecks it (`toggleTask`); the caret stays where it was.

### 7.3 Inline formats (`formatting.js`)

`toggleInline(state, selection, format)` for `strong` (`**`), `em` (`*`), `underline`
(`==`), `strike` (`~~`), `code`, `sub` (`~`) and `sup` (`^`), by MaxPad's rules
(`InlineFormatting`):

- The text a selection takes is cut into **pieces** (each run of text, code span, picture,
  autolink or escape it reaches, with the constructs it is in). The selection is in the
  format if every piece that is not white space is.
- **Taking it off:** a construct of the format whose whole text the selection takes loses its
  delimiters; one it takes part of is split round that part (`_a «b» c_` becomes
  `_a_ «b» _c_`), the delimiters kept clear of the white space at the cut. Code spans come
  off whole.
- **Putting it on:** the pieces are grouped into **segments**: a run of pieces held by the same
  construct that the selection does not take whole. Each segment, without its white space at
  either end, gets a pair of delimiters, so that no construct is ever cut (`*a «b* c»` made
  bold is `*a **b*** **c**`). The same format inside a segment is taken out, and one that
  meets the segment at either end is joined to it. Code gets as many backticks as it takes to
  be none of those inside it.
- **At a caret:** in a construct of the format (or at either end of it), the construct comes
  off; in a word (letters, digits, `_`, and an apostrophe between two of them), the word gets
  the format and the caret keeps its place in it; elsewhere in text, a pair of delimiters
  with the caret between (not on an empty paragraph, next to other delimiters, or, for
  strikethrough, at a line's start).
- The edits are applied together; the selection stays on the same text, backward if it was
  (an insertion at its start goes before it, one at its end after it).

`isInline` says whether the selection (or the caret) is in a format: what a toolbar shows as
pressed.

### 7.4 Paragraph types and blocks (`blocks.js`)

- `setBlockType(state, selection, type)`: the paragraphs and headings the selection touches
  made `paragraph`, `h1` to `h6`, `quote`, `bullet`, `number` (numbered 1, 2, 3...), `task`
  or `code`. It is a toggle: when every one is already that type, they become paragraphs (a
  quote loses one level). Each paragraph is written again (`rewrite`): what its containers
  put in front of its lines is kept, its own syntax (hashes, an item's marker and box, a
  setext underline) is replaced; a heading is one line, so its lines are joined. An item made
  something else after another item gets a blank line before it. `code` puts a fenced block
  round the paragraphs, or takes the fences of the block the caret is in away.
- `setHeadingLevel(state, selection, level)`: MaxPad's Ctrl+1 to Ctrl+6 and Ctrl+0: headings
  of that level, or paragraphs for 0. Not a toggle: one that is that already is left alone.
- `stepHeadingLevel(state, selection, by)`: MaxPad's Ctrl+= and Ctrl+-: one level deeper (a
  paragraph becomes Heading 1, Heading 6 stays) or shallower (Heading 1 becomes a paragraph).
- All three keep the caret and the selection at their places in the text (`rewriteAll`).
- `insertRule`, `insertTable(columns, rows)` (its first header cell selected),
  `insertCodeBlock(language)`: a block after the block at the caret (or in place of an empty
  paragraph), with the blank lines that keep it a block of its own. `insertLink(address)`
  makes the selection (or the address) a link's text; `insertImage(address, description)`
  writes a picture at the caret.

### 7.5 Undo and redo (`history.js`)

The history is of the source: a step is one replacement `{ start, removed, inserted }`, with
the caret and the selection's other end before and after. Undo puts the source and the
selection back as they were before the step; redo as they were after. A step is checked
against the source first (an error if the source is not what it was made on).

A step is found by comparing the sources before and after (`difference`: their common start
and end), the start held no further than the selection's start, so that a letter typed next
to the same letter is a step where it was typed. Steps join (`merge`): typing goes on in the
step of the word (a space then a letter starts a new one; so does a line ending), a run of
Backspace or of Delete is one step, and what is typed over a selection goes on in the step
that took it. A moved caret, an undo or a redo, Enter, a format, a paste, a page's own
command each `seal` the last step, so that the next starts another.

------

## 8. The controller: `controller.js`

`MarkdownController(view, options)` ties a source to a view.

- **Loading:** `load(markdown)` finds the document's line ending (the first one in it; "\n"
  when it has none), makes every line ending "\n", reads it, gives the view its paragraphs,
  clears the history and puts the caret at the start. `getMarkdown()` gives the source back
  in its own line ending.
- **`apply(result, kind)`:** a command's `{ source, caret, anchor }` made the document: the
  step recorded, then `_setSource`, which reads the new source (projected with the caret, for
  a table's padding), finds the paragraphs that changed (`changedParagraphs`: the common
  start and end of the old and new paragraphs by their `key`, widened to whole tables, so
  that the cells of a table are of one table object), and in one `batch` of the view hides the
  syntax it showed, replaces those paragraphs (`replaceParagraphs`), puts the selection and
  shows the syntax at the caret.
- **The selection is in the source** (`selection`: `{ anchor, caret }`). The view's caret is
  mapped to the source when the user moves it (`selectionchange`), and before every command,
  so that no command acts on a caret the view has not told of yet (`_syncFromView`). The
  controller remembers the view position it put the caret at (`_placed`), and keeps its own
  source caret while the view's is there: the caret after a hard break at a paragraph's end
  has no place of its own in the view.
- **The syntax at the caret** (`_reveal`): the paragraph the caret is in gets
  `viewRunsOf(paragraph, caret)` (`restyleParagraph`: the same text, nothing recorded); the
  caret on a fence shows the other fence of its block too (`_fencePartner`); a paragraph that
  showed its syntax and no longer should is restyled back. **An editor without the focus shows
  no syntax** (it reads as the formatted text it is; a page may have several editors);
  `revealUnfocused: true` keeps MaxPad's way, the syntax at the caret always. `revealSyntax:
  false` never shows it.
- **The view's edit commands** are mapped to `commands.js` (`_onEditCommand`), each with its
  kind for the history; `copy` answers with the selection's Markdown (`copiedText`); a paste
  with no text raises `pasteother` for the host.
- **A page's commands:** `toggleInline`, `isInline`, `setBlockType`, `setHeadingLevel`,
  `stepHeadingLevel`, `blockType`, `insertRule`, `insertTable`, `insertCodeBlock`,
  `insertLink`, `insertImage`, `linkAtCaret`, `select(anchor, caret)`, `replace(start, end,
  text)` (an edit of the host's own, one step), `undo`, `redo`. Events: `change` after each
  change of the source, `selectionchange`, `pasteother`. `version` counts the changes.

------

## 9. The look: `styleProvider.js`

`MarkdownStyleProvider(theme)` resolves the projection's style IDs. Its colors and proportions
are MaxPad's: headings 2, 1.69, 1.44, 1.25, 1.13 and 1.06 times the body's size, in the
heading color, with a line under the first ones; code a little smaller, in a code font, on a
light background; quotes in a quiet color.

- A paragraph's style is its kind's (`builtIn`), then moved in for the lists (a list's
  indent, 28 px, a level) and the quotes it is in: each quote level adds 14 px of room and a
  3 px bar, drawn with a CSS gradient in the box's background so that each level has its own
  bar.
- A fenced block of code is one framed box: the opening fence's paragraph has the frame's top
  and round top corners, the closing fence's the bottom, every line of code the sides; the
  fences' padding stays when they are collapsed, so the box has room above and below its
  code.
- A task's box is its `[ ]` or `[x]` in transparent ink over a drawn check box (an SVG
  background), so that its three characters stay text.
- A character style ID is taken apart at `+`, and the styles of its names laid one on the
  other.
- **Themes:** `LIGHT_THEME` and `DARK_THEME`, each an object of the values above (fonts, size,
  colors, `documentWidth`, `centered`, `listIndent`, `paragraphSpacing`, `headingLines`...).
  A page gives a theme in part, over the light one (or over the dark one, with
  `base: 'dark'`).

------

## 10. The component: `MarkdownEditor.js`

`new MarkdownEditor(target, options)` puts into `target` (an element, or a selector) a root
(`.mde`: flex, as tall as its target), a toolbar if wanted, and the view; it makes the style
provider from the theme and the controller from the Markdown. Options: `markdown`, `theme`,
`toolbar` (`true`, `false`, or a list of `DEFAULT_TOOLBAR`'s items), `readOnly`,
`revealSyntax`, `revealUnfocused`, `showFormattingMarks`, `imageBase`, `openLinks`,
`prompt`, `padding`, `label`, `onChange`.

- **The keys** are bound in the view's `keymap`, as MaxPad's where a browser leaves them to a
  page:

  | Keys | Command |
  | --- | --- |
  | Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z | undo, redo |
  | Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Shift+X, Ctrl+\` | bold, italic, underline, strikethrough, code |
  | Ctrl+K | a link (asked for with `prompt`) |
  | Ctrl+1 to Ctrl+6, Ctrl+0 (and with Alt) | `setHeadingLevel` |
  | Ctrl+=, Ctrl+- | `stepHeadingLevel` |
  | Ctrl+Shift+7, 8, 9 | numbered list, bullet list, task list |
  | Ctrl+Alt+Q, C, L | quote, code block, horizontal line |

  A browser gives a page Ctrl+1 to Ctrl+6 before it switches tabs with them, and switches
  none when the page takes them. MaxPad's Ctrl+Shift+T, Q, C, \[ and \] are the browser's own,
  hence the other keys for the lists, the quote and the code block. The backquote, = and -
  keys are recognized by where they are on the keyboard (`code`), and, for a key that reports
  none (a virtual keyboard's), by what it types.
- **Zoom** is Ctrl and the mouse wheel, about 2% a notch, as MaxPad's (no keys); the
  browser's own page zoom is kept out.
- **The toolbar:** buttons with inline SVG icons that do not take the focus (a click keeps
  the caret in the editor), and a list of paragraph and heading levels. After every change
  and every move of the caret it shows which formats are on, the paragraph's type, and
  whether undo and redo can be done.
- **Links:** Ctrl+click raises `linkclick` (`detail.href`, `detail.title`); unless the page
  cancels it, an `http`, `https` or `mailto` link opens in a new tab.
- **Theme colors** for the frame and the toolbar are CSS variables on the root, set from the
  theme (dark or light by the background's brightness).
- **What a page uses:** `value` (get and set), `getMarkdown`, `setMarkdown`, `version`,
  `selection`, `select`, `readOnly`, `theme`, `imageBase`, `showFormattingMarks`, `zoom`,
  `focus`, `destroy`, `undo`, `redo`, `canUndo`, `canRedo`, `toggleInline`, `isInline`,
  `setBlockType`, `setHeadingLevel`, `stepHeadingLevel`, `blockType`, `insertTable`,
  `insertRule`, `insertCodeBlock`, `insertLink`, `insertImage`, `promptLink`, `promptImage`,
  `execute(name)`; events `change`, `selectionchange`, `linkclick`.

------

## 11. The element: `element.js`

`<markdown-editor>` makes a `MarkdownEditor` in itself when it is put in the page.

- **Its Markdown** is its `value` attribute, or the text of a `<script type="text/markdown">`
  or `<template>` in it, or its own text, with the first and last blank lines and the
  indentation its lines share taken off (so that the Markdown can be indented in the HTML).
  `src` loads a file, and makes the file's folder where its pictures are loaded from.
- **Attributes:** `theme`, `toolbar="false"`, `readonly`, `image-base`, `src`, `name`.
- **A form field:** it is form-associated (`ElementInternals`): a form submits its Markdown
  under its `name`, and it raises `input` and `change` (bubbling) after each change, and
  `linkclick`.
- `value` and `editor` are its properties.

------

## 12. Tests

`test/index.html` runs the tests in the browser (the project needs no Node):
`test/harness.js` gives `test`, `equal` and `ok`, runs every test, writes the failures into the
page and leaves the results in `window.testResults`. `?suites=parser,commands` runs some of
the suites; `?steps=150` makes the random test longer.

| Suite | What it checks |
| --- | --- |
| `parser.test.js` | the block structure, lists, quotes, code, HTML, tables, front matter, definitions, line marks, inlines and their offsets |
| `projection.test.js` | blank lines, hidden and shown syntax (`⟦hidden⟧`, `⟨concealed⟩`), styles, list markers, and that every paragraph is its stretch of the source and every position maps to the source and back |
| `commands.test.js` | each editing rule, the formats and the paragraph types, written with `¦` for the caret and `«...»` for a selection, as MaxPad.Editing.Tests write theirs |
| `view.test.js` | the view on its own: its editing, `TextEdit` and its replay, styles, a host doing the edits |
| `editor.test.js` | the editor in a real view, keys and typing sent to it as the browser sends them |

After every command `editor.test.js` checks what MaxPad.Editing.Tests check: the view's
paragraphs are those of a fresh projection of the source (text, style and runs), and only the
caret's paragraph shows syntax. Its random test does random commands (typing, Enter,
Shift+Enter, Backspace, Delete, arrows, Tab, Ctrl+B) on documents of every kind, then undoes
everything back to the document it began as and redoes it to the one it ended as.

A test page that the browser has not given the system's focus is told of no focus at all, so
the tests that need it send the focus events themselves.

`tools/serve.ps1` serves the folder at `http://localhost:8765/` with nothing but Windows
PowerShell (ES modules are not loaded from `file://` pages).

------

## 13. Costs

Each edit reads and projects the whole source again; the view is then given only what
changed, and lays out only what is in view. Typing a character took 4 ms in an 11 KB
document, 11 ms at 50 KB and 22 ms at 167 KB (Chrome, on the development machine,
2026-11-03): about half of it the parse and the projection, the rest finding what changed
and laying it out. A document of 172 KB (4,500 paragraphs) loaded in 62 ms. MaxPad
reads again only the blocks an edit touched; that is the change long documents need here.

------

## 14. Not done, and differences from MaxPad

- Incremental parsing (section 13).
- MaxPad's raw Markdown mode, outline, find and replace, paragraph annotations, stylesheet
  files, spelling and export; code highlighting; drag and drop of text; pasting pictures;
  table commands beyond typing, Tab and Enter.
- A document whose line endings are a mixture is saved with its first kind.
- An editor without the focus shows no syntax (MaxPad shows it at the caret always; section
  8).
- The keys that a browser keeps are elsewhere (section 10).
- Tried in Chrome only; Firefox, Safari, phone keyboards and input methods not yet.

------

## 15. Keeping this document current

This document describes the source as it is. Every change to how the editor works updates it
in the same change: what a module does, a rule of the projection or the editing, a key, an
option, an event, a test suite, a measured cost. A change that makes a section wrong is not
done until the section is right again.
