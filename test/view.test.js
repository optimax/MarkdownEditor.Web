// The view on its own, as TinyPad uses it: its own editing, the edits it tells its recorder of, and their replay.
import { test, equal } from './harness.js';
import { VirtualTextView, pos, plainParagraph } from '../src/index.js';

function makeView(paragraphs, styleProvider) {
    const stage = document.getElementById('stage');
    stage.replaceChildren();
    const edits = [];
    const view = new VirtualTextView(stage, { styleProvider, editRecorder: { recordEdit: (edit) => edits.push(edit) } });
    view.setParagraphs(paragraphs);
    return { view, edits };
}

const typeText = (view, text) => view._command('insertText', text);

test('typing, Enter and Backspace, each one edit', () => {
    const { view, edits } = makeView(['Hello', 'world']);
    view.setCaret(pos(0, 5));
    typeText(view, ',');
    view._command('enter');
    typeText(view, 'big');
    equal(view.getText(), 'Hello,\nbig\nworld');
    view._command('backspace');
    view.setCaret(pos(2, 0));
    view._command('backspace');
    equal(view.getText(), 'Hello,\nbiworld');
    equal(edits.length, 5, 'a comma, Enter, a word, Backspace, and the Backspace that joins');
    for (const edit of [...edits].reverse()) view.applyEdit(edit.inverse());
    equal(view.getText(), 'Hello\nworld');
    for (const edit of edits) view.applyEdit(edit);
    equal(view.getText(), 'Hello,\nbiworld');
});

test('Enter at the end of a heading goes on in its next style', () => {
    const styles = { getParagraphStyle: (id) => (id === 'h1' ? { fontSize: 28, nextStyleId: 'normal' } : {}) };
    const { view } = makeView([{ styleId: 'h1', runs: [{ text: 'Title' }] }], styles);
    view.setCaret(pos(0, 5));
    view._command('enter');
    equal([view.getParagraph(0).styleId, view.getParagraph(1).styleId], ['h1', 'normal']);
});

test('character styles over a selection, one undo step', () => {
    const { view, edits } = makeView(['abcdef']);
    view.mapCharacterStyles(pos(0, 1), pos(0, 3), () => 'b');
    equal(view.getParagraph(0).runs.map((run) => [run.text, run.styleId ?? null]), [['a', null], ['bc', 'b'], ['def', null]]);
    view.setCaret(pos(0, 3));
    typeText(view, 'X');
    equal(view.getCharacterStyleIdAt(pos(0, 4)), 'b', 'typed text takes the format of the text before it');
    view.applyEdit(edits[1].inverse());
    view.applyEdit(edits[0].inverse());
    equal(view.getParagraph(0).runs.map((run) => run.styleId ?? null), [null]);
});

test('a host that does the edits itself', () => {
    const { view, edits } = makeView(['one', 'two']);
    view.addEventListener('editcommand', (event) => {
        event.preventDefault();
        if (event.detail.command === 'insertText') {
            view.replaceParagraphs(0, 1, [plainParagraph(event.detail.text.toUpperCase())]);
        }
    });
    view.setCaret(pos(1, 1));
    typeText(view, 'abc');
    equal(view.getText(), 'ABC\ntwo');
    equal(view.caret, pos(1, 1), 'the caret after the replaced paragraphs is where it was');
    equal(edits.length, 0, 'nothing is recorded for the host');
});

test('positions, text and selection', () => {
    const { view } = makeView(['ab', 'cde']);
    view.select(pos(0, 1), pos(1, 2));
    equal(view.selectedText, 'b\ncd');
    view.selectAll();
    equal(view.selection, { start: pos(0, 0), end: pos(1, 3) });
    view.setCaret(pos(9, 9));
    equal(view.caret, pos(1, 3), 'clamped to the document');
});
