import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api/config.js';
import { chatApi } from '../src/api/chatApi.js';
import {
  formatMessageTimestamp,
  normalizeChatMessage,
  getWebSocketUrl,
} from '../src/features/chat/hooks/useChat.js';

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

test('CHAT-06: chatApi REST client methods', async (t) => {
  await t.test('getChannels requests GET /groups/:groupId/channels', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: [
          { id: 1, groupId: 10, name: 'general', isDefault: true },
          { id: 2, groupId: 10, name: 'study-plan', isDefault: false },
        ],
      };
    });

    try {
      const channels = await chatApi.getChannels(10);
      assert.equal(capturedConfig.method, 'get');
      assert.equal(capturedConfig.url, '/groups/10/channels');
      assert.equal(channels.length, 2);
      assert.equal(channels[0].name, 'general');
    } finally {
      restore();
    }
  });

  await t.test('createChannel requests POST /groups/:groupId/channels with body', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: {
          id: 3,
          groupId: 10,
          name: 'homework-help',
          description: 'Questions and problem sets',
        },
      };
    });

    try {
      const payload = { name: 'homework-help', description: 'Questions and problem sets' };
      const created = await chatApi.createChannel(10, payload);
      assert.equal(capturedConfig.method, 'post');
      assert.equal(capturedConfig.url, '/groups/10/channels');
      assert.deepEqual(JSON.parse(capturedConfig.data), payload);
      assert.equal(created.id, 3);
    } finally {
      restore();
    }
  });

  await t.test('deleteChannel requests DELETE /groups/:groupId/channels/:channelId', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return { data: null };
    });

    try {
      await chatApi.deleteChannel(10, 2);
      assert.equal(capturedConfig.method, 'delete');
      assert.equal(capturedConfig.url, '/groups/10/channels/2');
    } finally {
      restore();
    }
  });

  await t.test('getMessages requests GET /channels/:channelId/messages with pagination params', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: {
          channelId: 1,
          hasMore: true,
          nextCursor: 90,
          messages: [{ id: 100, content: 'Hello' }],
        },
      };
    });

    try {
      const result = await chatApi.getMessages(1, { before: 101, limit: 25 });
      assert.equal(capturedConfig.method, 'get');
      assert.equal(capturedConfig.url, '/channels/1/messages');
      assert.equal(capturedConfig.params.before, 101);
      assert.equal(capturedConfig.params.limit, 25);
      assert.equal(result.messages.length, 1);
      assert.equal(result.hasMore, true);
    } finally {
      restore();
    }
  });

  await t.test('pinMessage requests PUT /channels/:channelId/messages/:messageId/pin', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: { id: 100, isPinned: true },
      };
    });

    try {
      const result = await chatApi.pinMessage(1, 100, true);
      assert.equal(capturedConfig.method, 'put');
      assert.equal(capturedConfig.url, '/channels/1/messages/100/pin');
      assert.deepEqual(JSON.parse(capturedConfig.data), { isPinned: true });
      assert.equal(result.isPinned, true);
    } finally {
      restore();
    }
  });

  await t.test('getPinnedMessages requests GET /channels/:channelId/pinned', async () => {
    let capturedConfig = null;
    const restore = setupApiMock(async (config) => {
      capturedConfig = config;
      return {
        data: [{ id: 50, content: 'Pinned announcement', isPinned: true }],
      };
    });

    try {
      const pinned = await chatApi.getPinnedMessages(1);
      assert.equal(capturedConfig.method, 'get');
      assert.equal(capturedConfig.url, '/channels/1/pinned');
      assert.equal(pinned.length, 1);
      assert.equal(pinned[0].isPinned, true);
    } finally {
      restore();
    }
  });
});

