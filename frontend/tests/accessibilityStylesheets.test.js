import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

test('FE-010: Dead stylesheet placeholders verification', async (t) => {
  await t.test('verifies global.css and variables.css placeholders are removed', () => {
    const globalCssPath = path.join(srcDir, 'styles', 'global.css');
    const variablesCssPath = path.join(srcDir, 'styles', 'variables.css');

    assert.strictEqual(
      fs.existsSync(globalCssPath),
      false,
      'src/styles/global.css should be completely removed'
    );
    assert.strictEqual(
      fs.existsSync(variablesCssPath),
      false,
      'src/styles/variables.css should be completely removed'
    );
  });

  await t.test('verifies active application code does not import dead stylesheets', () => {
    function scanImports(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanImports(fullPath);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.strictEqual(
            /from\s+['"][^'"]*styles\/global\.css['"]|import\s+['"][^'"]*styles\/global\.css['"]/.test(content),
            false,
            `File ${entry.name} should not import global.css`
          );
          assert.strictEqual(
            /from\s+['"][^'"]*styles\/variables\.css['"]|import\s+['"][^'"]*styles\/variables\.css['"]/.test(content),
            false,
            `File ${entry.name} should not import variables.css`
          );
        }
      }
    }

    scanImports(srcDir);
  });
});

