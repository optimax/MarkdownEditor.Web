// The editor in a real view: keys pressed and text typed into it, as the browser would send them, and after every
// command the check MaxPad.Editing.Tests make: the view is what the source says (each paragraph's text and style), and
// only the caret's paragraph shows its syntax.
import { test, equal, ok } from './harness.js';
import { MarkdownEditor } from '../src/index.js';
import { MarkdownState } from '../src/markdown/state.js';
import { viewRunsOf } from '../src/markdown/projection.js';

function makeEditor(markdown) {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown, toolbar: false, revealUnfocused: true });
    editor.focus();
    return editor;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function type(editor, text) {
    for (const ch of text) {
        editor.view.input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: ch, cancelable: true }));
        await tick();
    }
}

async function press(editor, key, modifiers = {}) {
    const code = key.length === 1 ? 'Key' + key.toUpperCase() : key;
    editor.view.input.dispatchEvent(new KeyboardEvent('keydown', { key, code, cancelable: true, ...modifiers }));
    await tick();
}

// The view is what the source says, and the syntax shown is the caret's paragraph's (and its fence's partner's).
function checkView(editor) {
    const source = editor.controller.state.source;
    const state = new MarkdownState(source, { caret: editor.controller.state.caret });
    const view = editor.view;
    equal(view.paragraphCount, state.paragraphs.length, 'the view has the projection\'s paragraphs');
    const caret = editor.controller.selection.caret;
    const shown = new Set(editor.controller._revealed.map((r) => r.index));
    for (let i = 0; i < state.paragraphs.length; i++) {
        const p = state.paragraphs[i];
        equal(view.getParagraphText(i), p.text, `paragraph ${i}'s text`);
        equal(view.paragraphs[i].styleId, p.styleId, `paragraph ${i}'s style`);
        // (a fence shown as the partner of the one the caret is on shows as though the caret were at its start)
        const partner = (p.kind === 'fence' || p.kind === 'fence-close') && !(caret >= p.start && caret <= p.end);
        const at = shown.has(i) ? (partner ? p.start : caret) : null;
        const expected = viewRunsOf(p, at, state.doc).runs.map((run) => [run.text, run.hidden, run.styleId]);
        const actual = view.paragraphs[i].runs.map((run) => [run.text, !!run.hidden, run.styleId ?? null]);
        equal(actual, expected, `paragraph ${i}'s runs`);
    }
    const index = state.projection.paragraphAt(caret);
    const p = state.paragraphs[index];
    if (caret >= p.start && caret <= p.end) ok(shown.has(index), 'the caret\'s paragraph shows its syntax');
}

test('typing, Enter in a list, and leaving it', async () => {
    const editor = makeEditor('- a');
    editor.select(3);
    await type(editor, 'b');
    await press(editor, 'Enter');
    await type(editor, 'c');
    await press(editor, 'Enter');
    await press(editor, 'Enter');
    await type(editor, 'd');
    equal(editor.value, '- ab\n- c\n\nd');
    checkView(editor);
});

test('undo and redo go back and forth exactly', async () => {
    const editor = makeEditor('# Title\n\nSome *text*.');
    editor.select(16);
    await type(editor, 'more ');
    await press(editor, 'Enter');
    await type(editor, 'x');
    await press(editor, 'b', { ctrlKey: true });
    const after = editor.value;
    while (editor.canUndo) editor.undo();
    equal(editor.value, '# Title\n\nSome *text*.');
    checkView(editor);
    while (editor.canRedo) editor.redo();
    equal(editor.value, after);
    checkView(editor);
});

test('a word typed is one undo step', async () => {
    const editor = makeEditor('');
    await type(editor, 'one two');
    editor.undo();
    equal(editor.value, 'one ');
    editor.undo();
    equal(editor.value, '');
});

test('what is typed after an undo is a step of its own', async () => {
    const editor = makeEditor('');
    await type(editor, 'abc');
    await press(editor, 'Backspace');
    editor.undo();
    equal(editor.value, 'abc');
    await type(editor, 'd');
    editor.undo();
    equal(editor.value, 'abc', 'the d alone was undone, not the word it was typed after');
});

test('the caret moved with the keys is where the next edit goes', async () => {
    const editor = makeEditor('abc\n\ndef');
    editor.select(0);
    await press(editor, 'ArrowDown');
    await press(editor, 'ArrowRight');
    await type(editor, 'X');
    equal(editor.value, 'abc\n\ndXef');
    await press(editor, 'Home');
    await press(editor, 'Backspace');
    equal(editor.value, 'abcdXef');
    checkView(editor);
});

