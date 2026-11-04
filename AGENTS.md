# MarkdownTools — Agent Instructions

## Purpose

This file defines the durable architectural assumptions, development conventions, Markdown semantics, user requirements, and agent working rules for the **MarkdownTools** solution.

It stays generic: it holds what applies to every project in the solution. Requirements that belong to one product, such as how MaxPad edits Markdown, live in the `AGENTS.md` of that product's project (for example `MaxPad\AGENTS.md`).

Every coding agent working on this repository should read this file completely before modifying the project.

If a `HANDOFF.md` file exists, read it after this file. It is the shared handoff: it says how
the handoff files are organized and holds what every agent needs to know. Then read the
`handoff.md` in the folder of the application you are working on (`MaxWrite\handoff.md` or
`MaxPad\handoff.md`): it describes that application's current implementation state and
immediate next steps, so that agents working on the two applications at the same time do not
overwrite each other's instructions. This file contains rules and design decisions that
should remain stable across development sessions.

If a project directory contains a more specific `AGENTS.md`, read that file as well.

The current source tree is authoritative if documentation and source disagree.

------

# 1. Project Overview

MarkdownTools is a suite of Windows desktop tools for working with documents.

The primary application is currently:

- **MaxPad** — a lightweight WYSIWYG Markdown editor. What it is, and its product-specific rules, are in `MaxPad\AGENTS.md`.

The suite also includes:

- **MaxWrite** — a lightweight but capable WYSIWYG document word processor.

MaxWrite is intended to provide a word-processor editing experience for general purpose documents, supporting a multitude of input and output document formats.

------

# 2. Development Environment

Primary environment:

- Windows 11
- Visual Studio 2026
- C#
- WPF
- .NET 10
- Target framework: `net10.0-windows`
- Markdig for Markdown parsing
- xUnit v3 for automated tests
- `Microsoft.Testing.Platform` for test execution
- Our shared libraries `MaxServices.Core` (whose `MaxServices.Core.Shell` is the application shell), `MaxServices.Panes`, `OptimaxTools.Keyboard`, `OptimaxTools.Options` and `OptimaxTools.FontSelection` are NuGet packages made in the Optimax.Shared.Lib repository (beside this one) and kept in `LocalPackages`: change them there, by its rules, not here (`handoff.md`, "Start here", item 6)

Use the solution format already present in the repository.

Do not migrate the application to WinUI, Avalonia, MAUI, Electron, WebView, or another UI technology unless explicitly requested.

Do not suggest Electron as the underlying technology.

Do not introduce an HTML/WebView-based Markdown renderer as a replacement for the WPF renderer.

------

# 3. Core Product Principle

There is no restriction on the transformations required to convert a document file into its WPF presentation (and vice versa).

It is acceptable and, in fact, encouraged to introduce the internal representation of a document as a Document Object Model (DOM) custom-tailored to the needs of the presentation.

**The DOM is the authoritative source of the document.**

Editing the document in memory means manipulating the DOM. Presenting the DOM in a GUI and saving it in the form of a file are two examples of its presentation. There may be other ways of representing the DOM that will be introduced in the future.

An "open then save" of an *unedited* file should remain byte-identical.

Edited blocks re-emitted into a file in a canonical style should keep the author's own stylistic choices, but may change other aspects of the file to conform to the canonical representation.

The DOM in MaxPad and the DOM in MaxWrite do not need to agree. Each is serving a different purpose and is specific to that application.

------

# 4. Markdown Standard

**CommonMark is the authoritative source of Markdown behavior, and Markdig's interpretation of CommonMark is its canonical definition.** This holds wherever any tool in this solution reads or writes Markdown.

When Markdown interpretation is ambiguous, check the CommonMark specification and Markdig behavior before inventing application-specific semantics.

The goal is to behave like standard Markdown wherever practical.

------

# 5. Line Ending Handling

Internally, Markdown editing should not depend on Windows CRLF semantics. The tools that accept markdown should equally work with Windows (CRLF), Linux/Unix convention (LF only), or Mac convention (CR only).

Be especially careful when translating between:

- WPF text positions,
- Markdown source offsets,
- Windows clipboard text,
- files loaded from disk.

------

# 6. Testing Architecture

Tests use:

- xUnit v3,
- Microsoft.Testing.Platform,
- STA execution where required for WPF.

WPF tests must run in an STA context where required.

Use the project's established `StaTest.Run` mechanism rather than inventing another threading mechanism.

------

# 7. Test Execution

The project uses the newer Microsoft.Testing.Platform test experience.

Do not assume older `dotnet test` behavior, adapters, or command-line conventions without checking the current project configuration.

Each `*.Tests` project builds an executable. These commands are known to work here; the second runs one test class, given by its fully qualified name (the runner does not accept `--filter-class`):

