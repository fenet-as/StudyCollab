import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api/config.js';
import {
  registerUser,
  loginUser,
  verifyEmailToken,
  resendVerificationEmail,
  refreshToken,
  logoutUser,
} from '../src/api/authApi.js';
import { notesApi } from '../src/api/notesApi.js';
import { tasksApi } from '../src/api/tasksApi.js';
import { userApi } from '../src/api/userApi.js';
import { filesApi } from '../src/api/filesApi.js';
import { fetchGroupOverview } from '../src/api/groupOverviewApi.js';
import { groupApi } from '../src/api/groupApi.js';

// Helper to configure a mock response on the shared Axios instance for a test
function setupApiMock(handler) {
  const originalAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => {
    try {
      const response = await handler(config);
      return {
        data: response.data,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: response.headers || {},
        config,
        request: {},
      };
    } catch (err) {
      if (err.response) {
        const error = new Error(err.message || 'Request failed with status code ' + err.response.status);
        error.config = config;
        error.response = {
          data: err.response.data || {},
          status: err.response.status,
          statusText: err.response.statusText || 'Error',
          headers: err.response.headers || {},
          config,
        };
        throw error;
      }
      throw err;
    }
  };

  return () => {
    api.defaults.adapter = originalAdapter;
  };
}

test('FE-011: Auth API utilities and authentication workflow', async (t) => {
  await t.test('loginUser sends credentials to /auth/login and returns response payload', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: {
          accessToken: 'jwt-access-token-123',
          tokenType: 'Bearer',
          user: { id: 1, email: 'student@example.com', name: 'Alex Student' },
        },
      };
    });

    try {
      const result = await loginUser({ email: 'student@example.com', password: 'Password123!' });

      assert.strictEqual(capturedConfig.method.toLowerCase(), 'post');
      assert.strictEqual(capturedConfig.url, '/auth/login');
      assert.deepStrictEqual(JSON.parse(capturedConfig.data), {
        email: 'student@example.com',
        password: 'Password123!',
      });
      assert.strictEqual(result.accessToken, 'jwt-access-token-123');
      assert.strictEqual(result.user.email, 'student@example.com');
    } finally {
      restore();
    }
  });

  await t.test('registerUser sends registration payload to /auth/register', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: { message: 'Registration successful! Verification email sent.' },
      };
    });

    try {
      const result = await registerUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      assert.strictEqual(capturedConfig.method.toLowerCase(), 'post');
      assert.strictEqual(capturedConfig.url, '/auth/register');
      assert.strictEqual(result.message, 'Registration successful! Verification email sent.');
    } finally {
      restore();
    }
  });

  await t.test('verifyEmailToken calls /auth/verify-email with query parameter', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: { verified: true, message: 'Email verified successfully.' },
      };
    });

    try {
      const result = await verifyEmailToken('uuid-verification-token-abc');

      assert.strictEqual(capturedConfig.method.toLowerCase(), 'get');
      assert.strictEqual(capturedConfig.url, '/auth/verify-email?token=uuid-verification-token-abc');
      assert.strictEqual(result.verified, true);
    } finally {
      restore();
    }
  });

  await t.test('resendVerificationEmail calls /auth/resend-verification', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: { message: 'Verification link resent.' },
      };
    });

    try {
      const result = await resendVerificationEmail('student@example.com');

      assert.strictEqual(capturedConfig.method.toLowerCase(), 'post');
      assert.strictEqual(capturedConfig.url, '/auth/resend-verification');
      assert.deepStrictEqual(JSON.parse(capturedConfig.data), { email: 'student@example.com' });
      assert.strictEqual(result.message, 'Verification link resent.');
    } finally {
      restore();
    }
  });

  await t.test('refreshToken calls /auth/refresh and logoutUser calls /auth/logout', async () => {
    const urls = [];
    const restore = setupApiMock(async (config) => {
      urls.push({ method: config.method.toLowerCase(), url: config.url });
      return { data: { success: true } };
    });

    try {
      await refreshToken();
      await logoutUser();

      assert.deepStrictEqual(urls, [
        { method: 'post', url: '/auth/refresh' },
        { method: 'post', url: '/auth/logout' },
      ]);
    } finally {
      restore();
    }
  });
});

