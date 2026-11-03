// MarkdownEditor: the WYSIWYG Markdown editor as a component a page plugs in. It puts a VirtualTextView (and, if wanted,
// a toolbar) into an element of the page, shows the Markdown it is given as formatted text, and edits the Markdown as
// the user edits what they see. The page reads the Markdown back with `value` (or `getMarkdown()`), and is told of each
// change ('change').
//
//   const editor = new MarkdownEditor(document.querySelector('#editor'), { markdown: '# Hello', theme: 'dark' });
//   editor.addEventListener('change', () => save(editor.value));

import { VirtualTextView } from './view/VirtualTextView.js';
import { MarkdownController } from './markdown/controller.js';
import { MarkdownStyleProvider, LIGHT_THEME, DARK_THEME } from './markdown/styleProvider.js';

const CSS = `
.mde { display: flex; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 200px;
  border: 1px solid var(--mde-line); border-radius: 8px; overflow: hidden; background: var(--mde-bg); color: var(--mde-ink); }
.mde-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 4px 6px;
  border-bottom: 1px solid var(--mde-line); background: var(--mde-bar); }
.mde-toolbar button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center;
  min-width: 30px; height: 30px; padding: 0 6px; border-radius: 6px; cursor: pointer; color: var(--mde-ink);
  font: 600 13px system-ui, -apple-system, "Segoe UI", sans-serif; }
.mde-toolbar button:hover { background: var(--mde-hover); }
.mde-toolbar button:focus-visible { outline: 2px solid var(--mde-accent); outline-offset: -2px; }
.mde-toolbar button[aria-pressed="true"] { background: var(--mde-pressed); color: var(--mde-accent); }
.mde-toolbar button:disabled { opacity: 0.4; cursor: default; }
.mde-toolbar svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round;
  stroke-linejoin: round; }
.mde-toolbar .mde-sep { width: 1px; height: 20px; margin: 0 4px; background: var(--mde-line); }
.mde-toolbar select { font: 13px system-ui, sans-serif; height: 28px; border: 1px solid var(--mde-line); border-radius: 6px;
  background: var(--mde-bg); color: var(--mde-ink); padding: 0 4px; }
.mde-body { position: relative; flex: 1; min-height: 0; }
.mde-body > .vtv { position: absolute; inset: 0; min-height: 0; }
`;

let injected = false;
function injectStyles() {
    if (injected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
    injected = true;
}

const ICONS = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    strong: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
    em: '<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
    strike: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><path d="M4 12h16"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2' +
        '-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11' +
        'c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    bullet: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/>' +
        '<circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    number: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/>' +
        '<path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    task: '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/>' +
        '<path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    codeblock: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 9-3 3 3 3"/><path d="m14 15 3-3-3-3"/>',
    rule: '<path d="M3 12h18"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>' +
        '<path d="M9 3v18"/><path d="M15 3v18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
        '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/>' +
        '<path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    marks: '<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>',
};

/** The toolbar's items, in order ('|' a separator): what `toolbar: true` shows. */
export const DEFAULT_TOOLBAR = ['undo', 'redo', '|', 'block', '|', 'strong', 'em', 'underline', 'strike', 'code', '|',
    'quote', 'bullet', 'number', 'task', 'codeblock', '|', 'link', 'image', 'table', 'rule', '|', 'marks'];

const LABELS = {
    undo: 'Undo (Ctrl+Z)', redo: 'Redo (Ctrl+Y)', strong: 'Bold (Ctrl+B)', em: 'Italic (Ctrl+I)', underline: 'Underline (Ctrl+U)',
    strike: 'Strikethrough (Ctrl+Shift+X)', code: 'Inline code (Ctrl+`)', quote: 'Quote (Ctrl+Alt+Q)',
    bullet: 'Bullet list (Ctrl+Shift+8)', number: 'Numbered list (Ctrl+Shift+7)', task: 'Task list (Ctrl+Shift+9)',
    codeblock: 'Code block (Ctrl+Alt+C)', link: 'Link (Ctrl+K)', image: 'Picture', table: 'Table',
    rule: 'Horizontal line (Ctrl+Alt+L)', marks: 'Paragraph marks', block: 'Paragraph type (Ctrl+Alt+0 to 6)',
};

const BLOCK_OPTIONS = [['paragraph', 'Paragraph'], ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'],
    ['h4', 'Heading 4'], ['h5', 'Heading 5'], ['h6', 'Heading 6']];