```bash
dotnet run --project MaxWrite.Tests -c Release
dotnet run --project OptimaxTools.RichText.Tests -c Release --no-build -- -class OptimaxTools.RichText.Tests.SoftBreakTests
```

After modifying editor semantics:

1. Build the solution.
2. Run the complete test suite: every `*.Tests` project in the solution, not only the one nearest the change.
3. Report failures accurately.
4. Do not change tests merely to make a regression appear to pass.

When a test fails because the intended product behavior has deliberately changed, update the test only after confirming that the new behavior is correct.

It is not necessary to run the complete test suite for changes localized to a particular project. In this case, run that project's tests. In general, you should run only targeted test classes during active development and reserve full suite runs for milestones or when changes touch shared libraries.

------

# 8. Regression Discipline

A small change can affect apparently unrelated behavior even in a different application.

Before modifying rendering or editing behavior, inspect all applicable layers.

When changing code, consider regression effects on:

- caret mapping,
- Enter,
- Shift+Enter,
- Backspace,
- undo/redo,
- clipboard,
- formatting.

A project's own `AGENTS.md` lists further areas that are specific to it.

Do not stop after verifying only the originally reported visual symptom.

Always keep in mind both applications, MaxPad and MaxWrite.

------

# 9. Source Modification Rules

These rules are mandatory for coding-agent work.

## Rule 1 — Verify Version-Sensitive Syntax

Check APIs and syntax against the actual framework/package versions used by the repository.

Do not provide obsolete syntax and correct it later.

## Rule 2 — Identify File and Method

For every code change delivered directly to chat, explicitly identify:

- exact file path,
- class where useful,
- exact method being modified.

## Rule 3 — Complete Replacement Methods

When an existing method must be modified interactively in chat, provide the complete replacement method.

Do not provide fragments with instructions such as:

> Add this after line X.

unless explicitly requested.

## Rule 4 — Keep Code Lines Intact

Do not unnecessarily wrap generated source lines.

