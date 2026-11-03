// MarkdownEditor.Web: a WYSIWYG Markdown editor for web pages, and the rich text view it is built on.
//
//   import { MarkdownEditor } from './src/index.js';
//   const editor = new MarkdownEditor(element, { markdown: '# Hello' });
//
// or, with no script of one's own, <markdown-editor> (src/element.js, defined by importing this module).

export { MarkdownEditor, DEFAULT_TOOLBAR } from './MarkdownEditor.js';
export { MarkdownEditorElement } from './element.js';
export { MarkdownController, lineEndingOf } from './markdown/controller.js';
export { MarkdownStyleProvider, LIGHT_THEME, DARK_THEME } from './markdown/styleProvider.js';
export { parseMarkdown } from './markdown/parser.js';
export { project, viewRunsOf, styleIdOf, parseStyleId } from './markdown/projection.js';
export { MarkdownState } from './markdown/state.js';
export { VirtualTextView, keyChord } from './view/VirtualTextView.js';
export {
    TextEdit, pos, comparePositions, samePosition, plainParagraph, paragraphText, cloneParagraph, SOFT_BREAK,
} from './view/model.js';
export { DEFAULT_PARAGRAPH_STYLE, DEFAULT_DOCUMENT_STYLE } from './view/styles.js';
