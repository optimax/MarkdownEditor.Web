# Markdown Editor for the Web

This is a **WYSIWYG** Markdown editor: you edit formatted text, and the document stays
*Markdown*. Put the caret inside **bold text** or a [link](https://commonmark.org "CommonMark")
and its syntax shows, ready to edit; move away and it hides again.

## What it does

- Bold, *italic*, ==underline==, ~~strikethrough~~, `inline code`, H~2~O and x^2^
- Lists that go on with Enter, and end with Enter on an empty item
  - nested items, with Tab and Shift+Tab at the start of an item
- [ ] a task to do
- [x] a task done (click its box)

1. Numbered lists
2. count on by themselves

> A quote stays a quote when you press Enter.
> Press Enter twice to leave it.

### Code

```js
// Each line of code is a paragraph of the view.
function greet(name) {
    return `Hello, ${name}!`;
}
```

### Tables

| Key | What it does |
| --- | :--- |
| Ctrl+B | Bold |
| Ctrl+2 | Heading 2 |
| Tab | The next cell |

---

Shift+Enter makes a line break\
inside a paragraph, and the Markdown stays standard: CommonMark, with the extensions
MaxPad uses. Open *Show the Markdown* to watch the source change as you type.
