import { test, equal, ok } from './harness.js';
import { parseMarkdown } from '../src/markdown/parser.js';
import { parseInlines } from '../src/markdown/inlines.js';

// The tree in short: each block as "type" or "type(detail)", containers with their children in brackets.
function shape(source) {
    const walk = (block) => {
        let name = block.type;
        if (block.type === 'heading') name += block.level + (block.setext ? 's' : '');
        if (block.type === 'list') name += block.ordered ? '(ol)' : '(ul)';
        if (block.type === 'code_block') name += block.fenced ? '(fenced)' : '(indented)';
        if (block.type === 'html_block') name += '(' + block.htmlType + ')';
        return block.children.length ? `${name}[${block.children.map(walk).join(',')}]` : name;
    };
    return parseMarkdown(source).root.children.map(walk).join(',');
}

// The inlines in short: "type:source" for each, children in brackets.
function inlines(text) {
    const walk = (node) => {
        const own = node.type + ':' + text.slice(node.start, node.end);
        return node.children && node.children.length ? `${own}[${node.children.map(walk).join(' | ')}]` : own;
    };
    return parseInlines(text).map(walk).join(' | ');
}

test('paragraphs and headings', () => {
    equal(shape('a\nb\n\nc'), 'paragraph,paragraph');
    equal(shape('# A\ntext'), 'heading1,paragraph');
    equal(shape('A\n===\n\nB\n---'), 'heading1s,heading2s');
    equal(shape('###### six\n####### seven'), 'heading6,paragraph');
    equal(shape('#5 bolt'), 'paragraph');
});

test('thematic breaks and setext', () => {
    equal(shape('***\n- - -\n___'), 'thematic_break,thematic_break,thematic_break');
    equal(shape('a\n---'), 'heading2s');
    equal(shape('\n---'), 'thematic_break');
});

test('lists', () => {
    equal(shape('- a\n- b'), 'list(ul)[item[paragraph],item[paragraph]]');
    equal(shape('1. a\n2. b\n\n- c'), 'list(ol)[item[paragraph],item[paragraph]],list(ul)[item[paragraph]]');
    equal(shape('- a\n  - b\n- c'), 'list(ul)[item[paragraph,list(ul)[item[paragraph]]],item[paragraph]]');
    equal(shape('- a\n\n  b'), 'list(ul)[item[paragraph,paragraph]]');
    equal(shape('-\n- b'), 'list(ul)[item,item[paragraph]]');
    equal(shape('a\n2. b'), 'paragraph', 'only 1. interrupts a paragraph');
    equal(shape('a\n-'), 'heading2s', 'an empty item cannot interrupt a paragraph');
});

test('quotes and lazy lines', () => {
    equal(shape('> a\nb'), 'blockquote[paragraph]');
    equal(shape('> a\n>\n> b'), 'blockquote[paragraph,paragraph]');
    equal(shape('> # h\n> - x'), 'blockquote[heading1,list(ul)[item[paragraph]]]');
});

test('code', () => {
    equal(shape('```js\nlet a;\n```\ntext'), 'code_block(fenced),paragraph');
    equal(shape('    code\n\ntext'), 'code_block(indented),paragraph');
    const doc = parseMarkdown('```js\nlet a;\n\n```');
    const code = doc.root.children[0];
    equal(code.info, 'js');
    equal(code.lines.map((line) => line.line), [1, 2]);
    equal(code.fenceLines, [0, 3]);
    equal(shape('```\nnever closed\n# not a heading'), 'code_block(fenced)');
    equal(shape('> ```\n> a\n> ```'), 'blockquote[code_block(fenced)]');
});

test('html blocks', () => {
    equal(shape('<div>\n*a*\n</div>\n\ntext'), 'html_block(6),paragraph');
    equal(shape('<!-- c -->\ntext'), 'html_block(2),paragraph');
});

