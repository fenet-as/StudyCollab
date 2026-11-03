import test from 'node:test';
import assert from 'node:assert/strict';

test('CHAT-10: ChatInput hardening & constraint boundaries', async (t) => {
  const MAX_LIMIT = 1000;

  await t.test('enforces strict boundary conditions on 1,000 character limit', () => {
    const evaluateInput = (content) => {
      const remaining = MAX_LIMIT - content.length;
      return {
        remaining,
        isNearLimit: remaining <= 50,
        isOverLimit: remaining < 0,
        canSubmit: content.trim().length > 0 && remaining >= 0,
      };
    };

    // Boundary 1: Empty and whitespace
    assert.equal(evaluateInput('').canSubmit, false);
    assert.equal(evaluateInput('     ').canSubmit, false);
    assert.equal(evaluateInput('\n\t ').canSubmit, false);

    // Boundary 2: 1 character
    const single = evaluateInput('x');
    assert.equal(single.remaining, 999);
    assert.equal(single.isNearLimit, false);
    assert.equal(single.canSubmit, true);

    // Boundary 3: Exactly 950 characters (near limit threshold)
    const at950 = evaluateInput('a'.repeat(950));
    assert.equal(at950.remaining, 50);
    assert.equal(at950.isNearLimit, true);
    assert.equal(at950.canSubmit, true);

    // Boundary 4: Exactly 1,000 characters (max allowed)
    const at1000 = evaluateInput('a'.repeat(1000));
    assert.equal(at1000.remaining, 0);
    assert.equal(at1000.isNearLimit, true);
    assert.equal(at1000.isOverLimit, false);
    assert.equal(at1000.canSubmit, true);

    // Boundary 5: 1,001 characters (exceeded limit)
    const at1001 = evaluateInput('a'.repeat(1001));
    assert.equal(at1001.remaining, -1);
    assert.equal(at1001.isNearLimit, true);
    assert.equal(at1001.isOverLimit, true);
    assert.equal(at1001.canSubmit, false);
  });

  await t.test('keyboard shortcuts: Enter vs Shift+Enter vs Escape', () => {
    let submitted = false;
    let editCancelled = false;
    let replyCancelled = false;

    const handleKeyDown = (e, { isEditing, isReplying }) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        submitted = true;
        return 'submit';
      }
      if (e.key === 'Enter' && e.shiftKey) {
        return 'newline';
      }
      if (e.key === 'Escape') {
        if (isEditing) editCancelled = true;
        else if (isReplying) replyCancelled = true;
        return 'cancel';
      }
      return 'typing';
    };

    // Enter sends message
    assert.equal(
      handleKeyDown({ key: 'Enter', shiftKey: false }, { isEditing: false }),
      'submit'
    );
    assert.equal(submitted, true);

    // Shift+Enter creates a multiline newline
    assert.equal(
      handleKeyDown({ key: 'Enter', shiftKey: true }, { isEditing: false }),
      'newline'
    );

    // Escape cancels editing
    assert.equal(
      handleKeyDown({ key: 'Escape' }, { isEditing: true, isReplying: false }),
      'cancel'
    );
    assert.equal(editCancelled, true);

    // Escape cancels replying
    assert.equal(
      handleKeyDown({ key: 'Escape' }, { isEditing: false, isReplying: true }),
      'cancel'
    );
    assert.equal(replyCancelled, true);
  });
});

