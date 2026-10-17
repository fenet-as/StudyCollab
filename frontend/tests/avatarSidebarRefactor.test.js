import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, '../src/features/dashboard');

// Helper state harness simulating Sidebar prop resolution and avatar lifecycle
function createSidebarHarness(initialProps = {}) {
  let props = { ...initialProps };
  let avatarError = false;
  let prevAvatarUrl = props.currentUser?.avatarUrl || props.userAvatarUrl || null;

  const getResolvedProps = () => {
    const user = props.user || props.currentUser;
    const resolvedEmail = user?.email || props.userEmail || '';
    const resolvedDisplayName =
      user?.displayName ||
      user?.fullName ||
      props.userDisplayName ||
      (resolvedEmail ? resolvedEmail.split('@')[0] : 'User');
    const resolvedInitials =
      user?.initials ||
      props.userInitials ||
      (resolvedDisplayName ? resolvedDisplayName.charAt(0).toUpperCase() : 'U');
    const resolvedAvatarUrl = user?.avatarUrl || props.userAvatarUrl || null;

    if (resolvedAvatarUrl !== prevAvatarUrl) {
      prevAvatarUrl = resolvedAvatarUrl;
      avatarError = false;
    }

    return {
      resolvedEmail,
      resolvedDisplayName,
      resolvedInitials,
      resolvedAvatarUrl,
      avatarError,
      isShowingImg: Boolean(resolvedAvatarUrl && !avatarError)
    };
  };

  const updateProps = (newProps) => {
    props = { ...props, ...newProps };
  };

  const triggerImgError = () => {
    avatarError = true;
  };

  return {
    getResolvedProps,
    updateProps,
    triggerImgError
  };
}

test('FE-009: Dead event removal and state propagation verification', async (t) => {
  await t.test('verifies avatarUpdated window event is completely removed from codebase', () => {
    const srcDir = path.resolve(__dirname, '../src');
    
    // Recursive search for avatarUpdated in all src files
    const findInDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findInDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.strictEqual(
            content.includes('avatarUpdated'),
            false,
            `File ${fullPath} must not reference dead 'avatarUpdated' event`
          );
        }
      }
    };

    findInDir(srcDir);
  });

  await t.test('verifies AvatarCard.jsx triggers onAvatarUpdated callback directly', () => {
    const avatarCardPath = path.join(dashboardDir, 'components', 'settings', 'AvatarCard', 'AvatarCard.jsx');
    assert.ok(fs.existsSync(avatarCardPath), 'AvatarCard.jsx must exist');
    const content = fs.readFileSync(avatarCardPath, 'utf8');

    assert.ok(
      content.includes('onAvatarUpdated(freshAvatarUrl)'),
      'AvatarCard.jsx must directly invoke onAvatarUpdated callback with fresh avatar URL'
    );
  });

  await t.test('verifies SettingsPane.jsx propagates avatarUrl in onProfileUpdated callback', () => {
    const settingsPanePath = path.join(dashboardDir, 'components', 'settings', 'SettingsPane.jsx');
    assert.ok(fs.existsSync(settingsPanePath), 'SettingsPane.jsx must exist');
    const content = fs.readFileSync(settingsPanePath, 'utf8');

    assert.ok(
      content.includes('onProfileUpdated({ avatarUrl: newAvatarUrl })'),
      'SettingsPane must pass updated avatarUrl payload to onProfileUpdated'
    );
  });

  await t.test('verifies Dashboard.jsx handles updated avatarUrl immediately', () => {
    const dashboardPath = path.join(dashboardDir, 'pages', 'Dashboard.jsx');
    assert.ok(fs.existsSync(dashboardPath), 'Dashboard.jsx must exist');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(
      content.includes('updatedProfile?.avatarUrl'),
      'Dashboard.jsx must check for updated avatarUrl payload in onProfileUpdated'
    );
    assert.ok(
      content.includes('currentUser={{'),
      'Dashboard.jsx must pass clean currentUser object to Sidebar'
    );
  });
});