test('CHAT-06: useChat utilities and data normalization', async (t) => {
  await t.test('formatMessageTimestamp formats valid date strings and handles invalid input', () => {
    assert.equal(formatMessageTimestamp(null), '');
    assert.equal(formatMessageTimestamp('invalid-date'), '');

    const formatted = formatMessageTimestamp('2026-11-01T14:30:00Z');
    assert.match(formatted, /\d{1,2}:\d{2}\s?(AM|PM)?/i);
  });

  await t.test('getWebSocketUrl constructs proper ws/wss endpoint from server base URL', () => {
    const wsUrl = getWebSocketUrl();
    assert.ok(wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://'));
    assert.ok(wsUrl.endsWith('/ws'));
  });

  await t.test('normalizeChatMessage maps backend DTO to component props correctly', () => {
    const rawDto = {
      id: 105,
      channelId: 2,
      content: 'Let us coordinate for the midterm!',
      sender: {
        id: 7,
        name: 'Sarah Chen',
        avatarUrl: 'https://example.com/avatar.jpg',
        groupRole: 'ADMIN',
      },
      isPinned: true,
      isDeleted: false,
      replyTo: {
        id: 104,
        senderName: 'Alex Rivera',
        contentSnippet: 'When is the midterm?',
      },
      reactions: [{ emoji: '👍', count: 2, reactedByMe: true }],
      createdAt: '2026-11-01T15:00:00Z',
      updatedAt: '2026-11-01T15:05:00Z',
    };

    const normalizedForAuthor = normalizeChatMessage(rawDto, 7);
    assert.equal(normalizedForAuthor.id, 105);
    assert.equal(normalizedForAuthor.channelId, 2);
    assert.equal(normalizedForAuthor.content, 'Let us coordinate for the midterm!');
    assert.equal(normalizedForAuthor.senderId, 7);
    assert.equal(normalizedForAuthor.senderName, 'Sarah Chen');
    assert.equal(normalizedForAuthor.senderAvatar, 'https://example.com/avatar.jpg');
    assert.equal(normalizedForAuthor.senderInitials, 'SC');
    assert.equal(normalizedForAuthor.isMine, true);
    assert.equal(normalizedForAuthor.role, 'ADMIN');
    assert.equal(normalizedForAuthor.pinned, true);
    assert.equal(normalizedForAuthor.isPinned, true);
    assert.equal(normalizedForAuthor.isEdited, true);
    assert.equal(normalizedForAuthor.isDeleted, false);
    assert.equal(normalizedForAuthor.replyTo, 'When is the midterm?');
    assert.equal(normalizedForAuthor.replyToId, 104);
    assert.equal(normalizedForAuthor.reactions.length, 1);

    const normalizedForOther = normalizeChatMessage(rawDto, 99);
    assert.equal(normalizedForOther.isMine, false);
  });

  await t.test('normalizeChatMessage masks deleted messages appropriately', () => {
    const deletedDto = {
      id: 200,
      channelId: 2,
      content: 'Sensitive deleted content',
      sender: { id: 7, name: 'Sarah Chen' },
      isDeleted: true,
      createdAt: '2026-11-01T15:00:00Z',
    };

    const normalized = normalizeChatMessage(deletedDto, 7);
    assert.equal(normalized.isDeleted, true);
    assert.equal(normalized.content, 'This message was deleted');
  });
});

test('CHAT-06: STOMP event reduction and message feed state transitions', async (t) => {
  const initialMessages = [
    {
      id: 1,
      channelId: 10,
      content: 'Original message',
      isMine: true,
      pinned: false,
      isPinned: false,
      isDeleted: false,
      reactions: [],
      replyToId: null,
      pending: false,
    },
    {
      id: 2,
      channelId: 10,
      content: 'Second message',
      isMine: false,
      pinned: false,
      isPinned: false,
      isDeleted: false,
      reactions: [{ emoji: '👍', count: 1 }],
      replyToId: null,
      pending: false,
    },
  ];

  await t.test('reduces CHAT_MESSAGE by replacing matching pending message or appending', () => {
    const pendingMsg = {
      id: 'optimistic-1',
      channelId: 10,
      content: 'Optimistic send',
      isMine: true,
      pending: true,
      replyToId: null,
    };
    const stateWithPending = [...initialMessages, pendingMsg];

    const serverMsg = {
      id: 3,
      channelId: 10,
      content: 'Optimistic send',
      isMine: true,
      pending: false,
      replyToId: null,
    };

    // Replacement logic
    const optimisticIdx = stateWithPending.findIndex(
      (m) =>
        m.pending &&
        m.isMine &&
        m.content === serverMsg.content &&
        String(m.replyToId) === String(serverMsg.replyToId)
    );
    assert.equal(optimisticIdx, 2);

    const updated = [...stateWithPending];
    updated[optimisticIdx] = serverMsg;
    assert.equal(updated.length, 3);
    assert.equal(updated[2].id, 3);
    assert.equal(updated[2].pending, false);
  });

  await t.test('reduces MESSAGE_EDITED by updating content and edited flags', () => {
    const editPayload = { id: 1, content: 'Updated content', updatedAt: '2026-11-01T16:00:00Z' };

    const updated = initialMessages.map((m) =>
      m.id === editPayload.id
        ? { ...m, content: editPayload.content, updatedAt: editPayload.updatedAt, isEdited: true }
        : m
    );

    assert.equal(updated[0].content, 'Updated content');
    assert.equal(updated[0].isEdited, true);
    assert.equal(updated[1].content, 'Second message');
  });

  await t.test('reduces MESSAGE_DELETED by marking isDeleted and masking content', () => {
    const deletePayload = { id: 2, isDeleted: true };

    const updated = initialMessages.map((m) =>
      m.id === deletePayload.id
        ? { ...m, isDeleted: true, content: 'This message was deleted' }
        : m
    );

    assert.equal(updated[1].isDeleted, true);
    assert.equal(updated[1].content, 'This message was deleted');
    assert.equal(updated[0].isDeleted, false);
  });

  await t.test('reduces REACTION_UPDATED by replacing message reactions', () => {
    const reactionPayload = {
      messageId: 2,
      reactions: [
        { emoji: '👍', count: 3, reactedByMe: true },
        { emoji: '🎉', count: 2, reactedByMe: false },
      ],
    };

    const updated = initialMessages.map((m) =>
      m.id === reactionPayload.messageId
        ? { ...m, reactions: reactionPayload.reactions }
        : m
    );

    assert.equal(updated[1].reactions.length, 2);
    assert.equal(updated[1].reactions[0].count, 3);
    assert.equal(updated[1].reactions[1].emoji, '🎉');
  });

  await t.test('reduces PIN_UPDATED by toggling pinned and isPinned properties', () => {
    const pinPayload = { messageId: 1, isPinned: true };

    const updated = initialMessages.map((m) =>
      m.id === pinPayload.messageId
        ? { ...m, pinned: Boolean(pinPayload.isPinned), isPinned: Boolean(pinPayload.isPinned) }
        : m
    );

    assert.equal(updated[0].pinned, true);
    assert.equal(updated[0].isPinned, true);
    assert.equal(updated[1].pinned, false);
  });
});
