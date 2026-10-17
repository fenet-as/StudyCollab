import React from 'react';
import { Save, FileText, Maximize2, Minimize2, PanelLeftClose, PanelLeft, RotateCcw } from 'lucide-react';
import styles from './NotesEditor.module.css';
import { parseMarkdownAndLaTeX } from '../utils/markdownParser';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;

export default function NotesEditor({
  viewMode,
  editorTitle,
  setEditorTitle,
  editorContent,
  onContentChange,
  textareaRef,
  onTitleKeyDown,
  onTextareaKeyDown,
  onSaveNote,
  onDownloadPdf,
  isExpanded,
  onToggleExpand,
  isNotesListCollapsed,
  onToggleNotesList,
  isDirty,
  onDiscardDraft
}) {
  const titleLength = editorTitle?.length || 0;
  const contentLength = editorContent?.length || 0;
  const isTitleOverLimit = titleLength > MAX_TITLE_LENGTH;
  const isContentOverLimit = contentLength > MAX_CONTENT_LENGTH;
  const isSaveDisabled = isTitleOverLimit || isContentOverLimit;

  return (
    <div className={`${styles.canvasContainer} ${styles[viewMode]}`}>
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className={styles.editorBox}>
          
          {/* Top Actions Bar (Edit & Split Modes) */}
          <div className={styles.topActionsBar}>
            <div className={styles.actionsLeft}>
              <button
                type="button"
                className={`${styles.actionIconButton} ${styles.sidebarToggleBtn}`}
                onClick={onToggleNotesList}
                title={isNotesListCollapsed ? "Expand Notes Sidebar" : "Collapse Notes Sidebar"}
                aria-label="Toggle notes sidebar"
              >
                {isNotesListCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            <div className={styles.actionsRight}>
              {/* Direct Export PDF Button */}
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={onDownloadPdf}
                title="Export as PDF"
                aria-label="Export PDF"
              >
                <FileText size={16} />
                <span className={styles.btnText}>Export PDF</span>
              </button>

              {/* Discard Unsaved Changes Button */}
              {isDirty && onDiscardDraft && (
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={onDiscardDraft}
                  title="Discard unsaved changes"
                  aria-label="Discard unsaved changes"
                >
                  <RotateCcw size={16} />
                  <span className={styles.btnText}>Discard</span>
                </button>
              )}

              {/* Direct Save Button */}
              <button
                type="button"
                className={styles.primarySaveBtn}
                onClick={onSaveNote}
                disabled={isSaveDisabled}
                title="Save Changes (Ctrl+Enter)"
                aria-label="Save note"
              >
                <Save size={16} />
                <span className={styles.btnText}>{isDirty ? 'Save *' : 'Save'}</span>
              </button>

              {/* Focus Mode Toggle */}
              <button
                type="button"
                className={styles.actionIconButton}
                onClick={onToggleExpand}
                title={isExpanded ? "Collapse Editor" : "Expand Editor"}
                aria-label="Toggle focus mode"
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* Dedicated Full-Width Title Input */}
          <div className={styles.titleContainer}>
            <input 
              type="text"
              className={`${styles.titleInput} ${isTitleOverLimit ? styles.inputError : ''}`}
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              onKeyDown={onTitleKeyDown}
              placeholder="Note Title"
              maxLength={MAX_TITLE_LENGTH}
            />
          </div>

          {/* Textarea Area */}
          <textarea 
            ref={textareaRef}
            className={`${styles.textareaInput} ${isContentOverLimit ? styles.inputError : ''}`}
            value={editorContent}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            placeholder="Type notes here... (Press Ctrl+Enter to save)"
          />

          {/* Live Character Counters Footer */}
          <div className={styles.characterCounterFooter}>
            <span className={isTitleOverLimit ? styles.counterError : ''}>
              Title: {titleLength}/{MAX_TITLE_LENGTH}
            </span>
            <span className={isContentOverLimit ? styles.counterError : ''}>
              Content: {contentLength.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()} chars
            </span>
          </div>
        </div>
      )}

      {(viewMode === 'preview' || viewMode === 'split') && (
        <div className={styles.previewBox}>
          
          {/* Top Actions Bar for Full Preview Mode */}
          {viewMode === 'preview' && (
            <div className={styles.topActionsBar}>
              <div className={styles.actionsLeft}>
                <button
                  type="button"
                  className={`${styles.actionIconButton} ${styles.sidebarToggleBtn}`}
                  onClick={onToggleNotesList}
                  title={isNotesListCollapsed ? "Expand Notes Sidebar" : "Collapse Notes Sidebar"}
                  aria-label="Toggle notes sidebar"
                >
                  {isNotesListCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                </button>
              </div>

              <div className={styles.actionsRight}>
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={onDownloadPdf}
                  title="Export as PDF"
                  aria-label="Export PDF"
                >
                  <FileText size={16} />
                  <span className={styles.btnText}>Export PDF</span>
                </button>

                <button
                  type="button"
                  className={styles.actionIconButton}
                  onClick={onToggleExpand}
                  title={isExpanded ? "Collapse Editor" : "Expand Editor"}
                  aria-label="Toggle focus mode"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>
          )}

          <h1 className={styles.previewTitle}>{editorTitle || 'Untitled Note'}</h1>
          <div 
            className={styles.previewContent}
            dangerouslySetInnerHTML={{ __html: parseMarkdownAndLaTeX(editorContent, styles) }}
          />
        </div>
      )}
    </div>
  );
}