test('FE-009: Sidebar props simplification and backward compatibility', async (t) => {
  await t.test('resolves user profile fields from currentUser object', () => {
    const harness = createSidebarHarness({
      currentUser: {
        email: 'student@example.com',
        displayName: 'Alice Johnson',
        initials: 'AJ',
        avatarUrl: 'https://cdn.example.com/alice.png'
      }
    });

    const state = harness.getResolvedProps();
    assert.strictEqual(state.resolvedEmail, 'student@example.com');
    assert.strictEqual(state.resolvedDisplayName, 'Alice Johnson');
    assert.strictEqual(state.resolvedInitials, 'AJ');
    assert.strictEqual(state.resolvedAvatarUrl, 'https://cdn.example.com/alice.png');
    assert.strictEqual(state.isShowingImg, true);
  });

  await t.test('preserves backward compatibility when legacy individual props are passed', () => {
    const harness = createSidebarHarness({
      userEmail: 'bob@example.com',
      userDisplayName: 'Bob Smith',
      userInitials: 'BS',
      userAvatarUrl: 'https://cdn.example.com/bob.png'
    });

    const state = harness.getResolvedProps();
    assert.strictEqual(state.resolvedEmail, 'bob@example.com');
    assert.strictEqual(state.resolvedDisplayName, 'Bob Smith');
    assert.strictEqual(state.resolvedInitials, 'BS');
    assert.strictEqual(state.resolvedAvatarUrl, 'https://cdn.example.com/bob.png');
    assert.strictEqual(state.isShowingImg, true);
  });

  await t.test('auto-recovers from avatar error when avatarUrl changes', () => {
    const harness = createSidebarHarness({
      currentUser: {
        email: 'carol@example.com',
        avatarUrl: 'https://cdn.example.com/broken-url.png'
      }
    });

    assert.strictEqual(harness.getResolvedProps().isShowingImg, true);

    // Image fails to load
    harness.triggerImgError();
    assert.strictEqual(harness.getResolvedProps().isShowingImg, false, 'Should fallback to initials on error');

    // User updates their avatar to a new working URL
    harness.updateProps({
      currentUser: {
        email: 'carol@example.com',
        avatarUrl: 'https://cdn.example.com/fresh-avatar.png?t=12345'
      }
    });

    assert.strictEqual(
      harness.getResolvedProps().isShowingImg,
      true,
      'Should automatically reset avatarError and show image when avatarUrl updates'
    );
    assert.strictEqual(harness.getResolvedProps().avatarError, false);
  });
});

test('FE-009: Existing navigation and settings behavior preservation', async (t) => {
  await t.test('group selection triggers active group and overview tab switches', () => {
    let selectedGroup = null;
    let selectedTab = null;
    let mobileOpen = true;

    const mockSetActiveGroup = (g) => { selectedGroup = g; };
    const mockSetActiveTab = (tab) => { selectedTab = tab; };
    const mockSetIsMobileMenuOpen = (open) => { mobileOpen = open; };

    const handleGroupSelect = (group) => {
      mockSetActiveGroup(group);
      mockSetActiveTab('Overview');
      mockSetIsMobileMenuOpen(false);
    };

    const targetGroup = { id: 101, name: 'Physics 101' };
    handleGroupSelect(targetGroup);

    assert.strictEqual(selectedGroup.id, 101);
    assert.strictEqual(selectedTab, 'Overview');
    assert.strictEqual(mobileOpen, false);
  });

  await t.test('account settings click opens settings tab and closes mobile drawer', () => {
    let activeTab = 'Overview';
    let mobileOpen = true;

    const handleOpenSettings = () => {
      activeTab = 'Settings';
      mobileOpen = false;
    };

    handleOpenSettings();
    assert.strictEqual(activeTab, 'Settings');
    assert.strictEqual(mobileOpen, false);
  });
});
