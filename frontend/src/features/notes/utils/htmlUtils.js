/**
 * Utilities for escaping HTML and generating safe printable documents.
 */

/**
 * Escapes special HTML characters in a string to prevent XSS.
 *
 * @param {unknown} str - Raw string or value to escape
 * @returns {string} Safely escaped HTML string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates the complete HTML markup for the printable note document,
 * ensuring all user-supplied content (such as title) is safely escaped.
 *
 * @param {string} title - The note's title (will be safely escaped)
 * @param {string} contentHtml - The pre-parsed HTML content of the note body
 * @param {Object} [styles] - Optional CSS module class mappings
 * @returns {string} The full HTML document string
 */
export function generatePrintHtml(title, contentHtml, styles = {}) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  const safeTitle = escapeHtml(trimmed || 'Untitled Note');
  const safeContent = contentHtml || '';
  const latexBlockClass = (styles && styles.latexBlock) || 'latexBlock';
  const latexInlineClass = (styles && styles.latexInline) || 'latexInline';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
      body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
      h1 { font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
      h2 { font-size: 20px; color: #1e293b; margin-top: 24px; }
      h3 { font-size: 16px; color: #475569; margin-top: 18px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 8px; }
      .${latexBlockClass} { margin: 16px 0; text-align: center; }
      .${latexInlineClass} { padding: 0 4px; }
    </style>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <div>${safeContent}</div>
    <script>
      window.onload = function() { 
        window.print(); 
        setTimeout(() => { window.close(); }, 500);
      };
    </script>
  </body>
</html>`;
}
