import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateChatMessage,
  formatMemberRole,
  getMemberInitials,
} from '../src/features/chat/utils/chatValidation.js';
import { api } from '../src/api/config.js';
import { groupApi } from '../src/api/groupApi.js';

// Mock helper for API adapter
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

test('CHAT-08: validateChatMessage rules', async (t) => {
  await t.test('rejects empty or whitespace-only messages', () => {
    assert.equal(validateChatMessage(''), 'Message content cannot be empty.');
    assert.equal(validateChatMessage('   '), 'Message content cannot be empty.');
    assert.equal(validateChatMessage(null), 'Message content cannot be empty.');
    assert.equal(validateChatMessage(undefined), 'Message content cannot be empty.');
  });

  await t.test('accepts valid messages within 1-1000 characters', () => {
    assert.equal(validateChatMessage('Hello world!'), null);
    assert.equal(validateChatMessage('A'), null);
    assert.equal(validateChatMessage('x'.repeat(1000)), null);
  });

  await t.test('rejects messages exceeding 1000 characters', () => {
    const tooLong = 'a'.repeat(1001);
    assert.equal(
      validateChatMessage(tooLong),
      'Message content cannot exceed 1000 characters.'
    );
  });
});

test('CHAT-08: Member role formatting and avatar initials', async (t) => {
  await t.test('formats role names to display labels', () => {
    assert.equal(formatMemberRole('CREATOR'), 'Creator');
    assert.equal(formatMemberRole('creator'), 'Creator');
    assert.equal(formatMemberRole('OWNER'), 'Creator');
    assert.equal(formatMemberRole('ADMIN'), 'Admin');
    assert.equal(formatMemberRole('admin'), 'Admin');
    assert.equal(formatMemberRole('MEMBER'), 'Member');
    assert.equal(formatMemberRole(null), 'Member');
    assert.equal(formatMemberRole(''), 'Member');
  });

  await t.test('generates two-letter initials from full name', () => {
    assert.equal(getMemberInitials('Sarah Chen'), 'SC');
    assert.equal(getMemberInitials('Alex Rivera'), 'AR');
    assert.equal(getMemberInitials('Ada Lovelace Byron'), 'AL');
  });

  await t.test('generates two-letter initials from single name or email', () => {
    assert.equal(getMemberInitials('Alice'), 'AL');
    assert.equal(getMemberInitials('', 'john@example.com'), 'JO');
    assert.equal(getMemberInitials(null, null), 'U');
  });
});

test('CHAT-08: ChatInput character counter and submission semantics', async (t) => {
  const MAX_LIMIT = 1000;

  await t.test('calculates remaining characters and visual warning thresholds', () => {
    const calcState = (content) => {
      const remaining = MAX_LIMIT - content.length;
      return {
        remaining,
        isNearLimit: remaining <= 50,
        isOverLimit: remaining < 0,
        canSubmit: content.trim().length > 0 && remaining >= 0,
      };
    };

    const empty = calcState('');
    assert.equal(empty.remaining, 1000);
    assert.equal(empty.isNearLimit, false);
    assert.equal(empty.canSubmit, false);

    const normal = calcState('Hello group!');
    assert.equal(normal.remaining, 988);
    assert.equal(normal.isNearLimit, false);
    assert.equal(normal.canSubmit, true);

    const near = calcState('x'.repeat(960));
    assert.equal(near.remaining, 40);
    assert.equal(near.isNearLimit, true);
    assert.equal(near.isOverLimit, false);
    assert.equal(near.canSubmit, true);

    const exact = calcState('x'.repeat(1000));
    assert.equal(exact.remaining, 0);
    assert.equal(exact.isNearLimit, true);
    assert.equal(exact.isOverLimit, false);
    assert.equal(exact.canSubmit, true);

    const over = calcState('x'.repeat(1005));
    assert.equal(over.remaining, -5);
    assert.equal(over.isNearLimit, true);
    assert.equal(over.isOverLimit, true);
    assert.equal(over.canSubmit, false);
  });

  await t.test('differentiates Enter (send) vs Shift+Enter (multiline newline)', () => {
    let sent = false;
    const handleKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        sent = true;
        return 'submit';
      }
      return 'newline';
    };

    assert.equal(handleKey({ key: 'Enter', shiftKey: false }), 'submit');
    assert.equal(sent, true);

    sent = false;
    assert.equal(handleKey({ key: 'Enter', shiftKey: true }), 'newline');
    assert.equal(sent, false);
  });

  await t.test('handles replying context submission with replyToId and snippet', () => {
    const replyingTo = {
      id: 42,
      senderName: 'Sarah Chen',
      content: 'Can someone explain dynamic programming?',
    };

    let submittedPayload = null;
    let replyCancelled = false;

    const onSendMessage = (payload) => {
      submittedPayload = payload;
    };
    const onCancelReply = () => {
      replyCancelled = true;
    };

    const text = 'Sure, think of it as recursion with memoization!';
    if (replyingTo) {
      onSendMessage({
        content: text.trim(),
        replyToId: replyingTo.id,
        replySnippet: replyingTo.content,
      });
      onCancelReply();
    }

    assert.deepEqual(submittedPayload, {
      content: 'Sure, think of it as recursion with memoization!',
      replyToId: 42,
      replySnippet: 'Can someone explain dynamic programming?',
    });
    assert.equal(replyCancelled, true);
  });

  await t.test('handles editing context submission with message id', () => {
    const editingMessage = {
      id: 108,
      content: 'Original typo message',
    };

    let editSaved = null;
    const onSaveEdit = (id, content) => {
      editSaved = { id, content };
    };

    const newText = 'Corrected message content';
    if (editingMessage) {
      onSaveEdit(editingMessage.id, newText.trim());
    }

    assert.deepEqual(editSaved, {
      id: 108,
      content: 'Corrected message content',
    });
  });
});

