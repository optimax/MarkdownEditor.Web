# MarkdownEditor.Web — Agent Instructions

## Purpose

This file holds the durable architectural assumptions, development conventions, Markdown
semantics, user requirements and agent working rules of **MarkdownEditor.Web**. Every coding
agent working on this repository reads it completely before changing the project.

Then read `handoff.md`: it describes the current state of the implementation and the next
steps. How the editor works is in `documents/implementation.md`; what it does, for writers and
for the pages that embed it, is in `documents/user-manual.md`.

This file holds rules and decisions that stay stable across sessions. The current source tree
is authoritative where documentation and source disagree.

(It began as a copy of MarkdownTools' `AGENTS.md`, and was made this project's own on
2026-11-11, the user approving the proposal in `TO-DO.md`.)

------

# 1. Project Overview

MarkdownEditor.Web is a WYSIWYG Markdown editor for web pages, as a plain JavaScript component:
`new MarkdownEditor(element, options)`, or the `<markdown-editor>` element, which is a form
field. You edit formatted text; the document stays Markdown.

It is the web counterpart of **MaxPad**, the WPF Markdown editor in MarkdownTools (beside this
repository, `C:\PROJECTS\MarkdownTools`): the same layers, the same rules of what each key
does, and a browser version of the `VirtualTextView` control it is built on. Where MaxPad has
settled a question (an editing rule, a key, a look), follow MaxPad unless a browser makes that
impossible, and say where it differs.

------

# 2. Development Environment

- Plain JavaScript ES modules: no framework, no build step, no dependencies, no transpiler.
  The files in `src/` are what a page imports.
- Browsers: tried in Chrome (the Claude desktop app's browser pane). Firefox, Safari, phones
  and input methods are not tried yet: say so rather than assume.
- Windows 11 is the development machine. `tools/serve.ps1` serves the folder at
  `http://localhost:8765/` with nothing but Windows PowerShell (ES modules are not loaded from
  `file://` pages); `.claude/launch.json` starts it for Claude's browser.

Do not introduce a framework, a bundler, TypeScript, npm packages or any other dependency
unless the user asks for it.

------

# 3. Core Product Principle

**The Markdown source is the authority.** The parse tree (`markdown/parser.js`) is read from
it, the view shows a projection of it (`markdown/projection.js`), and every edit is a change
of the source worked out by a pure function of the source and the selection
(`markdown/commands.js`, `formatting.js`, `blocks.js`), after which the source is read again
and the view given the paragraphs that changed. The view's own editing never runs for
Markdown.

An "open then save" of an *unedited* document is byte-identical, line endings included.

Edited blocks written again keep the author's own stylistic choices (their markers, their
fences, their emphasis characters) wherever the edit does not have to change them.

------

# 4. Markdown Standard

**CommonMark is the authoritative source of Markdown behavior, and Markdig's interpretation
of CommonMark is its reference**, as it is for MaxPad. The extensions are MaxPad's: pipe
tables, task lists, YAML front matter, `==underline==`, `~~strikethrough~~`, `~subscript~`
and `^superscript^`.

When Markdown interpretation is ambiguous, check the CommonMark specification, commonmark.js
(which the parser follows) and Markdig before inventing semantics of the editor's own.

------

# 5. Line Ending Handling

The editor works with CRLF, LF and CR documents alike: it reads them with "\n" and gives the
document back in its own line endings. Be especially careful when translating between:

- view positions (`{ paragraph, index }`) and source offsets,
- a line ending inside a paragraph (one character of the view: a space, or U+2028),
- clipboard text, which may have any line ending,
- `value`, and what the element submits in a form.

------

# 6. Testing

The tests run in the browser: start `tools/serve.ps1` (or the `markdown-editor-web` launch
configuration), then open `http://localhost:8765/test/index.html`.

- `?suites=parser,commands` runs some of the suites; `?steps=150` makes the random test
  (random commands, undone and redone) longer.
- The results are also in `window.testResults` (`passed`, `failed`, `failures`), for a script
  that drives the page.
- Every suite passes before a change is committed. Run the longer random test (`?steps=150`)
  for changes to the parser, the projection, the commands or the controller.
- Timings are only good with the browser pane in sight: a page out of sight runs as a
  background page, several times slower, and with no animation frames at all.
- Do not change a test merely to make a regression appear to pass. When the intended
  behavior has deliberately changed, change the test only after confirming that the new
  behavior is right, and say so.

------

# 7. Regression Discipline

A small change can affect apparently unrelated behavior. Before changing rendering or
editing, inspect every layer it passes through (parser, projection, commands, controller,
view), and consider its effect on:

