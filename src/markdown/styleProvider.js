// The look of a Markdown document: what each paragraph and character style ID of the projection stands for. The web
// counterpart of MaxPad.Projection's MarkdownStyleProvider (its colors and proportions), driven by a theme a page can
// give in part: { fontFamily, fontSize, codeFontFamily, color, background, headingColor, linkColor, syntaxColor,
// quietColor, codeBackground, codeFrameColor, inlineCodeBackground, quoteBarColor, ruleColor, tableBorderColor,
// tableHeaderBackground, selectionColor, caretColor, highlightColor, documentWidth, centered, listIndent,
// paragraphSpacing, headingLines }.

import { parseStyleId } from './projection.js';

export const LIGHT_THEME = Object.freeze({
    fontFamily: '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", sans-serif',
    fontSize: 16,
    codeFontFamily: 'Consolas, "Cascadia Mono", Menlo, "DejaVu Sans Mono", monospace',
    color: '#1f2328',
    background: '#ffffff',
    headingColor: '#203287',
    linkColor: '#0066cc',
    syntaxColor: '#808080',
    quietColor: '#6a737d',
    htmlColor: '#8250df',
    codeBackground: '#f5f6f8',
    codeFrameColor: '#dddddd',
    inlineCodeBackground: '#f0f1f3',
    quoteBarColor: '#c8cdd4',
    ruleColor: '#2032aa',
    tableBorderColor: '#d9dce1',
    tableHeaderBackground: '#f0f2f5',
    selectionColor: 'rgba(51, 144, 255, 0.28)',
    caretColor: '#000000',
    highlightColor: 'rgba(255, 213, 0, 0.45)',
    documentWidth: 860,
    centered: true,
    listIndent: 28,
    paragraphSpacing: 8,
    headingLines: [3, 2, 1, 0.5, 0, 0],
});

export const DARK_THEME = Object.freeze({
    ...LIGHT_THEME,
    color: '#e6e6e6',
    background: '#1e1f22',
    headingColor: '#8fb4ff',
    linkColor: '#6cb6ff',
    syntaxColor: '#8b8f96',
    quietColor: '#a0a6ad',
    htmlColor: '#c49bff',
    codeBackground: '#2a2c30',
    codeFrameColor: '#3d4046',
    inlineCodeBackground: '#33363b',
    quoteBarColor: '#4b5059',
    ruleColor: '#8fb4ff',
    tableBorderColor: '#454950',
    tableHeaderBackground: '#2c2f34',
    selectionColor: 'rgba(90, 160, 255, 0.35)',
    caretColor: '#ffffff',
    highlightColor: 'rgba(255, 200, 0, 0.35)',
});

const HEADING_SCALE = [2.0, 1.6875, 1.4375, 1.25, 1.125, 1.0625];
const QUOTE_STEP = 14, QUOTE_BAR = 3;

const checkbox = (checked, color) => {
    const stroke = encodeURIComponent(color);
    const tick = checked ? `<path d='M3.5 8.5l3 3 6-7' fill='none' stroke='${stroke}' stroke-width='2'/>` : '';
    return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>` +
        `<rect x='1.5' y='1.5' width='13' height='13' rx='2.5' fill='none' stroke='${stroke}' stroke-width='1.4'/>` +
        `${tick}</svg>")`;
};

export class MarkdownStyleProvider {
    constructor(theme = {}) {
        this.theme = { ...LIGHT_THEME, ...theme };
    }

    getDocumentStyle() {
        const t = this.theme;
        return {
            maxWidth: t.documentWidth > 0 ? t.documentWidth : Infinity, placement: t.centered ? 'center' : 'left',
            background: t.background, color: t.color, selectionColor: t.selectionColor, caretColor: t.caretColor,
            highlightColor: t.highlightColor,
        };
    }

    getHyperlinkStyle() {
        return { color: this.theme.linkColor, underline: true };
    }

    getTableStyle() {
        const t = this.theme;
        return { margin: [10, 0, 14, 0], cellCss: `border:1px solid ${t.tableBorderColor};`, css: { minWidth: '30%' } };
    }

    getParagraphStyle(styleId) {
        const t = this.theme;
        const { kind, quotes, lists } = parseStyleId(styleId ?? 'p');
        let style = this.builtIn(kind);
        if (quotes > 0 || lists > 0) {
            const quoteRoom = quotes * QUOTE_STEP;
            const listRoom = lists * t.listIndent;
            const [top, right, bottom, left] = sides4(style.padding);
            style = {
                ...style,
                padding: [top, right, bottom, left + quoteRoom + listRoom],
                color: quotes > 0 && !isCode(kind) ? t.quietColor : style.color,
            };
            if (quotes > 0) {
                // (a bar at the left of each quote the paragraph is in)
                const stops = [];
                for (let q = 0; q < quotes; q++) {
                    const x = q * QUOTE_STEP;
                    stops.push(`transparent ${x}px`, `${t.quoteBarColor} ${x}px`, `${t.quoteBarColor} ${x + QUOTE_BAR}px`,
                        `transparent ${x + QUOTE_BAR}px`);
                }
                const bars = `linear-gradient(to right, ${stops.join(', ')}) left top / ${quotes * QUOTE_STEP}px 100% no-repeat`;
                style.css = { ...(style.css ?? {}), background: style.background ? `${bars}, ${style.background}` : bars };
                style.background = null;
            }
        }
        return style;
    }

