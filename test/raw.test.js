// The raw Markdown view: its paragraphs, the map between it and the source, and the editor in it.
import { test, equal, ok } from './harness.js';
import { MarkdownState } from '../src/markdown/state.js';
import { rawStarts, rawTexts, toRaw, rawToSource, rawFromSource, sourceOfRaw } from '../src/markdown/rawView.js';
import { MarkdownEditor, SOFT_BREAK } from '../src/index.js';

// (a break of the view written as ↵, to read)
const shown = (texts) => texts.map((text) => text.split(SOFT_BREAK).join('↵'));

test('the raw view\'s paragraphs start where the formatted view\'s do', () => {
    const source = '# T\n\nsome\ntext\n\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n';
    const state = new MarkdownState(source);
    const starts = rawStarts(state);
    const texts = rawTexts(source, starts);
    equal(shown(texts), ['# T↵', 'some↵text↵', '- a', '- b↵', '| x | y |↵|---|---|', '| 1 | 2 |↵']);
    equal(sourceOfRaw(texts), source, 'the view says the source');
    equal(shown(rawTexts('', rawStarts(new MarkdownState('')))), ['']);
});

test('a place in the source is the same place in the raw view', () => {
    const source = 'ab\n\ncd\nef\n\n> g';
    const state = new MarkdownState(source);
    const starts = rawStarts(state);
    const texts = rawTexts(source, starts);
    for (let offset = 0; offset <= source.length; offset++) {
        const position = toRaw(offset, starts, texts);
        equal(rawToSource(position, texts), offset, `offset ${offset} there and back`);
        equal(rawFromSource(offset, texts), position, `offset ${offset} by the text`);
    }
});

function makeEditor(markdown, options = {}) {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    return new MarkdownEditor(stage, { markdown, toolbar: false, ...options });
}

const typeInto = (editor, text) => editor.view.input.dispatchEvent(
    new InputEvent('beforeinput', { inputType: 'insertText', data: text, cancelable: true }));

test('looking at the source changes nothing', () => {
    const editor = makeEditor('# Title\r\n\r\nSome **bold** text.');
    editor.select(14);
    typeInto(editor, 'x');
    const value = editor.value, version = editor.version;
    editor.rawMode = true;
    equal(editor.view.getParagraphText(1), 'Some x**bold** text.', 'the source as it is, nothing hidden');
    equal(editor.selection, { anchor: 15, caret: 15 }, 'the caret where it was');
    editor.rawMode = false;
    equal([editor.value, editor.version, editor.canUndo], [value, version, true]);
    editor.undo();
    equal(editor.value, '# Title\r\n\r\nSome **bold** text.', 'the history as it was');
});

test('text changed in the source is the document, one undo step', async () => {
    const editor = makeEditor('Some text.');
    editor.select(5);
    editor.rawMode = true;
    typeInto(editor, '**');
    editor.select(11);
    typeInto(editor, '**');
    equal(editor.value, 'Some **text**.', 'the value is what the view says');
    equal(editor.isInline('strong'), false, 'no formats in the source');
    editor.undo();
    equal(editor.value, 'Some **text.', 'in the source, an edit at a time');
    editor.redo();
    editor.rawMode = false;
    equal(editor.value, 'Some **text**.');
    equal(editor.view.paragraphs[0].runs.find((run) => run.bold)?.text, 'text', 'formatted again');
    equal(editor.selection.caret, 13, 'the caret where it was in the text');
    editor.undo();
    equal(editor.value, 'Some text.', 'one undo: the document as it was before the source was shown');
    ok(!editor.rawMode);
});

test('the paragraph numbers of the two views agree', () => {
    const editor = makeEditor('# T\n\ntext\nmore\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```\nx\n```\n\n- i\n- j',
        { showParagraphNumbers: true });
    const numbersOf = () => {
        const view = editor.view, out = [];
        for (let i = 0; i < view.paragraphCount; i++) {
            const first = view.paragraphs[i].cell ? view.paragraphs[i].cell.column === 0 : true;
            if (first) out.push(view.getParagraphNumber(i));
        }
        return out;
    };
    const formatted = numbersOf();
    editor.rawMode = true;
    equal(numbersOf(), formatted, 'a number for each paragraph of the raw view, as the formatted view has them');
    ok(editor.showParagraphNumbers, 'the gutter stays');
});

test('formatting does nothing in the source; setting the value leaves it', () => {
    const editor = makeEditor('word', { rawMode: true });
    ok(editor.rawMode, 'started in the source');
    editor.select(2);
    editor.toggleInline('strong');
    editor.setHeadingLevel(1);
    equal(editor.value, 'word');
    editor.value = '# New';
    ok(!editor.rawMode);
    equal(editor.value, '# New');
});
