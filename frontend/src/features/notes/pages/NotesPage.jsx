// frontend/src/features/notes/pages/NotesPage.jsx
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './NotesPage.module.css';
import editorStyles from '../components/NotesEditor.module.css';
import { GroupContext } from '../../../context/GroupContext';
import { useNotes } from '../hooks/useNotes';
import { useNotesEditor } from '../hooks/useNotesEditor';

import MobileNavbar from '../components/MobileNavbar';
import NotesSidebar from '../components/NotesSidebar';
import NotesToolbar from '../components/NotesToolbar';
import NotesEditor from '../components/NotesEditor';
import DeleteModal from '../components/DeleteModal';
import SaveModal from '../components/SaveModal';

export default function NotesPage({ group, isDarkMode }) {
  const { activeGroup } = useContext(GroupContext);
  const groupId = group?.id || activeGroup?.id || null;
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(groupId);

  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Error Banner State
  const [toastMessage, setToastMessage] = useState(null);

  const showErrorToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000); // Auto dismiss after 5 seconds
  };

  // Focus mode & List Collapse States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNotesListCollapsed, setIsNotesListCollapsed] = useState(false);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || notes[0] || null;
  }, [notes, selectedNoteId]);

  const {
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
  } = useNotesEditor(selectedNote, editorStyles);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'split') {
        setViewMode('edit');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const promptDeleteNote = (e, note) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNote(noteToDelete.id);
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      await updateNote(selectedNote.id, {
        title: editorTitle,
        content: editorContent
      });
      setIsSaveModalOpen(true);
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await createNote({
        title: 'New Study Note',
        content: '# New Study Note\nStart writing...'
      });
      setSelectedNoteId(newNote.id);
      setIsSidebarOpen(false);
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [notes, searchQuery]);

  if (!groupId) {
    return (
      <div className={styles.noGroupSelectedWrapper} data-theme={isDarkMode ? 'dark' : 'light'}>
        <h2>Please select a study group to access notes workspace.</h2>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.workspaceWrapper} ${isExpanded ? styles.expandedMode : ''}`} 
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={{ position: 'relative' }}
    >
      {/* Graceful Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '0.9rem',
          fontWeight: 500,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <AlertCircle size={20} />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, marginLeft: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <MobileNavbar 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        title={editorTitle}
      />

      <div className={styles.workspaceContainer}>
        <NotesSidebar 
          notes={filteredNotes}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedNoteId={selectedNote?.id}
          onSelectNote={setSelectedNoteId}
          onCreateNote={handleCreateNewNote}
          onPromptDelete={promptDeleteNote}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          isCollapsed={isNotesListCollapsed}
          onToggleCollapse={() => setIsNotesListCollapsed(!isNotesListCollapsed)}
        />

        <main className={styles.editorPane}>
          {selectedNote ? (
            <>
              <NotesToolbar 
                insertMarkdown={insertMarkdown}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                historyLength={history.length}
                redoStackLength={redoStack.length}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              <NotesEditor 
                viewMode={viewMode}
                editorTitle={editorTitle}
                setEditorTitle={setEditorTitle}
                editorContent={editorContent}
                onContentChange={handleContentChange}
                textareaRef={textareaRef}
                onTitleKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveNote())}
                onTextareaKeyDown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && (e.preventDefault(), handleSaveNote())}
                onSaveNote={handleSaveNote}
                onDownloadPdf={handleDownloadPdf}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                isNotesListCollapsed={isNotesListCollapsed}
                onToggleNotesList={() => setIsNotesListCollapsed(!isNotesListCollapsed)}
              />
            </>
          ) : (
            <div className={styles.noActiveNote}>No group notes created. Create a new note to start!</div>
          )}
        </main>
      </div>

      {isSidebarOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setIsSidebarOpen(false)} />
      )}

      <DeleteModal 
        isOpen={isDeleteModalOpen} 
        noteTitle={noteToDelete?.title} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDeleteNote} 
      />

      <SaveModal 
        isOpen={isSaveModalOpen} 
        noteTitle={editorTitle} 
        onClose={() => setIsSaveModalOpen(false)} 
      />
    </div>
  );
}