- the map between the view and the source (caret, selection, syntax shown at the caret),
- Enter, Shift+Enter, Backspace, Delete and Tab, in every kind of block,
- undo and redo,
- the clipboard (copy giving Markdown, paste reading it),
- formatting, inline and by paragraph,
- tables (a cell's pipes),
- the raw Markdown view,
- incremental parsing (a change read again in part must give what a whole reading gives),
- the `<markdown-editor>` element and its form value.

Do not stop after verifying only the originally reported symptom.

------

# 8. Source Modification Rules

These rules are mandatory for coding-agent work.

## Rule 1 — Verify Browser APIs

Check a browser API against what the browsers in use support before using it. Do not provide
an API that is not there and correct it later.

## Rule 2 — Identify File and Function

For every code change delivered directly to chat, identify the exact file path, the class
where useful, and the exact method or function being changed.

## Rule 3 — Complete Replacement Functions

When an existing function must be changed interactively in chat, give the complete
replacement function, not fragments with instructions such as "add this after line X",
unless asked to.

## Rule 4 — Keep Lines Intact

Keep lines of code under about 125 characters, and do not wrap them needlessly.

Keep every line of a Markdown (`.md`) file you write under 96 characters, wrapping prose at
word boundaries; a line that wrapping would break (a table row, a URL) stays as it is. Keep
the lines of a code block inside a Markdown file under 80 characters. When writing a `.md`
file again, make the whole of it comply.

## Rule 5 — One Considered Implementation

Validate the approach before presenting it. Give one considered implementation for each
step rather than proposing code and revising it at once.

## Rule 6 — Inspect Current Source

Always inspect the current source before changing it. Do not assume it matches an earlier
conversation, archive or handoff. The user may change files while you work: watch the files
you are changing.

## Rule 7 — Minimal Changes

Change only the files the requested work needs. Avoid unrelated refactoring, formatting,
renaming and clean-up. Suggest improvements freely, but finish the task at hand first, then
present them and wait for approval.

## Rule 8 — Preserve Existing Behavior

Do not remove or simplify existing features merely to make a new one easier. Ask for the
rationale behind something that seems overkill.

## Rule 9 — Do Not Clobber Changes by Others

Other agents or the user may be changing files at the same time. Never blindly overwrite a
file that changed since you read it: reconcile the differences, or tell the user, describe
the problem, propose solutions and let them decide.

## Rule 10 — Third-Party Code

The editor redistributes nothing of anyone else's. If that ever changes (a dependency, a
copied file), the user decides first, and a `THIRD-PARTY-NOTICES.md` reproducing its license
comes with it.

------

# 9. Documentation

- **`documents/implementation.md`** describes how the editor works. Every change to how it
  works updates it in the same change (2026-11-03, the user: "Keep this document in sync as
  changes are implemented"): a module, a rule of the projection or the editing, a key, an
  option, an event, a test suite, a measured cost.
- **`documents/user-manual.md`** says what the editor does. A change to what a user sees or a
  page uses updates it too; its chapter 38 lists the known limits, and a fix takes its entry
  off.
- **`README.md`** keeps its tables of options, members, events and keys current.

------

# 10. Deliverable Rules

When returning changes as a ZIP:

1. Include only changed files unless the whole project was asked for. A file to be deleted
   is in the archive with `_DELETE` before its extension.
2. Keep the folder hierarchy, with the **MarkdownEditor.Web root folder itself** in the
   archive:

   ```text
   MarkdownEditor.Web.202611111500.zip
   └── MarkdownEditor.Web/
       └── src/
           └── ChangedFile.js
   ```

3. Leave out `.git`, `.claude` (Claude Code's local settings and its worktrees) and
   `node_modules`.

------

# 11. Verification

There is no build. After changing the source:

- run the tests (section 6), and report test failures, and errors in the browser's console,
  separately;
- for what a user sees, look at it in the browser (`demo/index.html`, `demo/element.html`),
  and say what was tried there;
- do not claim interactive behavior was tested unless it was exercised in the browser;
- say what was not tried (another browser, a phone, a screen reader, a Mac).

------

# 12. Things Not to Change Without Asking

- Plain JavaScript with no framework, build step or dependency.
- The source-is-authority design: the projection of the source, edits as changes of the
  source, the view's own editing unused for Markdown.
- The CommonMark baseline and MaxPad's extensions.
- The browser test runner.
- Major keyboard conventions (MaxPad's keys; suggest where a convention differs from what is
  commonly accepted).
- The public API: the options, properties, methods and events of `MarkdownEditor`, and the
  attributes, properties and events of `<markdown-editor>`, beyond additions.
- Rendering the Markdown as HTML (`contenteditable`, `innerHTML` of the document) in place of
  the view.

------

# 13. Starting an Agent Session

Before changing source:

1. Read this `AGENTS.md` completely.
2. Read `handoff.md`, and the sections of `documents/implementation.md` the task touches.
3. Inspect the current source involved in the task, and its tests.
4. Check CommonMark (and Markdig, commonmark.js) for questions of Markdown.
5. Run the tests for a baseline.
6. Treat the current source as authoritative over earlier chats and stale notes.

Do not begin a fix based solely on a previous agent's description of the code.

------

# 14. Ending an Agent Session

Before handing work to another agent, update `handoff.md`: the current objective, the work
completed, the important design decisions, the test results, unresolved bugs, regressions
found, and the recommended next step. Remove what is obsolete, so that it describes the
current state, not a diary. Durable lessons every agent should know belong in this file.

Tell the user of any change you make to this `AGENTS.md`.

------

# 15. Suspending an Agent Session

When running autonomously on a series of tasks and the session reaches 95% of either its
weekly or its hourly limit, keep enough information to go on after the pause, then pause
safely, so that the limits are not breached, unless the user says otherwise. Wait for the
user to resume the session after the limits are lifted.

------

# 16. Committing Changes to git

Work in a git branch of the task's own, its name starting with `claude/`. Commit when the
task is done, to the **local repository only**. **Push only when the user says so**, and
merge into `main` only when the user, or `TO-DO-INSTRUCTIONS.md`, says so (as a
fast-forward: the history stays a straight line).

Commit as `Claude@<machineName>` with the e-mail `claude+<machineName>@anthropic.com` (or the
appropriate agent's name, if you are not Claude), `<machineName>` being the Windows machine's
name. Do not put a `Co-Authored-By:` line, or anything like it, in the commit message.

Git writes the working files with CRLF line endings on checkout: a scripted edit has to allow
`\r\n`.

------

# 17. Authority

When instructions conflict, use this priority:

1. Explicit user instruction for the current task.
2. This `AGENTS.md`.
3. `handoff.md`, for the current state.
4. Existing source conventions.

The current source tree is authoritative regarding what is actually implemented. When a
change would materially alter established behavior, or the desired behavior is not clear,
ask before implementing it.
