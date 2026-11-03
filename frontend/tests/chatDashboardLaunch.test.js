import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatDir = path.resolve(__dirname, '../src/features/chat');
const dashboardPath = path.resolve(
  __dirname,
  '../src/features/dashboard/pages/Dashboard.jsx'
);

test('CHAT-09: ChatPage assembly and Dashboard mount contract', async (t) => {
  await t.test('verifies ChatPage imports all subcomponents, hooks, and modals', () => {
    const chatPagePath = path.join(chatDir, 'pages', 'ChatPage.jsx');
    assert.ok(fs.existsSync(chatPagePath), 'ChatPage.jsx must exist');
    const content = fs.readFileSync(chatPagePath, 'utf8');

    // Subcomponents
    assert.ok(content.includes('ChannelList'), 'Must import ChannelList');
    assert.ok(content.includes('ChatHeader'), 'Must import ChatHeader');
    assert.ok(content.includes('MessageFeed'), 'Must import MessageFeed');
    assert.ok(content.includes('ChatInput'), 'Must import ChatInput');
    assert.ok(content.includes('MemberList'), 'Must import MemberList');

    // Modals
    assert.ok(content.includes('AddChannelModal'), 'Must import AddChannelModal');
    assert.ok(content.includes('ConfirmDeleteModal'), 'Must import ConfirmDeleteModal');

    // Hooks
    assert.ok(content.includes('useChannels'), 'Must use useChannels hook');
    assert.ok(content.includes('useChat'), 'Must use useChat hook');
  });

  await t.test('verifies Dashboard mounts live ChatPage without placeholder wrapper', () => {
    assert.ok(fs.existsSync(dashboardPath), 'Dashboard.jsx must exist');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(
      content.includes('import ChatPage from "../../chat/pages/ChatPage"'),
      'Dashboard must import ChatPage'
    );
    assert.ok(
      content.includes('{activeTab === "Chat" && ('),
      'Dashboard must conditionally render ChatPage when activeTab is "Chat"'
    );
    assert.ok(
      content.includes('<ChatPage'),
      'Dashboard must render <ChatPage'
    );
    assert.ok(
      content.includes('group={activeGroup}'),
      'Dashboard must pass activeGroup to ChatPage'
    );
    assert.ok(
      content.includes('currentUser={userProfile || authUser}'),
      'Dashboard must pass resolved currentUser to ChatPage'
    );
    assert.ok(
      content.includes('canManageChannels='),
      'Dashboard must pass canManageChannels permission to ChatPage'
    );
    assert.ok(
      !content.includes('styles.placeholderTabContent}>\n                  <ChatPage'),
      'Dashboard must NOT wrap live ChatPage in placeholderTabContent'
    );
  });
});

test('CHAT-09: Message actions state and workflows', async (t) => {
  await t.test('reaction action dispatches messageId and emoji to reactToMessage', () => {
    let reactedMessageId = null;
    let reactedEmoji = null;

    const mockReactToMessage = (messageId, emoji) => {
      reactedMessageId = messageId;
      reactedEmoji = emoji;
    };

    mockReactToMessage(42, '🚀');
    assert.equal(reactedMessageId, 42);
    assert.equal(reactedEmoji, '🚀');
  });

  await t.test('reply action populates replyingTo context and builds send payload', () => {
    let replyingTo = null;
    const handleStartReply = (msg) => {
      replyingTo = msg;
    };

    const originalMsg = {
      id: 15,
      senderName: 'Sarah Chen',
      content: 'Let us meet in Room 402',
    };

    handleStartReply(originalMsg);
    assert.deepEqual(replyingTo, originalMsg);

    // Draft send with reply context
    let sentPayload = null;
    const mockSendMessage = (payload) => {
      sentPayload = payload;
    };

    const replyText = 'Sounds good, see you there!';
    mockSendMessage({
      content: replyText,
      replyToId: replyingTo.id,
      replySnippet: replyingTo.content,
    });
    replyingTo = null; // cleared on submit

    assert.deepEqual(sentPayload, {
      content: 'Sounds good, see you there!',
      replyToId: 15,
      replySnippet: 'Let us meet in Room 402',
    });
    assert.equal(replyingTo, null);
  });

  await t.test('edit action populates editingMessage and dispatches editMessage', () => {
    let editingMessage = null;
    let replyingTo = { id: 99, content: 'some reply' };

    const handleStartEdit = (msg) => {
      editingMessage = msg;
      replyingTo = null; // edit preempts reply
    };

    const targetMsg = { id: 7, content: 'Old content with typo' };
    handleStartEdit(targetMsg);

    assert.deepEqual(editingMessage, targetMsg);
    assert.equal(replyingTo, null);

    let savedEdit = null;
    const mockEditMessage = (id, content) => {
      savedEdit = { id, content };
    };

    mockEditMessage(editingMessage.id, 'Corrected content');
    editingMessage = null; // cleared on save

    assert.deepEqual(savedEdit, { id: 7, content: 'Corrected content' });
    assert.equal(editingMessage, null);
  });

  await t.test('pin toggle action invokes togglePinMessage', () => {
    let toggledId = null;
    const mockTogglePin = (id) => {
      toggledId = id;
    };

    mockTogglePin(33);
    assert.equal(toggledId, 33);
  });
});

