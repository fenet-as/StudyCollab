import { useState, useRef, useEffect } from 'react';
import { parseMarkdownAndLaTeX } from '../utils/markdownParser';

export function useNotesEditor(selectedNote, styles) {
  const textareaRef = useRef(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    if (selectedNote) {
      setEditorContent(selectedNote.content || '');
      setEditorTitle(selectedNote.title || '');
      setHistory([selectedNote.content || '']);
      setRedoStack([]);
    } else {
      setEditorContent('');
      setEditorTitle('');
      setHistory([]);
      setRedoStack([]);
    }
  }, [selectedNote]);

  const handleContentChange = (newVal) => {
    setEditorContent(newVal);
    setHistory(prev => [...prev.slice(-19), newVal]);
    setRedoStack([]);
  };

  const insertMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;
    const updatedContent = text.substring(0, start) + replacement + text.substring(end);

    handleContentChange(updatedContent);

    setTimeout(() => {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
      textarea.focus();
    }, 0);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    setRedoStack(prev => [...prev, current]);
    setHistory(prev => prev.slice(0, -1));
    setEditorContent(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, next]);
    setEditorContent(next);
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const parsedHTML = parseMarkdownAndLaTeX(editorContent, styles);

    printWindow.document.write(`
      <html>
        <head>
          <title>${editorTitle || 'Untitled Note'}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #334155; }
            h1 { font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            h2 { font-size: 20px; color: #1e293b; margin-top: 24px; }
            h3 { font-size: 16px; color: #475569; margin-top: 18px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .${styles.latexBlock} { margin: 16px 0; text-align: center; }
            .${styles.latexInline} { padding: 0 4px; }
          </style>
        </head>
        <body>
          <h1>${editorTitle || 'Untitled Note'}</h1>
          <div>${parsedHTML}</div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return {
    textareaRef,
    editorContent,
    editorTitle,
    setEditorTitle,
    handleContentChange,
    insertMarkdown,
    handleUndo,
    handleRedo,
    history,
    redoStack,
    handleDownloadPdf
  };
}