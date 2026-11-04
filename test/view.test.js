// The view on its own, as TinyPad uses it: its own editing, the edits it tells its recorder of, and their replay.
import { test, equal, ok } from './harness.js';
import { VirtualTextView, GutterContent, pos, plainParagraph } from '../src/index.js';

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

test('paragraph numbers in the gutter, a table\'s row being one', () => {
    const table = { columns: 2 };
    const cell = (text, row, column) => ({ runs: [{ text }], cell: { table, row, column } });
    const { view } = makeView([plainParagraph('a'), cell('h1', 0, 0), cell('h2', 0, 1), cell('c1', 1, 0), cell('c2', 1, 1),
        plainParagraph('b'), { runs: [{ text: '---', hidden: true }] }]);
    equal([0, 1, 2, 3, 4, 5, 6].map((i) => view.getParagraphNumber(i)), [1, 2, 2, 3, 3, 4, 5]);
    const left = view.content.getBoundingClientRect().left;
    const shown = () => [...view.gutter.querySelectorAll('.vtv-gutter-label')]
        .filter((label) => label.style.display !== 'none').map((label) => label.textContent);
    equal(shown(), [], 'no gutter by default');
    view.leftGutterContent = GutterContent.ParagraphNumbers;
    ok(view.content.getBoundingClientRect().left > left, 'the gutter takes room left of the text');
    equal(shown(), ['1', '2', '3', '4'], 'one number a row; none for a line with nothing to see');
    const first = view.gutter.querySelector('.vtv-gutter-label').getBoundingClientRect();
    const text = view.content.querySelector('.vtv-run').getBoundingClientRect();
    ok(first.bottom > text.top && first.top < text.bottom, 'a number is on its paragraph\'s first line');
    view.leftGutterContent = GutterContent.None;
    equal(shown(), []);
    equal(view.content.getBoundingClientRect().left, left, 'and its room is given back');
});

test('style names in the gutter, outside the numbers', () => {
    const styles = { getParagraphStyle: (id) => (id === 'h1' ? { name: 'Heading 1', fontSize: 28 } : {}) };
    const { view } = makeView([{ styleId: 'h1', runs: [{ text: 'Title' }] }, { styleId: 'odd', runs: [{ text: 'x' }] },
        plainParagraph('y')], styles);
    const shown = (selector) => [...view.gutter.querySelectorAll(selector)]
        .filter((label) => label.style.display !== 'none');
    const left = view.content.getBoundingClientRect().left;
    view.leftGutterContent = GutterContent.StyleNames;
    equal(shown('.vtv-gutter-name').map((name) => name.textContent), ['Heading 1', 'odd'],
        'the style\'s name, else its ID; nothing for no style');
    equal(shown('.vtv-gutter-label'), [], 'no numbers');
    const namesOnly = view.content.getBoundingClientRect().left;
    ok(namesOnly > left, 'the names take room');
    view.leftGutterContent = GutterContent.StyleNames | GutterContent.ParagraphNumbers;
    ok(view.content.getBoundingClientRect().left > namesOnly, 'and the numbers more');
    const name = shown('.vtv-gutter-name')[0].getBoundingClientRect();
    const number = shown('.vtv-gutter-label')[0].getBoundingClientRect();
    ok(name.right < number.left, 'the names left of the numbers');
    ok(Math.abs(name.bottom - number.bottom) < 1, 'on the same line');
    view.paragraphLabels = (index) => (index === 0 ? 'Mine' : index === 1 ? '' : null);
    equal(shown('.vtv-gutter-name').map((label) => label.textContent), ['Mine'], 'the host\'s names first');
    view.paragraphLabels = (index) => (index === 0 ? 'A name much too long to fit in the column' : null);
    const long = shown('.vtv-gutter-name')[0];
    ok(long.scrollWidth > long.clientWidth, 'a long name is cut to its column');
    view.leftGutterContent = GutterContent.None;
    equal(view.content.getBoundingClientRect().left, left, 'and the room given back');
});

test('the outline: a heading folds what it heads, and the caret steps over it', () => {
    const styles = { getParagraphStyle: (id) => (/^h\d$/.test(id ?? '') ? { outlineLevel: +id[1], fontSize: 24 } : {}) };
    const h = (level, text) => ({ styleId: 'h' + level, runs: [{ text }] });
    const { view } = makeView([h(1, 'A'), plainParagraph('a1'), h(2, 'B'), plainParagraph('b1'), h(1, 'C'),
        plainParagraph('c1')], styles);
    view.leftGutterContent = GutterContent.Outline;
    const marks = () => [...view.gutter.querySelectorAll('.vtv-outline-mark')].filter((m) => m.style.display !== 'none');
    equal(marks().map((mark) => mark._index), [0, 2, 4], 'a mark beside each heading with something under it');
    equal([0, 1, 2, 3, 4].map((i) => view.isCollapsible(i)), [true, false, true, false, true]);
    marks()[0].click();
    ok(view.isCollapsed(0), 'a click on the mark collapses its heading');
    equal([1, 2, 3, 4].map((i) => view.isFolded(i)), [true, true, true, false], 'down to the next heading of its level');
    equal(view.content.children.length, 3, 'what is folded is not drawn');
    view.setCaret(pos(0, 1));
    view._move((p) => view._charMove(p, 1), false, 1);
    equal(view.caret, pos(4, 0), 'Right steps over the folded part');
    view._vertical(-1, false);
    equal(view.caret.paragraph, 0, 'and so does Up');
    view.replaceParagraphs(0, 1, [h(1, 'A')]);
    ok(view.isCollapsed(0), 'a heading replaced by its like stays collapsed');
    view.setCaret(pos(3, 0));
    ok(!view.isCollapsed(0) && !view.isFolded(3), 'a caret put into a folded part opens it');
    view.collapseAll();
    equal([0, 2, 4].map((i) => view.isCollapsed(i)), [true, true, true]);
    view.expandAll();
    equal(view.paragraphs.map((_, i) => view.isFolded(i)), [false, false, false, false, false, false]);
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