test('tables', () => {
    const doc = parseMarkdown('| a | b |\n|---|:-:|\n| 1 | 2 |\n3 | 4\n\nafter');
    const table = doc.root.children[0];
    equal(table.type, 'table');
    equal(table.alignments, [null, 'center']);
    equal(table.rows.length, 4);
    equal(table.rows[2].cells.map((cell) => doc.source.slice(cell.start, cell.end)), ['1', '2']);
    equal(table.rows[3].cells.map((cell) => doc.source.slice(cell.start, cell.end)), ['3', '4']);
    equal(doc.root.children[1].type, 'paragraph');
    equal(shape('a | b\n- | -'), 'table');
    equal(shape('a\n|-|-|'), 'paragraph', 'the header must have as many cells as the delimiter row');
});

test('front matter and definitions', () => {
    equal(shape('---\ntitle: x\n---\n# h'), 'front_matter,heading1');
    equal(shape('[a]: /url\n\n[a]'), 'definitions,paragraph');
    equal(shape('[a]: /url\ntext'), 'definitions,paragraph');
    const doc = parseMarkdown('[Foo Bar]: /u "t"\n\n[foo bar]');
    equal(doc.definitions.get('FOO BAR'), { destination: '/u', title: 't' });
    equal(doc.leaves[1].inlines[0].type, 'link');
});

test('the marks of a line', () => {
    const doc = parseMarkdown('> - a\n>   b');
    equal(doc.lineMarks[0].map((m) => m.kind + ':' + doc.source.slice(m.start, m.end)), ['quote:> ', 'item:- ']);
    equal(doc.lineMarks[1].map((m) => m.kind + ':' + doc.source.slice(m.start, m.end)), ['quote:> ', 'indent:  ']);
});

test('emphasis', () => {
    equal(inlines('*a* **b**'), 'em:*a*[text:a] | text:  | strong:**b**[text:b]');
    equal(inlines('***a***'), 'em:***a***[strong:**a**[text:a]]');
    equal(inlines('*a **b** c*'), 'em:*a **b** c*[text:a  | strong:**b**[text:b] | text: c]');
    equal(inlines('a*b*c'), 'text:a | em:*b*[text:b] | text:c');
    equal(inlines('a_b_c'), 'text:a_b_c');
    equal(inlines('* a *'), 'text:* a *');
    equal(inlines('==u== ~~s~~ ~b~ ^p^'),
        'underline:==u==[text:u] | text:  | strike:~~s~~[text:s] | text:  | sub:~b~[text:b] | text:  | sup:^p^[text:p]');
    equal(inlines('a = b'), 'text:a = b');
});

test('code, escapes, breaks', () => {
    equal(inlines('`a*b*` \\*'), 'code:`a*b*` | text:  | escape:\\*');
    equal(inlines('``a`b``'), 'code:``a`b``');
    equal(inlines('`a'), 'text:`a');
    equal(inlines('a  \nb\\\nc\nd'), 'text:a | hardbreak:  \n | text:b | hardbreak:\\\n | text:c | softbreak:\n | text:d');
});

test('links and images', () => {
    equal(inlines('[a *b*](http://x "t") ![i](p.png)'),
        'link:[a *b*](http://x "t")[text:a  | em:*b*[text:b]] | text:  | image:![i](p.png)[text:i]');
    const [link] = parseInlines('[a](<b c> \'t\')');
    equal([link.destination, link.title], ['b c', 't']);
    equal(inlines('[a](b'), 'text:[a](b');
    equal(inlines('<http://x.y> <a@b.cd> <span>'), 'autolink:<http://x.y> | text:  | autolink:<a@b.cd> | text:  | html:<span>');
    equal(inlines('[a [b](c)](d)'), 'text:[a  | link:[b](c)[text:b] | text:](d)');
});

test('inline offsets are offsets in the source', () => {
    const doc = parseMarkdown('> **bold** and\n> *more*');
    const [strong, , , em] = doc.leaves[0].inlines;
    equal(doc.source.slice(strong.start, strong.end), '**bold**');
    equal(doc.source.slice(em.start, em.end), '*more*');
    ok(doc.leaves[0].inlines.some((node) => node.type === 'softbreak' && doc.source[node.start] === '\n'));
});