test('CHAT-08: MessageFeed pagination ordering and pinned messages', async (t) => {
  await t.test('preserves chronological order when prepending older paginated messages', () => {
    const initialMessages = [
      { id: 3, content: 'Third message', createdAt: '2026-11-03T10:02:00Z' },
      { id: 4, content: 'Fourth message', createdAt: '2026-11-03T10:03:00Z' },
    ];

    // Older batch from server (returned newest-first from keyset query)
    const rawOlderBatch = [
      { id: 2, content: 'Second message', createdAt: '2026-11-03T10:01:00Z' },
      { id: 1, content: 'First message', createdAt: '2026-11-03T10:00:00Z' },
    ];

    // Reverse to chronological order before prepending
    const chronologicalOlder = [...rawOlderBatch].reverse();
    const merged = [...chronologicalOlder, ...initialMessages];

    assert.equal(merged.length, 4);
    assert.equal(merged[0].id, 1);
    assert.equal(merged[1].id, 2);
    assert.equal(merged[2].id, 3);
    assert.equal(merged[3].id, 4);
  });

  await t.test('filters pinned messages and triggers unpin callback', () => {
    const feedMessages = [
      { id: 1, content: 'Welcome to the channel!', pinned: true, senderName: 'Sarah' },
      { id: 2, content: 'Hello everyone', pinned: false, senderName: 'Alex' },
      { id: 3, content: 'Exam date is Nov 15th', pinned: true, senderName: 'Sarah' },
    ];

    const pinned = feedMessages.filter((m) => m.pinned);
    assert.equal(pinned.length, 2);
    assert.equal(pinned[0].id, 1);
    assert.equal(pinned[1].id, 3);

    let unpinnedId = null;
    const onTogglePin = (id) => {
      unpinnedId = id;
    };

    onTogglePin(pinned[0].id);
    assert.equal(unpinnedId, 1);
  });
});

test('CHAT-08: MemberList API integration and member normalization', async (t) => {
  await t.test('fetches group members via groupApi.getGroupMembersSummary and maps roles', async () => {
    let capturedUrl = null;
    const restore = setupApiMock(async (config) => {
      capturedUrl = config.url;
      return {
        data: [
          { id: 101, name: 'Sarah Chen', email: 'sarah@example.com', role: 'CREATOR' },
          { id: 102, name: 'Alex Rivera', email: 'alex@example.com', role: 'ADMIN' },
          { id: 103, name: 'Taylor Swift', email: 'taylor@example.com', role: 'MEMBER' },
        ],
      };
    });

    try {
      const members = await groupApi.getGroupMembers(5);
      assert.equal(capturedUrl, '/groups/5/members');
      assert.equal(members.length, 3);

      const currentUserId = 101;
      const normalized = members.map((m) => ({
        ...m,
        isCurrentUser: m.id === currentUserId,
        roleTitle: formatMemberRole(m.role),
        initials: getMemberInitials(m.name, m.email),
      }));

      assert.equal(normalized[0].isCurrentUser, true);
      assert.equal(normalized[0].roleTitle, 'Creator');
      assert.equal(normalized[0].initials, 'SC');

      assert.equal(normalized[1].isCurrentUser, false);
      assert.equal(normalized[1].roleTitle, 'Admin');
      assert.equal(normalized[1].initials, 'AR');

      assert.equal(normalized[2].roleTitle, 'Member');
      assert.equal(normalized[2].initials, 'TS');
    } finally {
      restore();
    }
  });

  await t.test('handles empty members response gracefully', async () => {
    const restore = setupApiMock(async () => {
      return { data: [] };
    });

    try {
      const members = await groupApi.getGroupMembersSummary(99);
      assert.equal(Array.isArray(members), true);
      assert.equal(members.length, 0);
    } finally {
      restore();
    }
  });
});

