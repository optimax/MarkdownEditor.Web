---
Title: TO-DO
---

# TO-DO MarkdownEditor.Web

> **IMPORTANT**: Follow the instructions found in [`TO-DO-INSTRUCTIONS.md`](TO-DO-INSTRUCTIONS.md).
>
---

## Screen Readers and the Keyboard in the Toolbar [QUESTION]

A screen reader reads nothing of the document: the focused text area holds only `''` or a
non-breaking space (`_syncInput`), and the paragraphs drawn are not tied to it. The text at
and around the caret, and its changes, should reach assistive technology. The toolbar
(`role="toolbar"`) makes each of its about 28 buttons a Tab stop; a toolbar is one Tab stop
with the arrow keys moving between its buttons.

Done (commit b843518): the toolbar is one Tab stop, Left and Right (Home, End) go from button
to button, Escape goes back to the text, and Alt+F10 in the text goes to the toolbar; Escape
and then Tab leave the text (Tab alone indents, so the keyboard could not leave it); hidden
syntax is `aria-hidden`, so the paragraphs drawn read as the text they show.

**Q (screen readers at the caret): the way editors such as Monaco reach a screen reader is to
keep the caret's text in the hidden text area -- the caret's paragraph (or a few around it),
as it is shown, the text area's own caret and selection where the view's are -- and to keep
it current at every move and edit, so that a screen reader reads the character, word or line
the caret goes over and what is typed. The risk is the keyboards of phones: they read that
text too, and may correct a word by replacing a stretch of it, which the editor does not
handle yet (it types at its own caret). A browser cannot tell that a screen reader runs. I
propose an option, `screenReader: 'auto' | 'on' | 'off'` ('auto', the default: on where there
is a mouse and a keyboard, off on touch screens), and a key to switch it. Or always on, or off
unless the page turns it on?**

A: As proposed, with the default `auto`.

## AGENTS.md and the Other Files Copied From MarkdownTools [QUESTION]

`AGENTS.md`, `.gitignore` and `TO-DO-INSTRUCTIONS.md` are MarkdownTools' (WPF, .NET, xUnit,
`publish-locally.bat`, building in Release after each task). Which of their rules hold here
is the user's decision (`handoff.md`): say which, and they are adapted.

**Q: I propose this. (1) `AGENTS.md` made this project's own: kept as they are, the source
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
test passing". Do it this way?**

A: Yes, and `.claude/` in it.

# END-OF-TO-DO

