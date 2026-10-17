import { useState, useRef, useEffect } from 'react';
import { parseMarkdownAndLaTeX } from '../utils/markdownParser';
import { generatePrintHtml } from '../utils/htmlUtils';

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
    if (typeof window === 'undefined' || typeof window.open !== 'function') {
      return null;
    }

    let printWindow = null;
    try {
      printWindow = window.open('', '_blank', 'width=800,height=900');
    } catch (err) {
      console.warn('Failed to open print window:', err);
      return null;
    }

    if (!printWindow || !printWindow.document) {
      console.warn('Popup blocked or failed to open print window.');
      return null;
    }

    try {
      const parsedHTML = parseMarkdownAndLaTeX(editorContent, styles);
      const htmlContent = generatePrintHtml(editorTitle, parsedHTML, styles);

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      if (typeof printWindow.focus === 'function') {
        printWindow.focus();
      }
      return printWindow;
    } catch (err) {
      console.error('Error generating or printing PDF document:', err);
      return null;
    }
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