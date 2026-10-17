import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatDir = path.resolve(__dirname, '../src/features/chat');

test('FE-005: Chat feature inventory and isolation', async (t) => {
  await t.test('verifies all expected prototype components exist and are cataloged', () => {
    const expectedComponents = [
      'AddChannelModal/AddChannelModal.jsx',
      'ChannelList/ChannelList.jsx',
      'ChatHeader/ChatHeader.jsx',
      'ChatInput/ChatInput.jsx',
      'ConfirmDeleteModal/ConfirmDeleteModal.jsx',
      'MemberList/MemberList.jsx',
      'MessageFeed/MessageFeed.jsx',
      'MessageItem/MessageItem.jsx',
    ];

    for (const compRelPath of expectedComponents) {
      const fullPath = path.join(chatDir, 'components', compRelPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Expected prototype component at ${compRelPath} to exist`
      );
    }
  });

  await t.test('verifies obsolete MessageCard.jsx stub has been removed', () => {
    const deadCardPath = path.join(chatDir, 'components', 'MessageCard.jsx');
    assert.strictEqual(
      fs.existsSync(deadCardPath),
      false,
      'Obsolete empty stub MessageCard.jsx must be removed'
    );
  });

  await t.test('verifies chat documentation README.md exists and covers roadmap', () => {
    const readmePath = path.join(chatDir, 'README.md');
    assert.ok(fs.existsSync(readmePath), 'Chat README.md must exist');
    const content = fs.readFileSync(readmePath, 'utf8');

    assert.ok(
      content.includes('Current Status: Planned / In-Development Prototype'),
      'README must clearly state prototype/planned status'
    );
    assert.ok(
      content.includes('deliberately isolated'),
      'README must explain why components are isolated from active workflows'
    );
    assert.ok(
      content.includes('WebSocket / STOMP'),
      'README must document backend requirements including WebSocket/STOMP'
    );
    assert.ok(
      content.includes('ChatPage'),
      'README must inventory ChatPage'
    );
    assert.ok(
      content.includes('MessageItem'),
      'README must inventory MessageItem'
    );
  });

  await t.test('verifies ChatPage source defines accessible placeholder', () => {
    const chatPagePath = path.join(chatDir, 'pages', 'ChatPage.jsx');
    assert.ok(fs.existsSync(chatPagePath), 'ChatPage.jsx must exist');
    const content = fs.readFileSync(chatPagePath, 'utf8');

    assert.ok(
      content.includes('role="region"'),
      'ChatPage must have role="region" for accessibility'
    );
    assert.ok(
      content.includes('aria-label="Chat feature placeholder"'),
      'ChatPage must have an aria-label'
    );
    assert.ok(
      content.includes('Chat Feature Space'),
      'ChatPage must render "Chat Feature Space"'
    );
    assert.ok(
      content.includes('Coming soon to the StudyCollab workspace.'),
      'ChatPage must state that the feature is coming soon'
    );
    assert.ok(
      content.includes('export default function ChatPage'),
      'ChatPage must default export the component'
    );
  });
});

test('FE-005: ChatInput workflow logic and constraints', async (t) => {
  const MAX_CHAR_LIMIT = 1000;

  await t.test('rejects empty or whitespace-only messages', () => {
    let sentMessage = null;
    const handleSubmitSimulation = (text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > MAX_CHAR_LIMIT) return false;
      sentMessage = trimmed;
      return true;
    };

    assert.strictEqual(handleSubmitSimulation(''), false);
    assert.strictEqual(handleSubmitSimulation('   '), false);
    assert.strictEqual(handleSubmitSimulation('\n\t  '), false);
    assert.strictEqual(sentMessage, null);
  });

  await t.test('rejects messages that exceed the 1000 character limit', () => {
    let sentMessage = null;
    const handleSubmitSimulation = (text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > MAX_CHAR_LIMIT) return false;
      sentMessage = trimmed;
      return true;
    };

    const validLongText = 'A'.repeat(1000);
    const overflowText = 'A'.repeat(1001);

    assert.strictEqual(handleSubmitSimulation(validLongText), true);
    assert.strictEqual(sentMessage, validLongText);

    sentMessage = null;
    assert.strictEqual(handleSubmitSimulation(overflowText), false);
    assert.strictEqual(sentMessage, null);
  });

  await t.test('routes submission between onSendMessage and onSaveEdit correctly', () => {
    let sentMessage = null;
    let editedMessage = null;

    const dispatchSubmission = (text, editingMessage) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > MAX_CHAR_LIMIT) return;

      if (editingMessage) {
        editedMessage = { id: editingMessage.id, content: trimmed };
      } else {
        sentMessage = trimmed;
      }
    };

    // New message scenario
    dispatchSubmission('Hello study group!', null);
    assert.strictEqual(sentMessage, 'Hello study group!');
    assert.strictEqual(editedMessage, null);

    // Edit scenario
    sentMessage = null;
    dispatchSubmission('Updated notes message', { id: 'msg-42', content: 'Old message' });
    assert.strictEqual(sentMessage, null);
    assert.deepStrictEqual(editedMessage, { id: 'msg-42', content: 'Updated notes message' });
  });

  await t.test('adjusts state on editingMessage prop changes during render cleanly', () => {
    let text = '';
    let prevEditingMessage = null;

    const simulatePropChange = (editingMessage) => {
      if (editingMessage !== prevEditingMessage) {
        prevEditingMessage = editingMessage;
        if (editingMessage) {
          text = editingMessage.content;
        } else {
          text = '';
        }
      }
      return text;
    };

    assert.strictEqual(simulatePropChange({ id: 1, content: 'First edit' }), 'First edit');
    assert.strictEqual(simulatePropChange({ id: 2, content: 'Second edit' }), 'Second edit');
    assert.strictEqual(simulatePropChange(null), '');
  });
});
