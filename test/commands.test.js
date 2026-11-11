// The editing rules, on the source alone: a document is written with ¦ for the caret and «...» for a selection (the
// anchor at «, the caret at »), as MaxPad.Editing.Tests write theirs.
import { test, equal } from './harness.js';
import { MarkdownState } from '../src/markdown/state.js';
import * as commands from '../src/markdown/commands.js';
import { toggleInline, isInline } from '../src/markdown/formatting.js';
import {
    setBlockType, setHeadingLevel, stepHeadingLevel, insertTable, insertLink, insertImage,
} from '../src/markdown/blocks.js';

function parse(marked) {
    let source = '', anchor = null, caret = null;
    for (const ch of marked) {
        if (ch === '¦') anchor = caret = source.length;
        else if (ch === '«') anchor = source.length;
        else if (ch === '»') caret = source.length;
        else source += ch;
    }
    return { source, selection: { anchor, caret } };
}

function marked(result) {
    if (!result) return null;
    const { source, caret, anchor } = result;
    if (caret === null || caret === undefined) return source;
    if (anchor === caret || anchor === null || anchor === undefined) return source.slice(0, caret) + '¦' + source.slice(caret);
    const [a, b] = anchor < caret ? [anchor, caret] : [caret, anchor];
    return source.slice(0, a) + '«' + source.slice(a, b) + '»' + source.slice(b);
}

function check(fn, before, after, ...args) {
    const { source, selection } = parse(before);
    equal(marked(fn(new MarkdownState(source), selection, ...args)), after, JSON.stringify(before));
}

test('Enter in paragraphs', () => {
    check(commands.enter, 'abc¦', 'abc\n\n¦');
    check(commands.enter, 'abc¦\n\nxyz', 'abc\n\n¦\nxyz');
    check(commands.enter, 'ab¦cd', 'ab\n\n¦cd');
    check(commands.enter, '¦abc', '\n¦abc');
    check(commands.enter, 'a\n\n# ¦T', 'a\n\n\n# ¦T');
    check(commands.enter, '# Ti¦tle', '# Ti\n\n¦tle');
    check(commands.enter, 'a\n\n¦\nb', 'a\n\n\n¦\nb');
    check(commands.enter, 'a«b»c', 'a\n\n¦c');
});

test('Enter in lists', () => {
    check(commands.enter, '- a¦', '- a\n- ¦');
    check(commands.enter, '1. a¦', '1. a\n2. ¦');
    check(commands.enter, '- [x] a¦', '- [x] a\n- [ ] ¦');
    check(commands.enter, '- a\n- ¦', '- a\n\n¦');
    check(commands.enter, '- ¦\n- b', '¦\n- b');
    check(commands.enter, '- a¦b', '- a\n- ¦b');
});

test('Enter in quotes', () => {
    check(commands.enter, '> a¦', '> a\n>\n>¦');
    check(commands.enter, '> a¦b', '> a\n>\n> ¦b');
    check(commands.enter, '> a\n>\n>¦', '> a\n>\n\n¦');
});

test('Enter in code and tables', () => {
    check(commands.enter, '```\nab¦\n```', '```\nab\n¦\n```');
    check(commands.enter, '```\n  ab¦\n```', '```\n  ab\n  ¦\n```');
    check(commands.enter, '```js¦', '```js\n¦\n```');
    check(commands.enter, '| a | b |\n|---|---|\n| 1¦ | 2 |', '| a | b |\n|---|---|\n| 1 | 2 |\n| ¦ |  |');
});

test('Shift+Enter', () => {
    check(commands.softBreak, 'ab¦cd', 'ab\\\n¦cd');
    check(commands.softBreak, '- ab¦cd', '- ab\\\n  ¦cd');
    check(commands.softBreak, '# a¦b', null);
});

