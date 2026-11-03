// The projection: what the view shows of a source, and the map between them. A paragraph is written as its text with
// ⟦hidden⟧ syntax, as MaxPad.Projection's RevealTests write theirs.
import { test, equal, ok } from './harness.js';
import { parseMarkdown } from '../src/markdown/parser.js';
import { project, viewRunsOf } from '../src/markdown/projection.js';

const projected = (source, caret = null) => {
    const doc = parseMarkdown(source);
    const projection = project(doc);
    return projection.paragraphs.map((p) => {
        const { runs } = viewRunsOf(p, caret, doc);
        // (⟦hidden⟧, and ⟨concealed⟩: there, keeping its line's height, but drawn in no ink)
        const write = (run) => {
            if (run.hidden) return `⟦${run.text}⟧`;
            return run.styleId?.includes('concealed') ? `⟨${run.text}⟩` : run.text;
        };
        return runs.map(write).join('');
    });
};

const styles = (source) => project(parseMarkdown(source)).paragraphs.map((p) => p.styleId);

test('blank lines: the first separates, each further one is an empty paragraph', () => {
    equal(projected('a\n\nb'), ['a', 'b']);
    equal(projected('a\n\n\nb'), ['a', '', 'b']);
    equal(projected('a\n'), ['a']);
    equal(projected('a\n\n'), ['a', '']);
    equal(projected(''), ['']);
    equal(projected('\n\na'), ['', '', 'a']);
    equal(projected('> a\n>\n>'), ['⟦> ⟧a', '⟨>⟩']);
    equal(projected('-'), ['⟨-⟩']);
});

test('syntax is hidden, and shown at the caret', () => {
    equal(projected('# Title'), ['⟦# ⟧Title']);
    equal(projected('a **b** c'), ['a ⟦**⟧b⟦**⟧ c']);
    equal(projected('a **b** c', 3), ['a **b** c']);
    equal(projected('a **b** c', 0), ['a ⟦**⟧b⟦**⟧ c']);
    equal(projected('[x](http://y)'), ['⟦[⟧x⟦](http://y)⟧']);
    equal(projected('a\\*b'), ['a⟦\\⟧*b']);
    equal(projected('> a\n> b'), ['⟦> ⟧a ⟦> ⟧b']);
});

test('styles of paragraphs', () => {
    equal(styles('# a\n\np\n\n> q\n\n- b\n\n1. n\n\n- [ ] t'), ['h1', 'p', 'p.q1', 'bullet.l1', 'list.l1', 'check.l1']);
    equal(styles('```\nx\n```'), ['code-fence', 'code', 'code-fence-close']);
    equal(styles('---'), ['hr']);
    equal(styles('| a |\n|---|\n| b |'), ['table-header', 'table-cell']);
});

test('every paragraph is its stretch of the source', () => {
    const source = '# T\n\n> q *e*\n> r\n\n- a\n  - b\n\n```js\nx\n```\n\n| a | b |\n|---|---|\n| 1 |\n\n---\n\n\ntext';
    const doc = parseMarkdown(source);
    const projection = project(doc);
    let last = -1;
    for (const p of projection.paragraphs) {
        equal(p.text.length, p.end - p.start, `the text of "${p.text}" is as long as its source`);
        ok(p.start > last || (p.start === last && p.length === 0), 'in the order of the source');
        last = p.start;
        for (let i = 0; i <= p.length; i++) {
            const view = projection.toView(p.start + i);
            const back = projection.toSource(view);
            equal(back, p.start + i, 'a position goes to the view and back');
        }
    }
});

test('list markers', () => {
    const doc = parseMarkdown('- a\n  - b\n\n3. c\n4. d');
    const markers = project(doc).paragraphs.map((p) => p.listMarker);
    equal(markers, ['•', '◦', '3.', '4.']);
    const first = project(doc).paragraphs[0];
    equal(viewRunsOf(first, 2, doc).listMarker, null, 'the caret on the item shows its own marker instead');
    equal(viewRunsOf(first, 2, doc).markerTextLength, 2);
});