test('FE-011: Notes API utilities and CRUD workflows', async (t) => {
  await t.test('notesApi.getByGroup calls /notes/group/:groupId', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: [
          { id: 101, title: 'Calculus Notes', content: 'Integral calculus...' },
          { id: 102, title: 'Physics Notes', content: 'Kinematics...' },
        ],
      };
    });

    try {
      const notes = await notesApi.getByGroup(55);
      assert.strictEqual(capturedConfig.method.toLowerCase(), 'get');
      assert.strictEqual(capturedConfig.url, '/notes/group/55');
      assert.strictEqual(notes.length, 2);
      assert.strictEqual(notes[0].title, 'Calculus Notes');
    } finally {
      restore();
    }
  });

  await t.test('notesApi.create, update, and delete perform full lifecycle', async () => {
    const operations = [];
    const restore = setupApiMock(async (config) => {
      operations.push({
        method: config.method.toLowerCase(),
        url: config.url,
        data: config.data ? JSON.parse(config.data) : null,
      });
      return {
        data: { id: 101, status: 'processed' },
      };
    });

    try {
      await notesApi.create({ title: 'New Note', content: 'Draft...', groupId: 55 });
      await notesApi.update(101, { title: 'Updated Note', content: 'Saved edits...' });
      await notesApi.delete(101);

      assert.deepStrictEqual(operations, [
        {
          method: 'post',
          url: '/notes',
          data: { title: 'New Note', content: 'Draft...', groupId: 55 },
        },
        {
          method: 'put',
          url: '/notes/101',
          data: { title: 'Updated Note', content: 'Saved edits...' },
        },
        {
          method: 'delete',
          url: '/notes/101',
          data: null,
        },
      ]);
    } finally {
      restore();
    }
  });
});

test('FE-011: Tasks API utilities and Kanban status workflow', async (t) => {
  await t.test('tasksApi.getTasksByGroup fetches group task list', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: [
          { id: 1, title: 'Finish Problem Set', status: 'TODO', priority: 'HIGH' },
          { id: 2, title: 'Review Chapter 3', status: 'DONE', priority: 'LOW' },
        ],
      };
    });

    try {
      const tasks = await tasksApi.getTasksByGroup(12);
      assert.strictEqual(capturedConfig.method.toLowerCase(), 'get');
      assert.strictEqual(capturedConfig.url, '/tasks/group/12');
      assert.strictEqual(tasks.length, 2);
    } finally {
      restore();
    }
  });

  await t.test('tasksApi handles task creation, Kanban status transition, and deletion', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
        body: config.data ? JSON.parse(config.data) : null,
      });
      return { data: { id: 7, success: true } };
    });

    try {
      // 1. Create task
      await tasksApi.createTask({ title: 'Read Paper', status: 'TODO', priority: 'MEDIUM', groupId: 12 });
      // 2. Transition TODO -> DONE
      await tasksApi.updateTask(7, { status: 'DONE' });
      // 3. Revert DONE -> TODO
      await tasksApi.updateTask(7, { status: 'TODO' });
      // 4. Delete task
      const deleted = await tasksApi.deleteTask(7);

      assert.strictEqual(deleted, true);
      assert.deepStrictEqual(ops, [
        { method: 'post', url: '/tasks', body: { title: 'Read Paper', status: 'TODO', priority: 'MEDIUM', groupId: 12 } },
        { method: 'put', url: '/tasks/7', body: { status: 'DONE' } },
        { method: 'put', url: '/tasks/7', body: { status: 'TODO' } },
        { method: 'delete', url: '/tasks/7', body: null },
      ]);
    } finally {
      restore();
    }
  });
});

test('FE-011: Files & Categories API and multipart upload workflows', async (t) => {
  await t.test('filesApi category operations (getCategories, createCategory, deleteCategory)', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
        data: config.data ? JSON.parse(config.data) : null,
      });
      return { data: [{ id: 1, name: 'Lecture Notes' }] };
    });

    try {
      await filesApi.getCategories(40);
      await filesApi.createCategory(40, { name: 'Exam Prep', parentId: 1 });
      const delResult = await filesApi.deleteCategory(40, 2);

      assert.strictEqual(delResult, true);
      assert.deepStrictEqual(ops, [
        { method: 'get', url: '/groups/40/categories', data: null },
        { method: 'post', url: '/groups/40/categories', data: { name: 'Exam Prep', parentId: 1 } },
        { method: 'delete', url: '/groups/40/categories/2', data: null },
      ]);
    } finally {
      restore();
    }
  });

  await t.test('filesApi file retrieval, download URL with disposition, and file deletion', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
      });
      return { data: { downloadUrl: 'https://cdn.example.com/file123.pdf' } };
    });

    try {
      await filesApi.getFiles(40);
      const dlInline = await filesApi.getFileDownloadUrl(40, 99, 'inline');
      const dlAttachment = await filesApi.getFileDownloadUrl(40, 99, 'attachment');
      const deleted = await filesApi.deleteFile(40, 99);

      assert.strictEqual(deleted, true);
      assert.strictEqual(dlInline.downloadUrl, 'https://cdn.example.com/file123.pdf');
      assert.strictEqual(dlAttachment.downloadUrl, 'https://cdn.example.com/file123.pdf');
      assert.deepStrictEqual(ops, [
        { method: 'get', url: '/groups/40/files' },
        { method: 'get', url: '/groups/40/files/99/download?disposition=inline' },
        { method: 'get', url: '/groups/40/files/99/download?disposition=attachment' },
        { method: 'delete', url: '/groups/40/files/99' },
      ]);
    } finally {
      restore();
    }
  });
});

