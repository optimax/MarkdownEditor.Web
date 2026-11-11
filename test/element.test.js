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