    builtIn(kind) {
        const t = this.theme;
        const body = { name: 'Paragraph', fontFamily: t.fontFamily, fontSize: t.fontSize, color: t.color, margin: [0, 0, 6, 0] };
        const code = (name, color) => ({
            ...body, name, fontFamily: t.codeFontFamily, fontSize: Math.round(t.fontSize * 0.875 * 10) / 10, color,
            background: t.codeBackground, padding: [0, 12, 0, 12], margin: 0, lineHeight: 1.45,
        });
        const frame = t.codeFrameColor;
        switch (kind) {
            case 'p':
                return { ...body, margin: [0, 0, t.paragraphSpacing, 0] };
            case 'blank':
                return { ...body, name: 'Empty paragraph', margin: [0, 0, t.paragraphSpacing, 0] };
            case 'bullet':
                return { ...body, name: 'Bullet' };
            case 'list':
                return { ...body, name: 'List' };
            case 'check':
                return { ...body, name: 'Check' };
            case 'image':
                return { ...body, name: 'Image', textAlign: 'center', margin: [10, 20, 10, 20] };
            case 'hr':
                return {
                    ...body, name: 'Rule', fontSize: 2, lineHeight: 1, margin: [12, 0, 12, 0], borderWidth: [0, 0, 2, 0],
                    borderColor: t.ruleColor,
                };
            case 'code':
                return { ...code('Code', t.color), borderWidth: [0, 1, 0, 1], borderColor: frame };
            case 'code-indented':
                return { ...code('Code', t.color) };
            case 'code-fence':
                return {
                    ...code('Code fence', t.quietColor), borderWidth: [1, 1, 0, 1], borderColor: frame, padding: [6, 12, 0, 12],
                    margin: [4, 0, 0, 0], borderRadius: [4, 4, 0, 0],
                };
            case 'code-fence-close':
                return {
                    ...code('Code fence', t.quietColor), borderWidth: [0, 1, 1, 1], borderColor: frame, padding: [0, 12, 6, 12],
                    margin: [0, 0, 10, 0], borderRadius: [0, 0, 4, 4],
                };
            case 'html':
                return { ...code('HTML', t.htmlColor) };
            case 'definition':
                return { ...code('Definition', t.quietColor) };
            case 'other':
                return { ...code('Other', t.quietColor) };
            case 'front-matter':
                return { ...code('Front matter', t.quietColor) };
            case 'front-matter-fence':
                return { ...code('Front matter fence', t.quietColor), margin: 0 };
            case 'table-header':
                return {
                    ...body, name: 'Table header', bold: true, background: t.tableHeaderBackground, margin: 0,
                    padding: [4, 8, 4, 8],
                };
            case 'table-cell':
                return { ...body, name: 'Table cell', margin: 0, padding: [4, 8, 4, 8] };
            default: {
                const match = /^h([1-6])$/.exec(kind);
                if (!match) return { ...body, margin: [0, 0, t.paragraphSpacing, 0] };
                const level = +match[1];
                const line = t.headingLines[level - 1] ?? 0;
                return {
                    ...body, name: 'Heading ' + level, fontSize: Math.round(t.fontSize * HEADING_SCALE[level - 1] * 10) / 10,
                    bold: true, color: t.headingColor, lineHeight: 1.25, margin: [level <= 2 ? 18 : 14, 0, 8, 0],
                    padding: [0, 0, line ? 3 : 0, 0], borderWidth: [0, 0, line, 0], borderColor: t.headingColor,
                    nextStyleId: 'p',
                };
            }
        }
    }

    getCharacterStyle(styleId) {
        const t = this.theme;
        let style = {};
        for (const name of styleId.split('+')) {
            switch (name) {
                case 'code':
                    style = {
                        ...style, fontFamily: t.codeFontFamily, background: t.inlineCodeBackground,
                        css: { ...(style.css ?? {}), fontSize: '0.92em', borderRadius: '3px', padding: '0 2px' },
                    };
                    break;
                case 'underline':
                    style = { ...style, underline: true };
                    break;
                case 'strike':
                    style = { ...style, strikethrough: true };
                    break;
                case 'sub':
                    style = { ...style, script: 'sub' };
                    break;
                case 'sup':
                    style = { ...style, script: 'super' };
                    break;
                case 'html':
                    style = { ...style, color: t.htmlColor, fontFamily: t.codeFontFamily };
                    break;
                case 'syntax':
                    style = {
                        ...style, color: t.syntaxColor, bold: false, italic: false, underline: false, strikethrough: false,
                    };
                    break;
                case 'rule-syntax':
                    style = { ...style, color: t.syntaxColor, fontSize: t.fontSize };
                    break;
                case 'concealed':
                    style = { ...style, color: 'transparent' };
                    break;
                case 'task':
                    style = {
                        ...style, fontFamily: t.codeFontFamily, color: 'transparent',
                        css: { ...(style.css ?? {}), background: `${checkbox(false, t.quietColor)} center / 1.05em no-repeat`,
                            cursor: 'pointer' },
                    };
                    break;
                case 'task-done':
                    style = {
                        ...style, fontFamily: t.codeFontFamily, color: 'transparent',
                        css: { ...(style.css ?? {}), background: `${checkbox(true, t.linkColor)} center / 1.05em no-repeat`,
                            cursor: 'pointer' },
                    };
                    break;
                default:
            }
        }
        return style;
    }
}

const isCode = (kind) => kind.startsWith('code') || kind === 'html' || kind === 'front-matter';

function sides4(value) {
    if (Array.isArray(value)) {
        const [top = 0, right = top, bottom = top, left = right] = value;
        return [top, right, bottom, left];
    }
    const side = value ?? 0;
    return [side, side, side, side];
}
