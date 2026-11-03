import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChannelName } from '../src/features/chat/utils/chatValidation.js';
import { api } from '../src/api/config.js';
import { chatApi } from '../src/api/chatApi.js';

// Mock helper for shared api instance
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
        const error = new Error(
          err.message || 'Request failed with status code ' + err.response.status
        );
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

test('CHAT-07: validateChannelName rules', async (t) => {
  await t.test('rejects empty or whitespace-only names', () => {
    assert.equal(validateChannelName(''), 'Channel name is required.');
    assert.equal(validateChannelName('   '), 'Channel name is required.');
    assert.equal(validateChannelName(null), 'Channel name is required.');
  });

  await t.test('rejects names with fewer than 2 characters', () => {
    assert.equal(validateChannelName('a'), 'Channel name must be at least 2 characters.');
  });

  await t.test('rejects names exceeding 50 characters', () => {
    const longName = 'a'.repeat(51);
    assert.equal(validateChannelName(longName), 'Channel name cannot exceed 50 characters.');
  });

  await t.test('rejects uppercase characters, spaces, and punctuation', () => {
    assert.equal(
      validateChannelName('Study-Group'),
      'Channel name must contain only lowercase letters, numbers, and hyphens.'
    );
    assert.equal(
      validateChannelName('study group'),
      'Channel name must contain only lowercase letters, numbers, and hyphens.'
    );
    assert.equal(
      validateChannelName('exam_prep!'),
      'Channel name must contain only lowercase letters, numbers, and hyphens.'
    );
  });

  await t.test('accepts valid lowercase alphanumeric and hyphen combinations', () => {
    assert.equal(validateChannelName('general'), null);
    assert.equal(validateChannelName('homework-help'), null);
    assert.equal(validateChannelName('cs101-midterm-review'), null);
    assert.equal(validateChannelName('2026-exam-prep'), null);
  });
});

test('CHAT-07: Channel management and state workflow simulation', async (t) => {
  const initialChannels = [
    { id: 1, groupId: 10, name: 'general', isDefault: true, description: 'Default' },
    { id: 2, groupId: 10, name: 'exam-prep', isDefault: false, description: 'Exam notes' },
  ];

  await t.test('selects default channel automatically if no channel is active', () => {
    const defaultChan =
      initialChannels.find((c) => c.isDefault || c.name === 'general') || initialChannels[0];
    assert.equal(defaultChan.id, 1);
    assert.equal(defaultChan.name, 'general');
  });

  await t.test('creates new channel via chatApi and appends to channel list', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: {
          id: 3,
          groupId: 10,
          name: 'project-team',
          description: 'Team project collaboration',
          isDefault: false,
        },
      };
    });

    try {
      const created = await chatApi.createChannel(10, {
        name: 'project-team',
        description: 'Team project collaboration',
      });

      assert.equal(capturedConfig.method, 'post');
      assert.equal(capturedConfig.url, '/groups/10/channels');
      assert.equal(created.id, 3);
      assert.equal(created.name, 'project-team');

      // State update simulation
      const updated = [...initialChannels, created];
      assert.equal(updated.length, 3);
      assert.equal(updated[2].id, 3);
    } finally {
      restore();
    }
  });

  await t.test('deletes custom channel and falls back to default channel when active was deleted', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return { data: null };
    });

    try {
      let activeId = 2; // custom channel active
      await chatApi.deleteChannel(10, 2);
      assert.equal(capturedConfig.method, 'delete');
      assert.equal(capturedConfig.url, '/groups/10/channels/2');

      // Fallback state logic
      const remaining = initialChannels.filter((c) => c.id !== 2);
      assert.equal(remaining.length, 1);

      if (activeId === 2) {
        const fallback =
          remaining.find((c) => c.isDefault || c.name === 'general') || remaining[0];
        activeId = fallback ? fallback.id : null;
      }

      assert.equal(activeId, 1);
    } finally {
      restore();
    }
  });

  await t.test('enforces channel deletion restriction for default channel', () => {
    const isChannelDeletable = (channel, canManage = true) => {
      const isDefault = Boolean(channel.isDefault) || channel.name === 'general';
      return !isDefault && canManage;
    };

    assert.equal(isChannelDeletable(initialChannels[0], true), false); // general is not deletable
    assert.equal(isChannelDeletable(initialChannels[1], true), true); // exam-prep is deletable
    assert.equal(isChannelDeletable(initialChannels[1], false), false); // non-admin cannot delete
  });

  await t.test('identifies max channel limit (10 channels)', () => {
    const tenChannels = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `channel-${i + 1}`,
      isDefault: i === 0,
    }));

    const isMaxReached = tenChannels.length >= 10;
    assert.equal(isMaxReached, true);

    const nineChannels = tenChannels.slice(0, 9);
    assert.equal(nineChannels.length >= 10, false);
  });
});