test('FE-011: User Profile & Group Overview API utilities', async (t) => {
  await t.test('userApi profile operations (getCurrentUser, updateProfileName, changePassword)', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
        data: config.data ? JSON.parse(config.data) : null,
      });
      return { data: { id: 1, fullName: 'Alex Student Updated' } };
    });

    try {
      await userApi.getCurrentUser();
      await userApi.updateProfileName('Alex Student Updated');
      await userApi.changePassword('OldPassword123!', 'NewPassword456!');

      assert.deepStrictEqual(ops, [
        { method: 'get', url: '/users/me', data: null },
        { method: 'put', url: '/users/profile', data: { fullName: 'Alex Student Updated' } },
        { method: 'put', url: '/users/change-password', data: { currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' } },
      ]);
    } finally {
      restore();
    }
  });

  await t.test('fetchGroupOverview validates groupId requirement and returns metrics', async () => {
    // 1. Validates missing groupId
    await assert.rejects(async () => fetchGroupOverview(null), { message: 'No Group ID provided.' });
    await assert.rejects(async () => fetchGroupOverview(undefined), { message: 'No Group ID provided.' });

    // 2. Successful call
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: {
          totalNotes: 14,
          pendingTasks: 3,
          completedTasks: 8,
          totalFiles: 22,
          totalMembers: 6,
        },
      };
    });

    try {
      const overview = await fetchGroupOverview(88);
      assert.strictEqual(capturedConfig.method.toLowerCase(), 'get');
      assert.strictEqual(capturedConfig.url, '/groups/88/overview');
      assert.strictEqual(overview.totalNotes, 14);
      assert.strictEqual(overview.completedTasks, 8);
    } finally {
      restore();
    }
  });

  await t.test('groupApi member role management (promote, demote, remove, leave)', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({ method: config.method.toLowerCase(), url: config.url });
      return { data: { success: true } };
    });

    try {
      await groupApi.promoteMemberToAdmin(10, 4);
      await groupApi.demoteAdminToMember(10, 4);
      await groupApi.removeMember(10, 4);
      await groupApi.leaveGroup(10);

      assert.deepStrictEqual(ops, [
        { method: 'put', url: '/groups/10/members/4/promote' },
        { method: 'put', url: '/groups/10/members/4/demote' },
        { method: 'delete', url: '/groups/10/members/4' },
        { method: 'post', url: '/groups/10/leave' },
      ]);
    } finally {
      restore();
    }
  });

  await t.test('userApi.updateAvatar and filesApi.uploadFile handle multipart payloads', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
      });
      return { data: { avatarUrl: '/avatars/1.jpg', fileId: 99 } };
    });

    try {
      const mockFile = { name: 'avatar.png' };
      const avatarRes = await userApi.updateAvatar(mockFile);
      assert.strictEqual(avatarRes.avatarUrl, '/avatars/1.jpg');

      const mockFormData = new FormData();
      mockFormData.append('file', 'content');
      const fileRes = await filesApi.uploadFile(10, mockFormData);
      assert.strictEqual(fileRes.fileId, 99);

      assert.deepStrictEqual(ops, [
        { method: 'post', url: '/avatars/upload' },
        { method: 'post', url: '/groups/10/files' },
      ]);
    } finally {
      restore();
    }
  });

  await t.test('groupApi group management (getMyGroups, create, delete, avatar, update, join, invite, overview)', async () => {
    const ops = [];
    const restore = setupApiMock(async (config) => {
      ops.push({
        method: config.method.toLowerCase(),
        url: config.url,
      });
      return { data: { id: 10, name: 'Algorithms Study' } };
    });

    try {
      await groupApi.getMyGroups();
      await groupApi.createGroup({ name: 'Algorithms Study', description: 'CS 201' });
      await groupApi.updateGroupDetails(10, { name: 'Algorithms Advanced' });
      await groupApi.uploadGroupAvatar(10, new FormData());
      await groupApi.joinGroupByInviteCode('ABC-123');
      await groupApi.addMemberByEmail(10, 'partner@example.com');
      await groupApi.getGroupPermissions(10);
      await groupApi.getGroupMembersSummary(10);
      await groupApi.fetchGroupOverview(10);
      await groupApi.deleteGroup(10);

      assert.deepStrictEqual(ops, [
        { method: 'get', url: '/groups/my-groups' },
        { method: 'post', url: '/groups' },
        { method: 'put', url: '/groups/10/details' },
        { method: 'post', url: '/groups/10/avatar' },
        { method: 'post', url: '/groups/join' },
        { method: 'post', url: '/groups/10/members' },
        { method: 'get', url: '/groups/10/permissions' },
        { method: 'get', url: '/groups/10/members' },
        { method: 'get', url: '/groups/10/overview' },
        { method: 'delete', url: '/groups/10' },
      ]);
    } finally {
      restore();
    }
  });
});
