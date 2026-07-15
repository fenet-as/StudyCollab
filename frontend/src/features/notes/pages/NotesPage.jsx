// frontend/src/features/notes/pages/NotesPage.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './NotesPage.module.css';

// Import KaTeX engine and stylesheet for mathematical parsing
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function NotesPage() {
  const textareaRef = useRef(null);

  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Database Study Project',
      updatedAt: 'Updated 7 hours ago',
      content: `There is a complex sensor agent task question using task-combine, solve the system of equations formula.

### Lecture Formulas:
$$f(x) = mx^3 + \\frac{x_0 + 10^3}{25}$$

$$F = ma$$

Let's review the **Newtonian mechanics** fundamentals before next class.`
    },
    {
      id: 2,
      title: 'Mammalian Systems',
      updatedAt: 'Updated 3 hours ago',
      content: '# Cardiovascular Physiology\n\nReview notes on cardiovascular physiology and nervous system pathways.\n* Key Concept 1: Cardiac cycle phases\n* Key Concept 2: Baroreceptor reflexes'
    }
  ]);

  const [selectedNoteId, setSelectedNoteId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Auto-switch view to 'edit' on small screens since split-view gets squeezed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'split') {
        setViewMode('edit');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Trigger instantly on load
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  useEffect(() => {
    if (selectedNote) {
      setEditorContent(selectedNote.content);
      setEditorTitle(selectedNote.title);
      setHistory([selectedNote.content]);
      setRedoStack([]);
    }
  }, [selectedNoteId]);

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

  // Parses Markdown and outputs native LaTeX formatting directly into the raw HTML string using KaTeX
  const parseMarkdownAndLaTeX = (text) => {
    if (!text) return '';
    
    // Convert basic HTML entities to keep rendering secure
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 1. Process block display LaTeX math: $$formula$$
    html = html.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
      try {
        return `<div class="${styles.latexBlock}">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (err) {
        return `<span style="color: red;">${match}</span>`;
      }
    });

    // 2. Process inline LaTeX math: $formula$
    html = html.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        return `<span class="${styles.latexInline}">${katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch (err) {
        return `<span style="color: red;">${match}</span>`;
      }
    });

    // 3. Process traditional Markdown layout rules
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

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const parsedHTML = parseMarkdownAndLaTeX(editorContent);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${editorTitle || 'Untitled Note'}</title>
          <!-- Import official KaTeX stylesheet to render print elements properly -->
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

  const filteredNotes = useMemo(() => {
    return notes.filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [notes, searchQuery]);

  return (
    <div className={styles.workspaceWrapper}>
      
      {/* Mobile Header Toggle */}
      <div className={styles.mobileNavbar}>
        <button className={styles.menuToggleBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? '✕ Close List' : '☰ Show Notes'}
        </button>
        <span className={styles.mobileNavTitle}>{editorTitle || "Notes"}</span>
      </div>

      <div className={styles.workspaceContainer}>
        
        {/* SIDEBAR */}
        <aside className={`${styles.notesSidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button className={styles.newNoteBtn} onClick={() => {
              const newNote = {
                id: Date.now(),
                title: 'New Study Note',
                updatedAt: 'Updated just now',
                content: '# New Study Note\nStart writing...'
              };
              setNotes([newNote, ...notes]);
              setSelectedNoteId(newNote.id);
              setIsSidebarOpen(false); // Auto close menu on tap
            }}>
              + New Note
            </button>
          </div>

          <div className={styles.notesList}>
            {filteredNotes.map((note) => (
              <div 
                key={note.id}
                className={`${styles.noteCard} ${selectedNoteId === note.id ? styles.activeCard : ''}`}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setIsSidebarOpen(false); // Close drawer on mobile selection
                }}
              >
                <h4 className={styles.noteTitle}>{note.title}</h4>
                <span className={styles.noteTime}>{note.updatedAt}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Backdrop for mobile drawer selection */}
        {isSidebarOpen && <div className={styles.sidebarBackdrop} onClick={() => setIsSidebarOpen(false)}></div>}

        {/* WORKSPACE PANELS */}
        <main className={styles.editorPane}>
          {selectedNote ? (
            <>
              {/* TOOLBAR */}
              <header className={styles.toolbar}>
                <div className={styles.toolbarScroll}>
                  <div className={styles.toolbarGroup}>
                    <button onClick={() => insertMarkdown('**', '**')} className={styles.toolbarBtn}><b>B</b></button>
                    <button onClick={() => insertMarkdown('*', '*')} className={styles.toolbarBtn}><i>I</i></button>
                    <button onClick={() => insertMarkdown('__', '__')} className={styles.toolbarBtn}><u>U</u></button>
                  </div>
                  <span className={styles.divider}></span>
                  <div className={styles.toolbarGroup}>
                    <button onClick={() => insertMarkdown('# ')} className={styles.toolbarBtn}>H1</button>
                    <button onClick={() => insertMarkdown('## ')} className={styles.toolbarBtn}>H2</button>
                    <button onClick={() => insertMarkdown('$$', '$$')} className={styles.toolbarBtn}>LaTeX</button>
                  </div>
                  <span className={styles.divider}></span>
                  <div className={styles.toolbarGroup}>
                    <button onClick={handleUndo} disabled={history.length <= 1} className={styles.toolbarBtn}>↩️</button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className={styles.toolbarBtn}>↪️</button>
                  </div>
                </div>

                {/* Switcher Toggles */}
                <div className={styles.viewToggles}>
                  <button className={viewMode === 'edit' ? styles.activeViewBtn : ''} onClick={() => setViewMode('edit')}>Edit</button>
                  <button className={`${styles.splitBtn} ${viewMode === 'split' ? styles.activeViewBtn : ''}`} onClick={() => setViewMode('split')}>Split</button>
                  <button className={viewMode === 'preview' ? styles.activeViewBtn : ''} onClick={() => setViewMode('preview')}>Preview</button>
                </div>
              </header>

              {/* CANVAS WRAPPER */}
              <div className={`${styles.canvasContainer} ${styles[viewMode]}`}>
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={styles.editorBox}>
                    <input 
                      type="text"
                      className={styles.titleInput}
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      placeholder="Note Title"
                    />
                    <textarea 
                      ref={textareaRef}
                      className={styles.textareaInput}
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Type notes here..."
                    />
                  </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={styles.previewBox}>
                    <h1 className={styles.previewTitle}>{editorTitle || 'Untitled Note'}</h1>
                    <div 
                      className={styles.previewContent}
                      dangerouslySetInnerHTML={{ __html: parseMarkdownAndLaTeX(editorContent) }}
                    />
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <footer className={styles.editorFooter}>
                <button className={styles.downloadBtn} onClick={handleDownloadPdf}>
                  📄 PDF
                </button>
                <button className={styles.saveBtn} onClick={() => alert('Saved!')}>Save Changes</button>
              </footer>
            </>
          ) : (
            <div className={styles.noActiveNote}>Select a note from the menu</div>
          )}
        </main>

      </div>
    </div>
  );
}