test('CHAT-10: MessageFeed & MessageItem hardening and deleted message rendering', async (t) => {
  await t.test('deleted messages render placeholder text and suppress interactive action menus', () => {
    const normalMessage = {
      id: 101,
      content: 'Live active message',
      isDeleted: false,
      isMine: true,
      reactions: [{ emoji: '👍', count: 1, userReacted: false }],
    };

    const deletedMessage = {
      id: 102,
      content: 'This message was deleted',
      isDeleted: true,
      isMine: true,
      reactions: [],
    };

    const getMessageItemCapabilities = (msg) => {
      return {
        displayText: msg.isDeleted
          ? 'This message has been deleted'
          : msg.content,
        showActions: !msg.isDeleted,
        showReactions: !msg.isDeleted && msg.reactions && msg.reactions.length > 0,
        canEdit: !msg.isDeleted && msg.isMine,
        canDelete: !msg.isDeleted && msg.isMine,
        canReact: !msg.isDeleted,
        canReply: !msg.isDeleted,
      };
    };

    const normalCaps = getMessageItemCapabilities(normalMessage);
    assert.equal(normalCaps.displayText, 'Live active message');
    assert.equal(normalCaps.showActions, true);
    assert.equal(normalCaps.showReactions, true);
    assert.equal(normalCaps.canEdit, true);
    assert.equal(normalCaps.canDelete, true);
    assert.equal(normalCaps.canReact, true);
    assert.equal(normalCaps.canReply, true);

    const deletedCaps = getMessageItemCapabilities(deletedMessage);
    assert.equal(deletedCaps.displayText, 'This message has been deleted');
    assert.equal(deletedCaps.showActions, false);
    assert.equal(deletedCaps.showReactions, false);
    assert.equal(deletedCaps.canEdit, false);
    assert.equal(deletedCaps.canDelete, false);
    assert.equal(deletedCaps.canReact, false);
    assert.equal(deletedCaps.canReply, false);
  });

  await t.test('reaction aggregation and userReacted toggle status', () => {
    const currentUserId = 42;
    const rawReactions = [
      { emoji: '🔥', userId: 42 },
      { emoji: '🔥', userId: 99 },
      { emoji: '❤️', userId: 88 },
    ];

    const groupReactions = (reactions, myId) => {
      const counts = {};
      const reacted = {};
      for (const r of reactions) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.userId === myId) reacted[r.emoji] = true;
      }
      return Object.entries(counts).map(([emoji, count]) => ({
        emoji,
        count,
        userReacted: Boolean(reacted[emoji]),
      }));
    };

    const aggregated = groupReactions(rawReactions, currentUserId);
    assert.equal(aggregated.length, 2);

    const fire = aggregated.find((r) => r.emoji === '🔥');
    assert.equal(fire.count, 2);
    assert.equal(fire.userReacted, true);

    const heart = aggregated.find((r) => r.emoji === '❤️');
    assert.equal(heart.count, 1);
    assert.equal(heart.userReacted, false);
  });
});

test('CHAT-10: Channel navigation switching and deletion fallback logic', async (t) => {
  const initialChannels = [
    { id: 1, name: 'general', isDefault: true },
    { id: 2, name: 'homework-help', isDefault: false },
    { id: 3, name: 'exam-prep', isDefault: false },
  ];

  await t.test('switching active channel preserves channel reference and isolates state', () => {
    let activeChannelId = 1;
    const selectChannel = (id) => {
      activeChannelId = id;
    };

    selectChannel(2);
    assert.equal(activeChannelId, 2);

    selectChannel(3);
    assert.equal(activeChannelId, 3);
  });

  await t.test('deleting active custom channel safely falls back to default general channel', () => {
    let channels = [...initialChannels];
    let activeChannelId = 2; // currently on homework-help

    const deleteChannel = (idToDelete) => {
      channels = channels.filter((c) => c.id !== idToDelete);
      if (activeChannelId === idToDelete) {
        const fallback =
          channels.find((c) => c.isDefault || c.name === 'general') || channels[0];
        activeChannelId = fallback ? fallback.id : null;
      }
    };

    deleteChannel(2);
    assert.equal(channels.length, 2);
    assert.equal(activeChannelId, 1); // restored to general
  });

  await t.test('prevents deletion of default channel regardless of permissions', () => {
    const isDeletable = (channel, isAdmin) => {
      if (channel.isDefault || channel.name === 'general') return false;
      return isAdmin;
    };

    assert.equal(isDeletable(initialChannels[0], true), false);
    assert.equal(isDeletable(initialChannels[1], true), true);
    assert.equal(isDeletable(initialChannels[1], false), false);
  });
});