test('Ctrl and a number makes a heading, Ctrl+0 a paragraph; Ctrl+= and Ctrl+- step the level', async () => {
    const editor = makeEditor('Title\n\nText');
    editor.select(2);
    await press(editor, '2', { ctrlKey: true, code: 'Digit2' });
    equal(editor.value, '## Title\n\nText');
    await press(editor, '0', { ctrlKey: true, code: 'Digit0' });
    equal(editor.value, 'Title\n\nText');
    await press(editor, '=', { ctrlKey: true, code: 'Equal' });
    await press(editor, '=', { ctrlKey: true, code: 'Equal' });
    equal(editor.value, '## Title\n\nText');
    await press(editor, '-', { ctrlKey: true, code: 'Minus' });
    equal(editor.value, '# Title\n\nText');
    await press(editor, '3', { ctrlKey: true, altKey: true, code: 'Digit3' });
    equal(editor.value, '### Title\n\nText');
    equal(editor.selection.caret, 6, 'the caret stays in the text');
    equal(editor.zoom, 1, 'the keys no longer zoom');
    checkView(editor);
});

test('CRLF documents keep their line endings', async () => {
    const editor = makeEditor('a\r\n\r\nb');
    editor.select(1);
    await press(editor, 'Enter');
    await type(editor, 'x');
    equal(editor.value, 'a\r\n\r\nx\r\n\r\nb');
});

test('a table: Tab to the next cell, and typing there', async () => {
    const editor = makeEditor('| a | b |\n|---|---|\n| 1 | 2 |');
    editor.select(23);
    await press(editor, 'Tab');
    await type(editor, '9');
    equal(editor.value, '| a | b |\n|---|---|\n| 1 | 9 |');
    checkView(editor);
});

test('an editor without the focus shows no syntax', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: '# Title', toolbar: false });
    const shown = () => editor.view.paragraphs[0].runs.some((run) => !run.hidden && run.text.includes('#'));
    // (the events themselves: a page the browser has not given the system's focus is told of no focus at all)
    editor.view.input.dispatchEvent(new FocusEvent('focus'));
    await tick();
    equal(shown(), true, 'focused: the heading\'s hashes show at the caret');
    editor.view.input.dispatchEvent(new FocusEvent('blur'));
    await tick();
    equal(shown(), false, 'not focused: hidden');
});

// Random commands on documents of every kind: the view stays what the source says, and everything undoes to the
// document it began as and redoes to the one it ended as.
const DOCUMENTS = [
    '# Heading\n\nA paragraph with **bold** and *italic*.\n\n- one\n- two\n  - three\n\n> quote\n> more',
    '```js\nlet a = 1;\n\nlet b = 2;\n```\n\ntext after\n\n---\n\n1. a\n2. b',
    '| a | b |\n|---|---|\n| 1 | 2 |\n\nAfter the table, [a link](http://x.y) and `code`.',
    'plain\n\n\n\nblank lines\n\n- [ ] task\n- [x] done',
];

// (each command, with the share of the steps it takes up to: typing 30%, Enter 12%...)
const COMMANDS = [[0.3, 'type'], [0.42, 'Enter'], [0.5, 'Shift+Enter'], [0.62, 'Backspace'], [0.7, 'Delete'],
    [0.78, 'ArrowLeft'], [0.84, 'ArrowUp'], [0.9, 'ArrowDown'], [0.95, 'Tab'], [1, 'Ctrl+B']];

function random(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

test('random commands keep the view right, and undo and redo', async () => {
    const steps = Number(new URLSearchParams(location.search).get('steps') ?? 40);
    for (let d = 0; d < DOCUMENTS.length; d++) {
        for (let seed = 1; seed <= 3; seed++) {
            const next = random(seed * 7919 + d);
            const editor = makeEditor(DOCUMENTS[d]);
            editor.select(Math.floor(next() * DOCUMENTS[d].length));
            const done = [];
            for (let step = 0; step < steps; step++) {
                const r = next();
                const what = COMMANDS.find(([limit]) => r < limit)[1];
                done.push(what);
                try {
                    if (what === 'type') await type(editor, 'ab '[Math.floor(next() * 3)]);
                    else if (what === 'Shift+Enter') await press(editor, 'Enter', { shiftKey: true });
                    else if (what === 'Ctrl+B') await press(editor, 'b', { ctrlKey: true });
                    else await press(editor, what);
                    checkView(editor);
                } catch (error) {
                    const where = `document ${d}, seed ${seed}, after ${done.join(', ')}`;
                    throw new Error(`${where}: ${error.message}\n${JSON.stringify(editor.value)}`);
                }
            }
            const final = editor.value;
            while (editor.canUndo) editor.undo();
            equal(editor.value, DOCUMENTS[d], `document ${d}, seed ${seed}: undone to the start`);
            while (editor.canRedo) editor.redo();
            equal(editor.value, final, `document ${d}, seed ${seed}: redone to the end`);
            checkView(editor);
        }
    }
});