test('FE-010: TabNavigation semantic and ARIA compliance', async (t) => {
  await t.test('verifies TabNavigation renders semantic buttons with role="tab" and aria-selected', () => {
    const tabNavPath = path.join(srcDir, 'features/dashboard/components/TabNavigation/TabNavigation.jsx');
    const content = fs.readFileSync(tabNavPath, 'utf8');

    assert.match(content, /role="tablist"/, 'TabNavigation must have role="tablist"');
    assert.match(content, /<button[^>]*role="tab"/, 'Tabs must be semantic button elements with role="tab"');
    assert.match(content, /aria-selected=\{activeTab === tab\}/, 'Tabs must define aria-selected');
    assert.match(content, /type="button"/, 'Tabs must explicitly set type="button"');
  });

  await t.test('verifies TabNavigation CSS contains button resets and focus-visible indicators', () => {
    const cssPath = path.join(srcDir, 'features/dashboard/components/TabNavigation/TabNavigation.module.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.tabLink:focus-visible/, 'TabNavigation must define :focus-visible for keyboard users');
    assert.match(css, /border:\s*none/, 'TabNavigation tabLink must reset default border');
    assert.match(css, /background:\s*transparent/, 'TabNavigation tabLink must reset default background');
  });
});

test('FE-010: Sidebar keyboard navigation and semantic controls', async (t) => {
  await t.test('verifies sidebar logo is a semantic button with accessible label', () => {
    const sidebarPath = path.join(srcDir, 'features/dashboard/components/Sidebar/Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.match(
      content,
      /<button[^>]*className=\{styles\.sidebarLogo\}[^>]*aria-label="StudyCollab home"/,
      'Sidebar logo must be a semantic button with an accessible label'
    );
  });

  await t.test('verifies group list items support keyboard selection via Enter and Space', () => {
    const sidebarPath = path.join(srcDir, 'features/dashboard/components/Sidebar/Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.match(content, /role="button"/, 'Group items must declare role="button"');
    assert.match(content, /tabIndex=\{0\}/, 'Group items must declare tabIndex={0}');
    assert.match(content, /aria-label=\{`Select group \$\{group\.name\}`\}/, 'Group items must provide aria-label');
    assert.match(content, /aria-selected=\{activeGroup\?\.id === group\.id/, 'Group items must provide aria-selected');
    assert.match(content, /e\.key === "Enter" \|\| e\.key === " "/, 'Group items must support Enter and Space keys');
  });

  await t.test('verifies sidebar footer actions are semantic buttons with accessible names', () => {
    const sidebarPath = path.join(srcDir, 'features/dashboard/components/Sidebar/Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.match(
      content,
      /<button[^>]*className=\{styles\.footerAction\}[^>]*onClick=\{handleThemeToggle\}/,
      'Theme toggle must be a semantic button'
    );
    assert.match(
      content,
      /<button[^>]*className=\{styles\.userInfo\}[^>]*title="Account Settings"/,
      'User info must be a semantic button'
    );
    assert.match(
      content,
      /<button[^>]*className=\{`\$\{styles\.footerAction\} \$\{styles\.logoutAction\}`\}/,
      'Logout must be a semantic button'
    );
  });

  await t.test('verifies Sidebar CSS contains focus indicators for interactive elements', () => {
    const cssPath = path.join(srcDir, 'features/dashboard/components/Sidebar/Sidebar.module.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.sidebarLogo:focus-visible/, 'Sidebar logo must define :focus-visible');
    assert.match(css, /\.groupItem:focus-visible/, 'Group items must define :focus-visible');
    assert.match(css, /\.userInfo:focus-visible/, 'User info must define :focus-visible');
    assert.match(css, /\.footerAction:focus-visible/, 'Footer actions must define :focus-visible');
  });
});

test('FE-010: TasksPage and NotesSidebar keyboard and screen-reader accessibility', async (t) => {
  await t.test('verifies task cards have role="button", tabIndex={0}, and Enter/Space handlers', () => {
    const tasksPath = path.join(srcDir, 'features/tasks/pages/TasksPage.jsx');
    const content = fs.readFileSync(tasksPath, 'utf8');

    assert.match(content, /role="button"/, 'Task cards must declare role="button"');
    assert.match(content, /tabIndex=\{0\}/, 'Task cards must declare tabIndex={0}');
    assert.match(content, /e\.key === 'Enter' \|\| e\.key === ' '/, 'Task cards must handle Enter and Space keys');
    assert.match(content, /aria-label="Mark task complete"/, 'Task complete button must have aria-label');
    assert.match(content, /aria-label="Delete task"/, 'Task delete button must have aria-label');
  });

  await t.test('verifies note cards have role="button", tabIndex={0}, and Enter/Space handlers', () => {
    const notesSidebarPath = path.join(srcDir, 'features/notes/components/NotesSidebar.jsx');
    const content = fs.readFileSync(notesSidebarPath, 'utf8');

    assert.match(content, /role="button"/, 'Note cards must declare role="button"');
    assert.match(content, /tabIndex=\{0\}/, 'Note cards must declare tabIndex={0}');
    assert.match(content, /aria-selected=\{selectedNoteId === note\.id\}/, 'Note cards must declare aria-selected');
    assert.match(content, /e\.key === 'Enter' \|\| e\.key === ' '/, 'Note cards must handle Enter and Space keys');
    assert.match(content, /aria-label=\{`Delete note \$\{note\.title\}`\}/, 'Delete note button must have aria-label');
  });

  await t.test('verifies TasksPage and NotesSidebar CSS define :focus-visible', () => {
    const tasksCss = fs.readFileSync(path.join(srcDir, 'features/tasks/pages/TasksPage.module.css'), 'utf8');
    const notesCss = fs.readFileSync(path.join(srcDir, 'features/notes/components/NotesSidebar.module.css'), 'utf8');

    assert.match(tasksCss, /\.taskCard:focus-visible/, 'Task card must define :focus-visible');
    assert.match(tasksCss, /\.actionIconButton:focus-visible/, 'Action icon buttons must define :focus-visible');
    assert.match(notesCss, /\.noteCard:focus-visible/, 'Note card must define :focus-visible');
    assert.match(notesCss, /\.inlineDeleteBtn:focus-visible/, 'Inline delete button must define :focus-visible');
  });
});

test('FE-010: Semantic buttons and keyboard controls across dashboard and landing views', async (t) => {
  await t.test('verifies GroupOverview cards and rows are semantic buttons with aria-labels', () => {
    const filesPath = path.join(srcDir, 'features/dashboard/components/GroupOverview/components/RecentFiles/RecentFiles.jsx');
    const notesPath = path.join(srcDir, 'features/dashboard/components/GroupOverview/components/RecentNotes/RecentNotes.jsx');
    const tasksPath = path.join(srcDir, 'features/dashboard/components/GroupOverview/components/UpcomingTasks/UpcomingTasks.jsx');
    const statsPath = path.join(srcDir, 'features/dashboard/components/GroupOverview/components/StatsGrid/StatsGrid.jsx');
    const membersPath = path.join(srcDir, 'features/dashboard/components/GroupOverview/components/MembersCard/MembersCard.jsx');

    const filesContent = fs.readFileSync(filesPath, 'utf8');
    const notesContent = fs.readFileSync(notesPath, 'utf8');
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    const statsContent = fs.readFileSync(statsPath, 'utf8');
    const membersContent = fs.readFileSync(membersPath, 'utf8');

    assert.match(filesContent, /<button[\s\S]*?className=\{styles\.listRow\}[\s\S]*?aria-label=/, 'RecentFiles rows must be semantic buttons');
    assert.match(notesContent, /<button[\s\S]*?className=\{styles\.listRow\}[\s\S]*?aria-label=/, 'RecentNotes rows must be semantic buttons');
    assert.match(tasksContent, /<button[\s\S]*?className=\{styles\.taskRow\}[\s\S]*?aria-label=/, 'UpcomingTasks rows must be semantic buttons');
    assert.match(statsContent, /<button[\s\S]*?className=\{styles\.statCard\}[\s\S]*?aria-label=/, 'StatsGrid cards must be semantic buttons');
    assert.match(membersContent, /<button[\s\S]*?className=\{styles\.memberAvatarCircle\}[\s\S]*?aria-label=/, 'MembersCard avatars must be semantic buttons');
  });

  await t.test('verifies Header and Auth logos are semantic buttons with aria-label', () => {
    const headerPath = path.join(srcDir, 'features/landing/components/Header/Header.jsx');
    const loginPath = path.join(srcDir, 'features/auth/pages/Login.jsx');
    const registerPath = path.join(srcDir, 'features/auth/pages/Register.jsx');
    const verifyPath = path.join(srcDir, 'features/auth/pages/VerifyEmail.jsx');

    const headerContent = fs.readFileSync(headerPath, 'utf8');
    const loginContent = fs.readFileSync(loginPath, 'utf8');
    const registerContent = fs.readFileSync(registerPath, 'utf8');
    const verifyContent = fs.readFileSync(verifyPath, 'utf8');

    assert.match(headerContent, /<button[\s\S]*?className=\{styles\.logoContainer\}[\s\S]*?aria-label="StudyCollab home"/, 'Landing header logo must be a semantic button');
    assert.match(loginContent, /<button[\s\S]*?className=\{styles\.logo\}[\s\S]*?aria-label="StudyCollab home"/, 'Login logo must be a semantic button');
    assert.match(registerContent, /<button[\s\S]*?className=\{styles\.logo\}[\s\S]*?aria-label="StudyCollab home"/, 'Register logo must be a semantic button');
    assert.match(verifyContent, /<button[\s\S]*?className=\{styles\.logo\}[\s\S]*?aria-label="StudyCollab home"/, 'VerifyEmail logo must be a semantic button');
  });
});
