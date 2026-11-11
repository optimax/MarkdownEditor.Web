# MarkdownEditor.Web User Manual

MarkdownEditor.Web is an editor for Markdown documents that runs in a web page. You write as
you would in a word processor: headings look like headings, bold text is bold, a list is a
list and a table is a table. The document stays Markdown all the while: plain text that any
Markdown tool reads, that a form can submit, and that version control can compare line by
line.

It is a plain JavaScript component: no framework, no build step, nothing to install. A page
puts it in with a few lines of script, or with a `<markdown-editor>` element and no script at
all.

**Who this manual is for.**

- **Getting started** (chapters 1 to 6) is for everyone: how to see the editor working, how
  to put it in a page, and a five-minute tour of it.
- **Part I, Writing** (chapters 7 to 26), is for the people who write in the editor: what
  each key does, how each kind of Markdown is made and changed, and the views that help.
- **Part II, Building it into a page** (chapters 27 to 39), is for the developers who put the
  editor in a page: its options, methods and events, the toolbar, the looks, the
  `<markdown-editor>` element, and recipes.
- **The appendices** list the stylesheet's classes, the theme's values and the toolbar's
  items.

How the editor works inside, module by module, is in
[implementation.md](implementation.md). This manual says what it does.

**Conventions.**

- Keys are written as on Windows: Ctrl+B. On a Mac, Cmd does what Ctrl does.
- In the examples, `¦` is the caret, and `«` and `»` are the ends of a selection. They are
  not typed.
- An example shows the Markdown the editor holds, before and after. What you see on the
  screen is that Markdown, formatted.

------

## Contents

**Getting started**

