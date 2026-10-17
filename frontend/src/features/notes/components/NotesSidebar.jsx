import React from 'react';
import { Search, Plus, Trash2, PanelLeftClose } from 'lucide-react';
import styles from './NotesSidebar.module.css';

export default function NotesSidebar({
  notes,
  loading,
  searchQuery,
  setSearchQuery,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onPromptDelete,
  isSidebarOpen,
  onCloseSidebar,
  isCollapsed
}) {
  if (isCollapsed) return null;

  return (
    <aside className={`${styles.notesSidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.headerActions}>
          <button className={styles.newNoteBtn} onClick={onCreateNote}>
            <Plus size={16} /> New Note
          </button>
          {/* <button 
            type="button" 
            className={styles.collapseBtn} 
            onClick={onToggleCollapse}
            title="Collapse List"
          >
            <PanelLeftClose size={18} />
          </button> */}
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingText}>Loading Group Notes...</div>
      ) : (
        <div className={styles.notesList}>
          {notes.map((note) => (
            <div 
              key={note.id}
              className={`${styles.noteCard} ${selectedNoteId === note.id ? styles.activeCard : ''}`}
              onClick={() => {
                onSelectNote(note.id);
                onCloseSidebar();
              }}
            >
              <div className={styles.noteCardContent}>
                <div className={styles.noteCardLeft}>
                  <h4 className={styles.noteTitle}>{note.title}</h4>
                  <span className={styles.noteTime}>
                    By {note.ownerName || note.creatorName || 'Group Member'}
                  </span>
                </div>
                <button 
                  className={styles.inlineDeleteBtn} 
                  onClick={(e) => onPromptDelete(e, note)}
                  title="Delete Note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}