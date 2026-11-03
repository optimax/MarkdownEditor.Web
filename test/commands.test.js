// The editing rules, on the source alone: a document is written with ¦ for the caret and «...» for a selection (the
// anchor at «, the caret at »), as MaxPad.Editing.Tests write theirs.
import { test, equal } from './harness.js';
import { MarkdownState } from '../src/markdown/state.js';
import * as commands from '../src/markdown/commands.js';
import { toggleInline, isInline } from '../src/markdown/formatting.js';
import { setBlockType, insertTable } from '../src/markdown/blocks.js';

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

test('typing on an empty paragraph keeps the blank line after it', () => {
    check((state, selection) => commands.insertText(state, selection, 'x'), 'a\n\n¦\nb', 'a\n\nx¦\n\nb');
    const typePipe = (state, selection) => commands.insertText(state, selection, 'x|y');
    check(typePipe, '| a |\n|---|\n| ¦ |', '| a |\n|---|\n| x\\|y¦ |');
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
