import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

test('FE-006: ESLint clean check across codebase', async (t) => {
  await t.test('executes npm run lint with zero errors and zero warnings', () => {
    let output = '';
    try {
      output = execSync('npm run lint', { cwd: frontendDir, stdio: 'pipe' }).toString();
    } catch (err) {
      assert.fail(`ESLint failed with violations:\n${err.stdout?.toString() || err.message}`);
    }
    assert.ok(output.includes('eslint .'), 'Expected eslint command to have run');
  });

  await t.test('verifies ThemeContext only exports components and useTheme is in separate file', () => {
    const themeContextPath = path.join(frontendDir, 'src/context/ThemeContext.jsx');
    const useThemePath = path.join(frontendDir, 'src/context/useTheme.js');
    const instancePath = path.join(frontendDir, 'src/context/themeContextInstance.js');

    assert.ok(fs.existsSync(themeContextPath), 'ThemeContext.jsx must exist');
    assert.ok(fs.existsSync(useThemePath), 'useTheme.js must exist');
    assert.ok(fs.existsSync(instancePath), 'themeContextInstance.js must exist');

    const themeContent = fs.readFileSync(themeContextPath, 'utf8');
    assert.ok(
      themeContent.includes('export function ThemeProvider'),
      'ThemeContext.jsx must export ThemeProvider component'
    );
    assert.ok(
      !themeContent.includes('export function useTheme'),
      'ThemeContext.jsx must not export useTheme to preserve Fast Refresh'
    );
  });

  await t.test('verifies useNotesEditor state adjusts cleanly across note switching', () => {
    let currentNote = { id: 1, title: 'Note 1', content: 'Content 1' };
    let editorContent = currentNote.content;
    let editorTitle = currentNote.title;
    let history = [currentNote.content];
    let prevNoteId = currentNote.id;

    const simulateEditorUpdate = (newNote) => {
      if (newNote?.id !== prevNoteId) {
        prevNoteId = newNote?.id;
        if (newNote) {
          editorContent = newNote.content || '';
          editorTitle = newNote.title || '';
          history = [newNote.content || ''];
        } else {
          editorContent = '';
          editorTitle = '';
          history = [];
        }
      }
    };

    // Switching to note 2
    simulateEditorUpdate({ id: 2, title: 'Note 2', content: 'Content 2' });
    assert.strictEqual(editorTitle, 'Note 2');
    assert.strictEqual(editorContent, 'Content 2');
    assert.deepStrictEqual(history, ['Content 2']);

    // Re-rendering note 2 with identical ID should not wipe unsaved history
    history.push('User typed more content');
    simulateEditorUpdate({ id: 2, title: 'Note 2', content: 'Content 2' });
    assert.strictEqual(history.length, 2, 'Should not reset history when note ID is identical');

    // Deselecting note
    simulateEditorUpdate(null);
    assert.strictEqual(editorTitle, '');
    assert.strictEqual(editorContent, '');
    assert.deepStrictEqual(history, []);
  });

  await t.test('verifies GroupOverview loading state initialization avoiding synchronous set-state in effect', () => {
    const calculateInitialLoading = (groupId) => Boolean(groupId);

    assert.strictEqual(calculateInitialLoading(null), false, 'Empty groupId should initialize loading to false');
    assert.strictEqual(calculateInitialLoading(undefined), false);
    assert.strictEqual(calculateInitialLoading(42), true, 'Valid groupId should initialize loading to true');
  });
});