export class MarkdownEditor extends EventTarget {
    /**
     * @param {HTMLElement|string} target The element (or a selector of it) the editor goes into; it fills it.
     * @param {object} [options] { markdown, theme ('light' | 'dark' | a theme object), toolbar (true, false, or a list
     *   of DEFAULT_TOOLBAR's items), readOnly, revealSyntax (the syntax at the caret shown; true by default),
     *   revealUnfocused (shown while the editor has no focus too; false by default), showFormattingMarks,
     *   imageBase (the URL relative pictures are loaded from), openLinks (Ctrl+click opens a link in a new tab; true
     *   by default), prompt (an async function (question, value) asking the user for a link's or a picture's
     *   address; window.prompt by default) }
     */
    constructor(target, options = {}) {
        super();
        injectStyles();
        const host = typeof target === 'string' ? document.querySelector(target) : target;
        if (!host) throw new Error('MarkdownEditor: no element to put the editor in.');
        this.options = { toolbar: true, openLinks: true, ...options };
        this.host = host;
        this.root = document.createElement('div');
        this.root.className = 'mde';
        this.body = document.createElement('div');
        this.body.className = 'mde-body';
        this.root.append(this.body);
        host.append(this.root);

        this.styles = new MarkdownStyleProvider(themeOf(this.options.theme));
        this.view = new VirtualTextView(this.body, {
            styleProvider: this.styles, readOnly: this.options.readOnly, acceptsTab: true,
            showFormattingMarks: this.options.showFormattingMarks, label: this.options.label ?? 'Markdown editor',
            padding: this.options.padding ?? [16, 24, 24, 24],
        });
        if (this.options.imageBase) this.imageBase = this.options.imageBase;
        this.controller = new MarkdownController(this.view, {
            markdown: this.options.markdown ?? '', revealSyntax: this.options.revealSyntax !== false,
            revealUnfocused: this.options.revealUnfocused === true,
        });
        this._applyThemeColors();
        this._buildToolbar();
        this._bindKeys();
        this.controller.addEventListener('change', () => {
            this._refreshToolbar();
            this.dispatchEvent(new Event('change'));
            this.options.onChange?.(this);
        });
        this.controller.addEventListener('selectionchange', () => {
            this._refreshToolbar();
            this.dispatchEvent(new Event('selectionchange'));
        });
        this.view.addEventListener('hyperlinkclick', (event) => this._onLinkClick(event));
        this._refreshToolbar();
    }

    // ---- The document ------------------------------------------------------------------------------------------------

    /** The Markdown being edited (in the line endings it was given in). Setting it loads a new document. */
    get value() {
        return this.controller.getMarkdown();
    }

    set value(markdown) {
        this.controller.load(String(markdown ?? ''));
    }

    getMarkdown() {
        return this.controller.getMarkdown();
    }

    setMarkdown(markdown) {
        this.value = markdown;
    }

    /** Counts every change of the document: a saved document's version is a clean one. */
    get version() {
        return this.controller.version;
    }

    get readOnly() {
        return this.view.readOnly;
    }

    set readOnly(value) {
        this.view.readOnly = !!value;
        this._refreshToolbar();
    }

    /** 'light', 'dark' or a theme object (see styleProvider.js), over the light theme. */
    set theme(theme) {
        this.options.theme = theme;
        this.styles.theme = { ...LIGHT_THEME, ...themeOf(theme) };
        this.view.invalidateStyles();
        this._applyThemeColors();
    }

    get theme() {
        return this.styles.theme;
    }

    /** Where relative picture addresses are loaded from (a URL). */
    set imageBase(base) {
        this._imageBase = base;
        this.view.imageResolver = (src) => {
            try {
                return new URL(src, new URL(base, location.href)).href;
            } catch {
                return src;
            }
        };
    }

    get imageBase() {
        return this._imageBase;
    }

    get showFormattingMarks() {
        return this.view.showFormattingMarks;
    }

    set showFormattingMarks(value) {
        this.view.showFormattingMarks = value;
        this._refreshToolbar();
    }

    /** The scale the document is shown at (1 is 100%). */
    get zoom() {
        return this.view.zoom;
    }

    set zoom(value) {
        this.view.zoom = value;
    }

    /** The selection in the Markdown: { anchor, caret }, offsets in the source with "\n" line endings. */
    get selection() {
        return { ...this.controller.selection };
    }

    /** Selects from `anchor` to `caret` (offsets in the source with "\n" line endings), and scrolls it into view. */
    select(anchor, caret = anchor) {
        this.controller.select(anchor, caret);
    }

    focus() {
        this.view.focus();
    }

    /** Takes the editor out of the page. */
    destroy() {
        this.view.destroy();
        this.root.remove();
    }

    // ---- Commands ----------------------------------------------------------------------------------------------------

    undo() {
        this.controller.undo();
    }

    redo() {
        this.controller.redo();
    }

    get canUndo() {
        return this.controller.canUndo;
    }

    get canRedo() {
        return this.controller.canRedo;
    }

