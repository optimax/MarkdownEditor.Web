// The editor in a real view: keys pressed and text typed into it, as the browser would send them, and after every
// command the check MaxPad.Editing.Tests make: the view is what the source says (each paragraph's text and style), and
// only the caret's paragraph shows its syntax.
import { test, equal, ok } from './harness.js';
import { MarkdownEditor, DEFAULT_TOOLBAR } from '../src/index.js';
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

test('the content is styled by classes of a stylesheet the page can restyle', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: '# Title\n\n> quoted *text* and [a](b)', toolbar: false });
    const view = editor.view;
    const box = (selector) => view.content.querySelector(selector);
    ok(view.host.classList.contains('mde-content'), 'the content is .mde-content');
    const heading = box('.vtv-box.mde-content-h1');
    ok(heading && box('.vtv-box.mde-content-in-quote.mde-content-q1'), 'each paragraph has its kind\'s classes');
    equal([heading.getAttribute('style'), box('.mde-content-link').getAttribute('style')], [null, null],
        'no CSS of its own');
    ok(box('.vtv-run.vtv-italic'), 'italic by class');
    equal(getComputedStyle(heading).fontSize, '32px', 'the default stylesheet');
    const page = document.createElement('style');
    page.textContent = '.mde-content-h1 { font-size: 20px; color: rgb(1, 2, 3); }';
    document.head.append(page);
    try {
        editor.view.invalidateStyles();
        await tick();
        const restyled = box('.vtv-box.mde-content-h1');
        equal([getComputedStyle(restyled).fontSize, getComputedStyle(restyled).color], ['20px', 'rgb(1, 2, 3)'],
            'a page\'s rule wins over the default stylesheet\'s, whatever their specificity');
        ok(Math.abs(view.heights[0] - restyled.parentElement.getBoundingClientRect().height) < 1, 'and is laid out so');
    } finally {
        page.remove();
    }
    editor.view.invalidateStyles();
    editor.zoom = 1.5;
    await tick();
    equal(getComputedStyle(box('.vtv-box.mde-content-h1')).fontSize, '48px', 'the zoom scales the em');
    editor.zoom = 1;
    editor.theme = { headingColor: 'rgb(4, 5, 6)' };
    await tick();
    equal(getComputedStyle(box('.vtv-box.mde-content-h1')).color, 'rgb(4, 5, 6)', 'a theme\'s value is a custom property');
    editor.theme = 'dark';
    ok(view.host.classList.contains('mde-dark'), 'the dark theme is a class');
    equal(view.host.style.getPropertyValue('--mde-heading-color'), '', 'and the values given before are gone');
});

test('the outline in a Markdown document: a heading edited stays collapsed', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: '# A\n\ntext\n\n## B\n\nmore\n\n# C', toolbar: false });
    const view = editor.view;
    ok(!editor.showOutline, 'off by default: the page offers it if it wants to');
    editor.collapseAll();
    ok(!view.isFolded(1), 'nothing folds while it is off');
    editor.showOutline = true;
    view.setCollapsed(0, true);
    equal(view.paragraphs.map((_, i) => view.isFolded(i)), [false, true, true, true, false]);
    editor.select(3);
    editor.view.input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', cancelable: true }));
    await tick();
    equal([editor.value, view.isCollapsed(0)], ['# Ax\n\ntext\n\n## B\n\nmore\n\n# C', true], 'typed in: still collapsed');
    editor.undo();
    await tick();
    equal([editor.value.startsWith('# A\n'), view.isCollapsed(0), view.isFolded(3)], [true, true, true], 'and undone');
    editor.showOutline = false;
    ok(!view.isFolded(1) && !view.isFolded(3), 'turned off, everything shows: no fold is left with no mark to open it');
    ok(!DEFAULT_TOOLBAR.includes('outline'), 'the default toolbar does not offer it');
});

test('where the document goes is the stylesheet\'s: centered, or as a page\'s rule says', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    stage.style.width = '1400px';
    try {
        const editor = new MarkdownEditor(stage, { markdown: 'text', toolbar: false });
        const view = editor.view;
        const room = () => {
            const page = view.page.getBoundingClientRect(), host = view.host.getBoundingClientRect();
            return [Math.round(page.left - host.left), Math.round(host.right - page.right)];
        };
        ok(view.page.classList.contains('mde-content-page') && !view.page.style.margin, 'the page has its class, no margin');
        const [left, right] = room();
        ok(left > 100 && Math.abs(left - right) <= 20, 'centered by the default stylesheet');
        const width = view.content.getBoundingClientRect().width;
        ok(Math.abs(width - 720) < 1, 'the text 720 px wide at most');
        const page = document.createElement('style');
        page.textContent = '.mde-content-page { margin: 0; }';
        document.head.append(page);
        try {
            view.invalidateStyles();
            await tick();
            equal(room()[0], 0, 'a page\'s rule puts it at the left');
        } finally {
            page.remove();
        }
        editor.theme = { centered: false, documentWidth: 600 };
        await tick();
        equal(room()[0], 0, 'and so does a theme that is not centered');
        ok(Math.abs(view.content.getBoundingClientRect().width - 600) < 1, 'its width the theme\'s');
    } finally {
        stage.style.width = '';
    }
});

