import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const notesDir = path.resolve(__dirname, '../src/features/notes');

// Simulator replicating the useNotesEditor state machine logic
function createNotesEditorHarness(initialNote = null) {
  let selectedNote = initialNote;
  let prevNoteId = initialNote?.id;
  let prevServerVersion = {
    id: initialNote?.id,
    title: initialNote?.title,
    content: initialNote?.content
  };
  const baseNotes = {};
  const drafts = {};

  if (initialNote?.id) {
    baseNotes[initialNote.id] = {
      title: initialNote.title || '',
      content: initialNote.content || ''
    };
  }

  let editorContent = initialNote?.content || '';
  let editorTitle = initialNote?.title || '';
  let history = initialNote?.content ? [initialNote.content] : [];
  let redoStack = [];

  const updateFromProps = (newNote) => {
    selectedNote = newNote;
    if (newNote?.id !== prevNoteId) {
      if (prevNoteId != null) {
        const prevBase = baseNotes[prevNoteId];
        const wasDirty = Boolean(
          drafts[prevNoteId]?.isDirty ||
          (prevBase && (editorTitle !== prevBase.title || editorContent !== prevBase.content))
        );
        if (wasDirty) {
          drafts[prevNoteId] = {
            title: editorTitle,
            content: editorContent,
            history: [...history],
            redoStack: [...redoStack],
            isDirty: true
          };
        }
      }

      prevNoteId = newNote?.id;
      prevServerVersion = {
        id: newNote?.id,
        title: newNote?.title,
        content: newNote?.content
      };

      if (newNote) {
        baseNotes[newNote.id] = {
          title: newNote.title || '',
          content: newNote.content || ''
        };

        const existingDraft = drafts[newNote.id];
        if (existingDraft && existingDraft.isDirty) {
          editorContent = existingDraft.content || '';
          editorTitle = existingDraft.title || '';
          history = [...existingDraft.history];
          redoStack = [...existingDraft.redoStack];
        } else {
          editorContent = newNote.content || '';
          editorTitle = newNote.title || '';
          history = newNote.content ? [newNote.content] : [''];
          redoStack = [];
        }
      } else {
        editorContent = '';
        editorTitle = '';
        history = [];
        redoStack = [];
      }
    } else if (
      newNote &&
      (newNote.title !== prevServerVersion.title || newNote.content !== prevServerVersion.content)
    ) {
      const prevBase = baseNotes[newNote.id];
      const hasActiveDraft = Boolean(drafts[newNote.id]?.isDirty);
      const isCurrentlyDirty = hasActiveDraft ||
        (prevBase && (editorTitle !== prevBase.title || editorContent !== prevBase.content));

      prevServerVersion = {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content
      };
      baseNotes[newNote.id] = {
        title: newNote.title || '',
        content: newNote.content || ''
      };

      // Only update from background server changes if user hasn't made dirty edits
      if (!isCurrentlyDirty) {
        editorContent = newNote.content || '';
        editorTitle = newNote.title || '';
        history = newNote.content ? [newNote.content] : [''];
        redoStack = [];
      }
    }
  };

  const getIsDirty = () => {
    if (!selectedNote) return false;
    const base = baseNotes[selectedNote.id] || selectedNote;
    return Boolean(
      drafts[selectedNote.id]?.isDirty ||
      editorTitle !== (base?.title || '') ||
      editorContent !== (base?.content || '')
    );
  };

  const handleContentChange = (newVal) => {
    editorContent = newVal;
    history = [...history.slice(-19), newVal];
    redoStack = [];

    if (selectedNote?.id) {
      const base = baseNotes[selectedNote.id] || selectedNote;
      const dirty = newVal !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        drafts[selectedNote.id] = {
          title: editorTitle,
          content: newVal,
          history: [...history],
          redoStack: [],
          isDirty: true
        };
      } else {
        delete drafts[selectedNote.id];
      }
    }
  };

  const handleTitleChange = (newTitle) => {
    editorTitle = newTitle;
    if (selectedNote?.id) {
      const base = baseNotes[selectedNote.id] || selectedNote;
      const dirty = newTitle !== (base.title || '') || editorContent !== (base.content || '');
      if (dirty) {
        drafts[selectedNote.id] = {
          title: newTitle,
          content: editorContent,
          history: [...history],
          redoStack: [...redoStack],
          isDirty: true
        };
      } else {
        delete drafts[selectedNote.id];
      }
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    redoStack = [...redoStack, current];
    history = history.slice(0, -1);
    editorContent = previous;

    if (selectedNote?.id) {
      const base = baseNotes[selectedNote.id] || selectedNote;
      const dirty = previous !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        drafts[selectedNote.id] = {
          title: editorTitle,
          content: previous,
          history: [...history],
          redoStack: [...redoStack],
          isDirty: true
        };
      } else {
        delete drafts[selectedNote.id];
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    redoStack = redoStack.slice(0, -1);
    history = [...history, next];
    editorContent = next;

    if (selectedNote?.id) {
      const base = baseNotes[selectedNote.id] || selectedNote;
      const dirty = next !== (base.content || '') || editorTitle !== (base.title || '');
      if (dirty) {
        drafts[selectedNote.id] = {
          title: editorTitle,
          content: next,
          history: [...history],
          redoStack: [...redoStack],
          isDirty: true
        };
      } else {
        delete drafts[selectedNote.id];
      }
    }
  };

  const markSaved = (noteId = selectedNote?.id) => {
    if (!noteId) return;
    delete drafts[noteId];
    baseNotes[noteId] = {
      title: editorTitle,
      content: editorContent
    };
    prevServerVersion = {
      id: noteId,
      title: editorTitle,
      content: editorContent
    };
    history = [editorContent];
    redoStack = [];
  };

  const discardDraft = (noteId = selectedNote?.id) => {
    if (!noteId) return;
    delete drafts[noteId];
    const base = baseNotes[noteId] || selectedNote;
    editorTitle = base?.title || '';
    editorContent = base?.content || '';
    history = editorContent ? [editorContent] : [''];
    redoStack = [];
  };

  const hasDraft = (noteId) => {
    if (!noteId) return false;
    const draft = drafts[noteId];
    if (draft && draft.isDirty) return true;
    if (selectedNote?.id === noteId && getIsDirty()) return true;
    return false;
  };

  return {
    getState: () => ({
      editorTitle,
      editorContent,
      history: [...history],
      redoStack: [...redoStack],
      isDirty: getIsDirty(),
      hasDraft: (id) => hasDraft(id)
    }),
    updateFromProps,
    handleContentChange,
    handleTitleChange,
    handleUndo,
    handleRedo,
    markSaved,
    discardDraft
  };
}

test('FE-008: Source implementation and contract validation', async (t) => {
  await t.test('verifies useNotesEditor hook exports dirty state and draft controls', () => {
    const hookPath = path.join(notesDir, 'hooks', 'useNotesEditor.js');
    assert.ok(fs.existsSync(hookPath), 'useNotesEditor.js must exist');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(content.includes('isDirty,'), 'useNotesEditor must return isDirty');
    assert.ok(content.includes('markSaved,'), 'useNotesEditor must return markSaved');
    assert.ok(content.includes('discardDraft,'), 'useNotesEditor must return discardDraft');
    assert.ok(content.includes('hasDraft'), 'useNotesEditor must return hasDraft');
    assert.ok(content.includes('draftsRef'), 'useNotesEditor must maintain drafts in memory');
    assert.ok(content.includes('beforeunload'), 'useNotesEditor must protect unsaved edits on unload');
  });

  await t.test('verifies NotesPage.jsx separates note selection from background updates', () => {
    const pagePath = path.join(notesDir, 'pages', 'NotesPage.jsx');
    assert.ok(fs.existsSync(pagePath), 'NotesPage.jsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('markSaved(selectedNote.id)'), 'handleSaveNote must call markSaved');
    assert.ok(content.includes('discardDraft'), 'NotesPage must handle discardDraft');
    assert.ok(content.includes('hasDraft={hasDraft}'), 'NotesSidebar must receive hasDraft');
    assert.ok(content.includes('isDirty={isDirty}'), 'NotesEditor must receive isDirty');
    assert.ok(content.includes('onDiscardDraft='), 'NotesEditor must receive onDiscardDraft');
  });

  await t.test('verifies NotesEditor.jsx renders discard button when dirty', () => {
    const editorPath = path.join(notesDir, 'components', 'NotesEditor.jsx');
    assert.ok(fs.existsSync(editorPath), 'NotesEditor.jsx must exist');
    const content = fs.readFileSync(editorPath, 'utf8');

    assert.ok(content.includes('isDirty && onDiscardDraft'), 'NotesEditor must conditionally render Discard button');
    assert.ok(content.includes('RotateCcw'), 'NotesEditor must import and display RotateCcw icon');
    assert.ok(content.includes("isDirty ? 'Save *' : 'Save'"), 'NotesEditor must indicate dirty status on Save button');
  });

  await t.test('verifies NotesSidebar.jsx renders draft indicator when draft exists', () => {
    const sidebarPath = path.join(notesDir, 'components', 'NotesSidebar.jsx');
    assert.ok(fs.existsSync(sidebarPath), 'NotesSidebar.jsx must exist');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.ok(content.includes('hasDraft && hasDraft(note.id)'), 'NotesSidebar must check hasDraft for notes');
    assert.ok(content.includes('Draft'), 'NotesSidebar must render Draft badge');
  });
});

test('FE-008: Note switching and draft preservation', async (t) => {
  await t.test('preserves unsaved edits and history when switching between notes', () => {
    const note1 = { id: 1, title: 'Math Notes', content: 'Derivative rules' };
    const note2 = { id: 2, title: 'History Notes', content: 'Ancient Rome' };

    const harness = createNotesEditorHarness(note1);
    assert.strictEqual(harness.getState().isDirty, false);

    // User types in note 1
    harness.handleContentChange('Derivative rules: Power rule d/dx x^n = n*x^(n-1)');
    harness.handleContentChange('Derivative rules: Power rule and Product rule');
    assert.strictEqual(harness.getState().isDirty, true);
    assert.strictEqual(harness.getState().history.length, 3);

    // Switch to note 2
    harness.updateFromProps(note2);
    assert.strictEqual(harness.getState().editorTitle, 'History Notes');
    assert.strictEqual(harness.getState().editorContent, 'Ancient Rome');
    assert.strictEqual(harness.getState().isDirty, false);
    assert.strictEqual(harness.getState().hasDraft(1), true, 'Note 1 should have a saved draft');
    assert.strictEqual(harness.getState().hasDraft(2), false, 'Note 2 should not have a draft');

    // Switch back to note 1
    harness.updateFromProps(note1);
    assert.strictEqual(harness.getState().editorContent, 'Derivative rules: Power rule and Product rule');
    assert.strictEqual(harness.getState().isDirty, true);
    assert.strictEqual(harness.getState().history.length, 3, 'History should be restored with note 1');

    // Undo should work on the restored history
    harness.handleUndo();
    assert.strictEqual(harness.getState().editorContent, 'Derivative rules: Power rule d/dx x^n = n*x^(n-1)');
    assert.strictEqual(harness.getState().redoStack.length, 1);

    // Redo should work
    harness.handleRedo();
    assert.strictEqual(harness.getState().editorContent, 'Derivative rules: Power rule and Product rule');
  });

  await t.test('markSaved clears dirty state and updates base content', () => {
    const note1 = { id: 1, title: 'Biology', content: 'Cell biology' };
    const harness = createNotesEditorHarness(note1);

    harness.handleContentChange('Cell biology: Mitochondria is the powerhouse');
    assert.strictEqual(harness.getState().isDirty, true);

    harness.markSaved(1);
    assert.strictEqual(harness.getState().isDirty, false);
    assert.strictEqual(harness.getState().hasDraft(1), false);
    assert.strictEqual(harness.getState().history.length, 1);
  });

  await t.test('discardDraft reverts changes to clean baseline upon confirmation', () => {
    const note1 = { id: 1, title: 'Original Title', content: 'Original Content' };
    const harness = createNotesEditorHarness(note1);

    harness.handleTitleChange('Unwanted Title Change');
    harness.handleContentChange('Unwanted Content Change');
    assert.strictEqual(harness.getState().isDirty, true);

    harness.discardDraft(1);
    assert.strictEqual(harness.getState().editorTitle, 'Original Title');
    assert.strictEqual(harness.getState().editorContent, 'Original Content');
    assert.strictEqual(harness.getState().isDirty, false);
    assert.strictEqual(harness.getState().hasDraft(1), false);
  });
});

test('FE-008: Background update protection and note selection separation', async (t) => {
  await t.test('background update does not overwrite active unsaved edits', () => {
    const note1 = { id: 1, title: 'Draft Note', content: 'Version 1' };
    const harness = createNotesEditorHarness(note1);

    // User types in draft
    harness.handleContentChange('Version 1 + User local edits');
    assert.strictEqual(harness.getState().isDirty, true);

    // Server sends background update for note 1
    const serverUpdatedNote1 = { id: 1, title: 'Draft Note', content: 'Version 2 from server background update' };
    harness.updateFromProps(serverUpdatedNote1);

    // Unsaved local edits MUST be preserved
    assert.strictEqual(harness.getState().editorContent, 'Version 1 + User local edits');
    assert.strictEqual(harness.getState().isDirty, true);
  });

  await t.test('background update cleanly updates non-dirty notes', () => {
    const note1 = { id: 1, title: 'Draft Note', content: 'Version 1' };
    const harness = createNotesEditorHarness(note1);

    assert.strictEqual(harness.getState().isDirty, false);

    // Server sends background update when user has not edited
    const serverUpdatedNote1 = { id: 1, title: 'Draft Note Updated', content: 'Version 2 from server' };
    harness.updateFromProps(serverUpdatedNote1);

    assert.strictEqual(harness.getState().editorTitle, 'Draft Note Updated');
    assert.strictEqual(harness.getState().editorContent, 'Version 2 from server');
    assert.strictEqual(harness.getState().isDirty, false);
  });

  await t.test('note selection remains stable when notes list prepends new items in background', () => {
    let notes = [
      { id: 10, title: 'First Note' },
      { id: 20, title: 'Second Note' }
    ];
    let selectedNoteId = notes && notes.length > 0 ? notes[0].id : null;
    let prevNotes = notes;

    const resolveSelection = (newNotes) => {
      if (newNotes !== prevNotes) {
        prevNotes = newNotes;
        if (selectedNoteId === null && newNotes.length > 0) {
          selectedNoteId = newNotes[0].id;
        } else if (selectedNoteId !== null && newNotes.length > 0 && !newNotes.some(n => n.id === selectedNoteId)) {
          selectedNoteId = newNotes[0].id;
        }
      }
      return newNotes.find(n => n.id === selectedNoteId) || newNotes[0] || null;
    };

    // Initial resolution selects note 10
    const initialSelected = resolveSelection(notes);
    assert.strictEqual(initialSelected.id, 10);
    assert.strictEqual(selectedNoteId, 10);

    // Background update: a new note is added at index 0
    const updatedNotes = [
      { id: 99, title: 'Brand New Note Added Remotely' },
      { id: 10, title: 'First Note' },
      { id: 20, title: 'Second Note' }
    ];

    const afterBackgroundUpdate = resolveSelection(updatedNotes);
    // Selection MUST remain on note 10, NOT switch to note 99
    assert.strictEqual(afterBackgroundUpdate.id, 10);
    assert.strictEqual(selectedNoteId, 10);
  });
});