test('Backspace', () => {
    check(commands.backspace, 'ab¦', 'a¦');
    check(commands.backspace, 'a\n\n¦b', 'a¦b');
    check(commands.backspace, '- a\n- ¦b', '- a\n\n¦b');
    check(commands.backspace, '- ¦a', '¦a');
    check(commands.backspace, 'a\n\n¦\n\nb', 'a¦\n\n\nb');
    check(commands.backspace, 'a\n\n#¦\n\nb', 'a\n\n¦\nb');
    check(commands.backspace, '> ¦a', '¦a');
    check(commands.backspace, '```\na\n¦b\n```', '```\na¦b\n```');
    check(commands.backspace, 'a\n\nx¦\n\nb', 'a\n\n¦\nb');
    check(commands.backspace, 'a «bc» d', 'a ¦ d');
    check(commands.backspace, 'a **«bold»** d', 'a ¦ d');
});

test('Delete', () => {
    check(commands.deleteForward, 'a¦b', 'a¦');
    check(commands.deleteForward, 'a¦\n\nb', 'a¦b');
    check(commands.deleteForward, 'a¦\n\n\n\nb', 'a¦\n\n\nb');
    check(commands.deleteForward, '> a¦\n> b', '> a¦b');
});

test('Tab', () => {
    check(commands.tab, '- a\n- ¦b', '- a\n  - ¦b');
    check((state, selection) => commands.tab(state, selection, true), '- a\n  - ¦b', '- a\n- ¦b');
    check(commands.tab, '# ¦T', '## ¦T');
    check(commands.tab, 'a¦b', 'a\t¦b');
    check(commands.tab, '¦- a', null);
});

test('Tab on a numbered item: a nested list numbered 1, or the nested list there gone on', () => {
    const back = (state, selection) => commands.tab(state, selection, true);
    check(commands.tab, '1. a\n2. ¦b', '1. a\n   1. ¦b');
    check(commands.tab, '1) a\n2) ¦b', '1) a\n   1) ¦b');
    check(commands.tab, '9. a\n10. ¦b', '9. a\n   1. ¦b');
    check(commands.tab, '1. a\n2. ¦b\n   c', '1. a\n   1. ¦b\n      c');
    check(commands.tab, '1. a\n   1. x\n2. ¦b', '1. a\n   1. x\n   2. ¦b');
    check(commands.tab, '1. a\n2. ¦b\n3. c', '1. a\n   1. ¦b\n3. c');
    check(back, '1. a\n   1. ¦b', '1. a\n2. ¦b');
});

test('typing on an empty paragraph keeps the blank line after it', () => {
    check((state, selection) => commands.insertText(state, selection, 'x'), 'a\n\n¦\nb', 'a\n\nx¦\n\nb');
    const typePipe = (state, selection) => commands.insertText(state, selection, 'x|y');
    check(typePipe, '| a |\n|---|\n| ¦ |', '| a |\n|---|\n| x\\|y¦ |');
});

test('pipes typed or pasted into a table cell are text, and the cell\'s own pipes stay the cell\'s', () => {
    const typed = (text) => (state, selection) => commands.insertText(state, selection, text);
    check(typed('a||b'), '| x¦ | y |\n| --- | --- |', '| xa\\|\\|b¦ | y |\n| --- | --- |');
    check(typed('a\\|b'), '| ¦ |\n| --- |', '| a\\|b¦ |\n| --- |'); // (escaped already)
    check(typed('a\\\\|b'), '| ¦ |\n| --- |', '| a\\\\\\|b¦ |\n| --- |'); // (a backslash, then a pipe)
    check(typed('|'), '| x\\¦ |\n| --- |', '| x\\|¦ |\n| --- |'); // (the source's backslash escapes it)
    check(typed('\\'), '|x¦|y|\n|-|-|', '|x\\¦ |y|\n|-|-|'); // (a space keeps the cell's pipe after it)
    check(typed('x'), '| a\\¦|b |\n| - |', '| a\\x¦\\|b |\n| - |'); // (between an escaped pipe and its backslash)
    check(typed('y'), '| a\\x¦\\|b |\n| - |', '| a\\xy¦\\|b |\n| - |');
    const { source, selection } = parse('| x¦ | y |\n| --- | --- |');
    const pasted = new MarkdownState(commands.insertText(new MarkdownState(source), selection, 'a||b|').source);
    equal(pasted.doc.leaves[0].rows[0].cells.length, 2, 'the row\'s cells');
});