    /** Toggles an inline format: 'strong', 'em', 'underline', 'strike', 'code', 'sub', 'sup'. */
    toggleInline(format) {
        if (!this.readOnly) this.controller.toggleInline(format);
    }

    isInline(format) {
        return this.controller.isInline(format);
    }

    /** 'paragraph', 'h1' to 'h6', 'quote', 'bullet', 'number', 'task' or 'code' (a toggle, as the toolbar's buttons). */
    setBlockType(type) {
        if (!this.readOnly) this.controller.setBlockType(type);
    }

    get blockType() {
        return this.controller.blockType;
    }

    insertTable(columns = 3, rows = 2) {
        if (!this.readOnly) this.controller.insertTable(columns, rows);
    }

    insertRule() {
        if (!this.readOnly) this.controller.insertRule();
    }

    insertCodeBlock(language = '') {
        if (!this.readOnly) this.controller.insertCodeBlock(language);
    }

    insertLink(address, title = '') {
        if (!this.readOnly) this.controller.insertLink(address, title);
    }

    insertImage(address, description = '') {
        if (!this.readOnly) this.controller.insertImage(address, description);
    }

    /** Asks for a link's address (the page's `prompt`, or the browser's) and makes the selection a link to it. */
    async promptLink() {
        if (this.readOnly) return;
        const current = this.controller.linkAtCaret();
        const address = await this._ask('Link address:', current?.destination ?? 'https://');
        this.focus();
        if (address && address !== 'https://') this.insertLink(address.trim());
    }

    async promptImage() {
        if (this.readOnly) return;
        const address = await this._ask('Picture address:', '');
        this.focus();
        if (address) this.insertImage(address.trim(), '');
    }

    async _ask(question, value) {
        if (this.options.prompt) return this.options.prompt(question, value);
        return window.prompt(question, value);
    }

    /** A command by name, as the toolbar runs it ('strong', 'h2', 'bullet', 'undo', 'table', 'link'...). */
    execute(name) {
        if (['strong', 'em', 'underline', 'strike', 'code', 'sub', 'sup'].includes(name)) return this.toggleInline(name);
        if (/^h[1-6]$/.test(name) || ['paragraph', 'quote', 'bullet', 'number', 'task'].includes(name)) {
            return this.setBlockType(name);
        }
        switch (name) {
            case 'undo': return this.undo();
            case 'redo': return this.redo();
            case 'codeblock': return this.setBlockType('code');
            case 'rule': return this.insertRule();
            case 'table': return this.insertTable();
            case 'link': return this.promptLink();
            case 'image': return this.promptImage();
            case 'marks':
                this.showFormattingMarks = !this.showFormattingMarks;
                return undefined;
            default:
                throw new Error(`MarkdownEditor: no command "${name}".`);
        }
    }

    // ---- Keys, toolbar, links ---------------------------------------------------------------------------------------

    // The keys (MaxPad's where a browser leaves them to the page; Ctrl+Alt+digits for the paragraph types, as TinyPad's,
    // since Ctrl+1 to Ctrl+6 switch a browser's tabs).
    _bindKeys() {
        const keys = this.view.keymap;
        const run = (fn) => () => {
            fn();
            return true;
        };
        keys.set('Ctrl+Z', run(() => this.undo()));
        keys.set('Ctrl+Y', run(() => this.redo()));
        keys.set('Ctrl+Shift+Z', run(() => this.redo()));
        keys.set('Ctrl+B', run(() => this.toggleInline('strong')));
        keys.set('Ctrl+I', run(() => this.toggleInline('em')));
        keys.set('Ctrl+U', run(() => this.toggleInline('underline')));
        keys.set('Ctrl+Shift+X', run(() => this.toggleInline('strike')));
        keys.set('Ctrl+`', run(() => this.toggleInline('code')));
        keys.set('Ctrl+K', run(() => this.promptLink()));
        keys.set('Ctrl+Alt+0', run(() => this.setBlockType('paragraph')));
        for (let level = 1; level <= 6; level++) keys.set(`Ctrl+Alt+${level}`, run(() => this.setBlockType('h' + level)));
        keys.set('Ctrl+Shift+7', run(() => this.setBlockType('number')));
        keys.set('Ctrl+Shift+8', run(() => this.setBlockType('bullet')));
        keys.set('Ctrl+Shift+9', run(() => this.setBlockType('task')));
        keys.set('Ctrl+Alt+Q', run(() => this.setBlockType('quote')));
        keys.set('Ctrl+Alt+C', run(() => this.setBlockType('code')));
        keys.set('Ctrl+Alt+L', run(() => this.insertRule()));
        this.view.keymap.set('Ctrl+=', run(() => (this.zoom = this.zoom * 1.1)));
        this.view.keymap.set('Ctrl+-', run(() => (this.zoom = this.zoom / 1.1)));
        this.view.keymap.set('Ctrl+0', run(() => (this.zoom = 1)));
        // (the backquote key reports itself as ` on most layouts, Dead on some)
        this.view.addEventListener('key', (event) => {
            const { event: key } = event.detail;
            if ((key.ctrlKey || key.metaKey) && !key.altKey && key.code === 'Backquote') {
                event.preventDefault();
                this.toggleInline('code');
            }
        });
    }

