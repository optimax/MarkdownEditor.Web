// What the view needs of a host's stylesheet (the web counterpart of IStyleProvider, ParagraphStyle and CharacterStyle):
// a style provider answers for each style ID, the view asks once per ID and keeps the answer until the host calls
// `invalidateStyles()`. The styles are plain objects; a property left out has its default (a paragraph style) or no
// opinion (a character style, which overrides only what it sets).
//
// ParagraphStyle: { name, fontFamily, fontSize (px), bold, italic, color, background, underline, strikethrough,
//   lineHeight (a multiple of the font size), textAlign, margin, padding, borderWidth, borderColor, borderStyle,
//   borderRadius (each of the four a number or [top, right, bottom, left]), firstLineIndent, nextStyleId, hidden,
//   css (more CSS for the paragraph's box, as { property: value }) }
// CharacterStyle: { fontFamily, fontSize, bold, italic, color, background, underline, strikethrough,
//   script ('sub' | 'super'), hidden, css }
// DocumentStyle: { maxWidth, placement ('left' | 'center'), background, color, selectionColor, caretColor,
//   highlightColor, currentLineColor (a band behind the caret's line; none by default) }

export const DEFAULT_PARAGRAPH_STYLE = Object.freeze({
    name: '', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fontSize: 16, bold: false,
    italic: false, color: '#1f2328', background: null, underline: false, strikethrough: false, lineHeight: 1.45,
    textAlign: 'left', margin: 0, padding: 0, borderWidth: 0, borderColor: 'transparent', borderStyle: 'solid',
    borderRadius: 0, firstLineIndent: 0, nextStyleId: undefined, hidden: false, css: null,
});

export const DEFAULT_LINK_STYLE = Object.freeze({ color: '#0563c1', underline: true });

export const DEFAULT_DOCUMENT_STYLE = Object.freeze({
    maxWidth: Infinity, placement: 'left', background: '#ffffff', color: '#1f2328',
    selectionColor: 'rgba(51, 144, 255, 0.28)', caretColor: '#000000', highlightColor: 'rgba(255, 213, 0, 0.45)',
    currentLineColor: null,
});

/** Four sides of a thickness given as a number or [top, right, bottom, left] (CSS's order). */
export function sides(value) {
    if (Array.isArray(value)) {
        const valid = value.map((side) => (Number.isFinite(side) ? Math.max(0, side) : 0));
        const [top = 0, right = top, bottom = top, left = right] = valid;
        return [top, right, bottom, left];
    }
    const side = Number.isFinite(value) ? Math.max(0, value) : 0;
    return [side, side, side, side];
}

const px = (values) => values.map((value) => `${value}px`).join(' ');
const cssName = (property) => property.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());

function extraCss(css) {
    if (!css) return '';
    return Object.entries(css).map(([property, value]) => `${cssName(property)}:${value};`).join('');
}

function decorations(underline, strikethrough) {
    const lines = [];
    if (underline) lines.push('underline');
    if (strikethrough) lines.push('line-through');
    return lines.length ? lines.join(' ') : 'none';
}

/**
 * A paragraph style resolved to what the view draws: the CSS of the outer element (the margin, as padding, so that
 * margins add and never collapse) and of the box (font, colors, border, padding), and the numbers layout estimates with.
 */
export class ResolvedParagraphStyle {
    constructor(style, zoom = 1) {
        const s = { ...DEFAULT_PARAGRAPH_STYLE, ...(style ?? {}) };
        this.style = s;
        const fontSize = s.fontSize * zoom;
        const margin = sides(s.margin).map((side) => side * zoom);
        const padding = sides(s.padding).map((side) => side * zoom);
        const border = sides(s.borderWidth).map((side) => side * zoom);
        this.fontSize = fontSize;
        this.lineHeight = Math.max(1, fontSize * s.lineHeight);
        this.margin = margin;
        this.padding = padding;
        this.border = border;
        this.vertical = margin[0] + margin[2] + padding[0] + padding[2] + border[0] + border[2];
        this.horizontal = margin[1] + margin[3] + padding[1] + padding[3] + border[1] + border[3];
        this.hidden = !!s.hidden;
        this.outerCss = `padding:${px(margin)};`;
        this.boxCss =
            `font-family:${s.fontFamily};font-size:${fontSize}px;line-height:${s.lineHeight};` +
            `font-weight:${s.bold ? 700 : 400};font-style:${s.italic ? 'italic' : 'normal'};color:${s.color};` +
            `text-decoration:${decorations(s.underline, s.strikethrough)};text-align:${s.textAlign};` +
            `padding:${px(padding)};border-width:${px(border)};border-style:${s.borderStyle};` +
            `border-color:${s.borderColor};` +
            (s.borderRadius ? `border-radius:${px(sides(s.borderRadius).map((r) => r * zoom))};` : '') +
            (s.background ? `background:${s.background};` : '') +
            (s.firstLineIndent ? `text-indent:${s.firstLineIndent * zoom}px;` : '') +
            extraCss(s.css);
    }
}

/** A character style resolved to the CSS of a run (only what the style has an opinion of). */
export function characterCss(style, zoom = 1) {
    if (!style) return '';
    let css = '';
    if (style.fontFamily) css += `font-family:${style.fontFamily};`;
    if (Number.isFinite(style.fontSize)) css += `font-size:${style.fontSize * zoom}px;`;
    if (style.bold !== undefined && style.bold !== null) css += `font-weight:${style.bold ? 700 : 400};`;
    if (style.italic !== undefined && style.italic !== null) css += `font-style:${style.italic ? 'italic' : 'normal'};`;
    if (style.color) css += `color:${style.color};`;
    if (style.background) css += `background:${style.background};`;
    if (style.underline !== undefined || style.strikethrough !== undefined) {
        css += `text-decoration:${decorations(style.underline, style.strikethrough)};`;
    }
    if (style.script === 'sub' || style.script === 'super') css += `vertical-align:${style.script};font-size:0.75em;`;
    css += extraCss(style.css);
    return css;
}
