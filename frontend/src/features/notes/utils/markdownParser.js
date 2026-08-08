import katex from 'katex';
import 'katex/dist/katex.min.css';

export const parseMarkdownAndLaTeX = (text, styles) => {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 1. Block display LaTeX math: $$formula$$
  html = html.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    try {
      return `<div class="${styles.latexBlock}">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (err) {
      return `<span style="color: red;">${match}</span>`;
    }
  });

  // 2. Inline LaTeX math: $formula$
  html = html.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return `<span class="${styles.latexInline}">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })}</span>`;
    } catch (err) {
      return `<span style="color: red;">${match}</span>`;
    }
  });

  // 3. Traditional Markdown
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br />');

  return html;
};