    _buildToolbar() {
        const toolbar = this.options.toolbar;
        const items = toolbar === true ? DEFAULT_TOOLBAR : Array.isArray(toolbar) ? toolbar : null;
        this.buttons = new Map();
        if (!items) return;
        const bar = document.createElement('div');
        bar.className = 'mde-toolbar';
        bar.setAttribute('role', 'toolbar');
        bar.setAttribute('aria-label', 'Formatting');
        for (const item of items) {
            if (item === '|') {
                const separator = document.createElement('span');
                separator.className = 'mde-sep';
                bar.append(separator);
                continue;
            }
            if (item === 'block') {
                const select = document.createElement('select');
                select.title = LABELS.block;
                select.setAttribute('aria-label', 'Paragraph type');
                for (const [value, label] of BLOCK_OPTIONS) select.append(new Option(label, value));
                select.addEventListener('change', () => {
                    this.setBlockType(select.value);
                    this.focus();
                });
                this.blockSelect = select;
                bar.append(select);
                continue;
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.title = LABELS[item] ?? item;
            button.setAttribute('aria-label', LABELS[item] ?? item);
            button.innerHTML = ICONS[item] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[item]}</svg>` : item;
            // (a click keeps the caret in the editor: the button does not take the focus)
            button.addEventListener('mousedown', (event) => event.preventDefault());
            button.addEventListener('click', () => {
                this.execute(item);
                if (item !== 'link' && item !== 'image') this.focus();
            });
            this.buttons.set(item, button);
            bar.append(button);
        }
        this.root.insertBefore(bar, this.body);
        this.toolbar = bar;
    }

    _refreshToolbar() {
        if (!this.buttons?.size && !this.blockSelect) return;
        const readOnly = this.readOnly;
        const type = this.controller.blockType;
        for (const [item, button] of this.buttons) {
            let pressed = null;
            if (['strong', 'em', 'underline', 'strike', 'code'].includes(item)) pressed = this.controller.isInline(item);
            else if (['quote', 'bullet', 'number', 'task'].includes(item)) pressed = type === item;
            else if (item === 'codeblock') pressed = type === 'code';
            else if (item === 'marks') pressed = this.showFormattingMarks;
            if (pressed !== null) button.setAttribute('aria-pressed', String(pressed));
            if (item === 'undo') button.disabled = readOnly || !this.canUndo;
            else if (item === 'redo') button.disabled = readOnly || !this.canRedo;
            else if (item !== 'marks') button.disabled = readOnly;
        }
        if (this.blockSelect) {
            const known = BLOCK_OPTIONS.some(([value]) => value === type);
            this.blockSelect.value = known ? type : 'paragraph';
            this.blockSelect.disabled = readOnly;
        }
    }

    _applyThemeColors() {
        const t = this.styles.theme;
        const dark = isDark(t.background);
        const set = (name, value) => this.root.style.setProperty(name, value);
        set('--mde-bg', t.background);
        set('--mde-ink', t.color);
        set('--mde-line', dark ? '#3a3d42' : '#d0d7de');
        set('--mde-bar', dark ? '#25272b' : '#f6f8fa');
        set('--mde-hover', dark ? '#33363c' : '#e7eaee');
        set('--mde-pressed', dark ? '#2e3a50' : '#dbe7ff');
        set('--mde-accent', t.linkColor);
    }

    _onLinkClick(event) {
        const { link } = event.detail;
        const detail = { href: link.target, title: link.title ?? null };
        const relay = new CustomEvent('linkclick', { cancelable: true, detail });
        this.dispatchEvent(relay);
        if (!relay.defaultPrevented && this.options.openLinks && /^(https?:|mailto:)/i.test(link.target)) {
            window.open(link.target, '_blank', 'noopener');
        }
    }
}

function themeOf(theme) {
    if (theme === 'dark') return DARK_THEME;
    if (!theme || theme === 'light') return LIGHT_THEME;
    return theme.base === 'dark' ? { ...DARK_THEME, ...theme } : theme;
}

function isDark(color) {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(color ?? '');
    if (!match) return false;
    const [r, g, b] = match.slice(1).map((hex) => parseInt(hex, 16));
    return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}