test('a table cell\'s pipes stay what they were when text is taken out of it', () => {
    const cells = (marked) => new MarkdownState(parse(marked).source).doc.leaves[0].rows?.[0].cells.length ?? 0;
    const checkCells = (fn, before, after, count) => {
        check(fn, before, after);
        if (after) equal(cells(after), count, `${JSON.stringify(after)}: the row's cells`);
    };
    // (the cell shows "x\": the backslash left would escape the cell's own pipe, so a space goes before it)
    checkCells(commands.backspace, '|x\\\\¦|y|\n|-|-|', '|x\\¦ |y|\n|-|-|', 2);
    checkCells(commands.deleteForward, '|x\\¦\\|y|\n|-|-|', '|x\\¦ |y|\n|-|-|', 2);
    checkCells(commands.backspace, '|x«\\»\\|y|\n|-|-|', '|x¦\\ |y|\n|-|-|', 2);
    checkCells(commands.backspace, '|x\\\\\\\\¦|y|\n|-|-|', '|x\\\\\\¦ |y|\n|-|-|', 2);
    // (the backslash of an escaped pipe of the text: a cell has no bare pipe in its text, so nothing is done)
    check(commands.backspace, '| a\\¦|b | c |\n| - | - |', null);
    check(commands.deleteForward, '| a¦\\|b | c |\n| - | - |', null);
    // (what is taken out changes no pipe: as anywhere; an escaped character's backslash stays, as in a paragraph)
    checkCells(commands.backspace, '| ab¦ | c |\n| - | - |', '| a¦ | c |\n| - | - |', 2);
    checkCells(commands.backspace, '| a\\|¦b | c |\n| - | - |', '| a\\¦b | c |\n| - | - |', 2);
});

test('a picture: its description\'s brackets and backslashes escaped, its address written as a link\'s', () => {
    const image = (address, description) => (state, selection) => insertImage(state, selection, address, description);
    check(image('pic.png', 'a cat'), 'x¦', 'x![a cat](pic.png)¦');
    check(image('my pic<1>.png', 'a ] b'), 'x¦', 'x![a \\] b](<my pic%3C1%3E.png>)¦');
    check(image('p.png', 'C:\\'), '¦', '![C:\\\\](p.png)¦');
    const written = insertImage(new MarkdownState('x'), { anchor: 1, caret: 1 }, 'my pic<1>.png', '[a] ] b');
    const inlines = new MarkdownState(written.source).doc.leaves[0].inlines;
    equal(inlines.map((node) => node.type), ['text', 'image']);
    equal(inlines[1].destination, 'my pic%3C1%3E.png');
});

test('copying takes the syntax of what it takes whole', () => {
    const copy = (text) => {
        const { source, selection } = parse(text);
        return commands.copiedText(new MarkdownState(source), selection);
    };
    equal(copy('a **«bold»** c'), '**bold**');
    equal(copy('# «Title»'), '# Title');
    equal(copy('a **b«ol»d** c'), 'ol');
});

test('inline formats on a selection', () => {
    const bold = (state, selection) => toggleInline(state, selection, 'strong');
    check(bold, 'a «b» c', 'a **«b»** c');
    check(bold, '«a b»', '**«a b»**');
    check(bold, '**a «b» c**', '**a** «b» **c**');
    check(bold, '*a «b* c»', '*a **«b*** **c»**');
    check(bold, '«a **b** c»', '**«a b c»**');
    check((state, selection) => toggleInline(state, selection, 'code'), 'a «b`c» d', 'a ``«b`c»`` d');
    check((state, selection) => toggleInline(state, selection, 'em'), '«a» b', '*«a»* b');
});

