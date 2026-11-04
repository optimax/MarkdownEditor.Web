// Reading a source again in part (MarkdownState.edited): after every change, the document and the projection are what
// a whole reading of the new source makes of it -- every line, mark, block, definition and paragraph, field by field.
import { test, equal, ok } from './harness.js';
import { MarkdownState } from '../src/markdown/state.js';

// A state as plain data: its lines, their marks and whether a parse began each with no block open, its blocks (every
// field but the parent; a block met again as its number), its definitions and leaves, and its paragraphs (every field;
// a table's number, which only tells tables apart, left out).
function canonical(state) {
    const blocks = new Map();
    const visit = (block) => {
        blocks.set(block, blocks.size);
        block.children.forEach(visit);
    };
    visit(state.doc.root);
    const plain = (value) => {
        if (value === null || typeof value !== 'object') return value;
        if (blocks.has(value)) return `#${blocks.get(value)}`;
        if (Array.isArray(value)) return value.map(plain);
        if (ArrayBuffer.isView(value)) return [...value];
        const out = {};
        for (const key of Object.keys(value).sort()) {
            if (key !== 'parent' && key !== '_key' && key !== 'id') out[key] = plain(value[key]);
        }
        return out;
    };
    const blockData = [...blocks.keys()].map((block) => {
        const out = {};
        for (const key of Object.keys(block).sort()) {
            if (key !== 'parent') out[key] = key === 'children' ? block.children.map(plain) : plain(block[key]);
        }
        return out;
    });
    return {
        lines: state.doc.lines.map(({ start, end }) => [start, end]), marks: plain(state.doc.lineMarks),
        fresh: [...state.doc.fresh], blocks: blockData, leaves: state.doc.leaves.map(plain),
        definitions: [...state.doc.definitions.entries()], paragraphs: plain(state.paragraphs),
        caretTable: plain(state.projection.caretTable ?? null),
    };
}

// The first difference between two plain values, as a path and the two values there (null if none).
function firstDifference(a, b, path = '') {
    if (JSON.stringify(a) === JSON.stringify(b)) return null;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            const found = firstDifference(a[key], b[key], `${path}.${key}`);
            if (found) return found;
        }
    }
    return `${path}: ${JSON.stringify(a)?.slice(0, 160)} instead of ${JSON.stringify(b)?.slice(0, 160)}`;
}

const DOCUMENTS = [
    '# Title\n\nA paragraph with **bold**, *italic* and `code`.\nIts second line.\n\n## Two\n\n' +
        'More text, [a link](http://x.y).',
    '- one\n- two\n  - three\n\n  more of two\n\n1. a\n2. b\n\n> quote\n> more\n>\n> - in a quote\n\nafter',
    '```js\nlet a = 1;\n\nlet b = 2;\n```\n\ntext\n\n    indented code\n\n~~~\nfence\n~~~\n\n---\n\nend',
    '| a | b |\n|---|:-:|\n| 1 | 2 |\n| 3 | 4 |\n\nAfter the table.\n\n| x |\n|---|\n| y |',
    'Setext\n======\n\nAnother\n---\n\n<div>\nhtml\n</div>\n\n<!-- comment\nstill -->\n\n- [ ] task\n- [x] done',
    'plain\n\n\n\nblank lines\n\n\n> \n> quoted blank\n\n- item\n\n\n- far item\n\ntext [ref] here\n\n[ref]: /url "t"',
    '---\ntitle: front\n---\n\n# After front matter\n\nText.\n\n* a\n* b\n\n+ c\n\nlast line',
];

// What is typed or taken away: characters that make and unmake blocks, and plain ones.
const PIECES = ['\n', '\n\n', '#', '# ', '- ', '> ', '```', '|', '*', '**', ' ', 'a', 'word', '[', ']', '(x)', '1. ',
    '---', '===', '    ', '`', '<div>', '[ref]: /u', '~~~', '\t'];

function random(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

test('a source read again in part is what a whole reading makes of it', () => {
    const steps = Number(new URLSearchParams(location.search).get('steps') ?? 40) * 3;
    let partial = 0, total = 0;
    DOCUMENTS.forEach((document, d) => {
        for (let seed = 1; seed <= 3; seed++) {
            const next = random(seed * 104729 + d);
            // (a long document: the change lands among many blocks, as in a real one)
            const source0 = [document, DOCUMENTS[(d + 1) % DOCUMENTS.length].replace(/^---\n[^]*?\n---\n/, ''), document
                .replace(/^---\n[^]*?\n---\n/, '')].join('\n\n');
            let state = new MarkdownState(source0, { caret: 0 });
            for (let step = 0; step < steps; step++) {
                const source = state.source;
                const start = Math.floor(next() * (source.length + 1));
                const remove = next() < 0.4 ? Math.min(source.length - start, Math.floor(next() * 6)) : 0;
                const piece = next() < 0.75 ? PIECES[Math.floor(next() * PIECES.length)] : '';
                if (!remove && !piece) continue;
                const after = source.slice(0, start) + piece + source.slice(start + remove);
                const caret = start + piece.length;
                const change = { start, removed: remove, inserted: piece.length };
                const read = MarkdownState.edited(state, after, change, { caret });
                const whole = new MarkdownState(after, { caret });
                total++;
                if (read.window) partial++;
                const difference = firstDifference(canonical(read), canonical(whole));
                if (difference) {
                    throw new Error(`document ${d}, seed ${seed}, step ${step}: ${JSON.stringify(piece)} at ${start}` +
                        ` (${remove} taken) gives ${difference}\nsource: ${JSON.stringify(after)}`);
                }
                state = read;
            }
        }
    });
    ok(partial > total / 2, `most changes read in part (${partial} of ${total})`);
});

test('a change read again in part reads only the blocks around it', () => {
    const blocks = Array.from({ length: 200 }, (_, i) => `## Heading ${i}\n\nParagraph ${i} with *some* text.`);
    const source = blocks.join('\n\n');
    const state = new MarkdownState(source, { caret: 0 });
    const at = source.indexOf('Paragraph 100') + 'Paragraph 100'.length;
    const after = source.slice(0, at) + '!' + source.slice(at);
    const read = MarkdownState.edited(state, after, { start: at, removed: 0, inserted: 1 }, { caret: at + 1 });
    ok(read.window, 'read in part');
    equal(read.window.to - read.window.from, 2, 'the paragraph changed, and the blank line after it');
    equal(read.paragraphs.length, 400);
    equal(read.paragraphs[201].text, 'Paragraph 100! with *some* text.');
    const whole = new MarkdownState(after, { caret: at + 1 });
    equal(JSON.stringify(canonical(read)), JSON.stringify(canonical(whole)));
    const defined = after.replace('Paragraph 100!', '[x]: /y\n\nParagraph 100!');
    const edit = { start: after.indexOf('Paragraph 100!'), removed: 0, inserted: '[x]: /y\n\n'.length };
    equal(MarkdownState.edited(read, defined, edit, { caret: 0 }).window, undefined,
        'a definition changes what every link means: read whole');
});