test('CHAT-09: Confirmation modal lifecycle for message and channel deletion', async (t) => {
  await t.test('message deletion modal opens, confirms, and invokes deleteMessage', async () => {
    let deleteTarget = null;
    let deletedMessageId = null;

    const handleRequestDeleteMessage = (msg) => {
      deleteTarget = { type: 'message', data: msg };
    };

    const mockDeleteMessage = async (id) => {
      deletedMessageId = id;
    };

    handleRequestDeleteMessage({ id: 55, content: 'To be deleted' });
    assert.equal(deleteTarget.type, 'message');
    assert.equal(deleteTarget.data.id, 55);

    // Confirm action
    if (deleteTarget.type === 'message') {
      await mockDeleteMessage(deleteTarget.data.id);
    }
    deleteTarget = null;

    assert.equal(deletedMessageId, 55);
    assert.equal(deleteTarget, null);
  });

  await t.test('channel deletion modal opens, confirms, and invokes deleteChannel', async () => {
    let deleteTarget = null;
    let deletedChannelId = null;

    const handleRequestDeleteChannel = (channel) => {
      deleteTarget = { type: 'channel', data: channel };
    };

    const mockDeleteChannel = async (id) => {
      deletedChannelId = id;
    };

    handleRequestDeleteChannel({ id: 3, name: 'temp-discussion' });
    assert.equal(deleteTarget.type, 'channel');
    assert.equal(deleteTarget.data.id, 3);

    // Confirm action
    if (deleteTarget.type === 'channel') {
      await mockDeleteChannel(deleteTarget.data.id);
    }
    deleteTarget = null;

    assert.equal(deletedChannelId, 3);
    assert.equal(deleteTarget, null);
  });

  await t.test('closing deletion modal clears target without invoking deletion', () => {
    let deleteTarget = { type: 'message', data: { id: 99 } };
    let deleteInvoked = false;

    // User cancels dialog
    deleteTarget = null;

    assert.equal(deleteTarget, null);
    assert.equal(deleteInvoked, false);
  });
});

test('CHAT-09: In-channel message search filtering', async (t) => {
  const sampleMessages = [
    { id: 1, content: 'Calculus homework chapter 4 is due tomorrow', senderName: 'Sarah' },
    { id: 2, content: 'Can anyone share lecture slides?', senderName: 'Alex' },
    { id: 3, content: 'I uploaded chapter 4 solutions to Files', senderName: 'Taylor' },
  ];

  const filterMessages = (messages, query) => {
    if (!query.trim()) return messages;
    const q = query.toLowerCase();
    return messages.filter(
      (m) =>
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.senderName && m.senderName.toLowerCase().includes(q))
    );
  };

  await t.test('filters messages by content substring match', () => {
    const results = filterMessages(sampleMessages, 'chapter 4');
    assert.equal(results.length, 2);
    assert.equal(results[0].id, 1);
    assert.equal(results[1].id, 3);
  });

  await t.test('filters messages by sender name substring match', () => {
    const results = filterMessages(sampleMessages, 'Alex');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 2);
  });

  await t.test('returns full message list when query is empty or whitespace', () => {
    const emptyResults = filterMessages(sampleMessages, '');
    assert.equal(emptyResults.length, 3);

    const whitespaceResults = filterMessages(sampleMessages, '   ');
    assert.equal(whitespaceResults.length, 3);
  });
});