test('the zoom in the toolbar: smaller, larger, and back to 100%', () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: 'x', toolbar: ['zoomout', 'zoom', 'zoomin'] });
    let changes = 0;
    editor.addEventListener('zoomchange', () => changes++);
    const [out, label, into] = [...editor.toolbar.querySelectorAll('button')];
    equal(label.textContent, '100%');
    into.click();
    into.click();
    equal([editor.zoom, label.textContent], [1.2, '120%'], 'ten percent a step');
    out.click();
    equal(label.textContent, '110%');
    editor.zoom = 1.034; // (as Ctrl and the wheel do)
    equal(label.textContent, '103%', 'the label follows any zoom');
    into.click();
    equal(editor.zoom, 1.13, 'a step from the whole percent');
    label.click();
    equal([editor.zoom, label.textContent, changes], [1, '100%', 6], 'the label puts it back at 100%');
    editor.zoom = 5;
    ok(into.disabled && !out.disabled, 'no larger than the largest');
    editor.readOnly = true;
    ok(!out.disabled && !label.disabled, 'on in a read-only document too');
});

test('the page\'s own toolbar buttons, and the items it chooses', () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    let on = false, clicks = 0, events = [];
    const mine = {
        name: 'mine', title: 'Mine', icon: '<path d="M4 4h16"/>', pressed: () => on, onClick: (editor) => {
            on = !on;
            clicks += editor instanceof MarkdownEditor ? 1 : 0;
        },
    };
    const text = { name: 'hello', label: 'Hi', enabled: (editor) => !editor.readOnly };
    const editor = new MarkdownEditor(stage, { markdown: 'x', toolbar: ['strong', '|', mine, text] });
    editor.addEventListener('toolbarclick', (event) => events.push(event.detail.name));
    const buttons = () => [...editor.toolbar.querySelectorAll('button')];
    equal(buttons().length, 3, 'only the items asked for');
    const [, button, hello] = buttons();
    equal([button.title, !!button.querySelector('svg path'), hello.textContent], ['Mine', true, 'Hi']);
    equal(button.getAttribute('aria-pressed'), 'false');
    button.click();
    equal([on, clicks, button.getAttribute('aria-pressed')], [true, 1, 'true'], 'its click is the page\'s; pressed');
    hello.click();
    equal(events, ['mine', 'hello'], 'and each raises toolbarclick');
    editor.readOnly = true;
    ok(hello.disabled, 'enabled as the page says');
    editor.toolbarItems = ['undo', 'redo'];
    equal(buttons().length, 2, 'the items changed');
    equal(editor.toolbarItems, ['undo', 'redo']);
    editor.toolbarItems = false;
    equal(editor.toolbar, null, 'no toolbar');
});

test('a read-only editor shows no syntax at the caret', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: '# Title\n\n**bold**', toolbar: false });
    const shown = (i) => editor.view.paragraphs[i].runs.some((run) => !run.hidden && /[#*]/.test(run.text));
    editor.view.input.dispatchEvent(new FocusEvent('focus'));
    await tick();
    equal(shown(0), true, 'editable: shown at the caret');
    editor.readOnly = true;
    await tick();
    equal(shown(0), false, 'made read-only: hidden');
    editor.select(10);
    await tick();
    equal(shown(1), false, 'and not shown where the caret goes');
    editor.readOnly = false;
    await tick();
    equal(shown(1), true, 'editable again: shown');
});

test('Ctrl+K in a link asks with its address and changes it; an empty answer takes the link away', async () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const asked = [];
    let answer = 'https://new.org';
    const prompt = async (question, value) => {
        asked.push(value);
        return answer;
    };
    const editor = new MarkdownEditor(stage, {
        markdown: 'see [docs](https://old.org) here', toolbar: false, revealUnfocused: true, prompt,
    });
    editor.focus();
    editor.select(6);
    await press(editor, 'k', { ctrlKey: true });
    await tick();
    equal([asked, editor.value], [['https://old.org'], 'see [docs](https://new.org) here'], 'the address changed');
    equal(editor.selection, { anchor: 5, caret: 9 }, 'the link\'s text selected');
    answer = null;
    await press(editor, 'k', { ctrlKey: true });
    await tick();
    equal(editor.value, 'see [docs](https://new.org) here', 'cancelled: nothing');
    answer = '';
    await press(editor, 'k', { ctrlKey: true });
    await tick();
    equal(editor.value, 'see docs here', 'an empty address: the text left');
    checkView(editor);
    editor.undo();
    equal(editor.value, 'see [docs](https://new.org) here', 'one step each');
});