test('inline formats at a caret', () => {
    const bold = (state, selection) => toggleInline(state, selection, 'strong');
    check(bold, 'ab¦c', '**ab¦c**');
    check(bold, 'abc¦', '**abc¦**');
    check(bold, '**a¦b**', 'a¦b');
    check(bold, 'a ¦', 'a **¦**');
    const { source, selection } = parse('x **a¦b** y');
    equal(isInline(new MarkdownState(source), selection, 'strong'), true);
    equal(isInline(new MarkdownState(source), selection, 'em'), false);
});

test('paragraph types', () => {
    check((state, selection) => setBlockType(state, selection, 'h2'), 'ab¦c', '## ab¦c');
    check((state, selection) => setBlockType(state, selection, 'h2'), '## ab¦c', 'ab¦c');
    check((state, selection) => setBlockType(state, selection, 'bullet'), '«a\n\nb»', '- «a\n\n- b»');
    check((state, selection) => setBlockType(state, selection, 'quote'), 'a¦', '> a¦');
    check((state, selection) => setBlockType(state, selection, 'quote'), '> a¦', 'a¦');
    check((state, selection) => setBlockType(state, selection, 'paragraph'), '- a\n- b¦', '- a\n\nb¦');
    check((state, selection) => setBlockType(state, selection, 'code'), 'a¦', '```¦\na\n```');
    check(insertTable, 'a¦', 'a\n\n| «Column 1» | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |');
});

test('links: the selection made one, or the address of the one the caret is in changed (MaxPad\'s Ctrl+K)', () => {
    const link = (address, title) => (state, selection) => insertLink(state, selection, address, title);
    check(link('https://x.org'), 'see «docs»', 'see [docs](https://x.org)¦');
    check(link('https://x.org'), 'see ¦', 'see [https://x.org](https://x.org)¦');
    check(link('my file.pdf'), 'a «b»', 'a [b](<my file.pdf>)¦');
    check(link(''), 'a «b»', null);
    check(link('https://new.org'), 'see [do¦cs](https://old.org) here', 'see [«docs»](https://new.org) here');
    check(link('https://new.org'), 'see [«docs»](https://old.org)', 'see [«docs»](https://new.org)');
    check(link('v'), '[a **b**¦](u "T")', '[«a **b**»](v "T")');
    check(link('v', 'New'), '[a¦](u "T")', '[«a»](v "New")');
    check(link('https://b.org'), '<https://a¦.org>', '[«https://a.org»](https://b.org)');
    check(link('https://b.org'), '[te¦xt][r]\n\n[r]: https://a.org', '[«text»](https://b.org)\n\n[r]: https://a.org');
    check(link('v'), '| [a¦](u) |\n| --- |', '| [«a»](v) |\n| --- |');
    check(link(''), 'x [do¦cs](u) y', 'x «docs» y');
});

test('heading levels, as MaxPad\'s Ctrl+0 to Ctrl+6, Ctrl+= and Ctrl+-', () => {
    const level = (n) => (state, selection) => setHeadingLevel(state, selection, n);
    const step = (by) => (state, selection) => stepHeadingLevel(state, selection, by);
    check(level(2), 'ab¦c', '## ab¦c');
    check(level(2), '## ab¦c', null); // (not a toggle: a Heading 2 stays one)
    check(level(1), '### ab¦c', '# ab¦c');
    check(level(0), '### ab¦c', 'ab¦c');
    check(level(1), '«a\n\n## b»', '# «a\n\n# b»');
    check(step(1), 'ab¦c', '# ab¦c');
    check(step(1), '# ab¦c', '## ab¦c');
    check(step(1), '###### a¦', null);
    check(step(-1), '# ab¦c', 'ab¦c');
    check(step(-1), '## ab¦c', '# ab¦c');
    check(step(-1), 'ab¦c', null);
});