Keep generated lines of code to less than approximately 125 characters. This limit is for actual executable code (C#, XAML and the like).

Markdown (`.md`) files that you generate are different: keep every line under 96 characters long, wrapping prose at word boundaries. Where wrapping would break the content (a table row, a URL), leave that line as it is.

Furthermore, any code blocks that you generate inside the markdown files must be kept down to less than 80 characters per line.

When re-generating .md files, you need to make sure each time that they comply with the above rule, and re-wrap them in their entirety to the then-current standard, since they may have been changed or they reflect legacy standards.

## Rule 5 — One Considered Implementation

Validate the approach before presenting it.

Provide one considered implementation for each development step rather than proposing code and immediately revising it.

## Rule 6 — Inspect Current Source

Always inspect the current source before making changes.

Do not assume the source matches an earlier conversation, ZIP, or handoff.

The user may introduce changes even while you are working on something, so always monitor the files you are changing.

## Rule 7 — Minimal Changes

Change only files necessary for the requested work.

Avoid unrelated:

- refactoring,
- formatting,
- renaming,
- cleanup,
- dependency changes.

Feel free to suggest code improvements and refactorings, but first complete the task at hand, then present them and wait for approval before making them.

## Rule 8 — Preserve Existing Behavior

Do not remove or simplify existing features merely to make a new feature easier to implement. Always ask for the rationale behind something that may seem like an overkill or overengineering.

## Rule 9 — Do NOT Clobber Changes by Others

Be aware that other agents or the user you interact with may be making changes concurrently to you. 

Sometimes these changes may conflict with what you are trying to do. Never blindly overwrite files that have changed since you last read them. Attempt to reconcile the differences and come up with a consistent merge if possible. Otherwise alert the user, describing the problem, proposing solution or solutions, and let them decide what to do.

## Rule 10 — Keep the Third-Party Notices Current

The programs are commercial software, and `THIRD-PARTY-NOTICES.md` at the root reproduces
the license of everything they redistribute; each program copies it beside itself. Whenever
a package that ships with a program is added, upgraded or removed (its own dependencies
included), update that file in the same change: the component, its version, which program
uses it, and its license text as it is at that version.

## Rule 11 — Keep Tooltips Narrow

No tooltip in any program is wider than about 350 device-independent pixels (the user,
2026-09-27). A long one wraps, and a blank line in its text starts a new paragraph. Make it
with `MaxServices.Core.Shell.MenuToolTips.Create` (its width is `MenuToolTips.MaxWidth`) rather
than by setting a plain string as a `ToolTip`, which WPF draws on one line however long it is.

------

# 10. Deliverable Rules

When returning source changes as a ZIP:

1. Include only changed files unless a complete solution was explicitly requested.
Files to be deleted should also be present in the archive with `_DELETE` appended to their filename (before the extension, so that the extension does not change).
2. Preserve the complete folder hierarchy in the archive being delivered.
3. Include the **MarkdownTools root directory itself** in the archive.

Correct:

```text
MarkdownTools.202609171500.zip
└── MarkdownTools/
    └── ProjectName/
        ├── ChangedFile.cs
        └── AnotherChangedFile.cs
```

Incorrect:

```text
MarkdownTools.202609171500.zip
├── ChangedFile.cs
└── AnotherChangedFile.cs
```

Exclude generated/build/repository directories unless explicitly required:

- `bin`
- `obj`
- `publish`
- `.vs`
- `.git`
- `.claude` (Claude Code's local settings and its worktrees, whole copies of the repository)

------

# 11. Build and Verification

After modifying source, build the relevant project whenever the environment permits.

Run tests appropriate to the affected behavior.

Report separately:

- compiler errors,
- compiler warnings,
- test failures.

Do not claim a successful build unless the build was actually run and was successful.

Do not claim interactive editor behavior was tested unless the application was actually exercised interactively.

If only compilation and automated tests were performed, say so.

------

# 12. Things Not to Change Without Asking

Do not make these architectural/product changes without explicit approval:

- WPF to another UI framework
- .NET target framework
- MarkDig parser
- WYSIWYG architecture
- CommonMark baseline
- test framework
- major keyboard conventions (feel free to suggest if the convention differs from commonly accepted standards)
- introduction of HTML/WebView rendering
- major third-party editor frameworks
- proprietary document formats (an application-specific file format that is saved; the in-memory DOM is not one)

A project's own `AGENTS.md` may add to this list.

------

# 13. Starting a New Agent Session

Before modifying source:

1. Read this `AGENTS.md` completely.
2. Read the `AGENTS.md` of every project you are going to change (for example `MaxPad\AGENTS.md`).
3. Read `HANDOFF.md`, if present, and then the `handoff.md` of the application you are going
   to change (`MaxWrite\handoff.md` or `MaxPad\handoff.md`).
4. Inspect the current solution/project structure.
5. Inspect the current source involved in the task.
6. Inspect relevant tests before changing behavior.
7. Check CommonMark semantics for Markdown parsing questions.
8. Check actual Markdig behavior/API when relevant.
9. Build the current baseline when practical.
10. Treat current source as authoritative over previous chats and stale notes.

Do not begin implementing a fix based solely on a previous agent's description of the code.

------

# 14. Ending an Agent Session

Before handing work to another agent, update the `handoff.md` of the application you worked
on (`MaxWrite\handoff.md` or `MaxPad\handoff.md`). Update `HANDOFF.md` too only if what you
learned is shared: it concerns both applications or a shared library.

Record:

- current objective,
- completed work,
- exact files changed,
- important design decisions,
- build result,
- test result,
- unresolved bugs,
- regressions discovered,
- recommended next step.

Do not turn the handoff into an append-only development diary.

Remove obsolete information so it describes the **current project state**.

Durable lessons that future agents should always know belong in this `AGENTS.md`, not in an ever-growing handoff.

This AGENTS.md should not be a project-specific set of instructions. Keep it generic enough, so that it remains applicable across all projects in the solution. Add AGENTS.md at a project level if needed, but always alert the user to any changes you make to AGENTS.md files anywhere.

------

# 15. Suspending an Agent Session
When running autonomously on a series of tasks and the current session reaches 95% of either weekly or hourly limit, preserve enough information to continue after the pause, then pause it safely, so that the limits are not breached, unless the user explicitly directs otherwise. Wait for the user to resume the session after the limits have been lifted.

------

# 16. Committing Changes to git

When working on an assigned task, work in a git branch specific to that task, with a name starting with `claude/`. Commit changes to git when you are done with a task. 

When you commit your changes, collect all the files you worked on and commit them to **local repository only**. **You are allowed to push ==only== if the user explicitly instructs you to.**

When committing your changes to local, identify yourself as Claude@<machineName> with email claude+<machineName>@anthropic.com (or the appropriate Agent name, if you are not Claude). <machineName> is the local Windows machine name.

Do not put the signature 

​    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

(or anything similar) in the commit comments themselves.

# 17. Authority

When instructions conflict, use this priority:

1. Explicit user instruction for the current task.
2. Project-specific `AGENTS.md`, if one exists.
3. This root `AGENTS.md`.
4. `HANDOFF.md`, and the `handoff.md` of the application, for current-state information.
5. Existing source conventions.

The current source tree is authoritative regarding what is actually implemented.

When a proposed change would materially alter established application behavior and/or the desired behavior is not clear, ask before implementing it.
