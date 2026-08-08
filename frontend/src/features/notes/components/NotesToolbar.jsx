import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Sigma, 
  Undo2, 
  Redo2, 
  Edit3, 
  Columns, 
  Eye 
} from 'lucide-react';
import styles from './NotesToolbar.module.css';

export default function NotesToolbar({
  insertMarkdown,
  handleUndo,
  handleRedo,
  historyLength,
  redoStackLength,
  viewMode,
  setViewMode
}) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.toolbarScroll}>
        <div className={styles.toolbarGroup}>
          <button onClick={() => insertMarkdown('**', '**')} className={styles.toolbarBtn} title="Bold">
            <Bold size={16} />
          </button>
          <button onClick={() => insertMarkdown('*', '*')} className={styles.toolbarBtn} title="Italic">
            <Italic size={16} />
          </button>
          <button onClick={() => insertMarkdown('__', '__')} className={styles.toolbarBtn} title="Underline">
            <Underline size={16} />
          </button>
        </div>
        <span className={styles.divider}></span>
        <div className={styles.toolbarGroup}>
          <button onClick={() => insertMarkdown('# ')} className={styles.toolbarBtn} title="Heading 1">
            <Heading1 size={16} />
          </button>
          <button onClick={() => insertMarkdown('## ')} className={styles.toolbarBtn} title="Heading 2">
            <Heading2 size={16} />
          </button>
          <button onClick={() => insertMarkdown('$$', '$$')} className={styles.toolbarBtn} title="LaTeX Math">
            <Sigma size={16} />
          </button>
        </div>
        <span className={styles.divider}></span>
        <div className={styles.toolbarGroup}>
          <button 
            onClick={handleUndo} 
            disabled={historyLength <= 1} 
            className={styles.toolbarBtn}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={redoStackLength === 0} 
            className={styles.toolbarBtn}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.viewToggles}>
        <button 
          className={viewMode === 'edit' ? styles.activeViewBtn : ''} 
          onClick={() => setViewMode('edit')}
        >
          <Edit3 size={14} /> Edit
        </button>
        <button 
          className={`${styles.splitBtn} ${viewMode === 'split' ? styles.activeViewBtn : ''}`} 
          onClick={() => setViewMode('split')}
        >
          <Columns size={14} /> Split
        </button>
        <button 
          className={viewMode === 'preview' ? styles.activeViewBtn : ''} 
          onClick={() => setViewMode('preview')}
        >
          <Eye size={14} /> Preview
        </button>
      </div>
    </header>
  );
}