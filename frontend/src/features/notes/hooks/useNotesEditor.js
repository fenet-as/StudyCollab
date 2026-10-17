import { useState, useRef, useEffect } from 'react';
import { parseMarkdownAndLaTeX } from '../utils/markdownParser';
import { generatePrintHtml } from '../utils/htmlUtils';

export function useNotesEditor(selectedNote, styles) {
  const textareaRef = useRef(null);
  const baseNoteRef = useRef({});
  const draftsRef = useRef({});

  const [editorContent, setEditorContent] = useState(() => selectedNote?.content || '');
  const [editorTitle, setEditorTitle] = useState(() => selectedNote?.title || '');
  const [history, setHistory] = useState(() => (selectedNote?.content ? [selectedNote.content] : []));
  const [redoStack, setRedoStack] = useState([]);
  const [prevNoteId, setPrevNoteId] = useState(selectedNote?.id);
  const [prevServerVersion, setPrevServerVersion] = useState(() => ({
    id: selectedNote?.id,
    title: selectedNote?.title,
    content: selectedNote?.content
  }));

  if (selectedNote?.id && !baseNoteRef.current[selectedNote.id]) {
    baseNoteRef.current[selectedNote.id] = {
      title: selectedNote.title || '',
      content: selectedNote.content || ''
    };
  }

  // Handle note switching (different note ID)
  if (selectedNote?.id !== prevNoteId) {
    if (prevNoteId != null) {
      const prevBase = baseNoteRef.current[prevNoteId];
      const wasDirty = Boolean(
        draftsRef.current[prevNoteId]?.isDirty ||
        (prevBase && (editorTitle !== prevBase.title || editorContent !== prevBase.content))
      );
      if (wasDirty) {
        draftsRef.current[prevNoteId] = {
          title: editorTitle,
          content: editorContent,
          history,
          redoStack,
          isDirty: true
        };
      }
    }

    setPrevNoteId(selectedNote?.id);
    setPrevServerVersion({
      id: selectedNote?.id,
      title: selectedNote?.title,
      content: selectedNote?.content
    });

    if (selectedNote) {
      baseNoteRef.current[selectedNote.id] = {
        title: selectedNote.title || '',
        content: selectedNote.content || ''
      };

      const existingDraft = draftsRef.current[selectedNote.id];
      if (existingDraft && existingDraft.isDirty) {
        setEditorContent(existingDraft.content || '');
        setEditorTitle(existingDraft.title || '');
        setHistory(existingDraft.history || [existingDraft.content || '']);
        setRedoStack(existingDraft.redoStack || []);
      } else {
        setEditorContent(selectedNote.content || '');
        setEditorTitle(selectedNote.title || '');
        setHistory(selectedNote.content ? [selectedNote.content] : ['']);
        setRedoStack([]);
      }
    } else {
      setEditorContent('');
      setEditorTitle('');
      setHistory([]);
      setRedoStack([]);
    }
  } else if (
    selectedNote &&
    (selectedNote.title !== prevServerVersion.title || selectedNote.content !== prevServerVersion.content)
  ) {
    // Same note ID, but background update changed note content/title on the server
    const prevBase = baseNoteRef.current[selectedNote.id];
    const hasActiveDraft = Boolean(draftsRef.current[selectedNote.id]?.isDirty);
    const isCurrentlyDirty = hasActiveDraft ||
      (prevBase && (editorTitle !== prevBase.title || editorContent !== prevBase.content));

    setPrevServerVersion({
      id: selectedNote.id,
      title: selectedNote.title,
      content: selectedNote.content
    });
    baseNoteRef.current[selectedNote.id] = {
      title: selectedNote.title || '',
      content: selectedNote.content || ''
    };

    // Only update content if user has NOT made unsaved edits (protect dirty draft)
    if (!isCurrentlyDirty) {
      setEditorContent(selectedNote.content || '');
      setEditorTitle(selectedNote.title || '');
      setHistory(selectedNote.content ? [selectedNote.content] : ['']);
      setRedoStack([]);
    }
  }

  const currentBase = selectedNote ? (baseNoteRef.current[selectedNote.id] || selectedNote) : null;
  const isDirty = Boolean(
    selectedNote && (
      draftsRef.current[selectedNote.id]?.isDirty ||
      editorTitle !== (currentBase?.title || '') ||
      editorContent !== (currentBase?.content || '')
    )
  );

  const handleContentChange = (newVal) => {
    setEditorContent(newVal);
    const newHistory = [...history.slice(-19), newVal];
    setHistory(newHistory);
    setRedoStack([]);

    if (selectedNote?.id) {
      const base = baseNoteRef.current[selectedNote.id] || selectedNote;
      const dirty = newVal !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        draftsRef.current[selectedNote.id] = {
          title: editorTitle,
          content: newVal,
          history: newHistory,
          redoStack: [],
          isDirty: true
        };
      } else {
        delete draftsRef.current[selectedNote.id];
      }
    }
  };

  const handleTitleChange = (valOrFn) => {
    setEditorTitle(prev => {
      const nextTitle = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      if (selectedNote?.id) {
        const base = baseNoteRef.current[selectedNote.id] || selectedNote;
        const dirty = nextTitle !== (base.title || '') || editorContent !== (base.content || '');
        if (dirty) {
          draftsRef.current[selectedNote.id] = {
            title: nextTitle,
            content: editorContent,
            history,
            redoStack,
            isDirty: true
          };
        } else {
          delete draftsRef.current[selectedNote.id];
        }
      }
      return nextTitle;
    });
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
    const nextRedo = [...redoStack, current];
    const nextHistory = history.slice(0, -1);
    setRedoStack(nextRedo);
    setHistory(nextHistory);
    setEditorContent(previous);

    if (selectedNote?.id) {
      const base = baseNoteRef.current[selectedNote.id] || selectedNote;
      const dirty = previous !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        draftsRef.current[selectedNote.id] = {
          title: editorTitle,
          content: previous,
          history: nextHistory,
          redoStack: nextRedo,
          isDirty: true
        };
      } else {
        delete draftsRef.current[selectedNote.id];
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const nextRedo = redoStack.slice(0, -1);
    const nextHistory = [...history, next];
    setRedoStack(nextRedo);
    setHistory(nextHistory);
    setEditorContent(next);

    if (selectedNote?.id) {
      const base = baseNoteRef.current[selectedNote.id] || selectedNote;
      const dirty = next !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        draftsRef.current[selectedNote.id] = {
          title: editorTitle,
          content: next,
          history: nextHistory,
          redoStack: nextRedo,
          isDirty: true
        };
      } else {
        delete draftsRef.current[selectedNote.id];
      }
    }
  };

  const markSaved = (noteId = selectedNote?.id) => {
    if (!noteId) return;
    delete draftsRef.current[noteId];
    baseNoteRef.current[noteId] = {
      title: editorTitle,
      content: editorContent
    };
    setPrevServerVersion({
      id: noteId,
      title: editorTitle,
      content: editorContent
    });
    setHistory([editorContent]);
    setRedoStack([]);
  };

  const discardDraft = (noteId = selectedNote?.id) => {
    if (!noteId) return;
    delete draftsRef.current[noteId];
    const base = baseNoteRef.current[noteId] || selectedNote;
    const restoredTitle = base?.title || '';
    const restoredContent = base?.content || '';
    setEditorTitle(restoredTitle);
    setEditorContent(restoredContent);
    setHistory(restoredContent ? [restoredContent] : ['']);
    setRedoStack([]);
  };

  const hasDraft = (noteId) => {
    if (!noteId) return false;
    const draft = draftsRef.current[noteId];
    if (draft && draft.isDirty) return true;
    if (selectedNote?.id === noteId && isDirty) return true;
    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeUnload = (e) => {
      const anyDirtyDraft = Object.values(draftsRef.current).some(d => d?.isDirty);
      if (isDirty || anyDirtyDraft) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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
    setEditorTitle: handleTitleChange,
    handleContentChange,
    insertMarkdown,
    handleUndo,
    handleRedo,
    history,
    redoStack,
    handleDownloadPdf,
    isDirty,
    markSaved,
    discardDraft,
    hasDraft
  };
}