1. [What you need](#1-what-you-need)
2. [Seeing it work](#2-seeing-it-work)
3. [Putting an editor in a page](#3-putting-an-editor-in-a-page)
4. [Getting the Markdown back](#4-getting-the-markdown-back)
5. [No script at all: the element](#5-no-script-at-all-the-element)
6. [A five-minute tour](#6-a-five-minute-tour)

**Part I: Writing**

7. [What you see and what is written](#7-what-you-see-and-what-is-written)
8. [The toolbar](#8-the-toolbar)
9. [Moving, selecting and deleting](#9-moving-selecting-and-deleting)
10. [Paragraphs and line breaks](#10-paragraphs-and-line-breaks)
11. [Headings](#11-headings)
12. [Bold, italic and the other
    character formats](#12-bold-italic-and-the-other-character-formats)
13. [Lists](#13-lists)
14. [Task lists](#14-task-lists)
15. [Quotes](#15-quotes)
16. [Code](#16-code)
17. [Links](#17-links)
18. [Pictures](#18-pictures)
19. [Tables](#19-tables)
20. [Lines, front matter, HTML and the rest](#20-lines-front-matter-html-and-the-rest)
21. [Undo and redo](#21-undo-and-redo)
22. [Copy, cut and paste](#22-copy-cut-and-paste)
23. [The raw Markdown view](#23-the-raw-markdown-view)
24. [Paragraph marks, numbers, types and
    the outline](#24-paragraph-marks-numbers-types-and-the-outline)
25. [Zoom](#25-zoom)
26. [Keyboard reference](#26-keyboard-reference)

**Part II: Building it into a page**

27. [Options](#27-options)
28. [The document: value, version and
    selection](#28-the-document-value-version-and-selection)
29. [Commands](#29-commands)
30. [Events](#30-events)
31. [The toolbar: choosing items, adding
    your own](#31-the-toolbar-choosing-items-adding-your-own)
32. [Asking for addresses](#32-asking-for-addresses)
33. [Links and pictures](#33-links-and-pictures)
34. [Read-only documents](#34-read-only-documents)
35. [Looks: themes and stylesheets](#35-looks-themes-and-stylesheets)
36. [The markdown-editor element](#36-the-markdown-editor-element)
37. [Recipes](#37-recipes)
38. [Limits and what is not done yet](#38-limits-and-what-is-not-done-yet)
39. [Troubleshooting](#39-troubleshooting)

**Appendices**

- [A. Markdown reference](#a-markdown-reference)
- [B. Stylesheet classes](#b-stylesheet-classes)
- [C. Theme values](#c-theme-values)
- [D. Toolbar items](#d-toolbar-items)

------

# Getting started

## 1. What you need

- **A current browser.** The editor has been tried in Chrome. Firefox and Safari have not
  been tried yet (chapter 38).
- **A web server for your page.** The editor is a set of JavaScript modules, and browsers do
  not load modules into a page opened from a file (`file://`). Any static web server does.
- **The `src` folder** of this repository. Copy it into your site, or serve this folder as it
  is. There is no package to install, no build step and no other library.

## 2. Seeing it work

On Windows, with nothing installed but PowerShell, run this in the repository's folder:

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

It serves the folder at `http://localhost:8765/`. Any other static server works as well,
for example Python's:

```bash
python -m http.server 8765
```

Then open these pages:

| Page | What it shows |
| --- | --- |
| <http://localhost:8765/demo/index.html> | The editor with its whole toolbar and three buttons of the page's own: collapsible headings, a dark theme and read-only. A status bar, and a Download .md button. |
| <http://localhost:8765/demo/element.html> | `<markdown-editor>` as a field of a form, and what the form submits. |
| <http://localhost:8765/demo/tinypad.html> | TinyPad: the text view the editor is built on, used on its own as a small word processor. |
| <http://localhost:8765/test/index.html> | The tests. |

In the demo, `window.editor` is the editor: you can try every method of Part II in the
browser's console.

## 3. Putting an editor in a page

A whole page, with an editor in it:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My editor</title>
</head>
<body>
  <div id="editor" style="height: 480px"></div>

  <script type="module">
    import { MarkdownEditor } from './src/index.js';

    const editor = new MarkdownEditor('#editor', {
      markdown: '# Hello\n\nSome **bold** text.',
    });
    editor.focus();
  </script>
</body>
</html>
```

Three things to know:

1. **Give the element a height.** The editor fills the element it is put in, and scrolls
   inside it. (It is never shorter than 200 px.) Any CSS height works: `height: 100%` in a
   flex layout, `height: 60vh`, or a fixed one.
2. **Import from where `src` is**, relative to the page: `./src/index.js`,
   `/js/markdown-editor/index.js`, or wherever you put the folder.
3. **Nothing else goes in the page.** The editor puts its own stylesheet in the page's head.

The first argument is the element, or a CSS selector of it. The second, the options, may be
left out: an empty document with the whole toolbar. Chapter 27 lists every option.

```js
const element = document.querySelector('.notes');
const editor = new MarkdownEditor(element, {
  markdown: savedNotes,
  theme: 'dark',
  toolbar: ['undo', 'redo', '|', 'strong', 'em', 'link'],
});
```

## 4. Getting the Markdown back

`value` is the document, as Markdown. Read it to save it; set it to load another document.

```js
const markdown = editor.value;   // the Markdown, a string
editor.value = '# Another one';  // loads a new document (undo starts over)
```

The editor raises `change` after every change, and `version` counts the changes: keep the
version you saved, and the document is unsaved while the two differ.

```js
let savedVersion = editor.version;

editor.addEventListener('change', () => {
  const unsaved = editor.version !== savedVersion;
  document.title = (unsaved ? '* ' : '') + 'My document';
});

async function save() {
  await fetch('/api/document', { method: 'PUT', body: editor.value });
  savedVersion = editor.version;
}
```

Loading a document from the server:

```js
const response = await fetch('notes/today.md');
editor.value = await response.text();
```

**Line endings are kept.** The editor takes the line ending of a document from its first line
(Windows CRLF, Unix LF or old Mac CR) and gives the document back in it. A document you open
and save without changing it comes back exactly as it was, byte for byte.

## 5. No script at all: the element

Load the module once, and write `<markdown-editor>` where an editor goes. Its Markdown is
written inside it, in a `<script type="text/markdown">` (so that the browser leaves it
alone). The indentation its lines share is taken off, so it can be indented with the HTML.

```html
<script type="module" src="./src/index.js"></script>

<form method="post" action="/posts">
  <input name="title" value="Release notes">

  <markdown-editor name="body" style="height: 320px">
    <script type="text/markdown">
      ## What's new

      - **Faster** loading
      - [ ] Write the *documentation*
    </script>
  </markdown-editor>

  <button>Publish</button>
</form>
```

The element is a field of its form, as a `<textarea>` is: the form submits `title` and
`body`, and `body` is the Markdown. Chapter 36 has its attributes, properties and events.

An editor that loads a file:

```html
<markdown-editor src="docs/guide.md" style="height: 70vh"></markdown-editor>
```

## 6. A five-minute tour

Open the demo (chapter 2) and try these.

1. **The syntax at the caret.** Click in the heading at the top. Its `#` shows in front of
   it: that is its Markdown. Click in another paragraph and it hides again.
2. **Bold.** Double-click a word and press Ctrl+B. The word is bold. Click in it: `**` shows
   on either side, because the document now holds `**word**`.
3. **A list.** Put the caret at the end of a paragraph, press Enter, and type `- ` and a few
   words. The paragraph is a bullet now. Press Enter for the next item; press Enter on an
   empty item to leave the list.
4. **A heading.** In a paragraph, press Ctrl+2: it is Heading 2. Ctrl+0 makes it a paragraph
   again.
5. **A table.** Click the toolbar's table button. Type in the selected cell, press Tab to go
   to the next one, and Enter to add a row.
6. **The Markdown itself.** Press Ctrl+Shift+R. The editor shows the Markdown as plain text,
   which you can edit. Press Ctrl+Shift+R again to go back.
7. **Undo.** Press Ctrl+Z a few times: each step comes back, all the way to the document you
   began with. Ctrl+Y redoes.

------

# Part I: Writing

## 7. What you see and what is written

### 7.1 Formatted text that stays Markdown

The editor shows each part of the document as what it means: a heading large, bold text
bold, a list with its bullets, a table as a table, a picture as the picture. The Markdown
characters that make them, the *syntax* (`#`, `**`, `-`, `|`...), are hidden.

What you change is the Markdown. Pressing Ctrl+B on a word writes `**` on either side of it;
pressing Enter at the end of a list item writes the next item's `- `. Each key does what a
word processor's would, and writes the Markdown that says it.

This Markdown:

```markdown
## Shopping

Buy **fresh** bread and:

- milk
- eggs
```

is shown as a heading, a paragraph with one bold word, and a list of two bullets, with no
`#`, `**` or `-` in sight.

### 7.2 The syntax at the caret

Where the caret is, the syntax of what it is in shows, in grey, ready to be edited:

| The caret is | What shows |
| --- | --- |
| in bold, italic, a link, a code span..., or at either end of it | its delimiters: `**`, `*`, the link's `[`, `](address)`, the backticks |
| on a heading's line | its `#` marks |
| on the first line of a list item | its marker (`-`, `1.`, `- [ ]`), where the bullet or the number was drawn |
| on a line of a quote | its `>` |
| on either fence of a block of code | both fences, and the language after the first |
| on a horizontal line | its `---`, at the text's size |

The syntax that shows is text like any other: you can type in it and delete it. Put the
caret in a link and change its address; put it on a heading and delete one `#` to make it a
level higher.

The syntax shows only while the editor has the focus, so that an editor you are not using
reads as formatted text. A read-only document never shows it. (A page can change both:
chapter 27.)

### 7.3 Typing Markdown

As the document is Markdown, typing Markdown makes it. These work as you type:

| Type, at the start of a paragraph | It becomes |
| --- | --- |
| `# ` to `###### ` | a heading, of level 1 to 6 |
| `- `, `* ` or `+ ` | a bullet |
| `1. ` or `1) ` | a numbered item |
| `- [ ] ` | a task |
| `> ` | a quote |
| `---` (alone in its paragraph) | a horizontal line |
| ```` ``` ```` and Enter | a block of code |

And in the text: `**bold**`, `*italic*`, `` `code` ``, `[text](address)` and the rest
(appendix A). The moment the closing delimiter is typed, the text is formatted.

A character that Markdown reads as syntax, typed where you want the character itself, is
written with a backslash before it: `\*` is a star, `\#` at the start of a line a hash. The
backslash hides once the caret leaves it.

### 7.4 Blocks and blank lines

Markdown separates its blocks (paragraphs, headings, lists...) with a blank line. The
editor writes it for you, and does not show it: Enter at the end of a paragraph writes a
blank line and a new paragraph after it.

```markdown
The first paragraph.

The second paragraph.
```

is two paragraphs, one under the other, with no empty one between. Each further blank line
is an empty paragraph, which you see and can type in:

```markdown
The first paragraph.



The second paragraph.
```

has two empty paragraphs between the two (three blank lines: the first separates, the
other two show).

## 8. The toolbar

The editor's toolbar, from left to right. A page may show fewer of these, in another order,
and buttons of its own (the demo adds three): chapter 31.

| Button | What it does | Keys |
| --- | --- | --- |
| Undo, Redo | A step back, or forward again (chapter 21) | Ctrl+Z, Ctrl+Y |
| Paragraph or heading (a list) | The paragraph at the caret as a paragraph or a heading of level 1 to 6 | Ctrl+0 to Ctrl+6 |
| Bold | `**bold**` | Ctrl+B |
| Italic | `*italic*` | Ctrl+I |
| Underline | `==underline==` | Ctrl+U |
| Strikethrough | `~~strikethrough~~` | Ctrl+Shift+X |
| Inline code | `` `code` `` | Ctrl+\` |
| Quote | `> ` before each line | Ctrl+Alt+Q |
| Bullet list | `- ` items | Ctrl+Shift+8 |
| Numbered list | `1. `, `2. ` items | Ctrl+Shift+7 |
| Task list | `- [ ] ` items | Ctrl+Shift+9 |
| Code block | ```` ``` ```` fences around the paragraphs | Ctrl+Alt+C |
| Link | Asks for an address; the selection becomes the link's text, or the link the caret is in gets the new address | Ctrl+K |
| Picture | Asks for a picture's address, and puts the picture at the caret | |
| Table | A table of three columns and two rows after the paragraph | |
| Horizontal line | A `---` line after the paragraph | Ctrl+Alt+L |
| Paragraph marks | ¶ at the end of each paragraph, ↵ at each line break | |
| Paragraph numbers | Each paragraph's number, left of the text | |
| Paragraph types | Each paragraph's type (Heading 2, Bullet...), left of the text | |
| Markdown source | The raw Markdown view on and off (chapter 23) | Ctrl+Shift+R |
| Zoom out, Zoom in | 10% smaller or larger | Ctrl and the mouse wheel |
| The zoom (100%) | Says the zoom; a click puts it back at 100% | |

The toolbar follows the caret: the formats and the paragraph type at the caret show as
pressed, and the list shows its heading level. Undo and Redo are off when there is nothing
to undo or redo.

The buttons do not take the focus: after a click, the caret is where it was, and you go on
typing.

**From the keyboard**, Alt+F10 in the text goes to the toolbar. Left and Right go from button
to button (Home and End to the first and the last), Enter or Space presses one and goes back
to the text, and Escape goes back without pressing anything. The toolbar is one stop of Tab:
it comes back to the button last used. Since Tab is the editor's own (it indents), Escape and
then Tab leave the editor, Escape and then Shift+Tab go back to what is before it.

**With a screen reader.** In screen reader mode the editor gives a screen reader the text
round the caret, as it is shown (without the Markdown that is hidden), so that it reads the
character, the word or the line the caret goes over, and what is typed. The mode is on
where there is a mouse and off on a touch screen, whose keyboard would read that text too
and might change it. Shift+Alt+F1 switches it on or off, and the screen reader says which.
A page sets it with the `screenReader` option (chapter 27).

In a read-only document only the buttons that change the view (the marks, the numbers, the
types, the Markdown source and the zoom) are on. In the raw Markdown view only those, Undo
and Redo are.

Pointing at a button shows its name and its keys.

## 9. Moving, selecting and deleting

### 9.1 The keys

| Keys | The caret goes |
| --- | --- |
| Left, Right | a character back or on (an emoji, or a letter with its accent, is one character) |
| Ctrl+Left, Ctrl+Right | a word back or on |
| Up, Down | a line up or down, keeping its column; in a table, to the cell above or below |
| Home, End | to the start or end of the line (of a wrapped line, its own) |
| Ctrl+Home, Ctrl+End | to the start or end of the document |
| Page Up, Page Down | a screen up or down |

With Shift, each of them extends the selection instead. Ctrl+A selects the whole document,
and Escape drops the selection, leaving the caret where it was.

| Keys | Deletes |
| --- | --- |
| Backspace, Delete | the character before the caret, or after it (or the selection) |
| Ctrl+Backspace, Ctrl+Delete | the word before the caret, or after it |
| Shift+Delete | the selection, onto the clipboard (as Ctrl+X) |

What Backspace and Delete do at the edge of a paragraph, a list item, a quote or a heading is
in the chapters on them: they take the syntax off rather than leave it half there.

### 9.2 The mouse

| Mouse | Does |
| --- | --- |
| Click | puts the caret there |
| Shift+click | extends the selection to there |
| Double-click | selects a word |
| Triple-click | selects a paragraph |
| Drag | selects; after a double or triple click, by whole words or paragraphs |
| Ctrl+click on a link | opens the link (chapter 17) |
| Click on a task's box | checks or unchecks it (chapter 14) |

Dragging past the top or the bottom scrolls.

### 9.3 Deleting a whole construct

A selection that takes the whole text of a construct takes its syntax with it, so that no
empty `****` is left behind:

```markdown
x **«bold»** y
```

Backspace:

```markdown
x ¦ y
```

The same holds for copying: copying the selection above copies `**bold**` (chapter 22).

## 10. Paragraphs and line breaks

### 10.1 Enter

Enter makes a new paragraph. Where the caret is decides how:

At the end of a paragraph, an empty one after it:

```markdown
The first paragraph.¦
```

```markdown
The first paragraph.

¦
```

In the middle, the paragraph is split in two:

```markdown
One sentence. ¦Another sentence.
```

```markdown
One sentence.

¦Another sentence.
```

At the start of a paragraph, an empty paragraph before it; on an empty paragraph, one more
empty paragraph. In a list, a quote, a table or a block of code, Enter does what each of them
needs: see their chapters.

Text typed in an empty paragraph is a paragraph of its own: the blank lines around it stay,
so it does not join the paragraph before or after it.

### 10.2 Shift+Enter: a line break

Shift+Enter breaks the line without making a new paragraph. The editor writes the line break
as a backslash at the end of the line, which is how CommonMark writes one:

```markdown
Roses are red,\
violets are blue.
```

is one paragraph of two lines. (Two spaces at the end of a line are a line break too: the
editor reads them in a document, and writes a backslash itself.)

Shift+Enter in a heading, a table cell or an empty paragraph does nothing; in code it is
Enter.

A line ending without either is not a break: Markdown joins the lines of a paragraph with
a space.

```markdown
These two lines
are one line of text.
```

### 10.3 Joining paragraphs

Backspace at the start of a paragraph joins it to the one before:

```markdown
One sentence.

¦Another sentence.
```

```markdown
One sentence.¦Another sentence.
```

Delete at the end of a paragraph joins the next one to it. An empty paragraph before the
caret (with Backspace) or after it (with Delete) is taken away instead, and so is a
horizontal line before it. Backspace does not join a paragraph into a block of code or a
table: the caret goes to the end of it.

## 11. Headings

### 11.1 Making a heading

| To | Do |
| --- | --- |
| make the paragraph a heading of level 1 to 6 | Ctrl+1 to Ctrl+6, or the toolbar's list |
| make a heading a paragraph again | Ctrl+0, or Paragraph in the list |
| go one level deeper (a paragraph becomes Heading 1) | Ctrl+= |
| go one level higher (Heading 1 becomes a paragraph) | Ctrl+- |
| go one level deeper or higher with the caret at the start of the heading's text | Tab, Shift+Tab |
| type it | `## ` at the start of the paragraph |

```markdown
Getting there¦
```

Ctrl+2:

```markdown
## Getting there¦
```

Ctrl+= (one level deeper):

```markdown
### Getting there¦
```

Ctrl+1 to Ctrl+6 are not switches: Ctrl+2 on a Heading 2 leaves it as it is. Every paragraph
the selection touches is changed.

Some browsers switch tabs with Ctrl+1 to Ctrl+6. Chrome lets the editor have them while it
has the focus; Ctrl+Alt+1 to Ctrl+Alt+6 (and Ctrl+Alt+0) do the same for a browser that keeps
them.

### 11.2 Writing in a heading

- **Enter** at the end of a heading starts a paragraph after it, not another heading.
- **A heading is one line.** Shift+Enter does nothing in it, and a paragraph of several lines
  made a heading has its lines joined.
- **Backspace** in an empty heading takes its `#` marks away, leaving an empty paragraph.

### 11.3 The other kind of heading

Markdown has a second way of writing headings of level 1 and 2: the text, and a line of `=`
or `-` under it.

```markdown
A title
=======

A section
---------
```

The editor reads them, shows them as headings and keeps them as they are. Changing the
level of one writes it again with `#` marks.

## 12. Bold, italic and the other character formats

### 12.1 The formats

| Format | Keys | Markdown | Shown as |
| --- | --- | --- | --- |
| Bold | Ctrl+B | `**bold**` (or `__bold__`) | **bold** |
| Italic | Ctrl+I | `*italic*` (or `_italic_`) | *italic* |
| Underline | Ctrl+U | `==underline==` | underlined |
| Strikethrough | Ctrl+Shift+X | `~~strikethrough~~` | struck through |
| Inline code | Ctrl+\` | `` `code` `` | `code`, in the code font |
| Subscript | | `H~2~O` | H₂O |
| Superscript | | `x^2^` | x² |

Underline, strikethrough, subscript and superscript are extensions of Markdown (MaxPad's),
not CommonMark: another Markdown tool may show them as written.

Subscript and superscript have no keys or buttons: type them, or a page may add buttons for
them (chapter 31).

Ctrl+\` is the key left of 1 on most keyboards, whatever it types on yours.

### 12.2 How a format goes on and comes off

**A selection gets the format.** If all of it has it already, the format comes off instead.

```markdown
Read «this» first.
```

Ctrl+B:

```markdown
Read **«this»** first.
```

Ctrl+B again takes it off.

**The caret in a word** gives the whole word the format, and the caret stays where it was in
it:

```markdown
Read th¦is first.
```

Ctrl+B:

```markdown
Read **th¦is** first.
```

**The caret in text with the format** takes the format off what holds it:

```markdown
Read **th¦is** first.
```

Ctrl+B:

```markdown
Read th¦is first.
```

**The caret anywhere else** (after a space, at the end of a paragraph) writes a pair of
delimiters with the caret between them: what you type next is in the format.

```markdown
Read ¦
```

Ctrl+B, then type `this`:

```markdown
Read **this¦**
```

### 12.3 Fine points

- **Spaces stay outside.** A selection that ends in a space gets its delimiters inside the
  space, as Markdown needs: `hello «world »` made bold is `hello **world** `.
- **Taking part of a format off** splits it around the part:

  ```markdown
  **one «two» three**
  ```

  Ctrl+B:

  ```markdown
  **one** «two» **three**
  ```

- **No construct is cut in two.** A selection that starts inside italic text and ends
  outside it gets its bold in pieces that fit:

  ```markdown
  *one «two* three»
  ```

  Ctrl+B:

  ```markdown
  *one **two*** **three**
  ```

- **Inline code** gets as many backticks as it needs to hold backticks of its own: code
  with one backtick in it is written between two.

  ```markdown
  The command is `` echo `date` ``.
  ```

- **Formats combine**: bold and italic is `***both***`; a link may be bold, bold text may
  hold a link.

## 13. Lists

### 13.1 Making a list

Ctrl+Shift+8 (bullets) or Ctrl+Shift+7 (numbers), or the toolbar's buttons, make the
paragraphs the selection touches items of a list. The same again, on items that are all of
that kind already, makes them paragraphs again.

```markdown
«Milk

Eggs»
```

Ctrl+Shift+8:

```markdown
- Milk

- Eggs
```

Ctrl+Shift+7 instead:

```markdown
1. Milk

2. Eggs
```

Or type `- ` or `1. ` at the start of a paragraph.

Bullets are drawn by depth: •, then ◦, then ▪. Numbers count on from the first item's, as
in CommonMark: a list whose items are written `3.`, `4.` and `9.` is numbered 3, 4, 5.

### 13.2 Writing in a list

**Enter at the end of an item** starts the next one; in a numbered list, with the next
number:

```markdown
1. Preheat the oven¦
```

```markdown
1. Preheat the oven
2. ¦
```

**Enter in the middle of an item** splits it into two items.

**Enter on an empty item** ends the list: the item becomes an empty paragraph after it.

```markdown
- Milk
- ¦
```

```markdown
- Milk

¦
```

**Backspace at the start of an item's text** takes its marker off: the item becomes a
paragraph after the list.

```markdown
- Milk
- ¦Eggs
```

```markdown
- Milk

¦Eggs
```

**Shift+Enter** breaks the line inside the item; the next line is part of the same item.

### 13.3 Nested lists

**Tab at the start of an item's text** moves the item into the item above it, one level
deeper, with all its lines. **Shift+Tab** there moves it back out.

```markdown
- Fruit
- ¦Apples
```

Tab:

```markdown
- Fruit
  - ¦Apples
```

A numbered item put in another starts a list of its own, numbered 1; Shift+Tab gives it its
number in the outer list back:

```markdown
1. Prepare the dough
2. ¦Let it rest
```

Tab:

```markdown
1. Prepare the dough
   1. ¦Let it rest
```

An item can hold paragraphs, quotes, code and lists of its own: each line is indented to
where the item's text starts.

```markdown
1. Mix the flour and the butter.

   Use cold butter: it makes the pastry flaky.

2. Add the water, a spoonful at a time.
```

## 14. Task lists

A task is a list item with a box: Ctrl+Shift+9, or the toolbar's task button, or type
`- [ ] `.

```markdown
- [ ] Write the chapter on tables
- [x] Write the chapter on lists
```

- **Click the box** to check or uncheck it; the caret stays where it was. In a read-only
  document the box cannot be changed.
- **Enter** after a task starts another one, unchecked, even after a checked one.
- A bullet made a task gets an unchecked box: `- Milk` becomes `- [ ] Milk`.

## 15. Quotes

Ctrl+Alt+Q, or the toolbar's quote button, makes the paragraphs the selection touches a
quote: `> ` in front of each line. On a quote, it takes one level of quote off.

```markdown
To be or not to be.
```

Ctrl+Alt+Q:

```markdown
> To be or not to be.
```

A quote is drawn with a bar on its left, its text in a quieter color.

- **Enter at the end of a quote's paragraph** starts another paragraph in the quote:

  ```markdown
  > The first thought.
  >
  >¦
  ```

- **Enter on an empty paragraph of a quote** leaves the quote.
- **Backspace at the start of a quote's paragraph** takes one level of quote off its lines.
- **Quotes nest**: `> > ` is a quote in a quote, drawn with two bars. A quote may hold lists,
  code and headings.

```markdown
> ## A heading in a quote
>
> - with a list
> - of two items
>
> > and a quote inside it.
```

## 16. Code

### 16.1 Inline code

Ctrl+\`, or the toolbar's inline code button, makes the selection (or the word at the caret)
code: `` `like this` ``. Inside code nothing is formatted: `` `**` `` shows two stars.

### 16.2 Blocks of code

Ctrl+Alt+C, or the toolbar's code block button, puts the paragraphs the selection touches in
a block of code; on a block of code, it takes the block's fences away again.

```markdown
let total = 0;
```

Ctrl+Alt+C:

````markdown
```
let total = 0;
```
````

Or type the opening fence, with a language if you want one, and press Enter: the editor
writes the closing fence for you, with an empty line between for the code.

````markdown
```js¦
````

Enter:

````markdown
```js
¦
```
````

A block of code is drawn in a frame, in the code font. The fences are hidden; with the caret
on either of them, both show, so that you can change the language or the fence itself.

In a block of code:

- **Enter** starts a new line of code, indented as the line it was pressed on.
- **Tab** types a tab character.
- **Shift+Enter** is Enter.
- **Backspace at the start of a line** joins it to the line above.
- Nothing is formatted: the text is what you type.

The language is kept as written (`js`, `python`...). The code is not colored by language
yet (chapter 38).

Markdown also takes lines indented by four spaces as code, without fences. The editor reads
and keeps them.

## 17. Links

### 17.1 Making a link

Select the text that is to be the link, press Ctrl+K (or the toolbar's link button), and give
the address:

```markdown
Read the «guide».
```

Ctrl+K, `https://example.com/guide`:

```markdown
Read the [guide](https://example.com/guide).
```

With nothing selected, the address is the link's text as well:
`[https://example.com](https://example.com)`.

An address with spaces or parentheses in it is written between `<` and `>`, as Markdown
needs: `[report](<files/annual report.pdf>)`.

The question for the address is the browser's own small dialog, unless the page gives one of
its own (chapter 32).

### 17.2 Changing a link

**Ctrl+K with the caret in a link** (or with some of its text selected) asks for the address
with the link's own in the question, and changes it. The link's text and title stay as they
are, and its text is selected afterwards.

```markdown
Read the [gu¦ide](https://example.com/guide).
```

Ctrl+K, `https://example.com/manual`:

```markdown
Read the [«guide»](https://example.com/manual).
```

**An empty answer takes the link away** and leaves its text, as text. Cancelling the
question changes nothing.

A reference link (`[text][ref]`) or an address written as its own link
(`<https://example.com>`) whose address is changed this way becomes an ordinary link,
`[text](new address)`.

You can also put the caret in the link and edit it in place: its syntax shows,
`[guide](https://example.com/guide)`, and the text and the address are edited as any other
text.

### 17.3 Following a link

**Ctrl+click** a link to open it. A web address (`http:`, `https:`) or an e-mail address
(`mailto:`) opens in a new tab, unless the page does something else with it (chapter 33). A
click without Ctrl puts the caret in the link, to edit it.

### 17.4 Other ways of writing links

| Markdown | What it is |
| --- | --- |
| `[text](https://example.com "A title")` | A link with a title. |
| `<https://commonmark.org>` | An address that is its own link (the `<` and `>` hidden). |
| `<team@example.com>` | An e-mail address that is its own link. |
| `[text][spec]` and, on a line of its own, `[spec]: https://spec.commonmark.org` | A reference link: the address is defined once, elsewhere in the document. The definition shows as written. |

An address written without `<` and `>`, `https://example.com` or `www.example.com`, is text,
not a link, as in CommonMark.

## 18. Pictures

The toolbar's picture button asks for a picture's address and puts the picture at the
caret:

```markdown
![](images/harbour.jpg)
```

The picture is shown in the document. The text between the brackets is its description, for
those who cannot see it: put the caret on the picture, its Markdown shows, and type the
description there.

```markdown
![The harbour at dawn](images/harbour.jpg)
```

- A paragraph that holds only a picture shows it centered.
- A relative address (`images/harbour.jpg`) is loaded from where the page says the
  document's pictures are (chapter 33).
- Pictures cannot be pasted or dropped into the document yet (chapter 38): a picture is an
  address.

## 19. Tables

### 19.1 Making a table

The toolbar's table button puts a table of three columns and two rows after the paragraph
at the caret, with the first heading selected, ready to be typed over:

```markdown
| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
|  |  |  |
|  |  |  |
```

The first row is the heading row, drawn in bold on a shaded background. The `---` row under
it says that this is a table, and is not shown.

A table can also be pasted as Markdown, or written in the raw Markdown view (chapter 23). It
cannot be typed line by line in the formatted view, as Enter makes a new paragraph at the end
of each line.

### 19.2 Writing in a table

| Keys | In a table |
| --- | --- |
| Tab | to the next cell, its text selected; in the last cell, a new row at the end |
| Shift+Tab | to the cell before, its text selected |
| Enter | a new row under the caret's row (under the heading row, from a heading), the caret in its first cell |
| Up, Down | to the cell above or below |

- A `|` typed or pasted in a cell is written `\|`, so that it is text and not the edge of a
  cell (each of `||` too).
- Nothing typed or taken out of a cell moves its edges. A `\` left or typed right before the
  cell's edge gets a space after it (the cell's padding), so that it shows as `\` and does
  not make the edge text; Backspace on the `\` of a `\|` in a cell does nothing, since a cell
  cannot hold a bare `|`.
- A cell is one line: a line break typed or pasted into it becomes a space.
- Spaces typed at the end of a cell show while the caret is after them.

### 19.3 Alignment, and what is not done yet

A column's alignment is written in the `---` row: `:---` to the left, `:---:` centered,
`---:` to the right.

```markdown
| Item | Price |
| :--- | ---: |
| Bread | 2.40 |
| Butter | 3.15 |
```

There are no commands yet to add or delete columns, delete rows, or set an alignment
(chapter 38). Do these in the raw Markdown view: the table is plain text there, a row a line.

## 20. Lines, front matter, HTML and the rest

**A horizontal line**: Ctrl+Alt+L, or the toolbar's button, puts one after the paragraph at
the caret; or type `---` (or `***`, or `___`) alone in a paragraph.

```markdown
The end of one part.

---

The start of the next.
```

`---` right under a line of text, with no blank line between, makes that text a heading
instead (chapter 11.3). The editor's Enter always leaves a blank line, so a `---` typed in a
new paragraph is a line.

**Front matter** is a block of YAML at the very start of a document, between two `---`
lines, that many tools read for a title, a date or tags. The editor shows it as written, in
a code font, and keeps it.

```markdown
---
title: Release notes
date: 2026-11-04
---

# Release notes
```

**HTML** in a document is kept and shown as written, in its own color, not rendered: a block
of HTML on lines of its own, or a tag in the text (`<kbd>Ctrl</kbd>`). The editor never
turns HTML into what it would look like in a browser.

**Character entities**, `&copy;` or `&nbsp;`, are shown as written too.

## 21. Undo and redo

Ctrl+Z undoes, Ctrl+Y (or Ctrl+Shift+Z) redoes, as many steps as there were. The toolbar's
first two buttons do the same. The browser's own Edit menu's Undo and Redo do too.

A step is what you would expect to undo at once:

- a word typed (a space and the next letter begin another step);
- a run of Backspace, or of Delete;
- one Enter, one format, one paste, one change of a paragraph's type;
- the text typed over a selection, together with the selection it took.

Undo and redo put the caret and the selection back where they were.

Loading another document (a page setting its `value`) starts the history over.

## 22. Copy, cut and paste

**Copying gives Markdown.** Ctrl+C copies the selection as the Markdown it is, so that
pasting it into another Markdown document, or back into this one, keeps its formats.

```markdown
Some «**bold** and *italic*» text.
```

copies `**bold** and *italic*`. Selecting just the word in `**bold**` copies `**bold**`: a
construct whose whole text is selected is copied with its syntax.

**Pasting reads Markdown.** Ctrl+V pastes the clipboard's text, and the editor reads it as
Markdown: a pasted `## Heading` is a heading, a pasted table is a table.

```markdown
Paragraph.¦
```

Enter, then paste

```markdown
| a | b |
| --- | --- |
| 1 | 2 |
```

and the document has a table. What is pasted is always the clipboard's plain text: text
copied from a web page or a word processor is pasted without its formats. Ctrl+Shift+V pastes
the same.

Ctrl+X cuts (as does Shift+Delete). Pasted in a table cell, line breaks become spaces.

**The right-click menu** has the browser's Cut, Copy, Paste and Delete, and they do what the
keys do. A right-click outside the selection first puts the caret where it was clicked, as a
click does; one inside the selection keeps it, to cut or copy it. (The menu's Select All
selects nothing of the document: use Ctrl+A.)

## 23. The raw Markdown view

Ctrl+Shift+R, or the toolbar's Markdown source button, shows the document as the Markdown
it is: plain text in the code font, every `#`, `*` and `|` in sight. Press it again to go
back to the formatted view.

- **Looking changes nothing.** The caret and the selection stay where they were, the text on
  the screen stays where it was, and going back leaves the document and its undo history as
  they were.
- **You can edit the Markdown there**, as plain text: typing, Enter (a new line), Backspace,
  Delete, Tab, copy, cut and paste. Undo and redo work there an edit at a time.
- **What you changed becomes the document when you go back**, as one step: one Ctrl+Z in
  the formatted view brings back the document as it was before you opened the raw view.
- **The formats are off there**: the toolbar's formatting buttons and keys do nothing.
- The caret's line has a light band behind it.
- With the paragraph numbers or types on (chapter 24), each line is numbered and named as the
  paragraph it begins is in the formatted view.

The raw view is the place for what the formatted view does not do yet: a table's columns
and alignment, a list's numbering, a link reference's definition.

## 24. Paragraph marks, numbers, types and the outline

These change what is shown, not the document. They can be switched on in a read-only
document too.

**Paragraph marks** (the toolbar's ¶ button): a ¶ at the end of each paragraph and a ↵ at
each line break, to see where paragraphs end and lines break.

**Paragraph numbers** (the toolbar's # button): each paragraph's number in a column left of
the text. A table's row counts as one paragraph. The raw Markdown view numbers its lines the
same way, so a number points to the same place in both views.

**Paragraph types** (the button beside #): each paragraph's type, left of the text: Heading 1
to Heading 6, Paragraph, Bullet, List (a numbered item), Check (a task), List item (a further
paragraph of an item), Quote, Quote item, Code, Code fence, Table header, Table row, Rule,
Image, HTML, Definition, Front matter, Front matter fence, Empty paragraph, Other.

**The outline: collapsible headings.** When the page offers it (the demo's button with the
triangles), a small triangle beside each heading folds away what the heading heads: every
paragraph down to the next heading of the same level or a higher one. Click the triangle
again to open it.

```text
# Chapter one     ← folding it hides everything down to "Chapter two"
## Section 1.1    ← folding it hides its text, down to "Section 1.2"
Text...
## Section 1.2
Text...
# Chapter two
```

- A folded part is still in the document, and saved with it: it is only not shown.
- The caret steps over a folded part. If something puts the caret inside one (an undo, a
  page's command), the part opens.
- Switching the outline off opens every folded heading.

## 25. Zoom

| To | Do |
| --- | --- |
| zoom in or out by about 2% a notch | Ctrl and the mouse wheel over the document |
| zoom in or out by 10% | the toolbar's zoom buttons |
| go back to 100% | click the zoom's percentage in the toolbar |

The zoom goes from 25% to 500%. It scales the document, not the toolbar or the rest of the
page; the browser's own page zoom is not touched by Ctrl and the wheel over the document.

## 26. Keyboard reference

**Formats and paragraphs**

| Keys | What they do |
| --- | --- |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+\` | Inline code |
| Ctrl+K | A link |
| Ctrl+1 to Ctrl+6 | Heading 1 to 6 (Ctrl+Alt+1 to 6 too) |
| Ctrl+0 | A paragraph (Ctrl+Alt+0 too) |
| Ctrl+= | One heading level deeper (a paragraph becomes Heading 1) |
| Ctrl+- | One heading level higher (Heading 1 becomes a paragraph) |
| Ctrl+Shift+7 | Numbered list |
| Ctrl+Shift+8 | Bullet list |
| Ctrl+Shift+9 | Task list |
| Ctrl+Alt+Q | Quote |
| Ctrl+Alt+C | Code block |
| Ctrl+Alt+L | Horizontal line |

**Writing**

| Keys | What they do |
| --- | --- |
| Enter | A new paragraph; in a list, a new item; on an empty item, out of the list; in a table, a new row |
| Shift+Enter | A line break in the paragraph |
| Tab, Shift+Tab | At the start of an item's text: a level in or out; at the start of a heading's text: a level deeper or higher; in a table: the next or previous cell; elsewhere: a tab |
| Backspace, Delete | The character before or after; at a block's edge, its syntax off, or a join |
| Ctrl+Backspace, Ctrl+Delete | The word before or after |
| Ctrl+Z | Undo |
| Ctrl+Y, Ctrl+Shift+Z | Redo |
| Ctrl+C, Ctrl+X, Ctrl+V | Copy, cut, paste (as Markdown) |
| Shift+Delete | Cut |
| Ctrl+Shift+V | Paste |

**Moving and viewing**

| Keys | What they do |
| --- | --- |
| Arrows, Home, End, Page Up, Page Down | Move (chapter 9); with Shift, select |
| Ctrl+Left, Ctrl+Right | A word back or on |
| Ctrl+Home, Ctrl+End | The start or end of the document |
| Ctrl+A | Select all |
| Escape | Drop the selection |
| Escape, then Tab or Shift+Tab | Leave the editor (Tab alone is the editor's) |
| On a Mac: Cmd+Left, Cmd+Right | The start or end of the line; with Shift, select |
| On a Mac: Cmd+Up, Cmd+Down | The start or end of the document; with Shift, select |
| On a Mac: Cmd+Backspace, Cmd+Delete | Delete to the start or the end of the line |
| Alt+F10 | To the toolbar (Escape comes back) |
| Shift+Alt+F1 | Screen reader mode on or off (chapter 8) |
| Ctrl+Shift+R | The raw Markdown view on or off |
| Ctrl and the mouse wheel | Zoom |

**Why these keys.** They are MaxPad's, the Windows editor this one follows, except where a
browser keeps a key for itself: Ctrl+Shift+T, Ctrl+Shift+Q, Ctrl+Shift+C, Ctrl+\[ and
Ctrl+\] are the browser's, so the lists are on the keys Google Docs uses (Ctrl+Shift+7, 8
and 9) and the quote, the code block and the line on Ctrl+Alt. The editor takes Ctrl+Shift+R
while it has the focus, so the browser does not reload the page.

------

# Part II: Building it into a page

Everything in this part is in `src/index.js`:

```js
import {
  MarkdownEditor, DEFAULT_TOOLBAR, LIGHT_THEME, DARK_THEME,
} from './src/index.js';
```

Importing it also defines the `<markdown-editor>` element (chapter 36).

## 27. Options

`new MarkdownEditor(target, options)`. Every option may be left out.

| Option | Default | What it is |
| --- | --- | --- |
| `markdown` | `''` | The document to start with. |
| `theme` | `'light'` | `'light'`, `'dark'`, or a theme object (chapter 35). |
| `toolbar` | `true` | `true` for the whole toolbar, `false` for none, or a list of items and your own buttons (chapter 31). |
| `readOnly` | `false` | The document can be read, selected and copied, not changed (chapter 34). |
| `revealSyntax` | `true` | Show the syntax at the caret. `false` never shows it. |
| `revealUnfocused` | `false` | Show the syntax at the caret while the editor does not have the focus too. |
| `showFormattingMarks` | `false` | ¶ at each paragraph's end, ↵ at each line break. |
| `showParagraphNumbers` | `false` | Each paragraph's number, left of the text. |
| `showParagraphTypes` | `false` | Each paragraph's type, left of the text. |
| `showOutline` | `false` | Collapsible headings: the triangles beside them (chapter 24). |
| `screenReader` | `'auto'` | Screen reader mode (chapter 8): `'on'`, `'off'`, or `'auto'`, on with a mouse and off on a touch screen. Also a property. |
| `rawMode` | `false` | Start in the raw Markdown view. |
| `imageBase` | the page | The URL that relative picture addresses are read from (chapter 33). |
| `openLinks` | `true` | Ctrl+click opens a web or e-mail link in a new tab. |
| `prompt` | `window.prompt` | `async (question, value) => answer`: asks for a link's or a picture's address (chapter 32). |
| `onChange` | | `(editor) => {}`, called after every change, as the `change` event. |
| `label` | `'Markdown editor'` | The name screen readers give the editor. |
| `padding` | `[16, 24, 24, 24]` | The room around the text, in px: top, right, bottom, left (as CSS). |

A note-taking editor with a short toolbar and the paragraph numbers on:

```js
const notes = new MarkdownEditor('#notes', {
  markdown: localStorage.getItem('notes') ?? '',
  toolbar: ['undo', 'redo', '|', 'block', '|', 'strong', 'em', '|',
    'bullet', 'task', '|', 'numbers'],
  showParagraphNumbers: true,
  onChange: (editor) => localStorage.setItem('notes', editor.value),
});
```

Most options are properties too, which can be changed at any time: `readOnly`, `theme`,
`imageBase`, `rawMode`, `showFormattingMarks`, `showParagraphNumbers`,
`showParagraphTypes`, `showOutline`, `toolbarItems` (the toolbar) and `zoom`.

```js
editor.readOnly = true;
editor.theme = 'dark';
editor.showParagraphNumbers = true;
editor.zoom = 1.25;   // 125%
```

## 28. The document: value, version and selection

| Member | What it is |
| --- | --- |
| `value` | The Markdown, in the document's own line endings. Setting it loads a new document: the caret at the start, the undo history cleared, the raw view left. |
| `getMarkdown()`, `setMarkdown(text)` | The same as reading and setting `value`. |
| `version` | A number that changes with every change of the document. |
| `selection` | `{ anchor, caret }`: where the selection starts and where the caret is, as offsets in the Markdown. |
| `select(anchor, caret)` | Selects from `anchor` to `caret` (or puts the caret at `anchor`), and scrolls it into view. |
| `blockType` | The type of the paragraph at the caret (below). |
| `paragraphNumber` | The number of the paragraph at the caret, as the paragraph numbers count: for a status bar. |
| `focus()` | Gives the editor the focus. |
| `focusToolbar()` | Gives the toolbar the focus, at its button last used (Alt+F10; chapter 8). |
| `destroy()` | Takes the editor out of the page. |

**Offsets** count the characters of the Markdown from 0, with each line ending counted as one
character ("\n"), whatever the document's own line endings are.

```js
editor.value = 'Hello, world.';
editor.select(7, 12);          // selects "world"
editor.selection;              // { anchor: 7, caret: 12 }
editor.select(13);             // the caret at the end
```

A selection made backward, from right to left, has its `anchor` after its `caret`.

**`blockType`** is one of `'paragraph'`, `'h1'` to `'h6'`, `'bullet'`, `'number'`,
`'task'`, `'quote'`, `'code'`, `'table'`, `'rule'`, `'html'`, `'blank'` (an empty
paragraph), and `'markdown'` in the raw view.

**Unsaved changes.** Keep the `version` you saved:

```js
let saved = editor.version;
const isUnsaved = () => editor.version !== saved;

saveButton.addEventListener('click', async () => {
  await upload(editor.value);
  saved = editor.version;
});
```

## 29. Commands

Each of these does what its key or toolbar button does. They do nothing in a read-only
document or in the raw Markdown view.

| Method | What it does |
| --- | --- |
| `toggleInline(format)` | `'strong'`, `'em'`, `'underline'`, `'strike'`, `'code'`, `'sub'` or `'sup'`, on or off (chapter 12). |
| `isInline(format)` | Whether the selection (or the caret) is in that format. |
| `setBlockType(type)` | The paragraphs the selection touches made `'paragraph'`, `'h1'` to `'h6'`, `'quote'`, `'bullet'`, `'number'`, `'task'` or `'code'`; the same type again makes them paragraphs. |
| `setHeadingLevel(level)` | Headings of `level` 1 to 6, or paragraphs for 0. Not a switch. |
| `stepHeadingLevel(by)` | One level deeper (`1`) or higher (`-1`). |
| `insertTable(columns, rows)` | A table after the paragraph (3 and 2 if not given). |
| `insertRule()` | A horizontal line after the paragraph. |
| `insertCodeBlock(language)` | An empty block of code after the paragraph, with its language; with a selection, the selected paragraphs in a block. |
| `insertLink(address, title)` | The selection made a link to `address` (with a title, if given); in a link, its address changed instead, and an empty address takes the link away (chapter 17.2). |
| `insertImage(address, description)` | A picture at the caret. The description is text (a `]` in it is written `\]`), and an address with a space, a parenthesis or an angle bracket is written in angle brackets, as a link's is. |
| `promptLink()`, `promptImage()` | Ask for the address (chapter 32), then as above. |
| `undo()`, `redo()` | A step back or forward. `canUndo` and `canRedo` say whether there is one. |
| `toggleRawMode()` | The raw Markdown view on or off (also the `rawMode` property). |
| `collapseAll()`, `expandAll()` | Fold every heading (only with `showOutline` on), or open them all. |
| `zoomIn()`, `zoomOut()`, `resetZoom()` | 10% larger, smaller, or 100%. |
| `execute(name)` | Any of these by its toolbar name (below). |

`execute(name)` runs a command by name, as the toolbar does: `'undo'`, `'redo'`,
`'strong'`, `'em'`, `'underline'`, `'strike'`, `'code'`, `'sub'`, `'sup'`,
`'paragraph'`, `'h1'` to `'h6'`, `'quote'`, `'bullet'`, `'number'`, `'task'`,
`'codeblock'`, `'rule'`, `'table'`, `'link'`, `'image'`, `'marks'`, `'numbers'`,
`'types'`, `'outline'`, `'raw'`, `'zoomin'`, `'zoomout'`, `'zoom'`, `'collapseAll'` and
`'expandAll'`. An unknown name throws an error.

Examples:

```js
// A heading from a button of the page's own
document.querySelector('#make-title').addEventListener('click', () => {
  editor.setHeadingLevel(1);
  editor.focus();
});

// A 4 x 3 table
editor.insertTable(4, 3);

// A code block for Python
editor.insertCodeBlock('python');

// The word at the caret as code
editor.toggleInline('code');

// The selection as a link, with a title
editor.insertLink('https://commonmark.org', 'CommonMark');

// Whatever a menu item names
menu.addEventListener('select', (event) => editor.execute(event.detail));
```

A button of the page's own takes the focus when it is clicked: call `editor.focus()` after
the command, or make the button not take it (`mousedown` → `preventDefault()`), as the
editor's own buttons do. Buttons in the editor's toolbar (chapter 31) do this by themselves.

## 30. Events

The editor is an `EventTarget`: `editor.addEventListener(name, listener)`.

| Event | When | `event.detail` |
| --- | --- | --- |
| `change` | after every change of the document | |
| `selectionchange` | after the caret or the selection moves | |
| `modechange` | after the raw Markdown view is switched on or off | |
| `zoomchange` | after the zoom changes | |
| `toolbarclick` | after a click on a button of the page's own in the toolbar | `name`, `item` |
| `linkclick` | on a Ctrl+click on a link; cancelable | `href`, `title` |
| `clipboardunavailable` | when Shift+Delete or Ctrl+Shift+V could not use the clipboard (the browser did not allow the page to write or read it): nothing was cut or pasted | |

A status bar, as the demo's:

```js
const status = document.querySelector('#status');

function showStatus() {
  const words = editor.value.split(/\s+/).filter(Boolean).length;
  const where = editor.paragraphNumber
    ? `paragraph ${editor.paragraphNumber} · ` : '';
  status.textContent = `${where}${editor.blockType} · ${words} words`;
}

editor.addEventListener('change', showStatus);
editor.addEventListener('selectionchange', showStatus);
editor.addEventListener('modechange', showStatus);
showStatus();
```

`change` comes once for each change, after the document has changed: reading `value` in it
gives the new document.

## 31. The toolbar: choosing items, adding your own

### 31.1 Choosing the editor's items

`toolbar: true` shows `DEFAULT_TOOLBAR`:

```js
['undo', 'redo', '|', 'block', '|', 'strong', 'em', 'underline', 'strike',
  'code', '|', 'quote', 'bullet', 'number', 'task', 'codeblock', '|', 'link',
  'image', 'table', 'rule', '|', 'marks', 'numbers', 'types', 'raw', '|',
  'zoomout', 'zoom', 'zoomin']
```

`'|'` is a separator. A list of your own shows those items, in that order. Appendix D says
what each one is. One more item, `'outline'` (collapsible headings on and off), is not in
the default list: a page that wants to offer it adds it.

```js
// Only the formats
new MarkdownEditor('#comment', {
  toolbar: ['strong', 'em', 'code', '|', 'link', 'bullet'],
});

// The default toolbar, and the outline at the end
new MarkdownEditor('#book', {
  toolbar: [...DEFAULT_TOOLBAR, '|', 'outline'],
  showOutline: true,
});

// The default toolbar without the view buttons
const formatting = DEFAULT_TOOLBAR.filter(
  (item) => !['marks', 'numbers', 'types', 'raw'].includes(item));
new MarkdownEditor('#simple', { toolbar: formatting });

// No toolbar
new MarkdownEditor('#bare', { toolbar: false });
```

`toolbarItems` is the list, to read or to set at any time; setting it builds the toolbar
again.

```js
editor.toolbarItems = ['undo', 'redo'];
editor.toolbarItems = DEFAULT_TOOLBAR;
editor.toolbarItems = [];   // no toolbar
```

### 31.2 Adding buttons of your own

A button of your own is an object in the list, beside the editor's names:

| Field | What it is |
| --- | --- |
| `name` | A name of your own, given back in the `toolbarclick` event. |
| `title` | The button's tooltip, and its name for screen readers. |
| `icon` | An SVG: a whole `<svg>` element, or what goes inside a 24 x 24 one drawn in strokes, as the editor's icons are. |
| `label` | Text, for a button with no icon. |
| `onClick(editor, event)` | What a click does. |
| `pressed(editor)` | `true` or `false`: the button is a switch, shown pressed or not. |
| `enabled(editor)` | `false` while it cannot be clicked. |
| `keepFocus` | `false` to leave the focus where the click put it (the editor takes it back by default). |

It looks like the editor's buttons, the caret stays in the editor, and `pressed` and
`enabled` are asked again whenever the toolbar is brought up to date: after every change and
every move of the caret.

A Save button, off while there is nothing to save:

```js
let saved = 0;
const saveButton = {
  name: 'save',
  title: 'Save (Ctrl+S)',
  icon: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8V3"/>' +
    '<rect x="8" y="13" width="8" height="5"/>',
  enabled: (editor) => editor.version !== saved,
  onClick: async (editor) => {
    await upload(editor.value);
    saved = editor.version;
    editor.refreshToolbar();
  },
};

const editor = new MarkdownEditor('#editor', {
  toolbar: [saveButton, '|', ...DEFAULT_TOOLBAR],
});
saved = editor.version;
editor.refreshToolbar();
```

A switch, as the demo's read-only button:

```js
const lock = {
  name: 'readonly',
  title: 'Read-only',
  icon: '<rect x="4" y="11" width="16" height="10" rx="2"/>' +
    '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pressed: (editor) => editor.readOnly,
  onClick: (editor) => (editor.readOnly = !editor.readOnly),
};
```

Buttons with text, for subscript and superscript:

```js
const sub = { label: 'x₂', title: 'Subscript',
  onClick: (editor) => editor.toggleInline('sub') };
const sup = { label: 'x²', title: 'Superscript',
  onClick: (editor) => editor.toggleInline('sup') };

new MarkdownEditor('#editor', {
  toolbar: [...DEFAULT_TOOLBAR.slice(0, 10), sub, sup,
    ...DEFAULT_TOOLBAR.slice(10)],
});
```

(The first ten items of the default list end with the inline code button.)

An icon may be a whole SVG of your own, in colors of its own:

```js
const star = {
  name: 'star', title: 'Star this note',
  icon: '<svg viewBox="0 0 24 24"><path fill="gold" stroke="none" ' +
    'd="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>',
  onClick: () => toggleStar(),
};
```

When the state that `pressed` or `enabled` reads changes outside the editor, call
`editor.refreshToolbar()` to show it.

Every click on a button of your own also raises `toolbarclick`, so one listener can handle
all of them:

```js
editor.addEventListener('toolbarclick', (event) => {
  analytics.track('toolbar', event.detail.name);
});
```

## 32. Asking for addresses

The link and picture commands ask for an address with the browser's `window.prompt`. Give
the `prompt` option to ask in a dialog of your own. It is called with the question and the
value to start with, and returns the answer (or a promise of it); `null` or an empty answer
cancels.

```html
<dialog id="ask">
  <form method="dialog">
    <label><span id="ask-question"></span> <input id="ask-value"></label>
    <button value="ok">OK</button>
    <button value="cancel" formnovalidate>Cancel</button>
  </form>
</dialog>
```

```js
const dialog = document.querySelector('#ask');

function ask(question, value) {
  document.querySelector('#ask-question').textContent = question;
  const input = document.querySelector('#ask-value');
  input.value = value;
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'ok' ? input.value : null);
    }, { once: true });
  });
}

const editor = new MarkdownEditor('#editor', { prompt: ask });
```

The questions are `'Link address:'` (starting with `https://`, or the address of the link the
caret is in) and `'Picture address:'`. An answer of just `https://` makes no link; an empty
answer, with the caret in a link, takes the link away.

A picture picker of your own, that uploads a file and gives its address:

```js
const editor = new MarkdownEditor('#editor', {
  prompt: async (question, value) => {
    if (question !== 'Picture address:') return window.prompt(question, value);
    const file = await pickFile('image/*');   // your own file picker
    if (!file) return null;
    return uploadAndGetUrl(file);            // your own upload
  },
});
```

## 33. Links and pictures

**Links.** A Ctrl+click on a link raises `linkclick`, with the link's `href` and `title`.
Unless a listener calls `preventDefault()`, a link to `http:`, `https:` or `mailto:` opens in
a new tab; other links do nothing. `openLinks: false` opens none.

Links between the pages of an application, handled by its own router:

```js
editor.addEventListener('linkclick', (event) => {
  const { href } = event.detail;
  if (href.startsWith('/') || href.startsWith('#')) {
    event.preventDefault();
    router.navigate(href);
  }
});
```

**Pictures.** A picture with a relative address (`images/cat.png`) is loaded from
`imageBase`, or from the page's own address when there is none. Set it to where the
document's pictures are, usually the folder the document came from:

```js
const url = new URL('docs/guide.md', location.href);
editor.value = await (await fetch(url)).text();
editor.imageBase = new URL('./', url).href;   // docs/
```

A whole address (`https://...`, `data:...`) is loaded as it is, and one that starts with `/`
from the site's root. The `<markdown-editor>` element's `src` sets the base to the file's
folder by itself.

## 34. Read-only documents

`readOnly: true` (or `editor.readOnly = true`) makes the document one that is read, not
changed: no typing, no formats, no undo or redo (by key, by button, by the browser's Edit
menu, or by `undo()` and `redo()`). Selecting and copying still work, Ctrl+click still
follows links, and the view buttons (marks, numbers, types, the raw view, the zoom) still
work. The syntax at the caret is not shown, so the document reads as formatted text.

The undo history is kept: an editor made read-only and then editable again undoes what was
done before.

A viewer for Markdown, with no toolbar:

```js
new MarkdownEditor('#preview', {
  markdown: article,
  readOnly: true,
  toolbar: false,
});
```

A page that shows a document and lets its owner edit it:

```js
editButton.addEventListener('click', () => {
  editor.readOnly = !editor.readOnly;
  editButton.textContent = editor.readOnly ? 'Edit' : 'Done';
  if (!editor.readOnly) editor.focus();
});
```

## 35. Looks: themes and stylesheets

The look of the document comes from a stylesheet the editor puts in the page. There are
three ways to change it, from the simplest:

1. **A theme**: `'light'`, `'dark'`, or an object of values over one of them.
2. **Custom properties** in your own CSS: `--mde-heading-color` and the rest.
3. **Rules of your own** for the editor's classes: `.mde-content-h1` and the rest.

### 35.1 Themes

```js
new MarkdownEditor('#editor', { theme: 'dark' });

editor.theme = 'light';

// A few values of your own, over the light theme
editor.theme = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 18,
  headingColor: '#8b0000',
  linkColor: '#2e7d32',
};

// Over the dark theme
editor.theme = { base: 'dark', linkColor: '#ffcc00' };
```

A theme object needs only the values it changes. Appendix C lists them all; `LIGHT_THEME`
and `DARK_THEME` hold the two themes' values.

The theme also colors the editor's frame and toolbar, from its background, text and link
colors.

The dark theme when the system is dark:

```js
const dark = matchMedia('(prefers-color-scheme: dark)');
const followSystem = () => (editor.theme = dark.matches ? 'dark' : 'light');
dark.addEventListener('change', followSystem);
followSystem();
```

### 35.2 The document's width

The document is at most 720 px wide at 100% (45 times the font size) and centered in the
editor; a wider editor has room on either side. To change it:

```js
editor.theme = { documentWidth: 900 };   // at most 900 px
editor.theme = { documentWidth: 0 };     // as wide as the editor
editor.theme = { centered: false };      // at the left
```

Or in your CSS:

```css
.mde-content { --mde-document-width: 40em; }   /* in em, it zooms */
.mde-content-page { margin: 0; }               /* at the left */
```

### 35.3 Your own stylesheet

The editor's stylesheet is in a CSS cascade layer of its own, `mde`. **Any rule of your own
stylesheet, outside a layer, wins over it**, however simple its selector: restyle only what
you want, and the rest stays as it is.

```css
/* Red, larger first headings with no line under them */
.mde-content-h1 { font-size: 2.4em; color: #8b0000; border-bottom-width: 0; }

/* Links in green */
.mde-content { --mde-link-color: #2e7d32; }

/* Inline code in a frame */
.mde-content-code { border: 1px solid #ccc; }

/* Quotes in italics */
.mde-content-in-quote { font-style: italic; }

/* More room between paragraphs */
.mde-content-p { margin-bottom: 1em; }

/* Table headings in the heading color */
.mde-content-table-header { color: var(--mde-heading-color); }
```

**Use em for sizes**, as the editor's own stylesheet does: they grow and shrink with the
zoom. A size in px stays the same at every zoom.

**The classes.** The editor's content is `.mde-content` (with `.mde-dark` in the dark
theme). Each paragraph is `.mde-content-para` and one of its kind: `.mde-content-p`,
`.mde-content-h1` to `-h6`, `.mde-content-bullet`, `.mde-content-code-block`... Runs of text
are `.mde-content-code`, `.mde-content-link`, `.mde-content-strike`... Appendix B lists them
all.

**The custom properties** are set on `.mde-content`: the theme's colors and fonts
(`--mde-heading-color`, `--mde-font-family`...), `--mde-font-size` (the base size, 16px),
`--mde-document-width` and others (appendix C). Set them there, or on an element around the
editor:

```css
.mde-content {
  --mde-font-family: "Iowan Old Style", Georgia, serif;
  --mde-font-size: 17px;
  --mde-heading-color: #333;
  --mde-code-background: #fdf6e3;
}

.mde-content.mde-dark {
  --mde-heading-color: #ddd;
}
```

A value given in a theme object wins over the same custom property in a stylesheet.

**The frame and the toolbar** are `.mde` and `.mde-toolbar`. Their rules are not in the
layer, so yours need a more specific selector, such as the element's id:

```css
#editor .mde { border: none; border-radius: 0; }
#editor .mde-toolbar { background: transparent; }
```

**Two editors that look different**: put them in elements of their own and scope the rules.

```css
#notes .mde-content { --mde-font-size: 14px; }
#article .mde-content-h1 { font-family: Georgia, serif; }
```

The editor's stylesheet is also exported, as text (`MARKDOWN_CSS`), with
`injectMarkdownStylesheet()` that puts it in the page, for a page that wants to see it or
put it in itself.

## 36. The markdown-editor element

`<markdown-editor>` is the editor as an element of the page, for pages written in HTML. It
is defined when `src/index.js` is imported (or `src/element.js`).

```html
<script type="module" src="./src/index.js"></script>
```

### 36.1 Its Markdown

The first of these that it has:

1. its `value` attribute: `<markdown-editor value="# Hello">`;
2. a `<script type="text/markdown">` or a `<template>` inside it;
3. its own text.

Of what is inside it, the first and last blank lines are taken off, and the indentation its
lines share.

A `<script type="text/markdown">` keeps the Markdown exactly as written. A `<template>` is
read by the page's HTML parser first: its text comes back as written (`>`, `&`, `<` and the
HTML in it), but an entity such as `&lt;` comes back as `<`, and an autolink such as
`<https://example.com>` is taken for an HTML tag.

```html
<markdown-editor style="height: 240px">
  <script type="text/markdown">
    # A title

    Some *text*.
  </script>
</markdown-editor>
```

Or a file, with `src`:

```html
<markdown-editor src="notes/today.md" style="height: 60vh"></markdown-editor>
```

### 36.2 Attributes

| Attribute | What it does |
| --- | --- |
| `name` | Its name as a field of a form. |
| `src` | A Markdown file to load; its folder is where its pictures are loaded from. |
| `value` | The Markdown to start with. |
| `theme` | `light` or `dark`. |
| `toolbar` | `false` for none, or the names of the items wanted, in order, separated by spaces or commas: `toolbar="undo redo \| strong em"`. |
| `readonly` | Read-only (chapter 34). |
| `image-base` | Where relative picture addresses are loaded from. |
| `paragraph-numbers` | The paragraph numbers on. |
| `paragraph-types` | The paragraph types on. |
| `outline` | Collapsible headings on. |
| `screen-reader` | `auto` (the default), `on` or `off`: screen reader mode (chapter 8). |

Changing an attribute (except `name` and `value`) changes the editor at once:

```js
const element = document.querySelector('markdown-editor');
element.setAttribute('theme', 'dark');
element.toggleAttribute('readonly');
element.setAttribute('src', 'notes/tomorrow.md');
```

### 36.3 Properties, events and forms

- `value`: the Markdown; set it to load another document.
- `editor`: the `MarkdownEditor` inside it, for everything in Part II.
- `form` and `name`: its form and its name.
- `focus()`: gives it the focus.
- Events, which bubble: `input` and `change` after every change the user makes (as a
  `<textarea>`'s, not when a script sets `value`, a form is reset or a `src` file arrives:
  `element.editor`'s own `change` is raised for those too), and `linkclick` (as in
  chapter 33).

```js
const element = document.querySelector('markdown-editor[name="body"]');

element.addEventListener('change', () => {
  preview.textContent = element.value;
});

element.editor.theme = { base: 'dark', fontSize: 15 };
element.editor.toolbarItems = [...DEFAULT_TOOLBAR, '|', 'outline'];
```

In a form, it is submitted under its `name` with its Markdown, as a `<textarea>` is; a reset
of the form brings back the Markdown it started with (its `value` attribute, what is written
in it, or its `src` file), as a `<textarea>` goes back to its text.

```html
<form id="post">
  <markdown-editor name="body" toolbar="strong em link | bullet number"
                   style="height: 200px"></markdown-editor>
  <button>Send</button>
</form>

<script type="module">
  document.querySelector('#post').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    console.log(data.get('body'));   // the Markdown
  });
</script>
```

## 37. Recipes

### 37.1 Save as you type

```js
const KEY = 'draft';
const editor = new MarkdownEditor('#editor', {
  markdown: localStorage.getItem(KEY) ?? '# New draft\n',
});

let timer = 0;
editor.addEventListener('change', () => {
  clearTimeout(timer);
  timer = setTimeout(() => localStorage.setItem(KEY, editor.value), 500);
});
```

### 37.2 A warning before leaving with unsaved changes

```js
let saved = editor.version;
window.addEventListener('beforeunload', (event) => {
  if (editor.version !== saved) event.preventDefault();
});
```

### 37.3 Ctrl+S to save

The editor's text view has a map of keys, `editor.view.keymap`, keyed by the chord as
`'Ctrl+S'`, `'Ctrl+Shift+S'` or `'Alt+Enter'`. A key bound there is the page's: the browser
does not save the page.

```js
editor.view.keymap.set('Ctrl+S', () => {
  save();
});
```

A key bound there replaces the editor's own key of that chord, if it had one. (Return
`false` from the function to let the key go on to the editor and the browser.)

### 37.4 Download the document as a file

```js
function download(filename = 'document.md') {
  const blob = new Blob([editor.value], { type: 'text/markdown' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

### 37.5 Open a file from the computer

```html
<input type="file" id="open" accept=".md,.markdown,.txt">
```

```js
document.querySelector('#open').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) editor.value = await file.text();
});
```

### 37.6 Insert text at the caret

The commands of chapter 29 write Markdown of their own. To put text of yours in the
document, as one undo step, use the controller underneath (`editor.controller`): its
`replace(start, end, text)` replaces a stretch of the Markdown.

```js
function insertAtCaret(markdown) {
  if (editor.readOnly || editor.rawMode) return;
  const { anchor, caret } = editor.selection;
  const start = Math.min(anchor, caret), end = Math.max(anchor, caret);
  editor.controller.replace(start, end, markdown);
  editor.focus();
}

insertAtCaret(`*Signed, ${user.name}, ${new Date().toLocaleDateString()}*`);
```

The text is read as Markdown: a `**name**` inserted this way is bold.

### 37.7 A comment box

A small editor with a few formats, as a field of a form:

```html
<markdown-editor name="comment" toolbar="strong em code link bullet"
                 style="height: 180px"></markdown-editor>
```

### 37.8 Several editors on one page

Each `new MarkdownEditor` is an editor of its own, with its own document, history, toolbar
and options. They share the stylesheet. Only the editor with the focus shows the syntax at
its caret.

```js
const editors = [...document.querySelectorAll('.md-field')].map(
  (element) => new MarkdownEditor(element, {
    markdown: element.dataset.markdown ?? '',
    toolbar: ['strong', 'em', 'link'],
  }));
```

### 37.9 Show the Markdown beside the editor

```js
const source = document.querySelector('#source');   // a <pre>
const show = () => (source.textContent = editor.value);
editor.addEventListener('change', show);
show();
```

### 37.10 A long document

The editor lays out only the paragraphs near what is in view, and reads again only the part
of the document an edit can change: in a document of 170 KB (6,400 lines), a key takes a few
milliseconds. Nothing needs to be done for it.

## 38. Limits and what is not done yet

- **Browsers.** Tried in Chrome. Firefox, Safari, the keyboards of phones and tablets, and
  input methods (for Chinese, Japanese, Korean...) have not been tried, though the code for
  them is there. On a Mac, Cmd should do what Ctrl does, and Cmd with the arrows, Backspace
  and Delete what a Mac's do (chapter 26); that has been tried only by a test, not on a Mac.
  Screen reader mode (chapter 8) has been tried by tests, not yet with a screen reader.
- **Tables:** no commands to add or delete columns, delete rows or set alignment; use the
  raw Markdown view.
- **Code is not colored** by its language.
- **Pictures** cannot be pasted or dropped in; text cannot be dragged and dropped. A file
  dropped on the editor is refused, so that the browser does not open it in place of the
  page. A page that takes drops on the editor itself (to upload a picture, say) listens for
  `dragover` on an element round it, sets `event.dataTransfer.dropEffect` to `'copy'` there,
  and is then given the `drop`.
- **Pasting** takes the clipboard's plain text: formats copied from a web page or a word
  processor are not turned into Markdown.
- **No find and replace**, spelling, or export yet.
- **Mixed line endings:** a document whose lines end in more than one way is saved with the
  line ending of its first line.

## 39. Troubleshooting

**Nothing shows, or the editor is a thin strip.** The element it is in has no height: give it
one (chapter 3). A `height: 100%` needs a parent with a height too.

**The page is blank, and the console says the module could not be loaded.** The page was
opened as a file (`file://`). Serve it with a web server (chapter 2). Also check the path in
the `import`.

**`MarkdownEditor: no element to put the editor in.`** The selector found nothing: the
script ran before the element was in the page, or the selector is wrong. A
`<script type="module">` runs after the page is read, so put the element before it.

**The syntax does not show at the caret.** The editor does not have the focus (click in it),
or it is read-only, or the page gave `revealSyntax: false`.

**Ctrl+1 switches the browser's tab.** Some browsers keep Ctrl+1 to Ctrl+6. Use Ctrl+Alt+1 to
Ctrl+Alt+6, or the toolbar's list.

**A picture does not show.** Its address is relative and the editor looks for it in the
wrong place: set `imageBase` (chapter 33). Check the address in the browser's network
panel.

**Ctrl+click on a link does nothing.** It is not a web or e-mail address (a relative or
`#` link opens nothing by itself: handle `linkclick`), or the page gave `openLinks: false`,
or a pop-up blocker stopped the new tab.

**My CSS does not change the editor.** For the document's look, check the class (appendix B)
in the browser's element inspector: each paragraph shows its classes there. For the frame
and the toolbar, use a more specific selector (chapter 35.3). A theme object's value wins
over the same custom property in a stylesheet.

**The text pasted in has lost its formatting.** Pasting takes plain text. Formatting copied
from this editor or another Markdown document is Markdown, and is kept.

**Typing `*` made the following text italic.** A `*` that pairs with another is emphasis.
Type `\*` for a star.

------

# Appendices

## A. Markdown reference

What the editor reads and writes: CommonMark, and these extensions of MaxPad's: tables, task
lists, front matter, underline, strikethrough, subscript and superscript.

| To get | Write |
| --- | --- |
| A heading, level 1 to 6 | `# Title` to `###### Title` |
| A heading, level 1 or 2 (the other way) | `Title` with `===` or `---` on the next line |
| A paragraph | text; a blank line before the next one |
| A line break | `\` at the end of the line (or two spaces) |
| Bold | `**bold**` or `__bold__` |
| Italic | `*italic*` or `_italic_` |
| Bold italic | `***both***` |
| Underline | `==underline==` |
| Strikethrough | `~~strikethrough~~` |
| Subscript | `H~2~O` |
| Superscript | `x^2^` |
| Inline code | `` `code` `` |
| A link | `[text](https://example.com)` |
| A link with a title | `[text](https://example.com "Title")` |
| A reference link | `[text][ref]`, and `[ref]: https://example.com` on a line of its own |
| An address as a link | `<https://example.com>` |
| A picture | `![description](images/picture.png)` |
| A bullet | `- item` (or `* item`, `+ item`) |
| A numbered item | `1. item` (or `1) item`) |
| A task | `- [ ] to do`, `- [x] done` |
| A nested item | the item indented to the text of the one above |
| A quote | `> text` |
| A block of code | ```` ``` ```` (or `~~~`) lines around it, with the language after the first |
| A block of code (the other way) | each line indented by four spaces |
| A horizontal line | `---`, `***` or `___` alone on a line |
| A table | `\| a \| b \|` rows, with `\| --- \| --- \|` under the first |
| Front matter | `---` lines around YAML, at the very start |
| A character that is syntax, as itself | `\` before it: `\*`, `\#`, `\[` |
| HTML | as in HTML; kept and shown as written |

A complete example, which you can paste into the editor:

````markdown
---
title: An example
---

# A heading

A paragraph with **bold**, *italic*, ==underlined==, ~~struck~~ and `code`
text, H~2~O and x^2^, a [link](https://commonmark.org "CommonMark") and
<https://example.com>.\
A second line of the same paragraph.

## Lists

- a bullet
  - a nested bullet
- [ ] a task
- [x] a task done

1. first
2. second

> A quote,
>
> > and a quote in it.

## Code

```js
function hello(name) {
  return `Hello, ${name}!`;
}
```

## A table

| Name | Price |
| :--- | ---: |
| Bread | 2.40 |
| Butter | 3.15 |

---

![A picture](https://commonmark.org/help/images/favicon.png)
````

## B. Stylesheet classes

**The content:** `.mde-content` (and `.mde-dark` in the dark theme) holds the custom
properties; `.mde-content-page` is the document's column, its width and its place.

**Paragraphs.** Every paragraph is `.mde-content-para`, and one of these:

| Class | The paragraph |
| --- | --- |
| `.mde-content-p` | a paragraph |
| `.mde-content-blank` | an empty paragraph |
| `.mde-content-heading` and `.mde-content-h1` to `-h6` | a heading of that level |
| `.mde-content-bullet` | a bullet item |
| `.mde-content-numbered` | a numbered item |
| `.mde-content-task` | a task item |
| `.mde-content-image` | a paragraph that is only a picture |
| `.mde-content-rule` | a horizontal line |
| `.mde-content-code-block` | a line of code (`.mde-content-code-indented` too, without fences) |
| `.mde-content-code-fence` | a fence of a block of code (`.mde-content-code-fence-close` too, the closing one) |
| `.mde-content-html-block` | a line of an HTML block |
| `.mde-content-definition` | a line of link reference definitions |
| `.mde-content-front-matter` | a line of front matter (`.mde-content-front-matter-fence` too, its `---`) |
| `.mde-content-table-header` | a cell of a table's heading row |
| `.mde-content-table-cell` | a cell of a table's other rows |
| `.mde-content-other` | anything else |
| `.mde-content-raw` | a paragraph of the raw Markdown view |

In quotes and lists, a paragraph also has:

| Class | When |
| --- | --- |
| `.mde-content-in-quote` and `.mde-content-q1` to `-q9` | in a quote, at that depth (deeper ones as 9) |
| `.mde-content-in-list` and `.mde-content-l1` to `-l9` | in a list, at that depth |

**Runs of text:**

| Class | The text |
| --- | --- |
| `.mde-content-link` | a link |
| `.mde-content-code` | inline code |
| `.mde-content-underline` | underlined |
| `.mde-content-strike` | struck through |
| `.mde-content-sub`, `.mde-content-sup` | subscript, superscript |
| `.mde-content-html` | inline HTML |
| `.mde-content-syntax` | the syntax shown at the caret |
| `.mde-content-rule-syntax` | a horizontal line's `---`, shown at the caret |
| `.mde-content-concealed` | syntax kept in place but not drawn (an empty item's marker) |
| `.mde-content-task-box` | a task's box (`.mde-content-task-done` too, checked) |

Bold and italic have no classes of their own: they are the text's own `font-weight` and
`font-style`.

**Tables:** `.mde-content-table` is a table, `.mde-content-td` a cell's frame (the cell's text
is a paragraph, above).

**The frame:** `.mde` (the editor), `.mde-toolbar` (the toolbar, its `button`s, `select` and
`.mde-sep` separators), `.mde-body` (what is under the toolbar).

Examples:

```css
/* Second-level headings in small capitals */
.mde-content-h2 { font-variant: small-caps; }

/* A checked task in grey: its whole paragraph */
.mde-content-task:has(.mde-content-task-done) { color: #888; }

/* Blocks of code on a darker background */
.mde-content-code-block, .mde-content-code-fence {
  background-color: #272822; color: #f8f8f2;
}
```

## C. Theme values

The values of a theme object (`theme: { ... }`), the light theme's in the second column,
and the custom property each one sets. Sizes are in px at 100%, and zoom with the text.

| Value | Light theme | Custom property | What it is |
| --- | --- | --- | --- |
| `fontFamily` | `"Segoe UI", system-ui, ...` | `--mde-font-family` | the text's font |
| `fontSize` | `16` | `--mde-font-size` | the text's size, which every other size follows |
| `codeFontFamily` | `Consolas, "Cascadia Mono", ...` | `--mde-code-font-family` | the font of code |
| `color` | `#1f2328` | `--mde-color` | the text |
| `background` | `#ffffff` | `--mde-background` | the background (a dark one, however written, makes the frame and the toolbar dark too) |
| `headingColor` | `#203287` | `--mde-heading-color` | headings, and the lines under them |
| `linkColor` | `#0066cc` | `--mde-link-color` | links, and checked boxes |
| `syntaxColor` | `#808080` | `--mde-syntax-color` | the syntax shown at the caret |
| `quietColor` | `#6a737d` | `--mde-quiet-color` | quotes, fences, definitions, front matter, empty boxes |
| `htmlColor` | `#8250df` | `--mde-html-color` | HTML |
| `codeBackground` | `#f5f6f8` | `--mde-code-background` | blocks of code |
| `codeFrameColor` | `#dddddd` | `--mde-code-frame-color` | the frame of a block of code |
| `inlineCodeBackground` | `#f0f1f3` | `--mde-inline-code-background` | inline code |
| `quoteBarColor` | `#c8cdd4` | `--mde-quote-bar-color` | the bar beside a quote |
| `ruleColor` | `#2032aa` | `--mde-rule-color` | horizontal lines |
| `tableBorderColor` | `#d9dce1` | `--mde-table-border-color` | the lines of a table |
| `tableHeaderBackground` | `#f0f2f5` | `--mde-table-header-background` | a table's heading row |
| `selectionColor` | `rgba(51, 144, 255, 0.28)` | `--mde-selection-color` | the selection |
| `caretColor` | `#000000` | `--mde-caret-color` | the caret |
| `highlightColor` | `rgba(255, 213, 0, 0.45)` | `--mde-highlight-color` | highlighted text |
| `currentLineColor` | `#fffbdd` | `--mde-current-line-color` | the caret's line in the raw view |
| `documentWidth` | `720` | `--mde-document-width` | the document's greatest width; 0 for none |
| `centered` | `true` | `--mde-document-margin` | the document centered, or at the left |
| `listIndent` | `28` | `--mde-list-indent` | the indent of each level of a list |
| `paragraphSpacing` | `8` | `--mde-paragraph-spacing` | the room under a paragraph |
| `headingLines` | `[3, 2, 1, 0.5, 0, 0]` | `--mde-h1-line` to `--mde-h6-line` | the line under each level of heading, 0 for none |
| `paragraphNumberColor` | `#ab2899` | `--mde-paragraph-number-color` | the paragraph numbers |
| `paragraphTypeColor` | `#137a10` | `--mde-paragraph-type-color` | the paragraph types |
| `gutterFontSize` | `12` | (none) | the size of the numbers and types |

The dark theme changes the colors only; `DARK_THEME` has its values.

A sepia theme:

```js
editor.theme = {
  background: '#f4ecd8',
  color: '#3b2f1e',
  headingColor: '#5b3a1a',
  linkColor: '#8a4b08',
  codeBackground: '#ebe0c8',
  inlineCodeBackground: '#e6d9bd',
  quoteBarColor: '#cbb994',
  ruleColor: '#5b3a1a',
  fontFamily: 'Georgia, serif',
  fontSize: 17,
};
```

## D. Toolbar items

The names a `toolbar` list (or the element's `toolbar` attribute) takes:

| Name | The item |
| --- | --- |
| `undo`, `redo` | Undo, Redo |
| `block` | The list of Paragraph and Heading 1 to 6 |
| `strong`, `em`, `underline`, `strike`, `code` | Bold, Italic, Underline, Strikethrough, Inline code |
| `quote`, `bullet`, `number`, `task`, `codeblock` | Quote, Bullet list, Numbered list, Task list, Code block |
| `link`, `image`, `table`, `rule` | Link, Picture, Table, Horizontal line |
| `marks`, `numbers`, `types` | Paragraph marks, Paragraph numbers, Paragraph types |
| `outline` | Collapsible headings on and off (not in the default toolbar) |
| `raw` | The raw Markdown view |
| `zoomout`, `zoom`, `zoomin` | Zoom out, the zoom (a click: 100%), Zoom in |
| `\|` | A separator |