test('Tab on a numbered item nests it, numbered 1', async () => {
    const editor = makeEditor('1. a\n2. b');
    editor.select(8);
    await press(editor, 'Tab');
    equal(editor.value, '1. a\n   1. b');
    checkView(editor);
    await press(editor, 'Tab', { shiftKey: true });
    equal(editor.value, '1. a\n2. b', 'and Shift+Tab takes it out again');
});

test('a read-only editor undoes and redoes nothing', async () => {
    const editor = makeEditor('abc');
    editor.select(3);
    await type(editor, 'd');
    editor.undo();
    editor.redo();
    editor.readOnly = true;
    await press(editor, 'z', { ctrlKey: true });
    equal(editor.value, 'abcd', 'Ctrl+Z');
    editor.undo();
    equal(editor.value, 'abcd', 'undo()');
    const menu = new InputEvent('beforeinput', { inputType: 'historyUndo', cancelable: true });
    editor.view.input.dispatchEvent(menu);
    await tick();
    equal(editor.value, 'abcd', 'the browser\'s Edit menu');
    editor.readOnly = false;
    editor.undo();
    equal(editor.value, 'abc', 'editable again: undone');
    editor.readOnly = true;
    await press(editor, 'y', { ctrlKey: true });
    equal(editor.value, 'abc', 'Ctrl+Y');
    editor.readOnly = false;
});

test('the toolbar is one Tab stop, its arrows going from control to control; Alt+F10 and Escape', () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const toolbar = ['undo', 'redo', '|', 'block', 'strong', 'em', 'raw'];
    const editor = new MarkdownEditor(stage, { markdown: 'abc', toolbar });
    editor.select(1);
    const controls = [...editor.toolbar.querySelectorAll('button, select')];
    const stop = () => controls.map((control) => control.tabIndex).indexOf(0);
    const focused = () => controls.indexOf(document.activeElement);
    const key = (target, key, more = {}) => {
        const event = new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true, ...more });
        target.dispatchEvent(event);
        return event.defaultPrevented;
    };
    equal(stop(), 2, 'the Tab stop: the first control that can be used (nothing to undo or redo)');
    key(editor.view.input, 'F10', { altKey: true });
    equal(focused(), 2, 'Alt+F10 in the text');
    const moves = ['ArrowRight', 'End', 'ArrowRight', 'ArrowLeft', 'Home'].map((name) => {
        key(document.activeElement, name);
        return [focused(), stop()];
    });
    equal(moves, [[3, 3], [5, 5], [2, 2], [5, 5], [2, 2]], 'the arrows, End, Home, round the ends');
    key(document.activeElement, 'ArrowRight');
    key(document.activeElement, 'Escape');
    equal(document.activeElement === editor.view.input, true, 'Escape: back to the text');
    key(editor.view.input, 'F10', { altKey: true });
    equal(focused(), 3, 'Alt+F10 again: the control last in use');
    editor.focus();
    equal(key(editor.view.input, 'Tab'), true, 'Tab is the text\'s');
    key(editor.view.input, 'Escape');
    equal(key(editor.view.input, 'Tab'), false, 'Escape, then Tab: the browser\'s, out of the text');
    equal(key(editor.view.input, 'Tab'), true, 'and the text\'s again after');
    editor.destroy();
});

test('a file dropped on the editor is not opened in place of the page; a page may take it', () => {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const editor = new MarkdownEditor(stage, { markdown: 'abc' });
    const drag = (target, type) => {
        const data = new DataTransfer();
        data.items.add(new File(['x'], 'x.png', { type: 'image/png' }));
        data.dropEffect = 'copy';
        const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data });
        target.dispatchEvent(event);
        return [event.defaultPrevented, data.dropEffect];
    };
    const text = editor.view.content, bar = editor.toolbar;
    equal(drag(text, 'dragover'), [true, 'none'], 'over the text');
    equal(drag(text, 'drop')[0], true, 'dropped on the text');
    equal(drag(bar, 'dragover'), [true, 'none'], 'over the toolbar');
    equal(drag(bar, 'drop')[0], true, 'dropped on the toolbar');
    // (a page that takes drops on the editor sets the drop effect in its own listener, which runs after the editor's;
    // a script's DataTransfer takes no effect but 'none', so what is checked here is that it runs after)
    let seen = null;
    const take = (event) => (seen = event.dataTransfer.dropEffect);
    stage.addEventListener('dragover', take);
    drag(text, 'dragover');
    stage.removeEventListener('dragover', take);
    equal(seen, 'none', 'the page\'s own listener, after the editor\'s');
    equal(editor.value, 'abc');
    editor.destroy();
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
