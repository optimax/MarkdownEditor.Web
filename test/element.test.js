// <markdown-editor>: the Markdown written in it, and the form field it is.
import { test, equal } from './harness.js';
import '../src/element.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function staged(html) {
    const stage = document.getElementById('stage');
    stage.innerHTML = html;
    await tick();
    return stage;
}

test('a <template> is read as the Markdown written in it: a quote\'s ">", an "&", and its HTML', async () => {
    const stage = await staged('<markdown-editor style="height: 200px"><template>\n' +
        '  > A quote\n\n  R&D, a < b, <kbd>Ctrl</kbd><br> <!-- a note -->\n</template></markdown-editor>');
    equal(stage.querySelector('markdown-editor').value, '> A quote\n\nR&D, a < b, <kbd>Ctrl</kbd><br> <!-- a note -->');
});

test('the element\'s attributes, at first and changed; its linkclick passed on to the page', async () => {
    const stage = await staged('<markdown-editor readonly theme="dark" toolbar="undo redo | strong" paragraph-numbers ' +
        'screen-reader="on" value="[a](https://x.y)" style="height: 200px"></markdown-editor>');
    const element = stage.querySelector('markdown-editor');
    const editor = element.editor;
    const state = () => [editor.readOnly, editor.theme.background, editor.toolbarItems, editor.showParagraphNumbers,
        editor.screenReader];
    equal(state(), [true, '#1e1f22', ['undo', 'redo', '|', 'strong'], true, 'on'], 'at first');
    equal(element.value, '[a](https://x.y)', 'its value attribute');
    element.removeAttribute('readonly');
    element.setAttribute('theme', 'light');
    element.setAttribute('toolbar', 'false');
    element.removeAttribute('paragraph-numbers');
    element.setAttribute('screen-reader', 'off');
    equal(state(), [false, '#ffffff', [], false, 'off'], 'changed');
    let href = null;
    stage.addEventListener('linkclick', (event) => {
        href = event.detail.href;
        event.preventDefault();
    }, { once: true });
    const opened = [], open = window.open;
    window.open = (...args) => opened.push(args);
    try {
        const link = { target: 'https://x.y', title: null };
        editor.view.dispatchEvent(new CustomEvent('hyperlinkclick', { detail: { link } }));
    } finally {
        window.open = open;
    }
    equal([href, opened.length], ['https://x.y', 0], 'the page took the link: nothing opened');
    stage.replaceChildren();
});

test('input and change follow the user\'s changes only, as a <textarea>\'s: not a script\'s, a reset, a src file', async () => {
    const stage = await staged('<form><markdown-editor name="body" style="height: 200px"></markdown-editor></form>');
    const form = stage.querySelector('form'), element = form.querySelector('markdown-editor');
    const events = [];
    for (const type of ['input', 'change']) stage.addEventListener(type, () => events.push(type));
    let changes = 0;
    element.editor.addEventListener('change', () => changes++);
    element.value = '# Set';
    form.reset();
    equal([events, changes], [[], 2], 'a script\'s value and a form\'s reset: the editor\'s change only');
    element.editor.select(0);
    element.editor.view.input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x',
        cancelable: true }));
    equal([events, element.value, new FormData(form).get('body')], [['input', 'change'], 'x', 'x'], 'typed');
    events.length = 0;
    element.setAttribute('src', '../demo/sample.md');
    for (let i = 0; i < 100 && !element.value.startsWith('# Markdown'); i++) await new Promise((r) => setTimeout(r, 20));
    equal([events, new FormData(form).get('body') === element.value], [[], true], 'a src file loaded');
    stage.replaceChildren();
});

test('a form\'s reset brings back the Markdown the element was given, and the form sends it', async () => {
    const stage = await staged('<form><markdown-editor name="body" style="height: 200px">' +
        '<script type="text/markdown">\n# Initial\n</script></markdown-editor>' +
        '<markdown-editor name="other" value="*x*" style="height: 200px"></markdown-editor></form>');
    const form = stage.querySelector('form');
    const [body, other] = form.querySelectorAll('markdown-editor');
    body.value = '# Changed';
    other.value = 'y';
    equal(new FormData(form).get('body'), '# Changed');
    form.reset();
    equal([body.value, other.value], ['# Initial', '*x*']);
    equal(new FormData(form).get('body'), '# Initial');
    stage.replaceChildren();
});
